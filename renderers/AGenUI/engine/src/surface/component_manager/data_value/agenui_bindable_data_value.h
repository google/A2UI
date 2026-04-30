#pragma once

#include <string>
#include <memory>
#include "agenui_data_value_base.h"

namespace agenui {

class IDataModel;
class IDataChangedObserver;

/**
 * @brief Bindable data value
 * @remark Represents a dynamic value bound to a path in the data model
 */
class BindableDataValue : public DataValue {
public:
    BindableDataValue(IDataModel* dataModel, const std::string& bindingPath);
    ~BindableDataValue() override;
    
    DataType getDataType() const override;
    DataBindingStatus getDataBindingStatus() const override;
    SerializableData getValueData() const override;
    void bind(IDataChangedObserver* observer) override;
    void unbind() override;
    std::shared_ptr<DataValue> cloneAsTemplate(const std::string& rootDataPath) const override;
    
    void setDataModel(IDataModel* dataModel);
    std::string getBindingPath() const;
    void syncBindingValue(const std::string& value);

private:
    std::string _bindingPath;
    IDataChangedObserver* _observer;
};

}  // namespace agenui