#pragma once

#include "agenui_component_property_spec.h"
#include "agenui_icomponent_property_spec_manager.h"
#include <map>
#include <mutex>
#include <string>

namespace agenui {

/**
 * @brief Component property spec manager
 * @remark Aggregates ComponentPropertySpec instances by component type;
 *         handles JSON loading and spec application.
 */
class ComponentPropertySpecManager : public IComponentPropertySpecManager {
public:
    ComponentPropertySpecManager();
    ~ComponentPropertySpecManager() override;

    /**
     * @brief Load property spec definitions from a JSON string
     * @param jsonString JSON config string; top-level keys are theme names
     * @return true on success, false on failure
     */
    bool loadFromString(const std::string& jsonString) override;

    /**
     * @brief Apply property spec to a component instance
     * @param theme theme identifier
     * @param component component implementing ISpecApplicable
     * @remark Looks up the ComponentPropertySpec for the component type and:
     *         1. Fills in missing property default values
     *         2. Resolves enum mappings and applies style/property overrides
     *         3. Fills in missing style default values
     */
    void applySpec(const std::string& theme, ISpecApplicable* component) const override;

private:
    using ThemedSpecsMap = std::map<std::string, std::map<std::string, ComponentPropertySpec>>;

    // Parse kBaseComponentSpecConfig and register it as the "default" theme
    void initDefaultTheme();

    mutable std::mutex _mutex;  ///< Protects _themedSpecs
    // theme -> (component type -> property spec)
    ThemedSpecsMap _themedSpecs;
};

}  // namespace agenui
