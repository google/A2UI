#include "agenui_component_model.h"
#include "data_value/agenui_data_value_parser.h"
#include "surface/datamodel/agenui_idata_model.h"
#include "surface/agenui_serializable_data.h"
#include "agenui_log.h"

namespace agenui {

ComponentModel::AttributeDataBinder::AttributeDataBinder(const std::string& componentId, const std::string& attributeName, IComponentAttributeDataChangedObserver* observer) : _componentId(componentId), _attributeName(attributeName), _observer(observer) {
}

ComponentModel::AttributeDataBinder::~AttributeDataBinder() {
}

void ComponentModel::AttributeDataBinder::onDataChanged(const std::string& path, const std::string& newValue, bool appendMode) {
    if (!_observer) {
        return;
    }
    
    _observer->onComponentAttributeDataChanged(_attributeName, appendMode);
}

ComponentModel::ComponentModel(const std::string& id, const std::string& rawId, const std::string& component, IDataModel* dataModel, IComponentChangedObserver* observer, ITemplateComponentGenerator* generator) : _id(id), _rawId(rawId), _component(component), _dataModel(dataModel), _observer(observer), _templateComponentGenerator(generator) {
}

ComponentModel::~ComponentModel() {
    // Clear data-related members first: DataValue unbinds on destruction,
    // so the observers must still be alive at that point.
    _attributes.clear();
    _listChildrenData.reset();
    _templateBindingData.reset();

    // Clear attribute binders (observers) last
    _attributeBinders.clear();
}

std::string ComponentModel::getId() const {
    return _id;
}

std::string ComponentModel::getRawId() const {
    return _rawId;
}

std::string ComponentModel::getComponent() const {
    return _component;
}

void ComponentModel::setAttribute(const std::string& key, std::shared_ptr<DataValue> value) {
    _attributes[key] = value;
    if (value && _dataModel) {
        auto binderIt = _attributeBinders.find(key);
        if (binderIt == _attributeBinders.end()) {
            _attributeBinders.emplace(key, AttributeDataBinder(_id, key, this));
            binderIt = _attributeBinders.find(key);
        }
        value->bind(&(binderIt->second));
    }
    
    if (_component == "Tabs" && key == "tabs") {
        if (value && value->getDataType() == DataType::TabsData) {
            auto tabsDataValue = std::static_pointer_cast<TabsDataValue>(value);
            std::vector<std::string> tabChildren = tabsDataValue->getTabChildren();
            setChildren(tabChildren);
        }
    }
}

const std::map<std::string, std::shared_ptr<DataValue>>& ComponentModel::getAllAttributes() const {
    return _attributes;
}

void ComponentModel::syncValue(const std::string& attributeName, const std::string& value) {
    auto it = _attributes.find(attributeName);
    if (it == _attributes.end() || !it->second) {
        return;
    }

    // Only BindableData attributes need synchronization
    if (it->second->getDataType() != DataType::BindableData) {
        return;
    }

    auto bindableData = std::static_pointer_cast<BindableDataValue>(it->second);
    if (bindableData) {
        bindableData->syncBindingValue(value);
    }
}

void ComponentModel::setChildren(const std::vector<std::string>& children) {
    _children = children;
}

const std::vector<std::string>& ComponentModel::getChildren() const {
    return _children;
}

void ComponentModel::setListChildrenData(std::shared_ptr<DataValue> data) {
    _listChildrenData = data;
    if (_listChildrenData) {
        if (_listChildrenData->getDataType() == DataType::BindableData) {
            auto bindableData = std::static_pointer_cast<BindableDataValue>(_listChildrenData);
            if (bindableData) {
                auto binderIt = _attributeBinders.find("children");
                if (binderIt == _attributeBinders.end()) {
                    _attributeBinders.emplace("children", AttributeDataBinder(_id, "children", this));
                    binderIt = _attributeBinders.find("children");
                }
                bindableData->bind(&(binderIt->second));
            }
        }
    }
}

std::shared_ptr<DataValue> ComponentModel::getListChildrenData() const {
    return _listChildrenData;
}

void ComponentModel::setChildrenTemplateId(const std::string& templateId) {
    _listChildrenTemplateId = templateId;
}

std::string ComponentModel::getListChildrenTemplateId() const {
    return _listChildrenTemplateId;
}

void ComponentModel::generateListChildren() {
    if (!_templateComponentGenerator || !_listChildrenData) {
        return;
    }

    std::string rootDataPath = "";
    if (_listChildrenData->getDataType() == DataType::BindableData) {
        auto bindableData = std::static_pointer_cast<BindableDataValue>(_listChildrenData);
        if (bindableData) {
            rootDataPath = bindableData->getBindingPath();
        }
    }

    SerializableData childrenData = _listChildrenData->getValueData();
    if (!childrenData.isArray()) {
        return;
    }

    if (_children.size() == childrenData.size()) {
        return;
    }

    for (size_t index = _children.size(); index < childrenData.size(); ++index) {
        std::string itemPath = rootDataPath + "/" + std::to_string(index);
        auto itemData = std::make_shared<BindableDataValue>(_dataModel, itemPath);
        auto entity = _templateComponentGenerator->generateComponentWithTemplate(_listChildrenTemplateId, itemData);
        if (entity) {
            _children.emplace_back(entity->getId());
        }
    }

    for (size_t index = childrenData.size(); index < _children.size(); ++index) {
        notifyChildComponentDelete(_children[index]);
        _children.erase(_children.begin() + index);
    }

    notifyComponentChange("children");
}

void ComponentModel::setTemplateComponentInfo(std::shared_ptr<DataValue> bindingData, const std::vector<std::string>& childrenTemplateIds) {
    _isTemplateComponent = true;
    _templateBindingData = bindingData;
    _templateChildrenIds = childrenTemplateIds;
}

void ComponentModel::generateTemplateChildren(const std::string& childTemplateId) {
    if (!_templateComponentGenerator || !_isTemplateComponent) {
        return;
    }

    if (_templateChildrenIds.empty() || !_templateBindingData) {
        return;
    }

    if (!childTemplateId.empty()) {
        // Generate only the specified child template
        bool found = false;
        for (const auto& templateId : _templateChildrenIds) {
            if (templateId == childTemplateId) {
                found = true;
                break;
            }
        }

        if (!found) {
            return;
        }

        auto entity = _templateComponentGenerator->generateComponentWithTemplate(childTemplateId, _templateBindingData);
        if (entity) {
            bool replaced = false;
            for (auto& childId : _children) {
                if (childId == entity->getId()) {
                    childId = entity->getId();
                    replaced = true;
                    break;
                }
            }
            if (!replaced) {
                _children.emplace_back(entity->getId());
            }
        }
    } else {
        // Generate all child components; notify removal of old ones first
        for (const auto& childId : _children) {
            notifyChildComponentDelete(childId);
        }
        _children.clear();

        for (const auto& templateId : _templateChildrenIds) {
            auto entity = _templateComponentGenerator->generateComponentWithTemplate(templateId, _templateBindingData);
            if (entity) {
                _children.emplace_back(entity->getId());
            }
        }
    }

    notifyComponentChange("children");
}

void ComponentModel::tryUpdateChildrenTemplate(const std::string& componentId) {
    if (componentId.empty()) {
        return;
    }

    if (!_listChildrenTemplateId.empty() && componentId == _listChildrenTemplateId) {
        generateListChildren();
        return;
    }

    if (_isTemplateComponent && !_templateChildrenIds.empty()) {
        for (const auto& childTemplateId : _templateChildrenIds) {
            if (componentId == childTemplateId) {
                generateTemplateChildren(componentId);
                return;
            }
        }
    }
}

const ComponentSnapshot& ComponentModel::updateSnapshot(const std::string& attributeName) {
    _currentSnapshot.id = _id;
    _currentSnapshot.rawId = _rawId;
    _currentSnapshot.component = _component;

    if (attributeName.empty()) {
        // Full update: refresh children and all attributes
        _currentSnapshot.displayRule = _displayRule;
        _currentSnapshot.children = _children;

        _currentSnapshot.attributes.clear();
        _currentSnapshot.styles.clear();

        for (const auto& pair : _attributes) {
            if (pair.second) {
                SerializableData valueData = pair.second->getValueData();

                // "styles" is expanded into the snapshot's styles map
                if (pair.first == "styles") {
                    if (valueData.isObject()) {
                        for (auto it = valueData.begin(); it != valueData.end(); ++it) {
                            _currentSnapshot.styles[it.key()] = it.value();
                        }
                    }
                } else {
                    _currentSnapshot.attributes[pair.first] = valueData;
                }
            }
        }
    } else if (attributeName == "children") {
        _currentSnapshot.children = _children;
    } else if (attributeName == "styles") {
        auto it = _attributes.find("styles");
        if (it != _attributes.end() && it->second) {
            SerializableData valueData = it->second->getValueData();

            _currentSnapshot.styles.clear();
            if (valueData.isObject()) {
                for (auto jsonIt = valueData.begin(); jsonIt != valueData.end(); ++jsonIt) {
                    _currentSnapshot.styles[jsonIt.key()] = jsonIt.value();
                }
            }
        }
    } else {
        auto it = _attributes.find(attributeName);
        if (it != _attributes.end() && it->second) {
            _currentSnapshot.attributes[attributeName] = it->second->getValueData();
        }
    }

    // Aggregate data binding status across all attributes
    std::vector<DataBindingStatus> statuses;
    for (const auto& pair : _attributes) {
        if (pair.second) {
            statuses.emplace_back(pair.second->getDataBindingStatus());
        }
    }
    if (_listChildrenData) {
        statuses.emplace_back(_listChildrenData->getDataBindingStatus());
    }
    _currentSnapshot.dataBindingStatus = DataValue::aggregateBindingStatus(statuses);

    return _currentSnapshot;
}

void ComponentModel::setDisplayRule(DisplayRule rule) {
    _displayRule = rule;
}

void ComponentModel::onComponentAttributeDataChanged(const std::string& attributeName, bool appendMode) {
    if (attributeName == "children") {
        generateListChildren();
    } else {
        _currentSnapshot.appendMode = appendMode;
        notifyComponentChange(attributeName);
        _currentSnapshot.resetMode();
    }
}

void ComponentModel::notifyComponentChange(const std::string& attributeName) {
    if (!_observer) {
        return;
    }
    _observer->onComponentAttributeChanged(_id, attributeName);
}

void ComponentModel::notifyChildComponentDelete(const std::string& childComponentId) {
    if (!_observer) {
        return;
    }
    _observer->onComponentDeleted(childComponentId);
}

std::string ComponentModel::getComponentType() const {
    return _component;
}

bool ComponentModel::hasProperty(const std::string& propertyName) const {
    return _attributes.find(propertyName) != _attributes.end();
}

std::string ComponentModel::getPropertyStringValue(const std::string& propertyName) const {
    auto it = _attributes.find(propertyName);
    if (it == _attributes.end() || !it->second) {
        return "";
    }
    return it->second->getValueData().asString();
}

void ComponentModel::setPropertyValue(const std::string& propertyName, const std::string& value) {
    setAttribute(propertyName, std::make_shared<StaticDataValue>(value));
}

bool ComponentModel::hasStyle(const std::string& styleName) const {
    auto it = _attributes.find("styles");
    if (it == _attributes.end() || !it->second || it->second->getDataType() != DataType::StylesData) {
        return false;
    }
    auto stylesData = std::static_pointer_cast<StylesDataValue>(it->second);
    return stylesData->getStyle(styleName) != nullptr;
}

void ComponentModel::setStyleValue(const std::string& styleName, const std::string& value) {
    auto it = _attributes.find("styles");
    std::shared_ptr<StylesDataValue> stylesData;
    
    if (it != _attributes.end() && it->second && it->second->getDataType() == DataType::StylesData) {
        stylesData = std::static_pointer_cast<StylesDataValue>(it->second);
    } else {
        stylesData = std::make_shared<StylesDataValue>(_dataModel);
        setAttribute("styles", std::static_pointer_cast<DataValue>(stylesData));
    }
    
    stylesData->setStyle(styleName, DataValueParser::parseDataValue(_dataModel, value));
}

void ComponentModel::executeAction(const std::string& surfaceId, agenui::EventDispatcher* dispatcher) {
    auto it = _attributes.find("action");
    if (it == _attributes.end() || !it->second) {
        return;
    }
    
    auto actionDataValue = it->second;
    DataType dataType = actionDataValue->getDataType();
    
    if (dataType == DataType::EventActionData) {
        auto eventAction = std::static_pointer_cast<EventActionDataValue>(actionDataValue);
        if (eventAction) {
            eventAction->execute(surfaceId, _rawId, dispatcher);
        }
        return;
    } else if (dataType == DataType::FunctionCallActionData) {
        auto functionCallAction = std::static_pointer_cast<FunctionCallActionDataValue>(actionDataValue);
        if (functionCallAction) {
            functionCallAction->execute();
        }
        return;
    }
    
    return;
}

}  // namespace agenui
