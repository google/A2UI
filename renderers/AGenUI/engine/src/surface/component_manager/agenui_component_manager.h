#pragma once

#include "agenui_icomponent_manager.h"
#include "agenui_component_model.h"
#include "surface/virtual_dom/agenui_ivirtual_dom.h"
#include <string>
#include <map>
#include <memory>
#include "nlohmann/json.hpp"

namespace agenui {

// Forward declaration
class IDataModel;

/**
 * @brief Component manager
 * @remark Manages all components for a surface, handling component creation, update, and deletion
 */
class ComponentManager : public IComponentManager, public IComponentChangedObserver, public ITemplateComponentGenerator {
public:
    /**
     * @brief Constructor
     * @param dataModel Data model pointer
     * @param virtualDom Virtual DOM pointer
     * @param theme Theme identifier
     */
    ComponentManager(IDataModel* dataModel, IVirtualDOM* virtualDom, const std::string& theme);

    ~ComponentManager() override;

    /**
     * @brief Update components
     * @param components Array of component JSON strings
     */
    void updateComponents(const std::vector<std::string>& components) override;

    /**
     * @brief Synchronize a binding value
     * @param id Component ID
     * @param attributeName Attribute name
     * @param value New value
     */
    void syncBindingValue(const std::string& id, const std::string& attributeName, const std::string& value) override;

    /**
     * @brief Get the parent component ID
     * @param componentId Component ID
     * @return Parent component ID, or empty string if none
     */
    std::string getParentId(const std::string& componentId) override;

    /**
     * @brief Refresh style tokens for all components
     * @remark Iterates all components and reapplies component specs and style tokens
     */
    void refreshStyleTokens() override;

    /**
     * @brief Batch-set display rules for components
     * @param displayRules Map from componentId to DisplayRule
     */
    void setComponentsDisplayRule(const std::map<std::string, DisplayRule>& displayRules) override;

    /**
     * @brief Execute a component action
     * @param componentId Component ID
     * @param surfaceId Surface ID
     * @param dispatcher Event dispatcher pointer
     */
    void executeComponentAction(const std::string& componentId, const std::string& surfaceId, void* dispatcher) override;

    /**
     * @brief Called when a component attribute changes
     * @param componentId ID of the changed component
     * @param attributeName Name of the changed attribute
     */
    void onComponentAttributeChanged(const std::string& componentId, const std::string& attributeName) override;

    /**
     * @brief Called when a component is deleted
     * @param componentId ID of the deleted component
     */
    void onComponentDeleted(const std::string& componentId) override;

    /**
     * @brief Generate list child components
     * @param templateId Child component template ID
     * @param data Component data
     * @return Array of generated component model smart pointers
     */
    std::vector<std::shared_ptr<ComponentModel>> generateListChildren(const std::string& templateId, std::shared_ptr<DataValue> data) override;

    /**
     * @brief Generate a component from a template
     * @param templateId Template ID
     * @param data Component data (must be BindableDataValue so that bindingPath can be extracted)
     * @return Newly created component model, or nullptr on failure
     */
    std::shared_ptr<ComponentModel> generateComponentWithTemplate(const std::string& templateId, std::shared_ptr<DataValue> data) override;

private:
    /**
     * @brief Parse a component from a JSON string
     * @param componentJson Component JSON string
     * @return Component model smart pointer, or nullptr on failure
     */
    std::shared_ptr<ComponentModel> parseComponent(const std::string& componentJson);

    /**
     * @brief Parse child components from JSON
     * @param json JSON object
     * @param componentType Component type string
     * @param entity Parent component model
     */
    void parseChildren(const nlohmann::json& json, const std::string& componentType, std::shared_ptr<ComponentModel> entity);

    /**
     * @brief Notify the virtual DOM of a component update
     * @param component Component model
     * @param attributeName Name of the changed attribute
     */
    void notifyComponentUpdate(std::shared_ptr<ComponentModel> component, const std::string& attributeName);

    /**
     * @brief Attempt to update a template
     * @param componentId Component ID
     */
    void tryUpdateTemplate(const std::string& componentId);

    IDataModel* _dataModel;                                              // Data model pointer
    IVirtualDOM* _virtualDom;                                            // Virtual DOM pointer
    std::string _theme;                                                  // Theme identifier
    std::map<std::string, std::shared_ptr<ComponentModel>> _components;  // Component map (key = id)
    std::map<std::string, DisplayRule> _displayRules;                    // Display rule map (key = componentId)
};

}  // namespace agenui
