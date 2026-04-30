#pragma once

#include <map>
#include <string>

namespace agenui {

/**
 * @brief Utility class for shared baseline style defaults
 * @remark Defaults are defined as a JSON config in agenui_style_defaults_config.h,
 *         parsed and cached on first access. All component types share the same set.
 *         Used to fill in missing style properties in ComponentSnapshot.styles.
 *
 *         Difference from ComponentPropertySpec:
 *         - ComponentPropertySpec loads from external JSON and supports theme switching and enum mapping
 *         - StyleDefaults is embedded in code and serves as the lowest-level style fallback
 */
class StyleDefaults {
public:
    /**
     * @brief Get baseline style defaults
     * @return const reference to the default style map (style name -> JSON string value)
     */
    static const std::map<std::string, std::string>& getDefaults();

private:
    StyleDefaults() = delete;  // Pure utility class; instantiation is not allowed
};

}  // namespace agenui
