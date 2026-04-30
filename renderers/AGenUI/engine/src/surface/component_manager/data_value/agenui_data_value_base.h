#pragma once

#include <string>
#include <vector>
#include <memory>
#include <map>
#include "surface/agenui_serializable_data.h"
#include "surface/virtual_dom/agenui_component_snapshot.h"

namespace agenui {

class EventDispatcher;
class IDataModel;
class IDataChangedObserver;

/**
 * @brief Data type enum
 */
enum class DataType {
    StaticData,                    // Static data
    BindableData,                  // Bindable data
    ParseableData,                 // Parseable data
    CallableData,                  // Callable data
    InterpolationBindableData,     // String-interpolation bindable data
    ChecksData,                    // Conditional check data
    ChecksAndData,                 // AND-logic check data
    ChecksOrData,                  // OR-logic check data
    StylesData,                    // Style data
    TabsData,                      // Tabs data
    EventActionData,               // Event action data
    FunctionCallActionData         // Function-call action data
};

/**
 * @brief Data value interface
 * @remark Represents the data value of a component attribute; supports static, bindable, and parseable values
 */
class DataValue {
public:
    virtual ~DataValue() = default;

    /**
     * @brief Get the data type
     * @return Data type
     */
    virtual DataType getDataType() const = 0;

    /**
     * @brief Get the data binding status
     * @return Data binding status
     * @remark Indicates whether the binding path can be resolved in the DataModel
     */
    virtual DataBindingStatus getDataBindingStatus() const = 0;

    /**
     * @brief Aggregate multiple data binding statuses
     * @param statuses Array of data binding statuses
     * @return Aggregated data binding status
     */
    static DataBindingStatus aggregateBindingStatus(const std::vector<DataBindingStatus>& statuses);

    /**
     * @brief Get the data value
     * @return Serializable data representation
     */
    virtual SerializableData getValueData() const = 0;

    /**
     * @brief Bind an observer
     * @param observer Observer pointer
     * @remark Registers the observer on the data path; it will be notified when the data changes
     */
    virtual void bind(IDataChangedObserver* observer) = 0;

    /**
     * @brief Unbind the observer
     */
    virtual void unbind() = 0;

    /**
     * @brief Set an extension field
     * @param key Extension field name
     * @param value Extension field value
     */
    virtual void setExtension(const std::string& key, const std::string& value);

    /**
     * @brief Get all extension fields
     * @return Extension field map
     */
    virtual std::map<std::string, std::string> getExtensions() const;

    /**
     * @brief Get the value of a specific extension field
     * @param key Extension field name
     * @return Extension field value, or empty string if not found
     */
    virtual std::string getExtension(const std::string& key) const;

    /**
     * @brief Clone the data value for template generation
     * @param rootDataPath Root data path used for relative path conversion
     * @return Cloned data value
     * @remark Used when generating components from templates; supports path substitution
     */
    virtual std::shared_ptr<DataValue> cloneAsTemplate(const std::string& rootDataPath) const = 0;

protected:
    /**
     * @brief Constructor
     * @param dataModel Data model pointer
     */
    explicit DataValue(IDataModel* dataModel);

    DataValue();

    IDataModel* _dataModel;                          // Data model pointer
    std::map<std::string, std::string> _extensions;  // Extension field map
};

}  // namespace agenui
