#include "a2ui/schema/common_modifiers.h"

namespace a2ui {

nlohmann::json remove_strict_validation(const nlohmann::json& schema) {
    if (schema.is_object()) {
        nlohmann::json new_schema = nlohmann::json::object();
        for (auto it = schema.begin(); it != schema.end(); ++it) {
            if (it.key() == "additionalProperties" && it.value().is_boolean() && !it.value().get<bool>()) {
                continue; // Skip additionalProperties: false
            }
            new_schema[it.key()] = remove_strict_validation(it.value());
        }
        return new_schema;
    } else if (schema.is_array()) {
        nlohmann::json new_schema = nlohmann::json::array();
        for (const auto& item : schema) {
            new_schema.push_back(remove_strict_validation(item));
        }
        return new_schema;
    }
    return schema;
}

} // namespace a2ui
