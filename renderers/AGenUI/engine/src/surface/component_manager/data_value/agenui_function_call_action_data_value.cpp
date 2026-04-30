#include "agenui_function_call_action_data_value.h"
#include "surface/datamodel/agenui_idata_model.h"
#include "surface/datamodel/agenui_data_observer.h"
#include "surface/virtual_dom/agenui_component_snapshot.h"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

FunctionCallActionDataValue::FunctionCallActionDataValue(IDataModel* dataModel, std::shared_ptr<CallableDataValue> functionCall) : DataValue(dataModel), _functionCall(functionCall) {
}

FunctionCallActionDataValue::~FunctionCallActionDataValue() {
    unbind();
}

DataType FunctionCallActionDataValue::getDataType() const {
    return DataType::FunctionCallActionData;
}

DataBindingStatus FunctionCallActionDataValue::getDataBindingStatus() const {
    if (!_functionCall) {
        return DataBindingStatus::NotDependent;
    }
    return _functionCall->getDataBindingStatus();
}

SerializableData FunctionCallActionDataValue::getValueData() const {
    auto impl = SerializableData::Impl::createObject();
    return SerializableData(impl);
}

std::shared_ptr<CallableDataValue> FunctionCallActionDataValue::getFunctionCall() const {
    return _functionCall;
}

void FunctionCallActionDataValue::bind(IDataChangedObserver* observer) {
    if (_functionCall) {
        _functionCall->bind(observer);
    }
}

void FunctionCallActionDataValue::unbind() {
    if (_functionCall) {
        _functionCall->unbind();
    }
}

std::shared_ptr<DataValue> FunctionCallActionDataValue::cloneAsTemplate(const std::string& rootDataPath) const {
    std::shared_ptr<CallableDataValue> clonedFunctionCall = nullptr;
    
    if (_functionCall) {
        auto clonedValue = _functionCall->cloneAsTemplate(rootDataPath);
        clonedFunctionCall = std::static_pointer_cast<CallableDataValue>(clonedValue);
    }
    
    auto cloned = std::make_shared<FunctionCallActionDataValue>(_dataModel, clonedFunctionCall);
    cloned->_extensions = _extensions;
    
    return cloned;
}

SerializableData FunctionCallActionDataValue::execute() const {
    if (!_functionCall) {
        return SerializableData();
    }

    return _functionCall->getValueData();
}

}  // namespace agenui
