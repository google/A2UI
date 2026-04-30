#include "agenui_token_parser.h"
#include "agenui_design_token_config.h"
#include "nlohmann/json.hpp"
#include "agenui_log.h"

namespace agenui {

TokenParser::TokenParser() {
    loadFromJsonString(kDesignTokenConfig);
}

TokenParser& TokenParser::getInstance() {
    static TokenParser instance;
    return instance;
}

std::string TokenParser::resolve(const std::string& tokenName) const {
    std::lock_guard<std::recursive_mutex> lock(_mutex);
    auto it = _designTokens.find(tokenName);
    if (it != _designTokens.end()) {
        const auto& token = it->second;
        if (_themeMode == ThemeMode::Dark) {
            // Dark mode: prefer dark, fall back to light
            return !token.dark.empty() ? token.dark : token.light;
        } else {
            // Light mode: prefer light, fall back to dark
            return !token.light.empty() ? token.light : token.dark;
        }
    }
    // Return the original token name if not found
    return tokenName;
}

bool TokenParser::loadFromJsonString(const std::string& jsonString) {
    auto root = nlohmann::json::parse(jsonString, nullptr, false);
    if (root.is_discarded() || !root.is_object()) {
        AGENUI_LOG("failed to parse JSON string");
        return false;
    }
    
    if (!root.contains("designTokens") || !root["designTokens"].is_object()) {
        AGENUI_LOG("missing or invalid 'designTokens' field");
        return false;
    }
    const auto& designTokens = root["designTokens"];
    
    std::lock_guard<std::recursive_mutex> lock(_mutex);
    for (auto it = designTokens.begin(); it != designTokens.end(); ++it) {
        const auto& tokenValue = it.value();
        if (!tokenValue.is_object()) {
            continue;
        }
        
        DesignToken token;
        if (tokenValue.contains("type") && tokenValue["type"].is_string()) {
            token.type = tokenValue["type"].get<std::string>();
        }
        if (tokenValue.contains("light") && tokenValue["light"].is_string()) {
            token.light = tokenValue["light"].get<std::string>();
        }
        if (tokenValue.contains("dark") && tokenValue["dark"].is_string()) {
            token.dark = tokenValue["dark"].get<std::string>();
        }
        
        // Only store the token if at least one of light/dark is set
        if (!token.light.empty() || !token.dark.empty()) {
            _designTokens[it.key()] = token;
        }
    }
    
    return true;
}

void TokenParser::setThemeMode(ThemeMode mode) {
    _themeMode = mode;
}

ThemeMode TokenParser::getThemeMode() const {
    return _themeMode;
}

} // namespace agenui
