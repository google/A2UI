#include "agenui_parseable_data_value.h"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

ParseableDataValue::ParseableDataValue(IDataModel* dataModel, const std::string& rawString) : DataValue(dataModel), _rawString(rawString) {
}

DataType ParseableDataValue::getDataType() const {
    return DataType::ParseableData;
}

DataBindingStatus ParseableDataValue::getDataBindingStatus() const {
    return DataBindingStatus::NotDependent;
}

SerializableData ParseableDataValue::getValueData() const {
    std::string result = parseExpression();
    return SerializableData::parse(result);
}

std::string ParseableDataValue::parseExpression() const {
    // TODO: implement expression parsing logic
    return _rawString;
}

void ParseableDataValue::bind(IDataChangedObserver* observer) {
    // Parseable values do not currently support binding
}

void ParseableDataValue::unbind() {
    // Parseable values do not currently support unbinding
}

std::shared_ptr<DataValue> ParseableDataValue::cloneAsTemplate(const std::string& rootDataPath) const {
    return std::make_shared<ParseableDataValue>(_dataModel, _rawString);
}

}  // namespace agenui
