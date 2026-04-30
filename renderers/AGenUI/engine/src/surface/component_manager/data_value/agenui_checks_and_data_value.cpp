#include "agenui_checks_and_data_value.h"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

ChecksAndDataValue::ChecksAndDataValue(IDataModel* dataModel, const std::vector<std::shared_ptr<DataValue>>& checks) : DataValue(dataModel), _checks(checks) {
}

DataType ChecksAndDataValue::getDataType() const {
    return DataType::ChecksAndData;
}

DataBindingStatus ChecksAndDataValue::getDataBindingStatus() const {
    std::vector<DataBindingStatus> statuses;
    for (const auto& check : _checks) {
        if (check) {
            statuses.emplace_back(check->getDataBindingStatus());
        }
    }
    return aggregateBindingStatus(statuses);
}

SerializableData ChecksAndDataValue::getValueData() const {
    // All checks must pass (AND logic)
    bool allPassed = true;
    std::string message;

    for (const auto& check : _checks) {
        if (!check) {
            allPassed = false;
            message = getExtension("message");
            break;
        }

        auto result = check->getValueData();
        if (!(result.isBool() && result.asBool())) {
            allPassed = false;
            message = check->getExtension("message");
            if (message.empty()) {
                message = getExtension("message");
            }
            break;
        }
    }

    auto impl = SerializableData::Impl::createObject();
    impl->set("result", allPassed);
    if (!allPassed) {
        impl->set("message", message);
    }
    return SerializableData(impl);
}

void ChecksAndDataValue::bind(IDataChangedObserver* observer) {
    for (auto& check : _checks) {
        if (check) {
            check->bind(observer);
        }
    }
}

void ChecksAndDataValue::unbind() {
    for (auto& check : _checks) {
        if (check) {
            check->unbind();
        }
    }
}

std::shared_ptr<DataValue> ChecksAndDataValue::cloneAsTemplate(const std::string& rootDataPath) const {
    std::vector<std::shared_ptr<DataValue>> clonedChecks;
    clonedChecks.reserve(_checks.size());

    for (const auto& check : _checks) {
        if (check) {
            clonedChecks.emplace_back(check->cloneAsTemplate(rootDataPath));
        }
    }

    auto cloned = std::make_shared<ChecksAndDataValue>(_dataModel, clonedChecks);
    cloned->_extensions = _extensions;
    return cloned;
}

}  // namespace agenui
