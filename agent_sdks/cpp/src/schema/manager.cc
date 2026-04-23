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

#include "a2ui/schema/manager.h"
#include "a2ui/schema/constants.h"
#include <filesystem>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <iostream>

namespace fs = std::filesystem;

namespace a2ui {

namespace internal {
extern const char* SERVER_TO_CLIENT_SCHEMA_V08;
extern const char* SERVER_TO_CLIENT_SCHEMA_V09;
extern const char* COMMON_TYPES_SCHEMA_V09;
}

A2uiSchemaManager::A2uiSchemaManager(
    std::string version,
    std::vector<CatalogConfig> catalogs,
    bool accepts_inline_catalogs,
    std::vector<std::function<nlohmann::json(nlohmann::json)>> schema_modifiers
) : version_(std::move(version)),
    accepts_inline_catalogs_(accepts_inline_catalogs),
    schema_modifiers_(std::move(schema_modifiers)) {
    
    load_schemas(version_, catalogs);
}

void A2uiSchemaManager::load_schemas(const std::string& version, const std::vector<CatalogConfig>& catalogs) {
    if (version == VERSION_0_8) {
        server_to_client_schema_ = apply_modifiers(nlohmann::json::parse(internal::SERVER_TO_CLIENT_SCHEMA_V08));
    } else if (version == VERSION_0_9) {
        server_to_client_schema_ = apply_modifiers(nlohmann::json::parse(internal::SERVER_TO_CLIENT_SCHEMA_V09));
        common_types_schema_ = apply_modifiers(nlohmann::json::parse(internal::COMMON_TYPES_SCHEMA_V09));
    } else {
        throw std::runtime_error("Unsupported version: " + version);
    }

    for (const auto& config : catalogs) {
        nlohmann::json catalog_schema = config.provider->load();
        catalog_schema = apply_modifiers(catalog_schema);
        
        A2uiCatalog catalog(version, config.name, server_to_client_schema_, common_types_schema_, catalog_schema);
        supported_catalogs_.push_back(catalog);
        if (config.examples_path) {
            catalog_example_paths_[catalog.catalog_id()] = *config.examples_path;
        }
    }
}

nlohmann::json A2uiSchemaManager::apply_modifiers(nlohmann::json schema) {
    for (const auto& modifier : schema_modifiers_) {
        schema = modifier(schema);
    }
    return schema;
}

std::vector<std::string> A2uiSchemaManager::supported_catalog_ids() const {
    std::vector<std::string> ids;
    for (const auto& c : supported_catalogs_) {
        ids.push_back(c.catalog_id());
    }
    return ids;
}

A2uiCatalog A2uiSchemaManager::select_catalog(const std::optional<nlohmann::json>& client_ui_capabilities) {
    if (supported_catalogs_.empty()) {
        throw std::runtime_error("No supported catalogs found.");
    }

    if (!client_ui_capabilities || !client_ui_capabilities->is_object()) {
        return supported_catalogs_[0];
    }

    std::vector<std::string> client_supported_ids;
    if (client_ui_capabilities->contains(SUPPORTED_CATALOG_IDS_KEY) && (*client_ui_capabilities)[SUPPORTED_CATALOG_IDS_KEY].is_array()) {
        for (const auto& id : (*client_ui_capabilities)[SUPPORTED_CATALOG_IDS_KEY]) {
            if (id.is_string()) client_supported_ids.push_back(id.get<std::string>());
        }
    }

    bool has_inline = client_ui_capabilities->contains("inlineCatalogs") && (*client_ui_capabilities)["inlineCatalogs"].is_array();

    if (has_inline && !accepts_inline_catalogs_) {
        throw std::runtime_error("Inline catalogs are not accepted");
    }

    A2uiCatalog selected_catalog = supported_catalogs_[0];
    bool found = false;

    if (!client_supported_ids.empty()) {
        for (const auto& cscid : client_supported_ids) {
            for (const auto& c : supported_catalogs_) {
                if (c.catalog_id() == cscid) {
                    selected_catalog = c;
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        if (!found && !has_inline) {
            throw std::runtime_error("No client-supported catalog found");
        }
    }

    if (has_inline) {
        nlohmann::json merged_schema = selected_catalog.catalog_schema();
        for (const auto& inline_cat : (*client_ui_capabilities)["inlineCatalogs"]) {
            nlohmann::json inline_schema = inline_cat;
            for (const auto& modifier : schema_modifiers_) {
                inline_schema = modifier(inline_schema);
            }
            
            if (inline_schema.contains("components") && inline_schema["components"].is_object()) {
                if (!merged_schema.contains("components")) {
                    merged_schema["components"] = nlohmann::json::object();
                }
                merged_schema["components"].update(inline_schema["components"]);
            }
        }
        return A2uiCatalog(
            selected_catalog.version(),
            "inline", // Match Python INLINE_CATALOG_NAME
            selected_catalog.s2c_schema(),
            selected_catalog.common_types_schema(),
            merged_schema
        );
    }

    return selected_catalog;
}


A2uiCatalog A2uiSchemaManager::get_selected_catalog(
    const std::optional<nlohmann::json>& client_ui_capabilities,
    const std::optional<std::vector<std::string>>& allowed_components,
    const std::optional<std::vector<std::string>>& allowed_messages
) {
    A2uiCatalog catalog = select_catalog(client_ui_capabilities);
    return std::move(catalog).with_pruning(
        allowed_components.value_or(std::vector<std::string>{}),
        allowed_messages.value_or(std::vector<std::string>{})
    );
}

std::string A2uiSchemaManager::load_examples(const A2uiCatalog& catalog, bool validate) {
    auto it = catalog_example_paths_.find(catalog.catalog_id());
    if (it != catalog_example_paths_.end()) {
        return catalog.load_examples(it->second, validate);
    }
    return "";
}

std::string A2uiSchemaManager::generate_system_prompt(
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
    std::stringstream ss;
    ss << role_description << "\n\n";

    std::string workflow = std::string(DEFAULT_WORKFLOW_RULES);
    if (!workflow_description.empty()) {
        workflow += "\n" + workflow_description;
    }
    ss << "## Workflow Description:\n" << workflow << "\n\n";

    if (!ui_description.empty()) {
        ss << "## UI Description:\n" << ui_description << "\n\n";
    }

    A2uiCatalog selected_catalog = get_selected_catalog(client_ui_capabilities, allowed_components, allowed_messages);

    if (include_schema) {
        ss << selected_catalog.render_as_llm_instructions() << "\n\n";
    }

    if (include_examples) {
        std::string examples_str = load_examples(selected_catalog, validate_examples);
        if (!examples_str.empty()) {
            ss << "### Examples:\n" << examples_str << "\n";
        }
    }

    return ss.str();
}

} // namespace a2ui
