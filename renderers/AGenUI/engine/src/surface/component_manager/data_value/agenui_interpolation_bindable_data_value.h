#pragma once

#include "agenui_data_value_base.h"
#include <string>
#include <vector>
#include <memory>

namespace agenui {

class IDataModel;
class IDataChangedObserver;

/**
 * @brief Interpolation bindable data value
 * @remark Represents an interpolated string that contains one or more data binding paths
 */
class InterpolationBindableDataValue : public DataValue {
public:
    InterpolationBindableDataValue(IDataModel* dataModel, const std::string& value, const std::vector<std::string>& bindingPaths);
    ~InterpolationBindableDataValue() override;
    
    DataType getDataType() const override;
    DataBindingStatus getDataBindingStatus() const override;
    SerializableData getValueData() const override;
    void bind(IDataChangedObserver* observer) override;
    void unbind() override;
    std::shared_ptr<DataValue> cloneAsTemplate(const std::string& rootDataPath) const override;
    
    std::vector<std::string> getBindingPaths() const;

private:
    std::string _value;
    std::vector<std::string> _bindingPaths;
    IDataChangedObserver* _observer;
};

}  // namespace agenui