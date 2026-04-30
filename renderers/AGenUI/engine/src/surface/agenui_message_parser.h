#pragma once

#include <string>
#include "nlohmann/json.hpp"
#include "agenui_dispatcher_types.h"
#include "agenui_errorcode_define.h"

namespace agenui {

/**
 * @brief Message parser class
 * @remark Responsible for parsing various JSON-format message data
 */
class AGenUIMessageParser {
public:
    /**
     * @brief Parse CreateSurface data
     * @param jsonData JSON-format input data
     * @param outMessage Output parameter: parsed CreateSurfaceMessage object
     * @return ExeCode_Parse_success on success, otherwise an error code
     */
    static AGenUIExeCode parseCreateSurfaceData(const std::string& jsonData, CreateSurfaceMessage& outMessage);
    
    /**
     * @brief Parse UpdateComponents data
     * @param jsonData JSON-format input data
     * @param outSurfaceId Output parameter: parsed surfaceId
     * @param outComponentsJson Output parameter: JSON object for the updateComponents field
     * @return ExeCode_Parse_success on success, otherwise an error code
     */
    static AGenUIExeCode parseUpdateComponentsData(const std::string& jsonData, std::string& outSurfaceId, nlohmann::json& outComponentsJson);
    
    /**
     * @brief Parse UpdateDataModel data
     * @param jsonData JSON-format input data
     * @param outSurfaceId Output parameter: parsed surfaceId
     * @param outDataModelJson Output parameter: JSON object for the updateDataModel field
     * @return ExeCode_Parse_success on success, otherwise an error code
     */
    static AGenUIExeCode parseUpdateDataModelData(const std::string& jsonData, std::string& outSurfaceId, nlohmann::json& outDataModelJson);
    
    /**
     * @brief Parse AppendDataModel data
     * @param jsonData JSON-format input data
     * @param outSurfaceId Output parameter: parsed surfaceId
     * @param outDataModelJson Output parameter: JSON object for the appendDataModel field
     * @return ExeCode_Parse_success on success, otherwise an error code
     */
    static AGenUIExeCode parseAppendDataModelData(const std::string& jsonData, std::string& outSurfaceId, nlohmann::json& outDataModelJson);

    /**
     * @brief Parse DeleteSurface data
     * @param jsonData JSON-format input data
     * @param outMessage Output parameter: parsed DeleteSurfaceMessage object
     * @return ExeCode_Parse_success on success, otherwise an error code
     */
    static AGenUIExeCode parseDeleteSurfaceData(const std::string& jsonData, DeleteSurfaceMessage& outMessage);
    
private:
    // Non-instantiable
    AGenUIMessageParser() = delete;
    ~AGenUIMessageParser() = delete;
    AGenUIMessageParser(const AGenUIMessageParser&) = delete;
    AGenUIMessageParser& operator=(const AGenUIMessageParser&) = delete;
};

}  // namespace agenui
