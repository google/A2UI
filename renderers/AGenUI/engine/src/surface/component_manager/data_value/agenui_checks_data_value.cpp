#include "agenui_checks_data_value.h"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

ChecksDataValue::ChecksDataValue(IDataModel* dataModel, const std::vector<std::shared_ptr<DataValue>>& checks) : DataValue(dataModel), _checks(checks) {
}

DataType ChecksDataValue::getDataType() const {
    return DataType::ChecksData;
}

DataBindingStatus ChecksDataValue::getDataBindingStatus() const {
    std::vector<DataBindingStatus> statuses;
    for (const auto& check : _checks) {
        if (check) {
            statuses.emplace_back(check->getDataBindingStatus());
        }
    }
    return aggregateBindingStatus(statuses);
}

SerializableData ChecksDataValue::getValueData() const {
    // Evaluate all checks with implicit AND
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

void ChecksDataValue::bind(IDataChangedObserver* observer) {
    for (auto& check : _checks) {
        if (check) {
            check->bind(observer);
        }
    }
}

void ChecksDataValue::unbind() {
    for (auto& check : _checks) {
        if (check) {
            check->unbind();
        }
    }
}

std::shared_ptr<DataValue> ChecksDataValue::cloneAsTemplate(const std::string& rootDataPath) const {
    std::vector<std::shared_ptr<DataValue>> clonedChecks;
    clonedChecks.reserve(_checks.size());

    for (const auto& check : _checks) {
        if (check) {
            clonedChecks.emplace_back(check->cloneAsTemplate(rootDataPath));
        }
    }

    auto cloned = std::make_shared<ChecksDataValue>(_dataModel, clonedChecks);
    cloned->_extensions = _extensions;  // Copy extension fields (e.g. message)
    return cloned;
}

}  // namespace agenui
