#include "agenui_required_functioncall.h"

namespace agenui {

FunctionCallResolution RequiredFunctionCall::execute(const nlohmann::json& args) {
    if (!args.contains("value")) {
        return FunctionCallResolution::createError("Missing required parameter: value");
    }
    
    const auto& value = args["value"];
    
    if (value.is_null()) {
        return FunctionCallResolution::createSuccess(false);
    }

    if (value.is_string() && value.get<std::string>().empty()) {
        return FunctionCallResolution::createSuccess(false);
    }

    if (value.is_array() && value.empty()) {
        return FunctionCallResolution::createSuccess(false);
    }

    if (value.is_object() && value.empty()) {
        return FunctionCallResolution::createSuccess(false);
    }
    
    return FunctionCallResolution::createSuccess(true);
}

FunctionCallConfig RequiredFunctionCall::getConfig() const {
    FunctionCallConfig config;
    config.setName("required");
    config.setDescription("Checks that the value is not null, undefined, or empty.");
    config.setReturnType("boolean");
    config.setSync(true);
    nlohmann::json params = {
        {"type", "object"},
        {"properties", {
            {"value", {{"description", "The value to check."}}}
        }},
        {"required", nlohmann::json::array({"value"})}
    };
    config.setParameters(params);
    return config;
}

} // namespace agenui
