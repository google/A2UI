#pragma once

#include <nlohmann/json.hpp>

namespace a2ui {

nlohmann::json remove_strict_validation(const nlohmann::json& schema);

} // namespace a2ui
