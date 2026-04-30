#pragma once

#include <string>
#include <vector>
#include <map>

namespace agenui {
enum class DisplayRule;

/**
 * @brief Component manager interface
 * @remark Defines the basic operations for component management
 */
class IComponentManager {
public:
    virtual ~IComponentManager() = default;

    /**
     * @brief Update components
     * @param components Array of component JSON strings
     */
    virtual void updateComponents(const std::vector<std::string>& components) = 0;

    /**
     * @brief Synchronize a binding value
     * @param id Component ID
     * @param attributeName Attribute name
     * @param value New value
     * @remark Called when a bound value of a component changes
     */
    virtual void syncBindingValue(const std::string& id, const std::string& attributeName, const std::string& value) = 0;

    /**
     * @brief Get the parent component ID
     * @param componentId Component ID
     * @return Parent component ID, or an empty string if there is no parent
     */
    virtual std::string getParentId(const std::string& componentId) = 0;

    /**
     * @brief Refresh style tokens for all components
     * @remark Iterates all components and notifies them of style updates
     */
    virtual void refreshStyleTokens() = 0;

    /**
     * @brief Batch-set the display rules for components
     * @param displayRules Map from componentId to DisplayRule
     * @remark Updates the display rule for each specified component, affecting orphan snapshot display logic
     */
    virtual void setComponentsDisplayRule(const std::map<std::string, DisplayRule>& displayRules) = 0;

    /**
     * @brief Execute a component action
     * @param componentId Component ID
     * @param surfaceId Surface ID
     * @param dispatcher Event dispatcher pointer
     */
    virtual void executeComponentAction(const std::string& componentId, const std::string& surfaceId, void* dispatcher) = 0;
};

}  // namespace agenui
