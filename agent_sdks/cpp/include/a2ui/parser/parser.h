/*
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
