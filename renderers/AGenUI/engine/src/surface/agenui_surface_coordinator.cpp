#include "agenui_surface_coordinator.h"
#include "agenui_log.h"
#include "agenui_message_parser.h"
#include "agenui_component_render_observable.h"
#include "agenui_surface_layout_observable.h"
#include "module/agenui_event_dispatcher.h"
#include "surface/virtual_dom/agenui_virtual_dom.h"
#include "function_call/agenui_functioncall_manager.h"
#include "agenui_engine_context.h"
#include "agenui_type_define.h"
#include "function_call/builtins/agenui_format_string_functioncall.h"
#include "function_call/builtins/agenui_required_functioncall.h"
#include "function_call/builtins/agenui_regex_functioncall.h"
#include "function_call/builtins/agenui_length_functioncall.h"
#include "function_call/builtins/agenui_numeric_functioncall.h"
#include "function_call/builtins/agenui_email_functioncall.h"
#include "function_call/builtins/agenui_format_number_functioncall.h"
#include "function_call/builtins/agenui_format_currency_functioncall.h"
#include "function_call/builtins/agenui_format_date_functioncall.h"
#include "function_call/builtins/agenui_pluralize_functioncall.h"
#include "function_call/builtins/agenui_parse_token_functioncall.h"
#include "surface/token_parser/agenui_token_parser.h"
#include "surface/agenui_expression_parser.h"
#include "module/agenui_surface_manager.h"

