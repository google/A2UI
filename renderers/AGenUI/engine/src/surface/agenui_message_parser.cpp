#include "agenui_message_parser.h"
#include "agenui_log.h"
#include "nlohmann/json.hpp"

namespace agenui {

AGenUIExeCode AGenUIMessageParser::parseCreateSurfaceData(const std::string& jsonData, CreateSurfaceMessage& outMessage) {
    try {
        auto json = nlohmann::json::parse(jsonData);

        if (!json.contains("createSurface")) {
            AGENUI_LOG("missing createSurface field");
            return ExeCode_ParseError_createSurface_no_keywords;
        }

        auto createSurfaceJson = json["createSurface"];

        if (!createSurfaceJson.contains("surfaceId")) {
            AGENUI_LOG("missing surfaceId");
            return ExeCode_ParseError_createSurface_no_surfaceId;
        }
        outMessage.surfaceId = createSurfaceJson["surfaceId"].get<std::string>();

        // catalogId is optional
        if (createSurfaceJson.contains("catalogId")) {
            outMessage.catalogId = createSurfaceJson["catalogId"].get<std::string>();
        }

        // sendDataModel is optional
        if (createSurfaceJson.contains("sendDataModel")) {
            outMessage.sendDataModel = createSurfaceJson["sendDataModel"].get<bool>();
        }

        // animated is optional (defaults to true)
        if (createSurfaceJson.contains("animated")) {
            outMessage.animated = createSurfaceJson["animated"].get<bool>();
        }
    } catch (const nlohmann::json::exception& e) {
        return ExeCode_ParseError_createSurface_jsonexception;
    }
    
    return ExeCode_Parse_success;
}

AGenUIExeCode AGenUIMessageParser::parseUpdateComponentsData(const std::string& jsonData, std::string& outSurfaceId, nlohmann::json& outComponentsJson) {
    try {
        auto json = nlohmann::json::parse(jsonData);

        if (!json.contains("updateComponents")) {
            AGENUI_LOG("missing updateComponents field");
            return ExeCode_ParseError_updateComponents_no_keywords;
        }

        auto updateComponentsJson = json["updateComponents"];

        if (!updateComponentsJson.contains("surfaceId")) {
            AGENUI_LOG("missing surfaceId");
            return ExeCode_ParseError_updateComponents_no_surfaceId;
        }
        outSurfaceId = updateComponentsJson["surfaceId"].get<std::string>();
        if (outSurfaceId.empty()) {
            return ExeCode_ParseError_updateComponents_empty_surfaceId;
        }

        outComponentsJson = updateComponentsJson;
    } catch (const nlohmann::json::exception& e) {
        return ExeCode_ParseError_updateComponents_jsonexception;
    }
    return ExeCode_Parse_success;
}

AGenUIExeCode AGenUIMessageParser::parseUpdateDataModelData(const std::string& jsonData, std::string& outSurfaceId, nlohmann::json& outDataModelJson) {
    try {
        auto json = nlohmann::json::parse(jsonData);

        if (!json.contains("updateDataModel")) {
            AGENUI_LOG("missing updateDataModel field");
            return ExeCode_ParseError_updateDataModel_no_keywords;
        }

        auto updateDataModelJson = json["updateDataModel"];

        if (!updateDataModelJson.contains("surfaceId")) {
            AGENUI_LOG("missing surfaceId");
            return ExeCode_ParseError_updateDataModel_no_surfaceId;
        }
        outSurfaceId = updateDataModelJson["surfaceId"].get<std::string>();
        if (outSurfaceId.empty()) {
            return ExeCode_ParseError_updateDataModel_empty_surfaceId;
        }

        outDataModelJson = updateDataModelJson;

        return ExeCode_Parse_success;
    } catch (std::exception &error) {
        return ExeCode_ParseError_updateDataModel_jsonexception;
    }
}

AGenUIExeCode AGenUIMessageParser::parseAppendDataModelData(const std::string& jsonData, std::string& outSurfaceId, nlohmann::json& outDataModelJson) {
    try {
        auto json = nlohmann::json::parse(jsonData);

        if (!json.contains("appendDataModel")) {
            AGENUI_LOG("missing appendDataModel field");
            return ExeCode_ParseError_appendDataModel_no_keywords;
        }

        auto appendDataModelJson = json["appendDataModel"];

        if (!appendDataModelJson.contains("surfaceId")) {
            AGENUI_LOG("missing surfaceId");
            return ExeCode_ParseError_appendDataModel_no_surfaceId;
        }
        outSurfaceId = appendDataModelJson["surfaceId"].get<std::string>();
        if (outSurfaceId.empty()) {
            return ExeCode_ParseError_appendDataModel_empty_surfaceId;
        }

        outDataModelJson = appendDataModelJson;
    } catch (const nlohmann::json::exception& e) {
        return ExeCode_ParseError_appendDataModel_jsonexception;
    }
    
    return ExeCode_Parse_success;
}

AGenUIExeCode AGenUIMessageParser::parseDeleteSurfaceData(const std::string& jsonData, DeleteSurfaceMessage& outMessage) {
    try {
        auto json = nlohmann::json::parse(jsonData);

        if (!json.contains("deleteSurface")) {
            AGENUI_LOG("missing deleteSurface field");
            return ExeCode_ParseError_deleteSurface_no_keywords;
        }

        auto deleteSurfaceJson = json["deleteSurface"];

        if (!deleteSurfaceJson.contains("surfaceId")) {
            AGENUI_LOG("missing surfaceId");
            return ExeCode_ParseError_deleteSurface_no_surfaceId;
        }
        outMessage.surfaceId = deleteSurfaceJson["surfaceId"].get<std::string>();
        if (outMessage.surfaceId.empty()) {
            AGENUI_LOG("surfaceId is empty");
            return ExeCode_ParseError_deleteSurface_empty_surfaceId;
        }
    } catch (const nlohmann::json::exception& e) {
        return ExeCode_ParseError_deleteSurface_jsonexception;
    }

    return ExeCode_Parse_success;
}

}  // namespace agenui
