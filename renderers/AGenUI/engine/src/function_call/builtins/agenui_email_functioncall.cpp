#include "agenui_email_functioncall.h"
#include <regex>

namespace agenui {

FunctionCallResolution EmailFunctionCall::execute(const nlohmann::json& args) {
    if (!args.contains("value")) {
        return FunctionCallResolution::createError("Missing required parameter: value");
    }
    
    if (!args["value"].is_string()) {
        return FunctionCallResolution::createError("Value must be a string");
    }
    
    std::string value = args["value"].get<std::string>();
    
    // Simple email regex
    std::regex emailRegex(R"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})");
    bool isValid = std::regex_match(value, emailRegex);
    
    return FunctionCallResolution::createSuccess(isValid);
}

FunctionCallConfig EmailFunctionCall::getConfig() const {
    FunctionCallConfig config;
    config.setName("email");
    config.setDescription("Checks that the value is a valid email address.");
    config.setReturnType("boolean");
    config.setSync(true);
    nlohmann::json params = {
        {"type", "object"},
        {"properties", {
            {"value", {{"type", "string"}}}
        }},
        {"required", nlohmann::json::array({"value"})}
    };
    config.setParameters(params);
    return config;
}

} // namespace agenui
