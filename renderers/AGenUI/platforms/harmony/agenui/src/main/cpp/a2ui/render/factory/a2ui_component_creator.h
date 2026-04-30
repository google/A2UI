#pragma once

#include "a2ui_component_factory.h"
#include "../a2ui_component_types.h"

namespace a2ui {

/**
 * Unified component creation factory
 * Replaces 20+ independent *_component_factory files
 * Dispatches by component type name to the matching component constructor
 */
class A2UIComponentCreator : public ComponentFactory {
public:
    /**
     * Create the matching component instance based on the type name provided during registration
     * @param surfaceId Surface ID used to identify the owning surface
     * @param id Component ID
     * @param properties Initial properties
     * @return Newly created component instance (caller owns the lifecycle), or nullptr when the type is unknown
     */
    A2UIComponent* createComponent(const std::string& surfaceId,
                                   const std::string& id,
                                   const nlohmann::json& properties) override;

    /**
     * Get the component type (this factory supports multiple types via setType)
     */
    const std::string& getComponentType() const override;

    /**
     * Set the component type represented by this instance (used during registration)
     */
    void setType(const std::string& type);

private:
    std::string m_type;
};

} // namespace a2ui
