#include "a2ui_component_state.h"
#include "a2ui_component.h"
#include "log/a2ui_capi_log.h"
#include <algorithm>

namespace a2ui {

ComponentState::ComponentState(const std::string& id, const std::string& type, const nlohmann::json& props)
    : m_id(id), m_type(type), m_properties(props), m_parent(nullptr), m_view(nullptr) {
    if (m_properties.find("surfaceId") != m_properties.end()) {
        m_surfaceId = m_properties["surfaceId"];
    }
}

ComponentState::~ComponentState() {
    // m_view is not deleted here; it is managed externally
    // m_children are not deleted here; they are managed externally
    HM_LOGD("ComponentState debug output");
}

std::string ComponentState::getProperty(const std::string& key) const {
    // Check whether the property exists
    if (!m_properties.contains(key)) {
        HM_LOGW(" property '%s' not found", m_id.c_str(), key.c_str());
        return "";
    }
    
    const auto& value = m_properties[key];
    
    // Convert the JSON value to a string based on its type
    if (value.is_string()) {
        return value.get<std::string>();
    } else if (value.is_number()) {
        return std::to_string(value.get<double>());
    } else if (value.is_boolean()) {
        return value.get<bool>() ? "true" : "false";
    } else if (value.is_null()) {
        return "";
    } else {
        // Return a JSON string for objects and arrays
        return value.dump();
    }
}

void ComponentState::setProperties(const nlohmann::json& props) {
    m_properties = props;
    
    // Mark all properties as dirty during initialization
    if (props.is_object()) {
        for (auto& [key, value] : props.items()) {
            m_dirtyProperties.insert(key);
        }
    }
    
    HM_LOGD(" set %zu properties, all marked dirty", m_id.c_str(), m_dirtyProperties.size());
}

void ComponentState::updateProperty(const std::string& key, const nlohmann::json& value) {
    // Check whether the value actually changed
    if (m_properties.contains(key) && m_properties[key] == value) {
        HM_LOGD(" property '%s' unchanged, skip", m_id.c_str(), key.c_str());
        return;  // The value did not change, so do not mark it dirty
    }
    
    m_properties[key] = value;
    m_dirtyProperties.insert(key);
    
    HM_LOGD(" property '%s' updated and marked dirty", m_id.c_str(), key.c_str());
}

void ComponentState::updateProperties(const nlohmann::json& newProps) {
    if (!newProps.is_object()) {
        return;
    }
    
    // Compare old and new properties and mark only changed entries
    for (auto& [key, value] : newProps.items()) {
        updateProperty(key, value);
    }
    
    HM_LOGD(" updated, %zu properties dirty", m_id.c_str(), m_dirtyProperties.size());
}

void ComponentState::markDirty(const std::string& propertyKey) {
    if (propertyKey.empty()) {
        // Mark all properties as dirty
        if (m_properties.is_object()) {
            for (auto& [key, value] : m_properties.items()) {
                m_dirtyProperties.insert(key);
            }
        }
        HM_LOGD(" marked all properties dirty", m_id.c_str());
    } else {
        m_dirtyProperties.insert(propertyKey);
        HM_LOGD(" property '%s' marked dirty", m_id.c_str(), propertyKey.c_str());
    }
}

void ComponentState::addChild(ComponentState* child) {
    if (!child) {
        return;
    }
    
    // Remove the previous parent node
    if (child->m_parent) {
        child->m_parent->removeChild(child);
    }
    
    child->m_parent = this;
    m_children.push_back(child);
    
    HM_LOGD("Parent %s added child %s", m_id.c_str(), child->m_id.c_str());
}

void ComponentState::removeChild(ComponentState* child) {
    if (!child) {
        return;
    }
    
    auto it = std::find(m_children.begin(), m_children.end(), child);
    if (it != m_children.end()) {
        m_children.erase(it);
        child->m_parent = nullptr;
        
        HM_LOGD("Parent %s removed child %s", m_id.c_str(), child->m_id.c_str());
    }
}

void ComponentState::clearChildren() {
    for (auto* child : m_children) {
        if (child) {
            child->m_parent = nullptr;
        }
    }
    m_children.clear();
    
    HM_LOGD(" cleared all children", m_id.c_str());
}

} // namespace a2ui