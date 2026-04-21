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
#include <optional>
#include <vector>
#include <nlohmann/json.hpp>

namespace a2ui {

class InferenceStrategy {
public:
    virtual ~InferenceStrategy() = default;
    
    virtual std::string generate_system_prompt(
        const std::string& role_description,
        const std::string& workflow_description = "",
        const std::string& ui_description = "",
        const std::optional<nlohmann::json>& client_ui_capabilities = std::nullopt,
        const std::optional<std::vector<std::string>>& allowed_components = std::nullopt,
        const std::optional<std::vector<std::string>>& allowed_messages = std::nullopt,
        bool include_schema = false,
        bool include_examples = false,
        bool validate_examples = false
    ) = 0;
};

} // namespace a2ui
