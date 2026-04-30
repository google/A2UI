#include "agenui_regex_functioncall.h"
#include <regex>

namespace agenui {

FunctionCallResolution RegexFunctionCall::execute(const nlohmann::json& args) {
    if (!args.contains("value") || !args.contains("pattern")) {
        return FunctionCallResolution::createError("Missing required parameters");
    }
    
    if (!args["value"].is_string() || !args["pattern"].is_string()) {
        return FunctionCallResolution::createError("Parameters must be strings");
    }
    
    std::string value = args["value"].get<std::string>();
    std::string pattern = args["pattern"].get<std::string>();
    
    std::regex regexPattern(pattern);
    bool matches = std::regex_match(value, regexPattern);
    return FunctionCallResolution::createSuccess(matches);
}

FunctionCallConfig RegexFunctionCall::getConfig() const {
    FunctionCallConfig config;
    config.setName("regex");
    config.setDescription("Checks that the value matches a regular expression string.");
    config.setReturnType("boolean");
    config.setSync(true);
    nlohmann::json params = {
        {"type", "object"},
        {"properties", {
            {"value", {{"type", "string"}}},
            {"pattern", {{"type", "string"}, {"description", "The regex pattern to match against."}}}
        }},
        {"required", nlohmann::json::array({"value", "pattern"})}
    };
    config.setParameters(params);
    return config;
}

} // namespace agenui
