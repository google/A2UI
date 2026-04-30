#include "agenui_callable_data_value.h"
#include "surface/agenui_expression_parser.h"
#include "surface/datamodel/agenui_idata_model.h"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

CallableDataValue::CallableDataValue(IDataModel* dataModel, const std::string& functionName, const std::map<std::string, std::shared_ptr<DataValue>>& args) : DataValue(dataModel), _functionName(functionName), _args(args) {
}

DataType CallableDataValue::getDataType() const {
    return DataType::CallableData;
}

DataBindingStatus CallableDataValue::getDataBindingStatus() const {
    std::vector<DataBindingStatus> statuses;
    for (const auto& pair : _args) {
        if (pair.second) {
            statuses.emplace_back(pair.second->getDataBindingStatus());
        }
    }
    return aggregateBindingStatus(statuses);
}

SerializableData CallableDataValue::getValueData() const {
    // Build the args object
    auto argsImpl = SerializableData::Impl::createObject();
    for (const auto& pair : _args) {
        if (!pair.second) {
            continue;
        }

        auto valueData = pair.second->getValueData();
        if (!valueData.isValid()) {
            continue;
        }

        argsImpl->set(pair.first, valueData);
    }
    SerializableData argsData(argsImpl);

    // Build the full function-call object
    auto functionCallImpl = SerializableData::Impl::createObject();
    functionCallImpl->set("call", _functionName);
    functionCallImpl->set("args", argsData);
    SerializableData functionCallData(functionCallImpl);

    // Create the data getter callback
    auto dataGetter = [this](const std::string& path) -> std::string {
        if (!_dataModel) {
            return "";
        }
        auto value = _dataModel->getValue(path);
        if (!value.isValid()) {
            return "";
        }
        return value.dump();
    };

    // Invoke handleFunctionCall directly (no JSON round-trip needed)
    ExpressionParser parser(dataGetter);
    return parser.handleFunctionCall(functionCallData);
}

std::string CallableDataValue::getFunctionName() const {
    return _functionName;
}

std::map<std::string, std::shared_ptr<DataValue>> CallableDataValue::getArgs() const {
    return _args;
}

void CallableDataValue::bind(IDataChangedObserver* observer) {
    for (auto& pair : _args) {
        if (pair.second) {
            pair.second->bind(observer);
        }
    }
}

void CallableDataValue::unbind() {
    for (auto& pair : _args) {
        if (pair.second) {
            pair.second->unbind();
        }
    }
}

std::shared_ptr<DataValue> CallableDataValue::cloneAsTemplate(const std::string& rootDataPath) const {
    // Recursively clone all arguments
    std::map<std::string, std::shared_ptr<DataValue>> clonedArgs;
    for (const auto& pair : _args) {
        if (pair.second) {
            clonedArgs[pair.first] = pair.second->cloneAsTemplate(rootDataPath);
        }
    }
    
    return std::make_shared<CallableDataValue>(_dataModel, _functionName, clonedArgs);
}

}  // namespace agenui
