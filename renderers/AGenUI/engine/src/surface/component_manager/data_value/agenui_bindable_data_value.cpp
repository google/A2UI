#include "agenui_bindable_data_value.h"
#include "surface/datamodel/agenui_idata_model.h"
#include "surface/datamodel/agenui_data_observer.h"
#include "surface/agenui_serializable_data_impl.h"


namespace agenui {

// Helper: normalize a path, resolving '.' and '..' segments
static std::string normalizePath(const std::string& path);

BindableDataValue::BindableDataValue(IDataModel* dataModel, const std::string& bindingPath) : DataValue(dataModel), _bindingPath(bindingPath), _observer(nullptr) {
}

BindableDataValue::~BindableDataValue() {
    unbind();
}

DataType BindableDataValue::getDataType() const {
    return DataType::BindableData;
}

DataBindingStatus BindableDataValue::getDataBindingStatus() const {
    if (!_dataModel) {
        return DataBindingStatus::NotReady;
    }
    auto value = _dataModel->getValue(_bindingPath);
    return !value.isValid() ? DataBindingStatus::NotReady : DataBindingStatus::FullyReady;
}

SerializableData BindableDataValue::getValueData() const {
    if (!_dataModel) {
        return SerializableData();
    }
    
    return _dataModel->getValue(_bindingPath);
}

void BindableDataValue::setDataModel(IDataModel* dataModel) {
    if (_dataModel == dataModel) {
        return;
    }
    
    unbind();
    _dataModel = dataModel;
    bind(_observer);
}

std::string BindableDataValue::getBindingPath() const {
    return _bindingPath;
}

void BindableDataValue::bind(IDataChangedObserver* observer) {
    unbind();
    
    _observer = observer;
    
    if (_observer != nullptr && _dataModel != nullptr) {
        _dataModel->bind(_bindingPath, _observer);
    }
}

void BindableDataValue::unbind() {
    if (_observer == nullptr) {
        return;
    }
    
    if (_dataModel != nullptr) {
        _dataModel->unbind(_bindingPath, _observer);
    }
    
    _observer = nullptr;
}

void BindableDataValue::syncBindingValue(const std::string& value) {
    if (!_dataModel) {
        return;
    }
    _dataModel->syncBindingValue(_bindingPath, value);
}

std::shared_ptr<DataValue> BindableDataValue::cloneAsTemplate(const std::string& rootDataPath) const {
    std::string newPath = _bindingPath;

    // Relative paths (not starting with '/') are resolved against rootDataPath
    if (!_bindingPath.empty() && _bindingPath[0] != '/') {
        if (!rootDataPath.empty()) {
            newPath = normalizePath(rootDataPath + "/" + _bindingPath);
        }
    }

    auto cloned = std::make_shared<BindableDataValue>(_dataModel, newPath);

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
