#pragma once

#include <string>
#include <nlohmann/json.hpp>

namespace a2ui {

nlohmann::json parse_and_fix(const std::string& payload);

// Exposed for testing
std::string normalize_smart_quotes(const std::string& json_str);
std::string remove_trailing_commas(const std::string& json_str);

} // namespace a2ui
