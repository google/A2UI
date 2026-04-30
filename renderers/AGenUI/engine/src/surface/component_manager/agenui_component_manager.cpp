#include "agenui_component_manager.h"
#include "data_value/agenui_data_value_parser.h"
#include "surface/datamodel/agenui_idata_model.h"
#include "surface/agenui_message_parser.h"
#include "surface/agenui_serializable_data.h"
#include "agenui_engine_context.h"
#include "surface/component_property_spec/agenui_icomponent_property_spec_manager.h"
#include "agenui_log.h"
#include "nlohmann/json.hpp"

namespace agenui {

ComponentManager::ComponentManager(IDataModel* dataModel, IVirtualDOM* virtualDom, const std::string& theme) : _dataModel(dataModel), _virtualDom(virtualDom), _theme(theme) {
}

ComponentManager::~ComponentManager() {
    _components.clear();
}

void ComponentManager::updateComponents(const std::vector<std::string>& components) {
    for (const auto& componentJson : components) {
        auto component = parseComponent(componentJson);

        if (component) {
            _components[component->getId()] = component;
            notifyComponentUpdate(component, "");
            tryUpdateTemplate(component->getId());
        }
    }
}

void ComponentManager::syncBindingValue(const std::string& id, const std::string& attributeName, const std::string& value) {
    auto componentIt = _components.find(id);

    if (componentIt != _components.end()) {
        componentIt->second->syncValue(attributeName, value);
    }
}



std::string ComponentManager::getParentId(const std::string& componentId) {
    if (componentId.empty()) {
        return "";
    }

    for (const auto& pair : _components) {
        if (!pair.second) {
            continue;
        }

        const auto& children = pair.second->getChildren();
        for (const auto& childId : children) {
            if (childId == componentId) {
                return pair.second->getId();
            }
        }
    }

    return "";
}

void ComponentManager::refreshStyleTokens() {
    for (const auto& pair : _components) {
        if (!pair.second) {
            continue;
        }
        notifyComponentUpdate(pair.second, "styles");
    }
}

void ComponentManager::setComponentsDisplayRule(const std::map<std::string, DisplayRule>& displayRules) {
    _displayRules = displayRules;
}

void ComponentManager::executeComponentAction(const std::string& componentId, const std::string& surfaceId, void* dispatcher) {
    auto it = _components.find(componentId);
    if (it == _components.end()) {
        AGENUI_LOG("ComponentManager::executeComponentAction: component not found, id=%s", componentId.c_str());
        return;
    }
    
    auto component = it->second;
    if (component == nullptr) {
        AGENUI_LOG("ComponentManager::executeComponentAction: component is null, id=%s", componentId.c_str());
        return;
    }
    
    component->executeAction(surfaceId, static_cast<agenui::EventDispatcher*>(dispatcher));
}

void ComponentManager::onComponentAttributeChanged(const std::string& componentId, const std::string& attributeName) {
    if (componentId.empty()) {
        return;
    }

    for (const auto& pair : _components) {
        if (pair.second && pair.second->getId() == componentId) {
            notifyComponentUpdate(pair.second, attributeName);
            break;
        }
    }
}

void ComponentManager::onComponentDeleted(const std::string& componentId) {
    if (componentId.empty()) {
        return;
    }

    for (auto it = _components.begin(); it != _components.end(); ) {
        if (it->second && it->second->getId() == componentId) {
            it = _components.erase(it);
        } else {
            ++it;
        }
    }
}

std::vector<std::shared_ptr<ComponentModel>> ComponentManager::generateListChildren(const std::string& templateId, std::shared_ptr<DataValue> data) {
    std::vector<std::shared_ptr<ComponentModel>> result;

    if (!data) {
        return result;
    }

    std::string rootDataPath = "";
    if (data->getDataType() == DataType::BindableData) {
        auto bindableData = std::static_pointer_cast<BindableDataValue>(data);
        if (bindableData) {
            rootDataPath = bindableData->getBindingPath();
        }
    }

    SerializableData childrenData = data->getValueData();
    if (!childrenData.isArray()) {
        return result;
    }

    for (size_t index = 0; index < childrenData.size(); ++index) {
        std::string itemPath = rootDataPath + "/" + std::to_string(index);
        auto itemData = std::make_shared<BindableDataValue>(_dataModel, itemPath);
        auto entity = generateComponentWithTemplate(templateId, itemData);
        if (entity) {
            result.emplace_back(entity);
        }
    }

    return result;
}

std::shared_ptr<ComponentModel> ComponentManager::generateComponentWithTemplate(const std::string& templateId, std::shared_ptr<DataValue> data) {
    auto templateIt = _components.find(templateId);

    if (templateIt == _components.end()) {
        return nullptr;
    }

    auto templateEntity = templateIt->second;
    if (!templateEntity) {
        return nullptr;
    }

    if (!data) {
        return nullptr;
    }

    std::string rootDataPath = "";
    if (data->getDataType() == DataType::BindableData) {
        auto bindableData = std::static_pointer_cast<BindableDataValue>(data);
        if (bindableData) {
            rootDataPath = bindableData->getBindingPath();
        }
    }

    std::string newId = templateEntity->getId() + "-" + rootDataPath;
    auto newEntity = std::make_shared<ComponentModel>(newId, templateEntity->getRawId(), templateEntity->getComponent(), _dataModel, this, this);

    // Apply display rule using the templateId as lookup key
    auto ruleIt = _displayRules.find(templateId);
    if (ruleIt != _displayRules.end()) {
        newEntity->setDisplayRule(ruleIt->second);
    }

    // Clone all attributes from the template
    const auto& templateAttributes = templateEntity->getAllAttributes();
    for (const auto& attrPair : templateAttributes) {
        const std::string& attrKey = attrPair.first;
        const auto& attrValue = attrPair.second;

        if (!attrValue) {
            continue;
        }

        auto clonedValue = attrValue->cloneAsTemplate(rootDataPath);
        if (clonedValue) {
            newEntity->setAttribute(attrKey, clonedValue);
        }
    }

    // Apply component spec/styles after all attributes are set
    auto* specManager = getEngineContext()->getComponentPropertySpecManager();
    if (specManager != nullptr) {
        specManager->applySpec(_theme, newEntity.get());
        AGENUI_LOG("id:%s, type:%s", newEntity->getId().c_str(), newEntity->getComponent().c_str());
    }

    // Generate non-list child components
    const auto& templateChildren = templateEntity->getChildren();
    if (!templateChildren.empty()) {
        newEntity->setTemplateComponentInfo(data, templateChildren);
        newEntity->generateTemplateChildren("");
    }

    // Generate list child components
    std::string listChildrenTemplateId = templateEntity->getListChildrenTemplateId();
    if (!listChildrenTemplateId.empty()) {
        auto listChildrenData = templateEntity->getListChildrenData();
        if (listChildrenData) {
            auto clonedListChildrenData = listChildrenData->cloneAsTemplate(rootDataPath);
            if (clonedListChildrenData) {
                newEntity->setListChildrenData(clonedListChildrenData);
                newEntity->setChildrenTemplateId(listChildrenTemplateId);
                newEntity->generateListChildren();
            }
        }
    }

    _components[newEntity->getId()] = newEntity;
    notifyComponentUpdate(newEntity, "");

    return newEntity;
}

std::shared_ptr<ComponentModel> ComponentManager::parseComponent(const std::string& componentJson) {
    auto json = nlohmann::json::parse(componentJson, nullptr, false);
    
    if (json.is_discarded()) {
        return nullptr;
    }
    
    if (!json.contains("id") || !json.contains("component")) {
        return nullptr;
    }
    
    std::string id = json["id"].get<std::string>();
    std::string component = json["component"].get<std::string>();
    
    // Use rawId from JSON if present, otherwise fall back to id
    std::string rawId = id;
    if (json.contains("rawId")) {
        rawId = json["rawId"].get<std::string>();
    }

    auto entity = std::make_shared<ComponentModel>(id, rawId, component, _dataModel, this, this);

    auto ruleIt = _displayRules.find(id);
    if (ruleIt != _displayRules.end()) {
        entity->setDisplayRule(ruleIt->second);
    }

    parseChildren(json, component, entity);

    // All fields except id/component/children/child/rawId are treated as attributes
    for (auto it = json.begin(); it != json.end(); ++it) {
        std::string key = it.key();
        if (key != "id" && key != "component" && key != "children" && key != "child" && key != "rawId") {
            std::shared_ptr<DataValue> value;

            // Special handling for action, checks, styles, and tabs
            if (key == "action") {
                std::string actionJson = it.value().dump();
                value = DataValueParser::parseFunctionCallActionDataValue(_dataModel, actionJson);
                if (!value) {
                    value = DataValueParser::parseEventActionDataValue(_dataModel, actionJson);
                }
                if (!value) {
                    value = std::make_shared<StaticDataValue>(actionJson);
                }
            } else if (key == "checks") {
                value = DataValueParser::parseChecksDataValue(_dataModel, it.value().dump());
            } else if (key == "styles") {
                value = DataValueParser::parseStylesDataValue(_dataModel, it.value().dump());
            } else if (key == "tabs" && component == "Tabs") {
                value = DataValueParser::parseTabsDataValue(_dataModel, it.value().dump());
            } else {
                value = DataValueParser::parseDataValue(_dataModel, it.value().dump());
            }
            
            if (value) {
                entity->setAttribute(key, value);
            }
        }
    }
    
    // Apply component spec/styles after all attributes are set
    auto* specManager = getEngineContext()->getComponentPropertySpecManager();
    if (specManager != nullptr) {
        specManager->applySpec(_theme, entity.get());
        AGENUI_LOG("id:%s, type:%s", id.c_str(), component.c_str());
    }

    return entity;
}

void ComponentManager::parseChildren(const nlohmann::json& json, const std::string &componentType, std::shared_ptr<ComponentModel> entity) {
    if (!entity) {
        return;
    }
    
    std::vector<std::string> children;
    // Parse trigger and content children for Modal components
    if (componentType == "Modal") {
        if (json.contains("trigger")) {
            children.emplace_back(json["trigger"].get<std::string>());
        }
        if (json.contains("content")) {
            children.emplace_back(json["content"].get<std::string>());
        }
    }
    
    if (json.contains("children")) {
        if (json["children"].is_array()) {
            for (const auto& child : json["children"]) {
                if (child.is_string()) {
                    children.emplace_back(child.get<std::string>());
                }
            }
        } else if (json["children"].is_object()) {
            // Object form: parse path (data binding) and componentId (template)
            const auto& childrenObj = json["children"];

            if (childrenObj.contains("path") && childrenObj["path"].is_string()) {
                std::string path = childrenObj["path"].get<std::string>();
                auto bindableData = std::make_shared<BindableDataValue>(_dataModel, path);
                entity->setListChildrenData(bindableData);
            }

            if (childrenObj.contains("componentId") && childrenObj["componentId"].is_string()) {
                std::string componentId = childrenObj["componentId"].get<std::string>();
                entity->setChildrenTemplateId(componentId);
            }

            entity->generateListChildren();
        }
    }

    if (json.contains("child")) {
        if (json["child"].is_string()) {
            children.emplace_back(json["child"].get<std::string>());
        }
    }
    
    if (!children.empty()) {
        entity->setChildren(children);
    }
}

void ComponentManager::notifyComponentUpdate(std::shared_ptr<ComponentModel> component, const std::string& attributeName) {
    if (!component || !_virtualDom) {
        return;
    }
    
    const auto& snapshot = component->updateSnapshot(attributeName);
    _virtualDom->updateNode(snapshot);
}

void ComponentManager::tryUpdateTemplate(const std::string& componentId) {
    for (const auto& pair : _components) {
        if (pair.second) {
            pair.second->tryUpdateChildrenTemplate(componentId);
        }
    }
}

}  // namespace agenui
