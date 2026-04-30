#pragma once

#include <string>
#include <vector>
#include <map>
#include <memory>
#include "surface/datamodel/agenui_data_observer.h"
#include "data_value/agenui_data_value_base.h"
#include "data_value/agenui_static_data_value.h"
#include "data_value/agenui_bindable_data_value.h"
#include "data_value/agenui_tabs_data_value.h"
#include "data_value/agenui_styles_data_value.h"
#include "data_value/agenui_event_action_data_value.h"
#include "data_value/agenui_function_call_action_data_value.h"
#include "surface/virtual_dom/agenui_component_snapshot.h"
#include "surface/component_property_spec/agenui_ispec_applicable.h"

namespace agenui {

class EventDispatcher;
class IDataModel;
class ComponentModel;

/**
 * @brief Interface for template-based component generation
 */
class ITemplateComponentGenerator {
public:
    virtual ~ITemplateComponentGenerator() = default;

    /**
     * @brief Generate list child components
     * @param templateId Child component template ID
     * @param data Component data
     * @return Array of generated component model smart pointers
     */
    virtual std::vector<std::shared_ptr<ComponentModel>> generateListChildren(const std::string& templateId, std::shared_ptr<DataValue> data) = 0;

    /**
     * @brief Generate a component from a template
     * @param templateId Template ID
     * @param data Component data (must be a BindableDataValue so that the bindingPath can be extracted)
     * @return Generated component model smart pointer
     */
    virtual std::shared_ptr<ComponentModel> generateComponentWithTemplate(const std::string& templateId, std::shared_ptr<DataValue> data) = 0;
};

/**
 * @brief Observer interface for component change events
 */
class IComponentChangedObserver {
public:
    virtual ~IComponentChangedObserver() = default;

    /**
     * @brief Called when a component attribute changes
     * @param componentId ID of the changed component
     * @param attributeName Name of the changed attribute
     */
    virtual void onComponentAttributeChanged(const std::string& componentId, const std::string& attributeName) = 0;

    /**
     * @brief Called when a component is deleted
     * @param componentId ID of the deleted component
     */
    virtual void onComponentDeleted(const std::string& componentId) = 0;
};

/**
 * @brief Observer interface for component attribute data change events
 */
class IComponentAttributeDataChangedObserver {
public:
    virtual ~IComponentAttributeDataChangedObserver() = default;

    /**
     * @brief Called when a component attribute's data changes
     * @param attributeName Name of the changed attribute
     */
    virtual void onComponentAttributeDataChanged(const std::string& attributeName, bool appendMode = false) = 0;
};

/**
 * @brief Component model class
 * @remark Represents the complete information of a component, including attributes, children, and data binding paths
 */
class ComponentModel : public IComponentAttributeDataChangedObserver, public ISpecApplicable {
public:
    /**
     * @brief Constructor
     * @param id Component ID (as defined by the a2ui protocol)
     * @param rawId Raw component ID
     * @param component Component type
     * @param dataModel Data model pointer
     * @param observer Component change observer
     * @param generator List child component generator
     */
    ComponentModel(const std::string& id, const std::string& rawId, const std::string& component, IDataModel* dataModel, IComponentChangedObserver* observer, ITemplateComponentGenerator* generator);

    ~ComponentModel() override;

    std::string getId() const;
    std::string getRawId() const;
    std::string getComponent() const;

    /**
     * @brief Set an attribute
     * @param key Attribute key
     * @param value Attribute value
     */
    void setAttribute(const std::string& key, std::shared_ptr<DataValue> value);

    /**
     * @brief Get all attributes
     * @return Const reference to the attribute map
     */
    const std::map<std::string, std::shared_ptr<DataValue>>& getAllAttributes() const;

    /**
     * @brief Synchronize a value
     * @param attributeName Attribute name
     * @param value New value
     * @remark Called when bound data changes
     */
    void syncValue(const std::string& attributeName, const std::string& value);

    /**
     * @brief Set the list of child component IDs
     * @param children Child component ID list
     */
    void setChildren(const std::vector<std::string>& children);

    /**
     * @brief Get the list of child component IDs
     * @return Child component ID list
     */
    const std::vector<std::string>& getChildren() const;

    /**
     * @brief Set list child component data
     * @param data List child component data
     */
    void setListChildrenData(std::shared_ptr<DataValue> data);

    /**
     * @brief Get list child component data
     * @return List child component data
     */
    std::shared_ptr<DataValue> getListChildrenData() const;

