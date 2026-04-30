#include "agenui_style_defaults.h"
#include "agenui_style_defaults_config.h"
#include "agenui_log.h"
#include "nlohmann/json.hpp"

namespace agenui {

const std::map<std::string, std::string>& StyleDefaults::getDefaults() {
    static const std::map<std::string, std::string> defaults = []() {
        std::map<std::string, std::string> result;

        nlohmann::json jsonData = nlohmann::json::parse(kStyleDefaultsConfig, nullptr, false);
        if (jsonData.is_discarded()) {
            AGENUI_LOG("[StyleDefaults] getDefaults failed: JSON parse error");
            return result;
        }

        if (!jsonData.is_object()) {
            AGENUI_LOG("[StyleDefaults] getDefaults failed: root is not an object");
            return result;
        }

        for (auto it = jsonData.begin(); it != jsonData.end(); ++it) {
            // Use dump() to normalize values to JSON strings:
            // strings become quoted (e.g. "auto" -> "\"auto\""), numbers stay unquoted (e.g. 0 -> "0")
            result[it.key()] = it.value().dump();
        }

        return result;
    }();
    return defaults;
}

}  // namespace agenui
