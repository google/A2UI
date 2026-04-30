#include "agenui_data_value_base.h"
#include <sstream>

namespace agenui {

DataBindingStatus DataValue::aggregateBindingStatus(const std::vector<DataBindingStatus>& statuses) {
    if (statuses.empty()) {
        return DataBindingStatus::NotDependent;
    }
    
    bool hasNotReady = false;
    bool hasPartiallyReady = false;
    bool hasFullyReady = false;
    
    for (auto status : statuses) {
        switch (status) {
            case DataBindingStatus::NotDependent:
                break;
            case DataBindingStatus::NotReady:
                hasNotReady = true;
                break;
            case DataBindingStatus::PartiallyReady:
                hasPartiallyReady = true;
                break;
            case DataBindingStatus::FullyReady:
                hasFullyReady = true;
                break;
        }
    }
    
    // No child depends on data
    if (!hasNotReady && !hasPartiallyReady && !hasFullyReady) {
        return DataBindingStatus::NotDependent;
    }
    // Mixed or partially ready → PartiallyReady
    if (hasPartiallyReady || (hasNotReady && hasFullyReady)) {
        return DataBindingStatus::PartiallyReady;
    }
    // Only FullyReady (and NotDependent)
    if (hasFullyReady) {
        return DataBindingStatus::FullyReady;
    }
    // Only NotReady (and NotDependent)
    return DataBindingStatus::NotReady;
}

// Helper: normalize a path, resolving '.' and '..' segments
std::string normalizePath(const std::string& path) {
    if (path.empty()) {
        return path;
    }

    std::vector<std::string> parts;
    std::stringstream ss(path);
    std::string part;

    bool isAbsolute = (path[0] == '/');

    while (std::getline(ss, part, '/')) {
        if (part.empty() || part == ".") {
            continue;
        }

        if (part == "..") {
            if (!parts.empty()) {
                parts.pop_back();
            }
        } else {
            parts.emplace_back(part);
        }
    }

    std::string result;
    if (isAbsolute) {
        result = "/";
    }

    for (size_t i = 0; i < parts.size(); ++i) {
        if (i > 0) {
            result += "/";
        }
        result += parts[i];
    }

    if (isAbsolute && result.empty()) {
        return "/";
    }

    return result;
}

DataValue::DataValue(IDataModel* dataModel) : _dataModel(dataModel) {
}

DataValue::DataValue() : _dataModel(nullptr) {
}

void DataValue::setExtension(const std::string& key, const std::string& value) {
    _extensions[key] = value;
}

std::map<std::string, std::string> DataValue::getExtensions() const {
    return _extensions;
}

std::string DataValue::getExtension(const std::string& key) const {
    auto it = _extensions.find(key);
    if (it != _extensions.end()) {
        return it->second;
    }
    return "";
}

}  // namespace agenui
