#include "surface/virtual_dom/agenui_virtual_dom.h"
#include "agenui_component_render_observable.h"
#include "agenui_surface_layout_observable.h"
#include "agenui_log.h"
#include <functional>
#if defined(__OHOS__)
#include <yoga/Yoga.h>
#include "surface/virtual_dom/agenui_ivirtual_define.h"
#endif

namespace agenui {

VirtualDOM::VirtualDOM(IVirtualDOMObserver* observer) : _root(std::make_shared<VirtualDOMNode>("root", observer, this)), _observer(observer) {
#if defined(__OHOS__)
    _defaultRoot = YGNodeNew();
    YGSize screenSize = AGenUIVirtualDefine::getDeviceScreenSize();
    _surfaceWidth  = screenSize.width;
    _surfaceHeight = screenSize.height;
    YGNodeStyleSetFlexDirection(_defaultRoot, YGFlexDirectionColumn);
    YGNodeStyleSetWidth(_defaultRoot, YGUndefined);
    YGNodeStyleSetHeight(_defaultRoot, YGUndefined);
#endif
}

VirtualDOM::~VirtualDOM() {
#if defined(__OHOS__)
    if (_defaultRoot) {
        YGNodeFree(_defaultRoot);
        _defaultRoot = nullptr;
    }
#endif
}

void VirtualDOM::updateNode(const ComponentSnapshot& snapshot) {
    if (snapshot.id == "root") {
        _root->setSnapshot(snapshot, "");
#if defined(__OHOS__)
        if (_root && _root->getYogaNode() && _defaultRoot) {
            YGNodeRef rootYoga = _root->getYogaNode();
            // Insert root's Yoga node into defaultRoot only once
            if (YGNodeGetOwner(rootYoga) == nullptr) {
                YGNodeInsertChild(_defaultRoot, rootYoga, 0);
            }
            YGNodeCalculateLayout(_defaultRoot, _surfaceWidth, YGUndefined, YGDirectionLTR);
            checkAndNotifyLayoutChanges();
        }
#endif
        // Non-OHOS: checkAndNotifyLayoutChanges is called directly inside setSnapshot
        return;
    }

    std::string parentId;
    auto node = findNodeByIdRecursive(_root, snapshot.id, parentId);
    if (node && checkCanDisplay(snapshot)) {
        node->setSnapshot(snapshot, parentId);
    } else {
        // Node not found: save as an orphan snapshot
        if (snapshot.displayRule == DisplayRule::Always) {
            _directOrphanSnapshots[snapshot.id] = snapshot;
        } else {
            _dataDependentOrphanSnapshots[snapshot.id] = snapshot;
        }
        // After adding a new orphan, check whether any are ready to attach
        tryAttachReadyOrphans();
    }

#if defined(__OHOS__)
        if (_root && _root->getYogaNode() && _defaultRoot) {
            YGNodeCalculateLayout(_defaultRoot, _surfaceWidth, YGUndefined, YGDirectionLTR);
            checkAndNotifyLayoutChanges();
        }
#endif
        // Non-OHOS: checkAndNotifyLayoutChanges is called directly inside setSnapshot
}

void VirtualDOM::clear() {
#if defined(__OHOS__)
    // Remove root's Yoga node from defaultRoot before releasing _root
    if (_defaultRoot && _root && _root->getYogaNode()) {
        YGNodeRemoveChild(_defaultRoot, _root->getYogaNode());
    }
#endif
    _root = std::make_shared<VirtualDOMNode>("root", _observer, this);
    _directOrphanSnapshots.clear();
    _dataDependentOrphanSnapshots.clear();
}

bool VirtualDOM::takeOrphanSnapshot(const std::string& id, ComponentSnapshot& outSnapshot) {
    auto directIt = _directOrphanSnapshots.find(id);
    if (directIt != _directOrphanSnapshots.end() && checkCanDisplay(directIt->second)) {
        outSnapshot = directIt->second;
        _directOrphanSnapshots.erase(directIt);
        return true;
    }

    auto it = _dataDependentOrphanSnapshots.find(id);
    if (it != _dataDependentOrphanSnapshots.end() && checkCanDisplay(it->second)) {
        outSnapshot = it->second;
        _dataDependentOrphanSnapshots.erase(it);
        return true;
    }
    return false;
}

bool VirtualDOM::checkCanDisplay(const ComponentSnapshot& snapshot) const {
    // true if status is PartiallyReady or FullyReady
    auto isAnyDataReady = [](DataBindingStatus status) -> bool {
        return status == DataBindingStatus::PartiallyReady || status == DataBindingStatus::FullyReady;
    };

    // true if status is FullyReady or NotDependent
    auto isFullyReadyOrNotDependent = [](DataBindingStatus status) -> bool {
        return status == DataBindingStatus::FullyReady || status == DataBindingStatus::NotDependent;
    };

    // Search both orphan maps for a child snapshot by ID
    auto findChildSnapshot = [this](const std::string& childId) -> const ComponentSnapshot* {
        auto it = _dataDependentOrphanSnapshots.find(childId);
        if (it != _dataDependentOrphanSnapshots.end()) {
            return &it->second;
        }
        auto directIt = _directOrphanSnapshots.find(childId);
        if (directIt != _directOrphanSnapshots.end()) {
            return &directIt->second;
        }
        return nullptr;
    };

    // Recursively check if any descendant has data ready
    std::function<bool(const ComponentSnapshot&)> hasAnyDescendantDataReady =
        [&](const ComponentSnapshot& s) -> bool {
        for (const auto& childId : s.children) {
            const ComponentSnapshot* child = findChildSnapshot(childId);
            if (child == nullptr) continue;
            if (isAnyDataReady(child->dataBindingStatus)) return true;
            if (hasAnyDescendantDataReady(*child)) return true;
        }
        return false;
    };

    // Recursively check if all descendants are in orphan and are NotDependent
    std::function<bool(const ComponentSnapshot&)> allDescendantsNotDependent =
        [&](const ComponentSnapshot& s) -> bool {
        for (const auto& childId : s.children) {
            const ComponentSnapshot* child = findChildSnapshot(childId);
            if (child == nullptr || child->dataBindingStatus != DataBindingStatus::NotDependent) return false;
            if (!allDescendantsNotDependent(*child)) return false;
        }
        return true;
    };

    // Recursively check if all descendants are in orphan and are FullyReady or NotDependent
    std::function<bool(const ComponentSnapshot&)> allDescendantsFullyReadyOrNotDependent =
        [&](const ComponentSnapshot& s) -> bool {
        for (const auto& childId : s.children) {
            const ComponentSnapshot* child = findChildSnapshot(childId);
            if (child == nullptr || !isFullyReadyOrNotDependent(child->dataBindingStatus)) return false;
            if (!allDescendantsFullyReadyOrNotDependent(*child)) return false;
        }
        return true;
    };

    // Top-level rule: the snapshot's own dataBindingStatus must be NotDependent or FullyReady
    if (!isFullyReadyOrNotDependent(snapshot.dataBindingStatus)) {
        return false;
    }

    switch (snapshot.displayRule) {
        case DisplayRule::Always: {
            return true;
        }

        case DisplayRule::AnyDataReady: {
            // Condition A: own data is ready
            if (isAnyDataReady(snapshot.dataBindingStatus)) return true;

            // Condition B: any descendant's data is ready
            if (hasAnyDescendantDataReady(snapshot)) return true;

            // Condition C: self and all descendants are orphans and all are NotDependent
            if (snapshot.dataBindingStatus == DataBindingStatus::NotDependent) {
                return allDescendantsNotDependent(snapshot);
            }
            return false;
        }

        case DisplayRule::AllDataReady: {
            // All descendants must be in orphan and be FullyReady or NotDependent
            if (!isFullyReadyOrNotDependent(snapshot.dataBindingStatus)) return false;
            return allDescendantsFullyReadyOrNotDependent(snapshot);
        }
    }
    return false;
}

void VirtualDOM::tryAttachReadyOrphans() {
    auto it = _dataDependentOrphanSnapshots.begin();
    while (it != _dataDependentOrphanSnapshots.end()) {
        if (!checkCanDisplay(it->second)) {
            ++it;
            continue;
        }
        
        std::string parentId;
        auto node = findNodeByIdRecursive(_root, it->first, parentId);
        if (node) {
            node->setSnapshot(it->second, parentId);
            it = _dataDependentOrphanSnapshots.erase(it);
        } else {
            ++it;
        }
    }
}

std::shared_ptr<VirtualDOMNode> VirtualDOM::findNodeByIdRecursive(std::shared_ptr<VirtualDOMNode> parent, const std::string& id, std::string& outParentId) {
    if (!parent) {
        return nullptr;
    }
    
    const auto& children = parent->getChildren();
    for (const auto& child : children) {
        if (!child) {
            continue;
        }
        
        if (child->getId() == id) {
            outParentId = parent->getId();
            return child;
        }
        
        auto found = findNodeByIdRecursive(child, id, outParentId);
        if (found) {
            return found;
        }
    }
    
    return nullptr;
}

void VirtualDOM::checkAndNotifyLayoutChanges() {
    if (_root) {
        _root->checkAndNotifyLayoutChanges();
    }
}

void VirtualDOM::updateSurfaceSize(const SurfaceLayoutInfo& info) {
    AGENUI_LOG("updateSurfaceSize: surfaceId=%s, width=%.1f, height=%.1f",
               info.surfaceId.c_str(), info.width, info.height);
#if defined(__OHOS__)
    if (info.width > 0.0f)  _surfaceWidth  = info.width;
    if (info.height > 0.0f) _surfaceHeight = info.height;
    if (_root && _root->getYogaNode()) {
        if (info.width > 0.0f) {
            YGNodeStyleSetMinWidth(_root->getYogaNode(), info.width);
        }
        if (info.height > 0.0f) {
            YGNodeStyleSetMinHeight(_root->getYogaNode(), info.height);
        }
    }
    YGNodeCalculateLayout(_defaultRoot, _surfaceWidth, YGUndefined, YGDirectionLTR);
    checkAndNotifyLayoutChanges();
#endif
}


void VirtualDOM::updateComponentSize(const ComponentRenderInfo& info) {
    auto node = findNodeByComponentIdAndTypeRecursive(_root, info.componentId, info.type);
    if (!node) {
        return;
    }

#if defined(__OHOS__)
    node->setYogaNodeSize(info.width, info.height);
    if (_defaultRoot) {
        YGNodeCalculateLayout(_defaultRoot, _surfaceWidth, YGUndefined, YGDirectionLTR);
        checkAndNotifyLayoutChanges();
    }
#endif
}

std::shared_ptr<VirtualDOMNode> VirtualDOM::findNodeByComponentIdAndTypeRecursive(
    std::shared_ptr<VirtualDOMNode> parent, 
    const std::string& componentId, 
    const std::string& type) {
    
    if (!parent) {
        return nullptr;
    }

    if (parent->hasSnapshot()) {
        const ComponentSnapshot* snapshot = parent->getSnapshot();
        if (snapshot && snapshot->id == componentId && snapshot->component == type) {
            return parent;
        }
    }

    const auto& children = parent->getChildren();
    for (const auto& child : children) {
        if (!child) continue;
        auto found = findNodeByComponentIdAndTypeRecursive(child, componentId, type);
        if (found) return found;
    }
    
    return nullptr;
}

}  // namespace agenui