    /**
     * @brief Set the children template ID
     * @param templateId Children template ID
     */
    void setChildrenTemplateId(const std::string& templateId);

    /**
     * @brief Get the list children template ID
     * @return List children template ID
     */
    std::string getListChildrenTemplateId() const;

    /**
     * @brief Generate list child components via the generator
     */
    void generateListChildren();

    /**
     * @brief Set template component information
     * @param bindingData Bound data value
     * @param childrenTemplateIds Array of child template IDs
     * @remark Used when this component was constructed from a template; sets the template flag, binding data, and child template IDs
     */
    void setTemplateComponentInfo(std::shared_ptr<DataValue> bindingData, const std::vector<std::string>& childrenTemplateIds);

    /**
     * @brief Generate template child components
     * @param childTemplateId Child template ID; generates all children if empty
     */
    void generateTemplateChildren(const std::string& childTemplateId = "");

    /**
     * @brief Attempt to update a child template
     * @param componentId Component ID
     */
    void tryUpdateChildrenTemplate(const std::string& componentId);

    /**
     * @brief Update and return the component snapshot
     * @param attributeName Name of the changed attribute
     * @return Updated component snapshot
     */
    const ComponentSnapshot& updateSnapshot(const std::string& attributeName);

    /**
     * @brief Set the component display rule
     * @param rule Display rule
     */
    void setDisplayRule(DisplayRule rule);

    void onComponentAttributeDataChanged(const std::string& attributeName, bool appendMode = false) override;

    std::string getComponentType() const override;

    /**
     * @brief Check whether a property is set
     * @param propertyName Property name
     * @return true if set, false otherwise
     */
    bool hasProperty(const std::string& propertyName) const override;

    /**
     * @brief Get a property value as a plain string
     * @param propertyName Property name
     * @return Property value string, or empty string if not set
     */
    std::string getPropertyStringValue(const std::string& propertyName) const override;

    /**
     * @brief Set a property value
     * @param propertyName Property name
     * @param value Property value
     */
    void setPropertyValue(const std::string& propertyName, const std::string& value) override;

    /**
     * @brief Check whether a style property is set
     * @param styleName Style property name
     * @return true if set, false otherwise
     */
    bool hasStyle(const std::string& styleName) const override;

    /**
     * @brief Set a style value
     * @param styleName Style property name
     * @param value Style value
     */
    void setStyleValue(const std::string& styleName, const std::string& value) override;

    /**
     * @brief Execute the component action
     * @param surfaceId Surface ID
     * @param dispatcher Event dispatcher
     */
    void executeAction(const std::string& surfaceId, agenui::EventDispatcher* dispatcher);

private:
    /**
     * @brief Attribute data binder
     * @remark Listens for data changes on a bound attribute
     */
    class AttributeDataBinder : public IDataChangedObserver {
    public:
        /**
         * @brief Constructor
         * @param componentId Component ID
         * @param attributeName Attribute name
         * @param observer Component attribute data change observer
         */
        AttributeDataBinder(const std::string& componentId, const std::string& attributeName, IComponentAttributeDataChangedObserver* observer);

        ~AttributeDataBinder() override;

        /**
         * @brief Called when data changes
         * @param path Data path
         * @param newValue New value
         */
        void onDataChanged(const std::string& path, const std::string& newValue, bool appendMode = false) override;

    private:
        std::string _componentId;
        std::string _attributeName;
        IComponentAttributeDataChangedObserver* _observer;
    };

    void notifyComponentChange(const std::string& attributeName);
    void notifyChildComponentDelete(const std::string& childComponentId);

    std::string _id;
    std::string _rawId;
    std::string _component;

    std::map<std::string, std::shared_ptr<DataValue>> _attributes;
    std::map<std::string, AttributeDataBinder> _attributeBinders;

    std::vector<std::string> _children;

    std::shared_ptr<DataValue> _listChildrenData = nullptr;
    std::string _listChildrenTemplateId = "";

    bool _isTemplateComponent = false;
    std::shared_ptr<DataValue> _templateBindingData = nullptr;
    std::vector<std::string> _templateChildrenIds;

    IDataModel* _dataModel;
    IComponentChangedObserver* _observer;
    ITemplateComponentGenerator* _templateComponentGenerator;

    ComponentSnapshot _currentSnapshot;
    DisplayRule _displayRule = DisplayRule::Always;
};

}  // namespace agenui
