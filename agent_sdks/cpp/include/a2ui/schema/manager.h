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

#include "a2ui/inference_strategy.h"
#include "a2ui/schema/catalog.h"
#include <functional>
#include <map>

namespace a2ui {

class A2uiSchemaManager : public InferenceStrategy {
public:
    A2uiSchemaManager(
        std::string version,
        std::vector<CatalogConfig> catalogs = {},
        bool accepts_inline_catalogs = false,
        std::vector<std::function<nlohmann::json(nlohmann::json)>> schema_modifiers = {}
    );

    std::string generate_system_prompt(
        const std::string& role_description,
        const std::string& workflow_description = "",
        const std::string& ui_description = "",
        const std::optional<nlohmann::json>& client_ui_capabilities = std::nullopt,
        const std::optional<std::vector<std::string>>& allowed_components = std::nullopt,
        const std::optional<std::vector<std::string>>& allowed_messages = std::nullopt,
        bool include_schema = false,
        bool include_examples = false,
        bool validate_examples = false
    ) override;

    bool accepts_inline_catalogs() const { return accepts_inline_catalogs_; }
    std::vector<std::string> supported_catalog_ids() const;

    A2uiCatalog get_selected_catalog(
        const std::optional<nlohmann::json>& client_ui_capabilities = std::nullopt,
        const std::optional<std::vector<std::string>>& allowed_components = std::nullopt,
        const std::optional<std::vector<std::string>>& allowed_messages = std::nullopt
    );

private:
    std::string version_;
    bool accepts_inline_catalogs_;
    nlohmann::json server_to_client_schema_;
    nlohmann::json common_types_schema_;
    std::vector<A2uiCatalog> supported_catalogs_;
    std::map<std::string, std::string> catalog_example_paths_;
    std::vector<std::function<nlohmann::json(nlohmann::json)>> schema_modifiers_;

    void load_schemas(const std::string& version, const std::vector<CatalogConfig>& catalogs);
    nlohmann::json apply_modifiers(nlohmann::json schema);
    A2uiCatalog select_catalog(const std::optional<nlohmann::json>& client_ui_capabilities);
    std::string load_examples(const A2uiCatalog& catalog, bool validate);
};

} // namespace a2ui
