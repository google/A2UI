#include "agenui_numeric_functioncall.h"

namespace agenui {

FunctionCallResolution NumericFunctionCall::execute(const nlohmann::json& args) {
    if (!args.contains("value")) {
        return FunctionCallResolution::createError("Missing required parameter: value");
    }
    
    if (!args["value"].is_number()) {
        return FunctionCallResolution::createError("Value must be a number");
    }
    
    double value = args["value"].get<double>();
    
    // Check minimum
    if (args.contains("min") && args["min"].is_number()) {
        double minVal = args["min"].get<double>();
        if (value < minVal) {
            return FunctionCallResolution::createSuccess(false);
        }
    }

    // Check maximum
    if (args.contains("max") && args["max"].is_number()) {
        double maxVal = args["max"].get<double>();
        if (value > maxVal) {
            return FunctionCallResolution::createSuccess(false);
        }
    }
    
    return FunctionCallResolution::createSuccess(true);
}

FunctionCallConfig NumericFunctionCall::getConfig() const {
    FunctionCallConfig config;
    config.setName("numeric");
    config.setDescription("Checks numeric range constraints.");
    config.setReturnType("boolean");
    config.setSync(true);
    nlohmann::json params = {
        {"type", "object"},
        {"properties", {
            {"value", {{"type", "number"}}},
            {"min", {{"type", "number"}}},
            {"max", {{"type", "number"}}}
        }},
        {"required", nlohmann::json::array({"value"})}
    };
    config.setParameters(params);
    return config;
}

} // namespace agenui
