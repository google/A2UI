#include "agenui_length_functioncall.h"

namespace agenui {

FunctionCallResolution LengthFunctionCall::execute(const nlohmann::json& args) {
    if (!args.contains("value")) {
        return FunctionCallResolution::createError("Missing required parameter: value");
    }
    
    if (!args["value"].is_string()) {
        return FunctionCallResolution::createError("Value must be a string");
    }
    
    std::string value = args["value"].get<std::string>();
    size_t len = value.length();
    
    // Check minimum length
    if (args.contains("min") && args["min"].is_number_integer()) {
        int minLen = args["min"].get<int>();
        if (static_cast<int>(len) < minLen) {
            return FunctionCallResolution::createSuccess(false);
        }
    }

    // Check maximum length
    if (args.contains("max") && args["max"].is_number_integer()) {
        int maxLen = args["max"].get<int>();
        if (static_cast<int>(len) > maxLen) {
            return FunctionCallResolution::createSuccess(false);
        }
    }
    
    return FunctionCallResolution::createSuccess(true);
}

FunctionCallConfig LengthFunctionCall::getConfig() const {
    FunctionCallConfig config;
    config.setName("length");
    config.setDescription("Checks string length constraints.");
    config.setReturnType("boolean");
    config.setSync(true);
    nlohmann::json params = {
        {"type", "object"},
        {"properties", {
            {"value", {{"type", "string"}}},
            {"min", {{"type", "integer"}, {"minimum", 0}}},
            {"max", {{"type", "integer"}, {"minimum", 0}}}
        }},
        {"required", nlohmann::json::array({"value"})}
    };
    config.setParameters(params);
    return config;
}

} // namespace agenui
