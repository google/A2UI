#pragma once

#include <string>
#include <nlohmann/json.hpp>

namespace a2ui {

class A2UIComponent;

/**
 * Component factory interface aligned with the cross-platform ComponentFactory.
 *
 * Cross-platform equivalents:
 *   A2UIComponent createComponent(String id, Map<String, Object> properties)
 *   String getComponentType()
 */
class ComponentFactory {
public:
    virtual ~ComponentFactory() {}

    /**
     * Create a component instance.
     *
     * @param surfaceId Surface ID used to identify the owning surface
     * @param id Component ID
     * @param properties Flattened properties
     * @return Newly created component instance. The caller owns its lifetime.
     */
    virtual A2UIComponent* createComponent(const std::string& surfaceId,
                                            const std::string& id,
                                            const nlohmann::json& properties) = 0;

    /**
     * Return the component type name.
     */
    virtual const std::string& getComponentType() const = 0;
};

} // namespace a2ui
