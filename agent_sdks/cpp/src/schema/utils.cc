#include "a2ui/schema/utils.h"
#include <stdexcept>

namespace a2ui {

nlohmann::json wrap_as_json_array(const nlohmann::json& schema) {
    if (schema.empty()) {
        throw std::runtime_error("A2UI schema is empty");
    }
    return {{"type", "array"}, {"items", schema}};
}

nlohmann::json deep_update(const nlohmann::json& d, const nlohmann::json& u) {
    nlohmann::json result = d;
    for (auto it = u.begin(); it != u.end(); ++it) {
        if (it.value().is_object() && result.contains(it.key()) && result[it.key()].is_object()) {
            result[it.key()] = deep_update(result[it.key()], it.value());
        } else {
            result[it.key()] = it.value();
        }
    }
    return result;
}

} // namespace a2ui
