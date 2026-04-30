#pragma once

#include <mutex>
#include <string>
#include <map>

namespace agenui {

/**
 * @brief Theme mode
 */
enum class ThemeMode {
    Light,          ///< Light mode
    Dark            ///< Dark mode
};

/**
 * @brief Structured data for a single design token
 */
struct DesignToken {
    std::string type;   ///< Token type (e.g. "color")
    std::string light;  ///< Value in light mode
    std::string dark;   ///< Value in dark mode (may be empty, falls back to light)
};

/**
 * @brief Token resolver singleton
 * @remark Resolves token names to their actual values.
 *         Call loadFromJsonString to load the design token config.
 */
class TokenParser {
public:
    /**
     * @brief Get the singleton instance
     */
    static TokenParser& getInstance();

    /**
     * @brief Resolve a token name to its actual value
     * @param tokenName token name
     * @return Resolved value; returns the original token name if not found
     */
    std::string resolve(const std::string& tokenName) const;

    /**
     * @brief Load design token config from a JSON string
     * @param jsonString JSON string with format:
     *   { "designTokens": { "tokenName": {"type": "color", "light": "#xxx", "dark": "#xxx"}, ... } }
     *   Selects the light or dark value based on the current theme; falls back to light if dark is absent.
     * @return true on success, false if JSON parsing fails
     */
    bool loadFromJsonString(const std::string& jsonString);

    /**
     * @brief Set the theme mode
     * @param mode theme mode (Light or Dark)
     */
    void setThemeMode(ThemeMode mode);

    /**
     * @brief Get the current theme mode
     * @return current theme mode
     */
    ThemeMode getThemeMode() const;

private:
    TokenParser();
    ~TokenParser() = default;

    mutable std::recursive_mutex _mutex;
    std::map<std::string, DesignToken> _designTokens;  ///< token name -> structured data
    ThemeMode _themeMode = ThemeMode::Light;            ///< current theme mode
};

} // namespace agenui
