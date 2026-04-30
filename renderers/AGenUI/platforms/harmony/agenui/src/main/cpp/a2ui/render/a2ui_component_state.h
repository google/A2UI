#pragma once

#include <string>
#include <vector>
#include <set>
#include <nlohmann/json.hpp>

namespace a2ui {

class A2UIComponent;

enum class UpdateType {
    Layout,
    Padding,
    ContentSize,
    AttributeChanged,
    AttributeRemoved,
    NormalPropertyChanged,
    HoverPropertyChanged,
    NormalPropertyRemoved,
    HoverPropertyRemoved,
    ThemeChanged,
    Observed
};

class UpdateState {
public:
	UpdateState(UpdateType type) : m_type(type), m_property(0) {
	}

    UpdateState(UpdateType type, int property) : m_type(type), m_property(property) {
    }

    UpdateState(UpdateType type, const std::string &attribute) : m_type(type), m_property(0), m_attribute(attribute) {
    }

    int property() const {
		return m_property;
	}
    const std::string& attribute() const {
		return m_attribute;
	}
    UpdateType type() const {
		return m_type;
	}

private:
    int m_property;
    std::string m_attribute;
    UpdateType m_type;
};

/**
 * Pure data container for component state.
 *
 * Design goals:
 * 1. Separate data from view logic
 * 2. Support incremental updates through dirty flags
 * 3. Maintain the parent-child tree
 */
class ComponentState {
public:
    ComponentState(const std::string& id, const std::string& type, const nlohmann::json& props);
    ~ComponentState();
    
    // Basic information
    const std::string& getId() const { return m_id; }
    const std::string& getType() const { return m_type; }
    const std::string& getSurfaceId() const { return m_surfaceId; }
    
    void setSurfaceId(const std::string& surfaceId) { m_surfaceId = surfaceId; }
    
    // Property management
    const nlohmann::json& getProperties() const { return m_properties; }
    
    std::string getProperty(const std::string& key) const;
    
    /**
     * Set all properties during initialization and mark them dirty.
     */
    void setProperties(const nlohmann::json& props);
    
    /**
     * Update a single property and mark it dirty only when the value changes.
     */
    void updateProperty(const std::string& key, const nlohmann::json& value);
    
    /**
     * Batch-update properties and mark only changed keys as dirty.
     */
    void updateProperties(const nlohmann::json& newProps);
    
    // Parent-child relationships
    ComponentState* getParent() const { return m_parent; }
    const std::vector<ComponentState*>& getChildren() const { return m_children; }
    
    void setParent(ComponentState* parent) { m_parent = parent; }
    void addChild(ComponentState* child);
    void removeChild(ComponentState* child);
    void clearChildren();
    
    // Dirty-property tracking
    
    /**
     * Mark a property as dirty, or all properties when key is empty.
     */
    void markDirty(const std::string& propertyKey = "");
    
    /**
     * Return whether any properties are dirty.
     */
    bool isDirty() const { return !m_dirtyProperties.empty(); }
    
    /**
     * Return all dirty properties.
     */
    const std::set<std::string>& getDirtyProperties() const { return m_dirtyProperties; }
    
    /**
     * Clear all dirty flags.
     */
    void clearDirty() { m_dirtyProperties.clear(); }
    
    // Associated view
    void setView(A2UIComponent* view) { m_view = view; }
    A2UIComponent* getView() const { return m_view; }
    
private:
    std::string m_id;
    std::string m_type;
    std::string m_surfaceId;
    nlohmann::json m_properties;
    
    ComponentState* m_parent = nullptr;
    std::vector<ComponentState*> m_children;
    
    // Dirty-property set used for incremental updates
    std::set<std::string> m_dirtyProperties;
    
    A2UIComponent* m_view = nullptr;
};

} // namespace a2ui