namespace agenui {

SurfaceCoordinator::SurfaceCoordinator(SurfaceManager* owner)
    : _owner(owner) {
    initFunctionCalls();

    AGENUI_LOG("construction finished");
}

SurfaceCoordinator::~SurfaceCoordinator() {
    AGENUI_LOG("destruction finished");
}

void SurfaceCoordinator::setDayNightMode() {
    refreshStyleTokens();
}

void SurfaceCoordinator::refreshStyleTokens() {
    for (const auto &pair : _surfaces) {
        if (pair.second) {
            pair.second->refreshStyleTokens();
        }
    }
}

AGenUIExeCode SurfaceCoordinator::createSurface(const std::string &jsonData) {
    CreateSurfaceMessage message;
    AGenUIExeCode exeCode = AGenUIMessageParser::parseCreateSurfaceData(jsonData, message);
    if (exeCode != ExeCode_Parse_success) {
        return exeCode;
    }

    if (message.surfaceId.empty()) {
        AGENUI_LOG("surfaceId is empty");
        return ExeCode_ParseError_createSurface_empty_surfaceId;
    }

    if (_surfaces.find(message.surfaceId) != _surfaces.end()) {
        AGENUI_LOG("surfaceId already exists, %s", message.surfaceId.c_str());
        return ExeCode_ParseError_createSurface_duplicate_surfaceId;
    }

    std::string theme;
    auto themeIt = message.theme.find("themeId");
    if (themeIt != message.theme.end()) {
        theme = themeIt->second;
    }

    std::unique_ptr<Surface> surface(
        new Surface(message.surfaceId, theme, _owner));
    _surfaces[message.surfaceId] = std::move(surface);

    AGENUI_LOG("success: %s", jsonData.c_str());
    _owner->getEventDispatcher()->dispatchCreateSurface(message);
    return ExeCode_Parse_success;
}

AGenUIExeCode SurfaceCoordinator::updateComponents(const std::string &jsonData) {
    std::string surfaceId;
    nlohmann::json componentsJsonNode;
    AGenUIExeCode exeCode = AGenUIMessageParser::parseUpdateComponentsData(jsonData, surfaceId, componentsJsonNode);
    if (exeCode != ExeCode_Parse_success) {
        return exeCode;
    }

    auto it = _surfaces.find(surfaceId);
    if (it == _surfaces.end()) {
        AGENUI_LOG("surface not found, %s", surfaceId.c_str());
        return ExeCode_ParseError_updateComponents_notfound_surfaceId;
    }

    exeCode = it->second->updateComponents(componentsJsonNode);
    if (exeCode != ExeCode_Parse_success) {
        return exeCode;
    }

    AGENUI_LOG("success: %s", jsonData.c_str());
    return ExeCode_Parse_success;
}

AGenUIExeCode SurfaceCoordinator::updateDataModel(const std::string &jsonData) {
    std::string surfaceId;
    nlohmann::json dataModelJsonNode;
    AGenUIExeCode exeCode = AGenUIMessageParser::parseUpdateDataModelData(jsonData, surfaceId, dataModelJsonNode);
    if (exeCode != ExeCode_Parse_success) {
        return exeCode;
    }

    auto it = _surfaces.find(surfaceId);
    if (it == _surfaces.end()) {
        AGENUI_LOG("surface not found, %s", surfaceId.c_str());
        return ExeCode_ParseError_updateDataModel_notfound_surfaceId;
    }

    it->second->updateDataModel(dataModelJsonNode);

    AGENUI_LOG("success: %s", jsonData.c_str());
    return ExeCode_Parse_success;
}

AGenUIExeCode SurfaceCoordinator::appendDataModel(const std::string &jsonData) {
    std::string surfaceId;
    nlohmann::json dataModelJsonNode;
    AGenUIExeCode exeCode = AGenUIMessageParser::parseAppendDataModelData(jsonData, surfaceId, dataModelJsonNode);
    if (exeCode != ExeCode_Parse_success) {
        return exeCode;
    }

    auto it = _surfaces.find(surfaceId);
    if (it == _surfaces.end()) {
        AGENUI_LOG("surface not found, %s", surfaceId.c_str());
        return ExeCode_ParseError_appendDataModel_notfound_surfaceId;
    }

    it->second->appendDataModel(dataModelJsonNode);

    AGENUI_LOG("success: %s", jsonData.c_str());
    return ExeCode_Parse_success;
}

Surface *SurfaceCoordinator::getSurface(const std::string &surfaceId) const {
    auto it = _surfaces.find(surfaceId);
    if (it != _surfaces.end()) {
        return it->second.get();
    }
    return nullptr;
}

AGenUIExeCode SurfaceCoordinator::deleteSurface(const std::string &jsonData) {
    DeleteSurfaceMessage message;
    AGenUIExeCode exeCode = AGenUIMessageParser::parseDeleteSurfaceData(jsonData, message);
    if (exeCode != ExeCode_Parse_success) {
        return exeCode;
    }

    auto it = _surfaces.find(message.surfaceId);
    if (it != _surfaces.end()) {
        _surfaces.erase(it);
        AGENUI_LOG("deleteSurface success: %s", message.surfaceId.c_str());
    }

    _owner->getEventDispatcher()->dispatchDeleteSurface(message);
    return ExeCode_Parse_success;
}

void SurfaceCoordinator::handleAction(const ActionMessage &msg) {
    if (msg.surfaceId.empty()) {
        AGENUI_LOG("surfaceId is empty");
        return;
    }

    if (msg.sourceComponentId.empty()) {
        AGENUI_LOG("sourceComponentId is empty");
        return;
    }

    auto it = _surfaces.find(msg.surfaceId);
    if (it == _surfaces.end()) {
        AGENUI_LOG("surface not found, surfaceId=%s", msg.surfaceId.c_str());
        return;
    }

    it->second->handleUserAction(msg.sourceComponentId);
}

void SurfaceCoordinator::handleSyncUIToData(const SyncUIToDataMessage &msg) {
    if (msg.surfaceId.empty()) {
        AGENUI_LOG("surfaceId is empty");
        return;
    }

    auto it = _surfaces.find(msg.surfaceId);
    if (it == _surfaces.end()) {
        AGENUI_LOG("surface not found, surfaceId=%s", msg.surfaceId.c_str());
        return;
    }

    it->second->syncUIToData(msg.componentId, msg.change);

    AGENUI_LOG("success: surfaceId:%s, componentId:%s", msg.surfaceId.c_str(), msg.componentId.c_str());
}

void SurfaceCoordinator::initFunctionCalls() {
    auto* functionCallManager = getEngineContext()->getFunctionCallManager();
    if (!functionCallManager) {
        AGENUI_LOG("FunctionCallManager is null");
        return;
    }
    functionCallManager->registerFunctionCall(std::make_shared<FormatStringFunctionCall>());
    functionCallManager->registerFunctionCall(std::make_shared<RequiredFunctionCall>());
    functionCallManager->registerFunctionCall(std::make_shared<RegexFunctionCall>());
    functionCallManager->registerFunctionCall(std::make_shared<LengthFunctionCall>());
    functionCallManager->registerFunctionCall(std::make_shared<NumericFunctionCall>());
    functionCallManager->registerFunctionCall(std::make_shared<EmailFunctionCall>());
    functionCallManager->registerFunctionCall(std::make_shared<FormatNumberFunctionCall>());
    functionCallManager->registerFunctionCall(std::make_shared<FormatCurrencyFunctionCall>());
    functionCallManager->registerFunctionCall(std::make_shared<FormatDateFunctionCall>());
    functionCallManager->registerFunctionCall(std::make_shared<PluralizeFunctionCall>());
    functionCallManager->registerFunctionCall(std::make_shared<ParseTokenFunctionCall>());
}

void SurfaceCoordinator::handleRenderFinish(const ComponentRenderInfo &info) {
    AGENUI_LOG("handleRenderFinish: surfaceId=%s, componentId=%s, type=%s, width=%.1f, height=%.1f", info.surfaceId.c_str(),
               info.componentId.c_str(), info.type.c_str(), info.width, info.height);

    if (info.surfaceId.empty()) {
        AGENUI_LOG("handleRenderFinish failed: surfaceId is empty");
        return;
    }
    auto it = _surfaces.find(info.surfaceId);
    if (it == _surfaces.end()) {
        AGENUI_LOG("handleRenderFinish failed: surface not found, surfaceId=%s", info.surfaceId.c_str());
        return;
    }
    Surface *surface = it->second.get();
    if (surface) {
        surface->updateComponentSize(info);
        AGENUI_LOG("handleRenderFinish success: surfaceId=%s, componentId=%s, type=%s", info.surfaceId.c_str(),
                   info.componentId.c_str(), info.type.c_str());
    } else {
        AGENUI_LOG("handleRenderFinish failed: surface is null");
    }
}

void SurfaceCoordinator::handleSurfaceSizeChanged(const SurfaceLayoutInfo &info) {
    AGENUI_LOG("handleSurfaceSizeChanged: surfaceId:%s, width:%.1f, height:%.1f", info.surfaceId.c_str(), info.width, info.height);

    if (info.surfaceId.empty()) {
        AGENUI_LOG("handleSurfaceSizeChanged failed: surfaceId is empty");
        return;
    }
    auto it = _surfaces.find(info.surfaceId);
    if (it == _surfaces.end()) {
        AGENUI_LOG("handleSurfaceSizeChanged failed: surface not found, surfaceId=%s", info.surfaceId.c_str());
        return;
    }
    Surface *surface = it->second.get();
    if (surface) {
        surface->updateSurfaceSize(info);
    }
}

} // namespace agenui
