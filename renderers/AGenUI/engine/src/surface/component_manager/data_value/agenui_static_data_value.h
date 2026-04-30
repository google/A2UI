#pragma once

#include <string>
#include <memory>
#include "agenui_data_value_base.h"

namespace agenui {

/**
 * @brief Static data value
 * @remark Represents a static string value that does not depend on data binding
 */
class StaticDataValue : public DataValue {
public:
    explicit StaticDataValue(const std::string& value);
    
    DataType getDataType() const override;
    DataBindingStatus getDataBindingStatus() const override;
    SerializableData getValueData() const override;
    void bind(IDataChangedObserver* observer) override;
    void unbind() override;
    std::shared_ptr<DataValue> cloneAsTemplate(const std::string& rootDataPath) const override;

private:
    std::string _value;
};

}  // namespace agenui