// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include "a2ui/template/manager.h"
#include <stdexcept>

namespace a2ui {

std::string A2uiTemplateManager::generate_system_prompt(
    const std::string& role_description,
    const std::string& workflow_description,
    const std::string& ui_description,
    const std::optional<nlohmann::json>& client_ui_capabilities,
    const std::optional<std::vector<std::string>>& allowed_components,
    const std::optional<std::vector<std::string>>& allowed_messages,
    bool include_schema,
    bool include_examples,
    bool validate_examples
) {
    throw std::runtime_error("This method is not yet implemented.");
}

} // namespace a2ui
