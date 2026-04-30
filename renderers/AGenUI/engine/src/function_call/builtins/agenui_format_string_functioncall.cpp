#include "agenui_format_string_functioncall.h"
#include "agenui_log.h"
#include <sstream>

namespace agenui {

FunctionCallResolution FormatStringFunctionCall::execute(const nlohmann::json& args) {
    if (!args.contains("value")) {
        return FunctionCallResolution::createError("Missing required parameter: value");
    }
    
    const auto& value = args["value"];
    AGENUI_LOG("FormatStringFunctionCall execute, value: %s", value.dump().c_str());

    return FunctionCallResolution::createSuccess(value);
}

FunctionCallConfig FormatStringFunctionCall::getConfig() const {
    FunctionCallConfig config;
    config.setName("formatString");
    config.setDescription("Performs string interpolation of data model values and other functions in the catalog functions list and returns the resulting string. The value string can contain interpolated expressions in the ${expression} format.");
    config.setReturnType("string");
    config.setSync(true);
    
    nlohmann::json params = {
        {"type", "object"},
        {"properties", {
            {"value", {
                {"type", "string"},
                {"description", "Template string with ${} expressions (will be interpolated by the engine before calling this functionCall)"}
            }}
        }},
        {"required", nlohmann::json::array({"value"})}
    };
    
    config.setParameters(params);
    return config;
}

} // namespace agenui
