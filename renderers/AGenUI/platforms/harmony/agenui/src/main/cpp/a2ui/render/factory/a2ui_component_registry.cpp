#include "a2ui_component_registry.h"
#include "../a2ui_component.h"
#include "a2ui_component_factory.h"
#include "a2ui_component_creator.h"
#include "../hybrid/a2ui_hybrid_factory.h"
#include "log/a2ui_capi_log.h"

namespace a2ui {

ComponentRegistry::ComponentRegistry() {
}

ComponentRegistry::~ComponentRegistry() {
}

// ---- Factory Management ----

void ComponentRegistry::registerFactory(const std::string& type, ComponentFactory* factory) {
    if (!factory) {
        HM_LOGE("factory is null for type: %s", type.c_str());
        return;
    }
    factories_[type] = factory;
    HM_LOGI("Registered factory for type: %s", type.c_str());
}

ComponentFactory* ComponentRegistry::getFactory(const std::string& type) const {
    auto it = factories_.find(type);
    if (it != factories_.end()) {
        return it->second;
    }
    return nullptr;
}

bool ComponentRegistry::hasFactory(const std::string& type) const {
    return factories_.find(type) != factories_.end();
}

A2UIComponent* ComponentRegistry::createComponent(const std::string& surfaceId,
                                                    const std::string& type,
                                                    const std::string& id,
                                                    const nlohmann::json& properties) {
    ComponentFactory* factory = getFactory(type);
    if (!factory) {
        if (A2UIHybridFactory::hasCustomComponent(type)) {
            HM_LOGI("ComponentRegistry::createComponent - Use dynamic custom component creator for type: %s (id: %s, surfaceId: %s)",
                type.c_str(), id.c_str(), surfaceId.c_str());
            A2UIComponentCreator dynamicCreator;
            dynamicCreator.setType(type);
            return dynamicCreator.createComponent(surfaceId, id, properties);
        }
        HM_LOGW("No factory registered for type: %s (id: %s, surfaceId: %s)", type.c_str(), id.c_str(), surfaceId.c_str());
        return nullptr;
    }

    // Create the component through the factory and forward surfaceId.
    A2UIComponent* component = factory->createComponent(surfaceId, id, properties);
    if (component) {
        HM_LOGI("Created component: surfaceId=%s, type=%s, id=%s", surfaceId.c_str(), type.c_str(), id.c_str());
    } else {
        HM_LOGE("Factory returned null for: surfaceId=%s, type=%s, id=%s", surfaceId.c_str(), type.c_str(), id.c_str());
    }
    return component;
}

// ---- Component Instance Management ----

void ComponentRegistry::registerComponent(const std::string& id, A2UIComponent* component) {
    if (!component) {
        HM_LOGE("component is null for id: %s", id.c_str());
        return;
    }
    components_[id] = component;
}

A2UIComponent* ComponentRegistry::getComponent(const std::string& id) const {
    auto it = components_.find(id);
    if (it != components_.end()) {
        return it->second;
    }
    return nullptr;
}

void ComponentRegistry::unregisterComponent(const std::string& id) {
    components_.erase(id);
}

bool ComponentRegistry::hasComponent(const std::string& id) const {
    return components_.find(id) != components_.end();
}

void ComponentRegistry::clearAllComponents() {
    HM_LOGI("Clearing %zu component instances", components_.size());
    components_.clear();
    parentMap_.clear();
}

// ---- parentMap Management ----

void ComponentRegistry::setParentId(const std::string& childId, const std::string& parentId) {
    parentMap_[childId] = parentId;
}

std::string ComponentRegistry::getParentId(const std::string& childId) const {
    auto it = parentMap_.find(childId);
    if (it != parentMap_.end()) {
        return it->second;
    }
    return "";
}

// ---- Factory Map Copy ----

void ComponentRegistry::copyFactoriesFrom(const ComponentRegistry& source) {
    factories_ = source.factories_;
    HM_LOGI("Copied %zu factories", factories_.size());
}

// ---- Statistics ----

int ComponentRegistry::getRegisteredFactoryCount() const {
    return static_cast<int>(factories_.size());
}

int ComponentRegistry::getRegisteredComponentCount() const {
    return static_cast<int>(components_.size());
}

} // namespace a2ui
