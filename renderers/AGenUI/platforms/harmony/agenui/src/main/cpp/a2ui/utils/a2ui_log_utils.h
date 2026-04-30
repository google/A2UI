#pragma once

#include <string>

namespace agenui {

/**
 * @brief Utility helpers for formatting compact component logs.
 *
 * Parses component JSON and produces a concise summary without depending on
 * any platform-specific logging API.
 */
class A2UILogUtils {
public:
    /**
     * @brief Format component JSON as a one-line summary.
     *
     * Extracts component type, id, and x/y/width/height from styles, then appends
     * the raw JSON payload.
     *
     * Format: component:{type}, id:{id}, x:{x}, y:{y}, w:{w}, h:{h}, raw:{rawJson}
     *
     * @param componentJson Component JSON string
     * @return Formatted summary, or "raw:{componentJson}" on parse failure
     */
    static std::string formatComponentBrief(const std::string& componentJson);

private:
    /**
     * @brief Format a double value as an integer-like string.
     * @param value Value to format
     * @return A compact string such as 32.0 -> "32"
     */
    static std::string formatNumber(double value);
};

} // namespace agenui
