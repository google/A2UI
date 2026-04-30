#include "agenui_styles_data_value.h"
#include "surface/datamodel/agenui_idata_model.h"
#include "surface/datamodel/agenui_data_observer.h"
#include "surface/virtual_dom/agenui_component_snapshot.h"
#include "surface/agenui_serializable_data_impl.h"

namespace agenui {

StylesDataValue::StylesDataValue(IDataModel* dataModel) : DataValue(dataModel) {
}

StylesDataValue::StylesDataValue(IDataModel* dataModel, const std::map<std::string, std::shared_ptr<DataValue>>& styles) : DataValue(dataModel), _styles(styles) {
}

StylesDataValue::~StylesDataValue() {
    unbind();
}

DataType StylesDataValue::getDataType() const {
    return DataType::StylesData;
}

DataBindingStatus StylesDataValue::getDataBindingStatus() const {
    std::vector<DataBindingStatus> statuses;
    for (const auto& pair : _styles) {
        if (pair.second) {
            statuses.emplace_back(pair.second->getDataBindingStatus());
        }
    }
    return aggregateBindingStatus(statuses);
}

SerializableData StylesDataValue::getValueData() const {
    auto impl = SerializableData::Impl::createObject();
    
    for (const auto& pair : _styles) {
        if (pair.second) {
            auto valueData = pair.second->getValueData();
            if (valueData.isValid()) {
                impl->set(pair.first, valueData);
            }
        }
    }
    
    return SerializableData(impl);
}

void StylesDataValue::setStyle(const std::string& styleName, std::shared_ptr<DataValue> value) {
    _styles[styleName] = value;
}

std::shared_ptr<DataValue> StylesDataValue::getStyle(const std::string& styleName) const {
    auto it = _styles.find(styleName);
    if (it != _styles.end()) {
        return it->second;
    }
    return nullptr;
}

void StylesDataValue::removeStyle(const std::string& styleName) {
    _styles.erase(styleName);
}

const std::map<std::string, std::shared_ptr<DataValue>>& StylesDataValue::getAllStyles() const {
    return _styles;
}

void StylesDataValue::setStyles(const std::map<std::string, std::shared_ptr<DataValue>>& styles, bool merge) {
    if (merge) {
        for (const auto& pair : styles) {
            _styles[pair.first] = pair.second;
        }
    } else {
        _styles = styles;
    }
}

void StylesDataValue::clearStyles() {
    _styles.clear();
}

void StylesDataValue::bind(IDataChangedObserver* observer) {
    for (auto& pair : _styles) {
        if (pair.second) {
            pair.second->bind(observer);
        }
    }
}

void StylesDataValue::unbind() {
    for (auto& pair : _styles) {
        if (pair.second) {
            pair.second->unbind();
        }
    }
}

std::shared_ptr<DataValue> StylesDataValue::cloneAsTemplate(const std::string& rootDataPath) const {
    std::map<std::string, std::shared_ptr<DataValue>> clonedStyles;
    
    for (const auto& pair : _styles) {
        if (pair.second) {
            clonedStyles[pair.first] = pair.second->cloneAsTemplate(rootDataPath);
        }
    }
    
    auto cloned = std::make_shared<StylesDataValue>(_dataModel, clonedStyles);
    cloned->_extensions = _extensions;
    
    return cloned;
}

}  // namespace agenui
