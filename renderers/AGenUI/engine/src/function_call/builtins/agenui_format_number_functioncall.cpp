#include "agenui_format_number_functioncall.h"
#include <sstream>
#include <iomanip>

namespace agenui {

FunctionCallResolution FormatNumberFunctionCall::execute(const nlohmann::json& args) {
    if (!args.contains("value")) {
        return FunctionCallResolution::createError("Missing required parameter: value");
    }
    
    if (!args["value"].is_number()) {
        return FunctionCallResolution::createError("Value must be a number");
    }
    
    double value = args["value"].get<double>();
    int decimals = 2;
    bool grouping = true;
    
    if (args.contains("decimals") && args["decimals"].is_number_integer()) {
        decimals = args["decimals"].get<int>();
    }
    
    if (args.contains("grouping") && args["grouping"].is_boolean()) {
        grouping = args["grouping"].get<bool>();
    }
    
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(decimals) << value;
    std::string result = oss.str();
    
    // Add thousands separators
    if (grouping) {
        size_t dotPos = result.find('.');
        size_t start = (result[0] == '-') ? 1 : 0;
        size_t end = (dotPos != std::string::npos) ? dotPos : result.length();
        
        for (size_t i = end; i > start + 3; i -= 3) {
            result.insert(i - 3, ",");
        }
    }
    
    return FunctionCallResolution::createSuccess(result);
}

FunctionCallConfig FormatNumberFunctionCall::getConfig() const {
    FunctionCallConfig config;
    config.setName("formatNumber");
    config.setDescription("Formats a number with the specified grouping and decimal precision.");
    config.setReturnType("string");
    config.setSync(true);
    nlohmann::json params = {
        {"type", "object"},
        {"properties", {
            {"value", {{"type", "number"}}},
            {"decimals", {{"type", "number"}}},
            {"grouping", {{"type", "boolean"}}}
        }},
        {"required", nlohmann::json::array({"value"})}
    };
    config.setParameters(params);
    return config;
}

} // namespace agenui
