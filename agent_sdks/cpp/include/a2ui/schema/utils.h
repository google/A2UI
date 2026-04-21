#pragma once

#include <nlohmann/json.hpp>

namespace a2ui {

nlohmann::json wrap_as_json_array(const nlohmann::json& schema);
nlohmann::json deep_update(const nlohmann::json& d, const nlohmann::json& u);

} // namespace a2ui
