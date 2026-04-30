#include "agenui_errorcode_define.h"

namespace agenui {

std::string getExeCodeString(AGenUIExeCode code) {
    switch (code) {
        case ExeCode_Parse_success:
            return "success";
        case ExeCode_network_Error:
            return "network_Error";
        case ExeCode_ParseError_createSurface_no_keywords:
            return "createSurface_no_keywords";
        case ExeCode_ParseError_createSurface_no_surfaceId:
            return "createSurface_no_surfaceId";
        case ExeCode_ParseError_createSurface_empty_surfaceId:
            return "createSurface_empty_surfaceId";
        case ExeCode_ParseError_createSurface_jsonexception:
            return "createSurface_jsonexception";
        case ExeCode_ParseError_createSurface_duplicate_surfaceId:
            return "createSurface_duplicate_surfaceId";
        case ExeCode_ParseError_updateComponents_no_keywords:
            return "updateComponents_no_keywords";
        case ExeCode_ParseError_updateComponents_no_surfaceId:
            return "updateComponents_no_surfaceId";
        case ExeCode_ParseError_updateComponents_empty_surfaceId:
            return "updateComponents_empty_surfaceId";
        case ExeCode_ParseError_updateComponents_notfound_surfaceId:
            return "updateComponents_notfound_surfaceId";
        case ExeCode_ParseError_updateComponents_jsonexception:
            return "updateComponents_jsonexception";
        case ExeCode_ParseError_updateComponents_no_componentsField:
            return "updateComponents_no_componentsField";
        case ExeCode_ParseError_updateComponents_components_notarray:
            return "updateComponents_components_notarray";
        case ExeCode_ParseError_updateComponents_no_componentEntity:
            return "updateComponents_no_componentEntity";
        case ExeCode_ParseError_updateComponents_parseComponentTemplateFailed:
            return "updateComponents_parseComponentTemplateFailed";
        case ExeCode_ParseError_updateDataModel_no_keywords:
            return "updateDataModel_no_keywords";
        case ExeCode_ParseError_updateDataModel_no_surfaceId:
            return "updateDataModel_no_surfaceId";
        case ExeCode_ParseError_updateDataModel_empty_surfaceId:
            return "updateDataModel_empty_surfaceId";
        case ExeCode_ParseError_updateDataModel_notfound_surfaceId:
            return "updateDataModel_notfound_surfaceId";
        case ExeCode_ParseError_updateDataModel_jsonexception:
            return "updateDataModel_jsonexception";
        case ExeCode_ParseError_appendDataModel_no_keywords:
            return "appendDataModel_no_keywords";
        case ExeCode_ParseError_appendDataModel_no_surfaceId:
            return "appendDataModel_no_surfaceId";
        case ExeCode_ParseError_appendDataModel_empty_surfaceId:
            return "appendDataModel_empty_surfaceId";
        case ExeCode_ParseError_appendDataModel_notfound_surfaceId:
            return "appendDataModel_notfound_surfaceId";
        case ExeCode_ParseError_httpCallback_end_unmatch_data:
            return "httpCallback_end_unmatch_data";
        default:
            return "unknown";
    }
}

std::string formatErrorTips(AGenUIExeCode code) {
    return std::string("#Error: " + getExeCodeString(code));
}

} // namespace agenui
