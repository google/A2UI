#include "agenui_format_currency_functioncall.h"
#include <sstream>
#include <iomanip>

namespace agenui {

FunctionCallResolution FormatCurrencyFunctionCall::execute(const nlohmann::json& args) {
    if (!args.contains("value") || !args.contains("currency")) {
        return FunctionCallResolution::createError("Missing required parameters");
    }
    
    if (!args["value"].is_number() || !args["currency"].is_string()) {
        return FunctionCallResolution::createError("Invalid parameter types");
    }
    
    double value = args["value"].get<double>();
    std::string currency = args["currency"].get<std::string>();
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
    std::string numStr = oss.str();

    // Add thousands separators
    if (grouping) {
        size_t dotPos = numStr.find('.');
        size_t start = (numStr[0] == '-') ? 1 : 0;
        size_t end = (dotPos != std::string::npos) ? dotPos : numStr.length();
        
        for (size_t i = end; i > start + 3; i -= 3) {
            numStr.insert(i - 3, ",");
        }
    }
    
    // Prepend currency symbol
    std::string result = currency + " " + numStr;
    
    return FunctionCallResolution::createSuccess(result);
}

FunctionCallConfig FormatCurrencyFunctionCall::getConfig() const {
    FunctionCallConfig config;
    config.setName("formatCurrency");
    config.setDescription("Formats a number as a currency string.");
    config.setReturnType("string");
    config.setSync(true);
    nlohmann::json params = {
        {"type", "object"},
        {"properties", {
            {"value", {{"type", "number"}}},
            {"currency", {{"type", "string"}}},
            {"decimals", {{"type", "number"}}},
            {"grouping", {{"type", "boolean"}}}
        }},
        {"required", nlohmann::json::array({"value", "currency"})}
    };
    config.setParameters(params);
    return config;
}

} // namespace agenui
