#pragma once

#include <string>

namespace agenui {

enum AGenUIExeCode {
    ExeCode_Parse_success = 0,
    ExeCode_network_Error,
    ExeCode_ParseError_createSurface_no_keywords,
    ExeCode_ParseError_createSurface_no_surfaceId,
    ExeCode_ParseError_createSurface_empty_surfaceId,
    ExeCode_ParseError_createSurface_jsonexception,
    ExeCode_ParseError_createSurface_duplicate_surfaceId,
    ExeCode_ParseError_updateComponents_no_keywords,
    ExeCode_ParseError_updateComponents_no_surfaceId,
    ExeCode_ParseError_updateComponents_empty_surfaceId,
    ExeCode_ParseError_updateComponents_notfound_surfaceId,
    ExeCode_ParseError_updateComponents_jsonexception,
    ExeCode_ParseError_updateComponents_no_componentsField,
    ExeCode_ParseError_updateComponents_components_notarray,
    ExeCode_ParseError_updateComponents_no_componentEntity,
    ExeCode_ParseError_updateComponents_parseComponentTemplateFailed,
    ExeCode_ParseError_updateDataModel_no_keywords,
    ExeCode_ParseError_updateDataModel_no_surfaceId,
    ExeCode_ParseError_updateDataModel_empty_surfaceId,
    ExeCode_ParseError_updateDataModel_notfound_surfaceId,
    ExeCode_ParseError_updateDataModel_jsonexception,
    ExeCode_ParseError_appendDataModel_no_keywords,
    ExeCode_ParseError_appendDataModel_no_surfaceId,
    ExeCode_ParseError_appendDataModel_empty_surfaceId,
    ExeCode_ParseError_appendDataModel_notfound_surfaceId,
    ExeCode_ParseError_appendDataModel_jsonexception,
    ExeCode_ParseError_deleteSurface_no_keywords,
    ExeCode_ParseError_deleteSurface_no_surfaceId,
    ExeCode_ParseError_deleteSurface_empty_surfaceId,
    ExeCode_ParseError_deleteSurface_jsonexception,
    ExeCode_ParseError_httpCallback_end_unmatch_data,
};

/**
 * @brief Returns the string description for an error code.
 * @param code Error code enum value
 * @return Corresponding string, or "unknown" if not found
 */
std::string getExeCodeString(AGenUIExeCode code);

std::string formatErrorTips(AGenUIExeCode code);

} // namespace agenui
