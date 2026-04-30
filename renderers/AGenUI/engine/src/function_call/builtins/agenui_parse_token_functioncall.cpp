#include "agenui_parse_token_functioncall.h"
#include "surface/token_parser/agenui_token_parser.h"
#include "agenui_log.h"

namespace agenui {

FunctionCallResolution ParseTokenFunctionCall::execute(const nlohmann::json& args) {
    if (!args.contains("name")) {
        return FunctionCallResolution::createError("Missing required parameter: name");
    }
    
    const auto& tokenArg = args["name"];
    if (!tokenArg.is_string()) {
        return FunctionCallResolution::createError("Parameter 'name' must be a string");
    }
    
    std::string tokenName = tokenArg.get<std::string>();
    // Resolve via TokenParser
    std::string resolved = TokenParser::getInstance().resolve(tokenName);
    AGENUI_LOG("token:%s, resolved:%s", tokenName.c_str(), resolved.c_str());
    
    return FunctionCallResolution::createSuccess(resolved);
}

FunctionCallConfig ParseTokenFunctionCall::getConfig() const {
    FunctionCallConfig config;
    config.setName("token");
    config.setDescription("Parses a token reference and resolves it to its actual value.");
    config.setReturnType("string");
    config.setSync(true);
    
    nlohmann::json params = {
        {"type", "object"},
        {"properties", {
            {"name", {
                {"type", "string"},
                {"description", "Token name to resolve"}
            }}
        }},
        {"required", nlohmann::json::array({"name"})}
    };
    
    config.setParameters(params);
    return config;
}

} // namespace agenui
