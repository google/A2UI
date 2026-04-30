#include "agenui_static_data_value.h"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

StaticDataValue::StaticDataValue(const std::string& value) : DataValue(), _value(value) {
}

DataType StaticDataValue::getDataType() const {
    return DataType::StaticData;
}

DataBindingStatus StaticDataValue::getDataBindingStatus() const {
    return DataBindingStatus::NotDependent;
}

SerializableData StaticDataValue::getValueData() const {
    return SerializableData::parse(_value);
}

void StaticDataValue::bind(IDataChangedObserver* observer) {
    // Static values do not need binding
}

void StaticDataValue::unbind() {
    // Static values do not need unbinding
}

std::shared_ptr<DataValue> StaticDataValue::cloneAsTemplate(const std::string& rootDataPath) const {
    return std::make_shared<StaticDataValue>(_value);
}

}  // namespace agenui
