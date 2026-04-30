#include "agenui_pluralize_functioncall.h"
#include <cmath>

namespace agenui {

FunctionCallResolution PluralizeFunctionCall::execute(const nlohmann::json& args) {
    if (!args.contains("value") || !args.contains("other")) {
        return FunctionCallResolution::createError("Missing required parameters");
    }
    
    if (!args["value"].is_number() || !args["other"].is_string()) {
        return FunctionCallResolution::createError("Invalid parameter types");
    }
    
    double value = args["value"].get<double>();
    int count = static_cast<int>(std::round(value));
    
    // English plural rules
    if (count == 0 && args.contains("zero") && args["zero"].is_string()) {
        return FunctionCallResolution::createSuccess(args["zero"].get<std::string>());
    }
    
    if (count == 1 && args.contains("one") && args["one"].is_string()) {
        return FunctionCallResolution::createSuccess(args["one"].get<std::string>());
    }
    
    if (count == 2 && args.contains("two") && args["two"].is_string()) {
        return FunctionCallResolution::createSuccess(args["two"].get<std::string>());
    }
    
    // Default to "other"
    return FunctionCallResolution::createSuccess(args["other"].get<std::string>());
}

FunctionCallConfig PluralizeFunctionCall::getConfig() const {
    FunctionCallConfig config;
    config.setName("pluralize");
    config.setDescription("Returns a localized string based on the plural category of the count.");
    config.setReturnType("string");
    config.setSync(true);
    nlohmann::json params = {
        {"type", "object"},
        {"properties", {
            {"value", {{"type", "number"}}},
            {"zero", {{"type", "string"}}},
            {"one", {{"type", "string"}}},
            {"two", {{"type", "string"}}},
            {"few", {{"type", "string"}}},
            {"many", {{"type", "string"}}},
            {"other", {{"type", "string"}}}
        }},
        {"required", nlohmann::json::array({"value", "other"})}
    };
    config.setParameters(params);
    return config;
}

} // namespace agenui
