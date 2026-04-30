#include "agenui_data_model.h"
#include "agenui_data_observer.h"
#include "agenui_log.h"
#include "surface/agenui_serializable_data_impl.h"
#include "nlohmann/json.hpp"
#include <algorithm>
#include <set>

namespace agenui {

using json = nlohmann::json;

struct DataModel::Impl {
    nlohmann::json root;

    Impl() : root(nlohmann::json::object()) {}

    // Recursively merges objects; overwrites leaf nodes directly
    void recursiveMergeAppend(nlohmann::json& target, const nlohmann::json& patch) {
        if (patch.is_object() && target.is_object()) {
            for (auto it = patch.begin(); it != patch.end(); ++it) {
                if (target.contains(it.key())) {
                    recursiveMergeAppend(target[it.key()], it.value());
                } else {
                    target[it.key()] = it.value();
                }
            }
        } else {
            target = patch;
        }
    }
};

DataModel::DataModel() : _impl(new Impl()) {
}

DataModel::~DataModel() {
}

void DataModel::syncBindingValue(const std::string& path, const std::string& value) {
    updateData(path, value);
}

void DataModel::updateData(const std::string& path, const std::string& jsonValue) {
    if (path.empty()) {
        AGENUI_LOG("updateData failed: path is empty");
        return;
    }

    AGENUI_LOG("path:%s, jsonValue:%s", path.c_str(), jsonValue.c_str());

    nlohmann::json newValue = nlohmann::json::parse(jsonValue, nullptr, false);
    if (newValue.is_discarded()) {
        newValue = jsonValue;
    }

    if (path == "/") {
        _impl->recursiveMergeAppend(_impl->root, newValue);
    } else {
        if (!_impl->root.is_object()) {
            _impl->root = nlohmann::json::object();
        }
        json::json_pointer ptr(path);
        _impl->root[ptr] = newValue;
    }
    notifyAffectedObservers(path);
}

void DataModel::appendData(const std::string& path, const std::string& jsonValue) {
    if (path.empty()) {
        AGENUI_LOG("appendData failed: path is empty");
        return;
    }

    AGENUI_LOG("path:%s, jsonValue:%s", path.c_str(), jsonValue.c_str());

    nlohmann::json patchValue = nlohmann::json::parse(jsonValue, nullptr, false);
    if (patchValue.is_discarded()) {
        patchValue = jsonValue;
    }

    if (path == "/") {
        _impl->recursiveMergeAppend(_impl->root, patchValue);
    } else {
        if (!_impl->root.is_object()) {
            _impl->root = nlohmann::json::object();
        }
        json::json_pointer ptr(path);
        if (_impl->root.contains(ptr)) {
            _impl->recursiveMergeAppend(_impl->root[ptr], patchValue);
        } else {
            _impl->root[ptr] = patchValue;
        }
    }
    notifyAffectedObservers(path, true);
}

SerializableData DataModel::getValue(const std::string& path) {
    if (path.empty()) {
        AGENUI_LOG("getValue failed: path is empty");
        return SerializableData();
    }

    if (path[0] != '/') {
        AGENUI_LOG("getValue failed: path must start with '/', path=%s", path.c_str());
        return SerializableData();
    }

    if (path == "/") {
        nlohmann::json rootCopy = _impl->root;
        return SerializableData(SerializableData::Impl::create(std::move(rootCopy)));
    }

    json::json_pointer ptr(path);
    if (_impl->root.contains(ptr)) {
        nlohmann::json childCopy = _impl->root[ptr];
        return SerializableData(SerializableData::Impl::create(std::move(childCopy)));
    }
    return SerializableData();
}

void DataModel::bind(const std::string& path, IDataChangedObserver* observer) {
    if (path.empty() || observer == nullptr) {
        AGENUI_LOG("bind failed: path is empty or observer is null");
        return;
    }

    AGENUI_LOG("path:%s", path.c_str());

    auto it = _bindingTable.find(path);
    if (it != _bindingTable.end()) {
        auto& observers = it->second;
        auto observerIt = std::find(observers.begin(), observers.end(), observer);
        if (observerIt == observers.end()) {
            observers.emplace_back(observer);
            AGENUI_LOG("added ob to binding table, path:%s, total observers:%zu", path.c_str(), observers.size());
        }
    } else {
        std::vector<IDataChangedObserver*> observers;
        observers.emplace_back(observer);
        _bindingTable[path] = std::move(observers);
        AGENUI_LOG("created new entry in binding table, path=%s", path.c_str());
    }
}

void DataModel::unbind(const std::string& path, IDataChangedObserver* observer) {
    if (path.empty() || observer == nullptr) {
        AGENUI_LOG("unbind failed: path is empty or observer is null");
        return;
    }

    AGENUI_LOG("path:%s", path.c_str());

    auto it = _bindingTable.find(path);
    if (it != _bindingTable.end()) {
        auto& observers = it->second;
        auto observerIt = std::find(observers.begin(), observers.end(), observer);
        if (observerIt != observers.end()) {
            observers.erase(observerIt);
            AGENUI_LOG("removed observer from binding table, path=%s, remaining observers=%zu", path.c_str(), observers.size());
            if (observers.empty()) {
                _bindingTable.erase(it);
            }
        } else {
            AGENUI_LOG("observer not found in binding table, path:%s", path.c_str());
        }
    } else {
        AGENUI_LOG("path not found in binding table, path:%s", path.c_str());
    }
}

bool DataModel::isSubPathOrEqual(const std::string& path, const std::string& parentPath) const {
    if (path == parentPath) {
        return true;
    }

    if (path.length() <= parentPath.length()) {
        return false;
    }

    if (path.compare(0, parentPath.length(), parentPath) != 0) {
        return false;
    }

    if (parentPath == "/") {
        return true;
    }

    return path[parentPath.length()] == '/';
}

void DataModel::notifyAffectedObservers(const std::string& changedPath, bool appendMode) {
    if (changedPath.empty()) {
        return;
    }
    for (const auto& entry : _bindingTable) {
        const std::string& observerPath = entry.first;
        const std::vector<IDataChangedObserver*>& observers = entry.second;

        if (isSubPathOrEqual(observerPath, changedPath) || isSubPathOrEqual(changedPath, observerPath)) {
            std::set<IDataChangedObserver*> uniqueObservers(observers.begin(), observers.end());

            auto data = getValue(observerPath);
            std::string newValue = data.isValid() ? data.dump() : "";

            for (auto* observer : uniqueObservers) {
                if (observer != nullptr) {
                    AGENUI_LOG("notifying observer for path:%s", observerPath.c_str());
                    observer->onDataChanged(observerPath, newValue, appendMode);
                }
            }
        }
    }
}

}  // namespace agenui
