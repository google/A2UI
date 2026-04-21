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
#include <nlohmann/json.hpp>
#include <string>
#include <vector>
#include <optional>
#include <set>

namespace a2ui {

class A2uiValidator {
public:
    explicit A2uiValidator(A2uiCatalog catalog);

    void validate(const nlohmann::json& a2ui_json,
                  const std::optional<std::string>& root_id = std::nullopt,
                  bool strict_integrity = true);

private:
    A2uiCatalog catalog_;
    std::string version_;
    std::map<std::string, std::set<std::string>> required_fields_map_;

    void validate_0_9_custom(const nlohmann::json& messages, const std::optional<std::string>& root_id, bool strict_integrity);
    void validate_0_8_custom(const nlohmann::json& messages, const std::optional<std::string>& root_id, bool strict_integrity);
    
    void check_component_integrity(const std::optional<std::string>& root_id, const nlohmann::json& components, bool skip_root_check);
    void check_topology(const std::optional<std::string>& root_id, const nlohmann::json& components, bool raise_on_orphans);
    
    void check_recursion_and_paths(const nlohmann::json& message);
    void dfs_check_recursion(const nlohmann::json& j, int depth, int func_depth);
};

} // namespace a2ui
