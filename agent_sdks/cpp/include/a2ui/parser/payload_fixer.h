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

#include <string>
#include <nlohmann/json.hpp>

namespace a2ui {

nlohmann::json parse_and_fix(const std::string& payload);

// Exposed for testing
std::string normalize_smart_quotes(const std::string& json_str);
std::string remove_trailing_commas(const std::string& json_str);

} // namespace a2ui
