#include "a2ui_surface.h"

#include <cstdlib>
#include <string>

#include "a2ui_component.h"
#include "components/tabs_component.h"
#include "components/modal_component.h"
#include "log/a2ui_capi_log.h"

namespace a2ui {

namespace {

bool shouldPrepareAppearAnimation(A2UIComponent* parent) {
    while (parent != nullptr) {
        if (parent->hasPendingAppearAnimation()) {
            return false;
        }
        parent = parent->getParent();
    }
    return true;
}

}  // namespace

A2UISurface::A2UISurface(const std::string& surfaceId, ComponentRegistry* registry, bool animated,
                         agenui::IComponentRenderObservable* componentRenderObservable,
                         agenui::ISurfaceLayoutObservable* surfaceLayoutObservable)
    : surfaceId_(surfaceId)
    , state_(State::CREATED)
    , registry_(registry)
    , rootComponent_(nullptr)
    , contentHandle_(nullptr)
    , animated_(animated)
    , componentRenderObservable_(componentRenderObservable)
    , surfaceLayoutObservable_(surfaceLayoutObservable) {
    HM_LOGI("Created surface: %s, animated: %d", surfaceId_.c_str(), animated_);
}

A2UISurface::~A2UISurface() {
    if (state_ != State::DESTROYED) {
        destroy();
    }
}

// ---- Basic Information ----

const std::string& A2UISurface::getSurfaceId() const {
    return surfaceId_;
}

A2UISurface::State A2UISurface::getState() const {
    return state_;
}

ComponentRegistry& A2UISurface::getComponentRegistry() {
    return *registry_;
}



void A2UISurface::handleComponentAdd(const agenui::ComponentsAddMessage& msg) {
    // Parse the component JSON before validating parentId.
    nlohmann::json componentJson;
    try {
        componentJson = nlohmann::json::parse(msg.component);
    } catch (const nlohmann::json::exception& e) {
        RELEASE_ASSERT_WITHLOG(false,"Failed to parse component JSON: %s", e.what())
    }

    
    std::string componentId = componentJson.value("id", "");
    std::string componentType = componentJson.value("component", "");

    if (componentId.empty() || componentType.empty()) {
        RELEASE_ASSERT_WITHLOG(false,"id or component type is empty, abort");
    }

    // Only the root component may omit parentId.
    if (msg.parentId.empty() && componentId != "root") {
        RELEASE_ASSERT_WITHLOG(false,"parentId is empty for non-root component: id=%s, abort", componentId.c_str());
    }

    // Abort when the component already exists.
    if (getComponent(componentId)) {
        RELEASE_ASSERT_WITHLOG(false,"Component already exists: id=%s, abort", componentId.c_str());
    }
    
    A2UIComponent* component = registry_->createComponent(getSurfaceId(), componentType, componentId, componentJson);
    if (!component) {
        RELEASE_ASSERT_WITHLOG(false,"Failed to create component: id=%s, type=%s, abort", componentId.c_str(), componentType.c_str());
    }

    A2UIComponent* parent = nullptr;
    if (!msg.parentId.empty()) {
        auto parentIt = componentTree_.find(msg.parentId);
        if (parentIt != componentTree_.end()) {
            parent = parentIt->second;
        }
    }
    // Pass the surface animation flag down to the component.
    component->setSurfaceAnimated(animated_);

    if (shouldPrepareAppearAnimation(parent)) {
        component->prepareAppearAnimation(componentJson);
    }

    // Register the component and its parent relationship.
    addComponent(msg.parentId, component);

    // Mount the root component once it is available.
    if (componentId == "root") {
        setRootComponent(component);
        mountRootNode();
    }

    // Apply the initial properties to the native node.
    component->updateProperties(componentJson);
}

void A2UISurface::handleComponentsUpdate(const std::vector<agenui::ComponentsUpdateMessage>& msgs) {
    for (const auto& msg : msgs) {
        // Parse the component JSON.
        nlohmann::json componentJson;
        try {
            componentJson = nlohmann::json::parse(msg.component);
        } catch (const nlohmann::json::exception& e) {
            HM_LOGE("Failed to parse component JSON: %s", e.what());
            continue;
        }

        // Updates may arrive before the component is created.
        auto* component = getComponent(msg.componentId);
        if (!component) {
            HM_LOGW("Component not found: %s, skip", msg.componentId.c_str());
            continue;
        }

        // Refresh all properties, including non-layout style fields.
        component->updateProperties(componentJson);
        
        HM_LOGI("Updated component: id=%s", msg.componentId.c_str());
    }
}

void A2UISurface::handleComponentsRemove(const std::vector<agenui::ComponentsRemoveMessage>& msgs) {
    for (const auto& msg : msgs) {
        const std::string& componentId = msg.componentId;

        auto it = componentTree_.find(componentId);
        if (it == componentTree_.end()) {
            HM_LOGW("handleComponentsRemove: component not found: %s, skip", componentId.c_str());
            continue;
        }

        A2UIComponent* component = it->second;

        // Guard: refuse to remove the root component via this path.  Root
        // removal must go through destroySurface() / destroy(), not through
        // an incremental remove message.  Doing otherwise would leave
        // rootComponent_ as a dangling pointer and crash destroy().
        if (component == rootComponent_) {
            HM_LOGE("handleComponentsRemove: attempted to remove root component '%s', ignored."
                    " Use destroySurface() to tear down the whole surface.",
                    componentId.c_str());
            continue;
        }

        // 1. Detach from parent: removes the ArkUI node from the parent's native
        //    view tree and clears the C++ parent/children relationship.
        A2UIComponent* parent = component->getParent();
        if (parent) {
            parent->removeChild(component);
        }

        // 2. Collect all descendant ids BEFORE calling destroy(), because
        //    destroy() recursively clears m_children making traversal impossible.
        std::vector<std::string> subtreeIds;
        subtreeIds.push_back(componentId);
        std::vector<A2UIComponent*> stack;
        stack.push_back(component);
        while (!stack.empty()) {
            A2UIComponent* cur = stack.back();
            stack.pop_back();
            for (A2UIComponent* child : cur->getChildren()) {
                if (child) {
                    subtreeIds.push_back(child->getId());
                    stack.push_back(child);
                }
            }
        }

        HM_LOGI("handleComponentsRemove: removing %s with %zu subtree node(s)",
                componentId.c_str(), subtreeIds.size());

        // 3. Erase every id from the tree and registry FIRST so that if any
        //    observer triggered during destroy() queries the tree it cannot
        //    obtain stale pointers to components that are being torn down.
        for (const std::string& id : subtreeIds) {
            componentTree_.erase(id);
            registry_->unregisterComponent(id);
        }

        // 4. Destroy all native resources (ArkUI nodes, media players, image
        //    loader requests, …) recursively, then free the C++ object.
        component->destroy();
        delete component;
    }
}

std::string A2UISurface::findParentInComponentTree(const std::string& childId) {
    // Search existing components for properties that reference childId.
    for (const auto& pair : componentTree_) {
        A2UIComponent* potentialParent = pair.second;
        if (!potentialParent) continue;

        const nlohmann::json& props = potentialParent->getProperties();
        if (props.is_null() || !props.is_object()) continue;

        // Check children arrays.
        if (props.contains("children") && props["children"].is_array()) {
            for (const auto& child : props["children"]) {
                if (child.is_string() && child.get<std::string>() == childId) {
                    return pair.first;
                }
            }
        }

        // Check single child references.
        if (props.contains("child") && props["child"].is_string()) {
            if (props["child"].get<std::string>() == childId) {
                return pair.first;
            }
        }

        // Check tab child references.
        if (props.contains("tabs") && props["tabs"].is_array()) {
            for (const auto& tab : props["tabs"]) {
                if (tab.is_object() && tab.contains("child") && tab["child"].is_string()) {
                    if (tab["child"].get<std::string>() == childId) {
                        return pair.first;
                    }
                }
            }
        }

        // Check modal trigger/content references.
        if (props.contains("trigger") && props["trigger"].is_string()) {
            if (props["trigger"].get<std::string>() == childId) {
                return pair.first;
            }
        }
        if (props.contains("content") && props["content"].is_string()) {
            if (props["content"].get<std::string>() == childId) {
                return pair.first;
            }
        }
    }

    return "";
}

void A2UISurface::tryMountOrphanChildren(A2UIComponent* parentComponent, const nlohmann::json& properties) {
    // Backfill orphan children once their parent component arrives.
    if (!parentComponent || properties.is_null() || !properties.is_object()) return;

    std::vector<std::string> childIds;

    // Collect every referenced child id.
    if (properties.contains("children") && properties["children"].is_array()) {
        for (const auto& child : properties["children"]) {
            if (child.is_string()) {
                childIds.push_back(child.get<std::string>());
            }
        }
    }
    if (properties.contains("child") && properties["child"].is_string()) {
        childIds.push_back(properties["child"].get<std::string>());
    }
    if (properties.contains("tabs") && properties["tabs"].is_array()) {
        for (const auto& tab : properties["tabs"]) {
            if (tab.is_object() && tab.contains("child") && tab["child"].is_string()) {
                childIds.push_back(tab["child"].get<std::string>());
            }
        }
    }
    if (properties.contains("trigger") && properties["trigger"].is_string()) {
        childIds.push_back(properties["trigger"].get<std::string>());
    }
    if (properties.contains("content") && properties["content"].is_string()) {
        childIds.push_back(properties["content"].get<std::string>());
    }

    // Mount existing children that still lack a parent relationship.
    for (const std::string& childId : childIds) {
        A2UIComponent* orphan = getComponent(childId);
        if (!orphan) {
            continue;
        }
        
        // Skip children that are already mounted under this parent.
        bool isAlreadyChild = false;
        for (A2UIComponent* existingChild : parentComponent->getChildren()) {
            if (existingChild == orphan) {
                isAlreadyChild = true;
                break;
            }
        }
        if (isAlreadyChild) {
            continue;
        }
        
        // Detach the child from its old parent first.
        A2UIComponent* oldParent = orphan->getParent();
        if (oldParent && oldParent != parentComponent) {
            HM_LOGI("Removing from old parent: %s (child: %s)", oldParent->getId().c_str(), childId.c_str());
            oldParent->removeChild(orphan);
        }
        
        // Attach the child to the current parent.
        parentComponent->addChild(orphan);
        HM_LOGI("Mounted orphan: %s -> parent: %s", childId.c_str(), parentComponent->getId().c_str());

        // Notify Tabs once a child becomes available.
        TabsComponent* tabsParent = dynamic_cast<TabsComponent*>(parentComponent);
        if (tabsParent) {
            tabsParent->onChildMounted(orphan);
        }

        // Notify Modal once a child becomes available.
        ModalComponent* modalParent = dynamic_cast<ModalComponent*>(parentComponent);
        if (modalParent) {
            modalParent->onChildMounted(orphan);
        }
    }
}


// ---- Component Tree Management ----

A2UIComponent* A2UISurface::getRootComponent() const {
    return rootComponent_;
}

void A2UISurface::setRootComponent(A2UIComponent* component) {
    rootComponent_ = component;
}

A2UIComponent* A2UISurface::getComponent(const std::string& id) const {
    auto it = componentTree_.find(id);
    if (it != componentTree_.end()) {
        return it->second;
    }
    return nullptr;
}

void A2UISurface::addComponent(const std::string& parentId, A2UIComponent* component) {
    if (!component) {
        return;
    }

    // 1. Set surfaceId on the component.
    component->setSurfaceId(surfaceId_);

    // 2. Inject the render observer.
    component->setComponentRenderObservable(componentRenderObservable_);

    // 3. Add the component to the tree.
    componentTree_[component->getId()] = component;

    // 4. Wire up the parent relationship.
    if (!parentId.empty()) {
        auto parentIt = componentTree_.find(parentId);
        if (parentIt != componentTree_.end()) {
            A2UIComponent* parent = parentIt->second;
            parent->addChild(component);

            // Notify Tabs so it can react to a newly mounted child.
            TabsComponent* tabsParent = dynamic_cast<TabsComponent*>(parent);
            if (tabsParent) {
                tabsParent->onChildMounted(component);
            }

            // Notify Modal so it can react to a newly mounted child.
            ModalComponent* modalParent = dynamic_cast<ModalComponent*>(parent);
            if (modalParent) {
                modalParent->onChildMounted(component);
            }
        } else {
            HM_LOGW("Parent not found in tree: %s (child: %s)", parentId.c_str(), component->getId().c_str());
        }
    }

    // 5. Register the component in the registry.
    registry_->registerComponent(component->getId(), component);
    if (!parentId.empty()) {
        registry_->setParentId(component->getId(), parentId);
    }
}

int A2UISurface::getComponentCount() const {
    return static_cast<int>(componentTree_.size());
}

// ---- Native UI Container Management ----

void A2UISurface::setContentHandle(ArkUI_NodeContentHandle handle) {
    contentHandle_ = handle;
    if (handle) {
        state_ = State::BOUND;
    }
    HM_LOGI("surfaceId=%s, handle=%s", surfaceId_.c_str(), handle ? "valid" : "null");
}

void A2UISurface::mountRootNode() {
    if (contentHandle_ && rootComponent_ && rootComponent_->getNodeHandle()) {
        OH_ArkUI_NodeContent_AddNode(contentHandle_, rootComponent_->getNodeHandle());
        HM_LOGI("Mounted root node, surfaceId=%s, rootId=%s", surfaceId_.c_str(), rootComponent_->getId().c_str());
    } else {
        HM_LOGW("Cannot mount: contentHandle=%s, root=%s, nodeHandle=%s", contentHandle_ ? "valid" : "null", rootComponent_ ? rootComponent_->getId().c_str() : "null", (rootComponent_ && rootComponent_->getNodeHandle()) ? "valid" : "null");
    }
}

void A2UISurface::unmountRootNode() {
    if (contentHandle_ && rootComponent_ && rootComponent_->getNodeHandle()) {
        OH_ArkUI_NodeContent_RemoveNode(contentHandle_, rootComponent_->getNodeHandle());
        HM_LOGI("Unmounted root node, surfaceId=%s", surfaceId_.c_str());
    }
}

void A2UISurface::destroy() {
    HM_LOGI("Destroying surface: %s (components: %d)", surfaceId_.c_str(), getComponentCount());

    // Unmount the native node first.
    unmountRootNode();

    // Destroy the tree recursively from the root.
    A2UIComponent* rootToDestroy = rootComponent_;
    rootComponent_ = nullptr;
    if (rootToDestroy) {
        rootToDestroy->destroy();
        delete rootToDestroy;
    }

    // Clear the maps without dereferencing stale pointers.
    componentTree_.clear();
    registry_->clearAllComponents();
    state_ = State::DESTROYED;

    HM_LOGI("Surface destroyed: %s", surfaceId_.c_str());
}

} // namespace a2ui
