#include "agenui_checks_or_data_value.h"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

ChecksOrDataValue::ChecksOrDataValue(IDataModel* dataModel, const std::vector<std::shared_ptr<DataValue>>& checks) : DataValue(dataModel), _checks(checks) {
}

DataType ChecksOrDataValue::getDataType() const {
    return DataType::ChecksOrData;
}

DataBindingStatus ChecksOrDataValue::getDataBindingStatus() const {
    std::vector<DataBindingStatus> statuses;
    for (const auto& check : _checks) {
        if (check) {
            statuses.emplace_back(check->getDataBindingStatus());
        }
    }
    return aggregateBindingStatus(statuses);
}

SerializableData ChecksOrDataValue::getValueData() const {
    // At least one check must pass (OR logic)
    std::string lastMessage = "";
    for (const auto& check : _checks) {
        if (!check) {
            continue;
        }

        auto result = check->getValueData();
        if (result.isBool() && result.asBool()) {
            auto implPass = SerializableData::Impl::createObject();
            implPass->set("result", true);
            return SerializableData(implPass);
        }

        std::string msg = check->getExtension("message");
        if (!msg.empty()) {
            lastMessage = msg;
        }
    }

    // All checks failed; prefer the last check's message, fall back to own message
    if (lastMessage.empty()) {
        lastMessage = getExtension("message");
    }

    auto impl = SerializableData::Impl::createObject();
    impl->set("result", false);
    impl->set("message", lastMessage);
    return SerializableData(impl);
}

void ChecksOrDataValue::bind(IDataChangedObserver* observer) {
    for (auto& check : _checks) {
        if (check) {
            check->bind(observer);
        }
    }
}

void ChecksOrDataValue::unbind() {
    for (auto& check : _checks) {
        if (check) {
            check->unbind();
        }
    }
}

std::shared_ptr<DataValue> ChecksOrDataValue::cloneAsTemplate(const std::string& rootDataPath) const {
    std::vector<std::shared_ptr<DataValue>> clonedChecks;
    clonedChecks.reserve(_checks.size());

    for (const auto& check : _checks) {
        if (check) {
            clonedChecks.emplace_back(check->cloneAsTemplate(rootDataPath));
        }
    }

    auto cloned = std::make_shared<ChecksOrDataValue>(_dataModel, clonedChecks);
    cloned->_extensions = _extensions;
    return cloned;
}

}  // namespace agenui
