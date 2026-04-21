#pragma once

#include <string>
#include <optional>
#include <nlohmann/json.hpp>

namespace a2ui {

struct ResponsePart {
    std::string text = "";
    std::optional<nlohmann::json> a2ui_json = std::nullopt;
};

} // namespace a2ui
