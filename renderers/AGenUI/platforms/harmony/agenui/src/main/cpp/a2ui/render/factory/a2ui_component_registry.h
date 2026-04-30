#pragma once

#include <string>
#include <map>
#include <nlohmann/json.hpp>

namespace a2ui {

class A2UIComponent;
class ComponentFactory;

/**
 * Component registry aligned with the cross-platform ComponentRegistry.
 *
 * Responsibilities:
 * 1. Manage component factories (type -> factory)
 * 2. Manage component instances (id -> component)
 * 3. Manage parent relationships (childId -> parentId)
 *
 * Each surface owns an independent registry copied from the global factory set.
 */
class ComponentRegistry {
public:
    ComponentRegistry();
    ~ComponentRegistry();

    // Factory management

    /**
     * Register a component factory.
     * @param type Component type name such as "Text" or "Column"
     * @param factory Factory instance. The caller owns its lifetime.
     */
    void registerFactory(const std::string& type, ComponentFactory* factory);

    /**
     * Return the factory for a given type, or nullptr.
     */
    ComponentFactory* getFactory(const std::string& type) const;

    /**
     * Return whether a factory has been registered for the given type.
     */
    bool hasFactory(const std::string& type) const;

    /**
     * Create a component through its registered factory.
     *
     * @param surfaceId Surface ID used to identify the owning surface
     * @param type Component type
     * @param id Component ID
     * @param properties Component properties
     * @return Newly created component instance, or nullptr if the factory is missing
     */
    A2UIComponent* createComponent(const std::string& surfaceId,
                                    const std::string& type,
                                    const std::string& id,
                                    const nlohmann::json& properties);

    // Component instance management

    /**
     * Register a component instance.
     */
    void registerComponent(const std::string& id, A2UIComponent* component);

    /**
     * Return the component instance for an ID, or nullptr.
     */
    A2UIComponent* getComponent(const std::string& id) const;

    /**
     * Unregister a component instance.
     */
    void unregisterComponent(const std::string& id);

    /**
     * Return whether a component instance exists.
     */
    bool hasComponent(const std::string& id) const;

    /**
     * Clear all component instances without removing factories.
     */
    void clearAllComponents();

    // Parent map management

    /**
     * Record a parent-child relationship.
     */
    void setParentId(const std::string& childId, const std::string& parentId);

    /**
     * Return the parent component ID, or an empty string if missing.
     */
    std::string getParentId(const std::string& childId) const;

    // Factory map copying

    /**
     * Copy all factory mappings from another registry.
     */
    void copyFactoriesFrom(const ComponentRegistry& source);

    /**
     * Return the number of registered factories.
     */
    int getRegisteredFactoryCount() const;

    /**
     * Return the number of registered component instances.
     */
    int getRegisteredComponentCount() const;

private:
    // type -> factory. Factory lifetime is owned externally.
    std::map<std::string, ComponentFactory*> factories_;

    // id -> component. Component lifetime is owned by Surface.
    std::map<std::string, A2UIComponent*> components_;

    // childId -> parentId
    std::map<std::string, std::string> parentMap_;
};

} // namespace a2ui
