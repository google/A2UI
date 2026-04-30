#pragma once

#include <string>

namespace agenui {

// Forward declaration
class ISpecApplicable;

/**
 * @brief Interface for the component property spec manager
 * @remark Defines the abstract contract for spec loading and application;
 *         implemented by ComponentPropertySpecManager.
 */
class IComponentPropertySpecManager {
public:
    virtual ~IComponentPropertySpecManager() = default;

    /**
     * @brief Load property spec definitions from a JSON string
     * @param jsonString JSON config string; top-level keys are theme names
     * @return true on success, false on failure
     */
    virtual bool loadFromString(const std::string& jsonString) = 0;

    /**
     * @brief Apply property spec to a component instance
     * @param theme theme identifier
     * @param component component implementing ISpecApplicable
     * @remark Looks up the spec for the component type and:
     *         1. Fills in missing property default values
     *         2. Resolves enum mappings
     *         3. Fills in missing style default values
     */
    virtual void applySpec(const std::string& theme, ISpecApplicable* component) const = 0;
};

}  // namespace agenui
