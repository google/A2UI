#include "agenui_surface.h"
#include "agenui_engine_context.h"
#include "agenui_type_define.h"
#include "module/agenui_surface_manager.h"
#include "datamodel/agenui_data_model.h"
#include "virtual_dom/agenui_virtual_dom.h"
#include "component_manager/agenui_component_manager.h"
#include "agenui_expression_parser.h"
#include "agenui_log.h"
#include "module/agenui_event_dispatcher.h"

namespace agenui {

Surface::Surface(const std::string& surfaceId, const std::string& theme, SurfaceManager* surfaceManager)
    : _surfaceId(surfaceId),
      _theme(theme),
      _dataModel(nullptr),
      _virtualDom(nullptr),
      _componentManager(nullptr),
      _surfaceManager(surfaceManager) {
    _dataModel = new DataModel();
    _virtualDom = new VirtualDOM(this);
    _componentManager = new ComponentManager(_dataModel, _virtualDom, _theme);
}

Surface::~Surface() {
    _isDestroying = true;
    SAFELY_DELETE(_componentManager);
    SAFELY_DELETE(_virtualDom);
    SAFELY_DELETE(_dataModel);
}

const std::string& Surface::getSurfaceId() const {
    return _surfaceId;
}

IDataModel* Surface::getDataModel() const {
    return _dataModel;
}

void Surface::updateComponentSize(const ComponentRenderInfo& info) {
    if (_virtualDom) {
        VirtualDOM* virtualDomImpl = static_cast<VirtualDOM*>(_virtualDom);
        virtualDomImpl->updateComponentSize(info);
    } else {
        AGENUI_LOG("Surface::updateComponentSize failed: virtualDom is null");
    }
}

void Surface::updateSurfaceSize(const SurfaceLayoutInfo& info) {
    if (_virtualDom) {
        VirtualDOM* virtualDomImpl = static_cast<VirtualDOM*>(_virtualDom);
        virtualDomImpl->updateSurfaceSize(info);
    } else {
        AGENUI_LOG("Surface::updateSurfaceSize failed: virtualDom is null");
    }
}

void Surface::sendCachedComponentMessages() {
#if !defined(TEST_COMPONENT_UPDATE) && !defined(__OHOS__)
    if (!_cachedComponentMessages.empty() && _surfaceManager) {
        UpdateComponentsMessage message;
        message.surfaceId = _surfaceId;
        for (const auto& pair : _cachedComponentMessages) {
            message.components.emplace_back(pair.second);
        }

        _surfaceManager->getEventDispatcher()->dispatchUpdateComponents(message);
    }
    _cachedComponentMessages.clear();
#endif
}

AGenUIExeCode Surface::updateComponents(const nlohmann::json& componentsData) {
    std::vector<std::string> parsedComponents;
    std::map<std::string, DisplayRule> displayRules;

    if (!componentsData.contains("components")) {
        return ExeCode_ParseError_updateComponents_no_componentsField;
    }

    if (!componentsData["components"].is_array()) {
        return ExeCode_ParseError_updateComponents_components_notarray;
    }

    const auto& components = componentsData["components"];
    parsedComponents.reserve(components.size());

    for (const auto& component : components) {
        auto componentStr = component.dump();
        parsedComponents.emplace_back(std::move(componentStr));
    }

    if (parsedComponents.empty()) {
        return ExeCode_ParseError_updateComponents_no_componentEntity;
    }

    if (_componentManager != nullptr) {
        if (!displayRules.empty()) {
            _componentManager->setComponentsDisplayRule(displayRules);
        }
        _componentManager->updateComponents(parsedComponents);
    }

    sendCachedComponentMessages();
    return ExeCode_Parse_success;
}

void Surface::updateDataModel(const nlohmann::json& dataModelData) {
    if (_dataModel == nullptr) {
        return;
    }

    if (!dataModelData.contains("path") && !dataModelData.contains("value")) {
        _dataModel->updateData("/", dataModelData.dump());
        sendCachedComponentMessages();
        return;
    }

    std::string path = dataModelData.contains("path") ? dataModelData["path"].get<std::string>() : "/";

    if (!dataModelData.contains("value")) {
        return;
    }

    const auto& value = dataModelData["value"];
    std::string valueStr;
    valueStr = value.dump();
    _dataModel->updateData(path, valueStr);
    sendCachedComponentMessages();
}

void Surface::appendDataModel(const nlohmann::json& dataModelData) {
    if (_dataModel == nullptr) {
        return;
    }

    std::string path = dataModelData.contains("path") ? dataModelData["path"].get<std::string>() : "/";

    if (!dataModelData.contains("value")) {
        return;
    }

    const auto& value = dataModelData["value"];
    std::string valueStr;
    if (value.is_string()) {
        valueStr = value.get<std::string>();
    } else {
        valueStr = value.dump();
    }

    _dataModel->appendData(path, valueStr);
    sendCachedComponentMessages();
}

void Surface::onNodeUpdate(const std::string& componentId, const std::string& nodeJson) {
    AGENUI_LOG("onNodeUpdate: %s", nodeJson.c_str());
#if !defined(TEST_COMPONENT_UPDATE) && !defined(__OHOS__)
    _cachedComponentMessages[componentId] = nodeJson;
#else
    if (!_surfaceManager) return;
    ComponentsUpdateMessage message;
    message.componentId = componentId;
    message.component = nodeJson;

    std::vector<ComponentsUpdateMessage> messages;
    messages.push_back(message);

    _surfaceManager->getEventDispatcher()->dispatchComponentsUpdate(_surfaceId, messages);
#endif
}

void Surface::onNodeAdded(const std::string& parentId, const std::string& nodeJson) {
    auto json = nlohmann::json::parse(nodeJson, nullptr, false);
    if (json.is_discarded() || !json.contains("id") || !json["id"].is_string()) {
        AGENUI_LOG("failed to parse componentId from nodeJson");
        return;
    }

    AGENUI_LOG("onNodeAdded: %s, parentId:%s", nodeJson.c_str(), parentId.c_str());
    std::string componentId = json["id"].get<std::string>();
#if !defined(TEST_COMPONENT_UPDATE) && !defined(__OHOS__)
    _cachedComponentMessages[componentId] = nodeJson;

#else
    if (!_surfaceManager) return;
    ComponentsAddMessage message;
    message.parentId = parentId;
    message.componentId = componentId;
    message.component = nodeJson;

    std::vector<ComponentsAddMessage> messages;
    messages.push_back(message);

    _surfaceManager->getEventDispatcher()->dispatchComponentsAdd(_surfaceId, messages);
#endif
}

void Surface::onNodeRemoved(const std::string& parentId, const std::string& id) {
    AGENUI_LOG("onNodeRemoved: %s, parentId:%s", id.c_str(), parentId.c_str());
#if defined(TEST_COMPONENT_UPDATE) || defined(__OHOS__)
    if (!_surfaceManager) return;
    ComponentsRemoveMessage message;
    message.parentId = parentId;
    message.componentId = id;

    std::vector<ComponentsRemoveMessage> messages;
    messages.push_back(message);

    _surfaceManager->getEventDispatcher()->dispatchComponentsRemove(_surfaceId, messages);
#endif
}


void Surface::syncUIToData(const std::string& componentId, const std::string& changingData) {
    if (_componentManager == nullptr) {
        AGENUI_LOG("componentManager is null");
        return;
    }

    auto changeJson = nlohmann::json::parse(changingData, nullptr, false);

    if (changeJson.is_discarded()) {
        AGENUI_LOG("failed to parse changingData");
        return;
    }

    if (!changeJson.is_object()) {
        AGENUI_LOG("changeJson is not an object");
        return;
    }

    for (auto it = changeJson.begin(); it != changeJson.end(); ++it) {
        const std::string& attributeName = it.key();
        const auto& fieldValue = it.value();

        std::string valueStr = fieldValue.dump();
        _componentManager->syncBindingValue(componentId, attributeName, valueStr);
        AGENUI_LOG("synced componentId:%s, attributeName:%s, value:%s", componentId.c_str(), attributeName.c_str(), valueStr.c_str());
    }

    sendCachedComponentMessages();
}

void Surface::handleUserAction(const std::string& sourceComponentId) {
    if (_componentManager != nullptr && _surfaceManager) {
        EventDispatcher* dispatcher = _surfaceManager->getEventDispatcher();
        _componentManager->executeComponentAction(sourceComponentId, _surfaceId, dispatcher);
    }
    sendCachedComponentMessages();
}

void Surface::refreshStyleTokens() {
    if (_componentManager != nullptr) {
        _componentManager->refreshStyleTokens();
        sendCachedComponentMessages();
    }
}

}  // namespace agenui
