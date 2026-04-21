#pragma once

#include "a2ui/schema/catalog.h"
#include <string>
#include <vector>
#include <optional>
#include <nlohmann/json.hpp>
#include <memory>
#include "a2ui/parser/streaming.h"
#include "a2ui/parser/response_part.h"

namespace a2ui {

bool has_a2ui_parts(const std::string& content);
std::vector<ResponsePart> parse_response(const std::string& content);

} // namespace a2ui
