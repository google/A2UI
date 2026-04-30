#include "agenui_interpolation_bindable_data_value.h"
#include "surface/datamodel/agenui_idata_model.h"
#include "surface/datamodel/agenui_data_observer.h"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

// Helper: normalize a path, resolving '.' and '..' segments
static std::string normalizePath(const std::string& path);

InterpolationBindableDataValue::InterpolationBindableDataValue(IDataModel* dataModel, const std::string& value, const std::vector<std::string>& bindingPaths) : DataValue(dataModel), _value(value), _bindingPaths(bindingPaths), _observer(nullptr) {
}

InterpolationBindableDataValue::~InterpolationBindableDataValue() {
    unbind();
}

DataType InterpolationBindableDataValue::getDataType() const {
    return DataType::InterpolationBindableData;
}

DataBindingStatus InterpolationBindableDataValue::getDataBindingStatus() const {
    if (_bindingPaths.empty()) {
        return DataBindingStatus::NotDependent;
    }
    if (!_dataModel) {
        return DataBindingStatus::NotReady;
    }
    
    int readyCount = 0;
    for (const auto& path : _bindingPaths) {
        auto value = _dataModel->getValue(path);
        if (value.isValid()) {
            readyCount++;
        }
    }
    
    if (readyCount == 0) {
        return DataBindingStatus::NotReady;
    }
    if (readyCount == static_cast<int>(_bindingPaths.size())) {
        return DataBindingStatus::FullyReady;
    }
    return DataBindingStatus::PartiallyReady;
}

SerializableData InterpolationBindableDataValue::getValueData() const {
    return SerializableData::parse(_value);
}

void InterpolationBindableDataValue::bind(IDataChangedObserver* observer) {
    unbind();
    
    _observer = observer;
    
    if (_observer != nullptr && _dataModel != nullptr) {
        for (const auto& path : _bindingPaths) {
            _dataModel->bind(path, _observer);
        }
    }
}

void InterpolationBindableDataValue::unbind() {
    if (_observer == nullptr) {
        return;
    }
    
    if (_dataModel != nullptr) {
        for (const auto& path : _bindingPaths) {
            _dataModel->unbind(path, _observer);
        }
    }
    
    _observer = nullptr;
}

std::vector<std::string> InterpolationBindableDataValue::getBindingPaths() const {
    return _bindingPaths;
}

std::shared_ptr<DataValue> InterpolationBindableDataValue::cloneAsTemplate(const std::string& rootDataPath) const {
    std::vector<std::string> newPaths;
    std::string newValue = _value;

    for (const auto& path : _bindingPaths) {
        std::string newPath = path;

        // Relative paths (not starting with '/') are resolved against rootDataPath
        if (!path.empty() && path[0] != '/') {
            if (!rootDataPath.empty()) {
                newPath = normalizePath(rootDataPath + "/" + path);

                // Replace placeholder references in the interpolation string
                std::string oldPlaceholder = "${" + path + "}";
                std::string newPlaceholder = "${" + newPath + "}";

                size_t pos = 0;
                while ((pos = newValue.find(oldPlaceholder, pos)) != std::string::npos) {
                    newValue.replace(pos, oldPlaceholder.length(), newPlaceholder);
                    pos += newPlaceholder.length();
                }
            }
        }

        newPaths.emplace_back(newPath);
    }

    auto cloned = std::make_shared<InterpolationBindableDataValue>(_dataModel, newValue, newPaths);

    // If the original was already bound, bind the clone to the same observer
    if (_observer != nullptr) {
        cloned->bind(_observer);
    }

    return cloned;
}

// Helper implementation: normalize a path, resolving '.' and '..' segments
static std::string normalizePath(const std::string& path) {
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

}  // namespace agenui
