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

#include "a2ui/schema/catalog.h"
#include "a2ui/schema/constants.h"
#include <filesystem>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <algorithm>
#include <queue>
#include <set>

namespace fs = std::filesystem;

namespace a2ui {

FileSystemCatalogProvider::FileSystemCatalogProvider(std::string path) : path_(std::move(path)) {}

nlohmann::json FileSystemCatalogProvider::load() {
    std::ifstream file(path_);
    if (!file.is_open()) {
        throw std::runtime_error("Failed to open file: " + path_);
    }
    nlohmann::json j;
    file >> j;
    return j;
}

CatalogConfig CatalogConfig::from_path(std::string name, std::string catalog_path, std::optional<std::string> examples_path) {
    std::shared_ptr<A2uiCatalogProvider> provider;
    if (catalog_path.rfind("file://", 0) == 0) {
        provider = std::make_shared<FileSystemCatalogProvider>(catalog_path.substr(7));
    } else if (catalog_path.find("://") != std::string::npos) {
        throw std::runtime_error("Unsupported catalog URL scheme: " + catalog_path);
    } else {
        provider = std::make_shared<FileSystemCatalogProvider>(catalog_path);
    }

    return CatalogConfig{
        std::move(name),
        std::move(provider),
        resolve_examples_path(examples_path)
    };
}

std::optional<std::string> resolve_examples_path(std::optional<std::string> path) {
    if (path) {
        if (path->rfind("file://", 0) == 0) {
            return path->substr(7);
        } else if (path->find("://") != std::string::npos) {
             throw std::runtime_error("Unsupported examples URL scheme: " + *path);
        }
        return path;
    }
    return std::nullopt;
}

A2uiCatalog::A2uiCatalog(std::string version,
                        std::string name,
                        nlohmann::json s2c_schema,
                        nlohmann::json common_types_schema,
                        nlohmann::json catalog_schema)
    : version_(std::move(version)),
      name_(std::move(name)),
      s2c_schema_(std::move(s2c_schema)),
      common_types_schema_(std::move(common_types_schema)),
      catalog_schema_(std::move(catalog_schema)) {}

std::string A2uiCatalog::catalog_id() const {
    if (catalog_schema_.contains(CATALOG_ID_KEY)) {
        return catalog_schema_[CATALOG_ID_KEY].get<std::string>();
    }
    throw std::runtime_error("Catalog '" + name_ + "' missing catalogId");
}

std::string A2uiCatalog::render_as_llm_instructions() const {
    std::stringstream ss;
    ss << A2UI_SCHEMA_BLOCK_START << "\n";

    if (!s2c_schema_.empty()) {
        ss << "### Server To Client Schema:\n" << s2c_schema_.dump(2) << "\n\n";
    }

    if (common_types_schema_.contains("$defs") && !common_types_schema_["$defs"].empty()) {
        ss << "### Common Types Schema:\n" << common_types_schema_.dump(2) << "\n\n";
    }

    ss << "### Catalog Schema:\n" << catalog_schema_.dump(2) << "\n\n";
    ss << A2UI_SCHEMA_BLOCK_END;

    return ss.str();
}

std::string A2uiCatalog::load_examples(const std::string& path, bool validate) const {
    if (path.empty()) return "";

    std::vector<std::string> matched_files;
    if (fs::is_directory(path)) {
        for (const auto& entry : fs::directory_iterator(path)) {
            if (entry.is_regular_file() && entry.path().extension() == ".json") {
                matched_files.push_back(entry.path().string());
            }
        }
    } else if (fs::is_regular_file(path)) {
        matched_files.push_back(path);
    }

    if (matched_files.empty()) return "";

    std::sort(matched_files.begin(), matched_files.end());

    std::stringstream ss;
    for (size_t i = 0; i < matched_files.size(); ++i) {
        const auto& file_path = matched_files[i];
        std::ifstream file(file_path);
        if (!file.is_open()) continue;

        std::stringstream buffer;
        buffer << file.rdbuf();
        std::string content = buffer.str();

        if (validate) {
            validate_example(file_path, content);
        }

        std::string basename = fs::path(file_path).stem().string();
        ss << "---BEGIN " << basename << "---\n" << content << "\n---END " << basename << "---";
        if (i < matched_files.size() - 1) {
            ss << "\n\n";
        }
    }
    return ss.str();
}

void A2uiCatalog::validate_example(const std::string& full_path, const std::string& content) const {
    try {
        auto parsed = nlohmann::json::parse(content);
        (void)parsed;
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to parse example " + full_path + ": " + e.what());
    }
}

// Helper for collecting refs
void collect_refs(const nlohmann::json& j, std::vector<std::string>& refs) {
    if (j.is_object()) {
        for (auto it = j.begin(); it != j.end(); ++it) {
            if (it.key() == "$ref" && it.value().is_string()) {
                refs.push_back(it.value().get<std::string>());
            } else {
                collect_refs(it.value(), refs);
            }
        }
    } else if (j.is_array()) {
        for (const auto& item : j) {
            collect_refs(item, refs);
        }
    }
}

// Helper for pruning by reachability
nlohmann::json prune_defs_by_reachability(
    const nlohmann::json& defs,
    const std::vector<std::string>& root_def_names,
    const std::string& internal_ref_prefix) {
    
    std::set<std::string> visited_defs;
    std::queue<std::string> refs_queue;
    
    for (const auto& root : root_def_names) {
        refs_queue.push(root);
    }

    while (!refs_queue.empty()) {
        std::string def_name = refs_queue.front();
        refs_queue.pop();

        if (defs.contains(def_name) && visited_defs.find(def_name) == visited_defs.end()) {
            visited_defs.insert(def_name);

            std::vector<std::string> internal_refs;
            collect_refs(defs[def_name], internal_refs);
            
            for (const auto& ref : internal_refs) {
                if (ref.rfind(internal_ref_prefix, 0) == 0) {
                    refs_queue.push(ref.substr(internal_ref_prefix.length()));
                }
            }
        }
    }

    nlohmann::json result = nlohmann::json::object();
    for (const auto& key : visited_defs) {
        result[key] = defs[key];
    }
    return result;
}

A2uiCatalog A2uiCatalog::with_pruning(
    const std::vector<std::string>& allowed_components,
    const std::vector<std::string>& allowed_messages) && {
    
    if (!allowed_components.empty()) {
        *this = std::move(*this).with_pruned_components(allowed_components);
    }
    if (!allowed_messages.empty()) {
        *this = std::move(*this).with_pruned_messages(allowed_messages);
    }
    return std::move(*this).with_pruned_common_types();
}

A2uiCatalog A2uiCatalog::with_pruned_components(const std::vector<std::string>& allowed_components) && {
    if (catalog_schema_.contains(CATALOG_COMPONENTS_KEY) && catalog_schema_[CATALOG_COMPONENTS_KEY].is_object()) {
        nlohmann::json filtered_comps = nlohmann::json::object();
        for (const auto& comp : allowed_components) {
            if (catalog_schema_[CATALOG_COMPONENTS_KEY].contains(comp)) {
                filtered_comps[comp] = std::move(catalog_schema_[CATALOG_COMPONENTS_KEY][comp]);
            }
        }
        catalog_schema_[CATALOG_COMPONENTS_KEY] = std::move(filtered_comps);
    }

    // Filter anyComponent oneOf if it exists
    if (catalog_schema_.contains("$defs") && catalog_schema_["$defs"].contains("anyComponent")) {
        auto& any_comp = catalog_schema_["$defs"]["anyComponent"];
        if (any_comp.contains("oneOf") && any_comp["oneOf"].is_array()) {
            nlohmann::json filtered_one_of = nlohmann::json::array();
            for (auto& item : any_comp["oneOf"]) {
                if (item.contains("$ref")) {
                    std::string ref = item["$ref"].get<std::string>();
                    std::string prefix = "#/" + std::string(CATALOG_COMPONENTS_KEY) + "/";
                    if (ref.rfind(prefix, 0) == 0) {
                        std::string comp_name = ref.substr(prefix.length());
                        if (std::find(allowed_components.begin(), allowed_components.end(), comp_name) != allowed_components.end()) {
                            filtered_one_of.push_back(std::move(item));
                        }
                    }
                }
            }
            any_comp["oneOf"] = std::move(filtered_one_of);
        }
    }

    return std::move(*this);
}

A2uiCatalog A2uiCatalog::with_pruned_messages(const std::vector<std::string>& allowed_messages) && {
    if (version_ == VERSION_0_8) {
        if (s2c_schema_.contains("properties") && s2c_schema_["properties"].is_object()) {
            s2c_schema_["properties"] = prune_defs_by_reachability(
                s2c_schema_["properties"],
                allowed_messages,
                "#/properties/"
            );
        }
    } else {
        if (s2c_schema_.contains("oneOf") && s2c_schema_["oneOf"].is_array()) {
            nlohmann::json filtered_one_of = nlohmann::json::array();
            for (auto& item : s2c_schema_["oneOf"]) {
                if (item.contains("$ref")) {
                    std::string ref = item["$ref"].get<std::string>();
                    std::string prefix = "#/$defs/";
                    if (ref.rfind(prefix, 0) == 0) {
                        std::string msg_name = ref.substr(prefix.length());
                        if (std::find(allowed_messages.begin(), allowed_messages.end(), msg_name) != allowed_messages.end()) {
                            filtered_one_of.push_back(std::move(item));
                        }
                    }
                }
            }
            s2c_schema_["oneOf"] = std::move(filtered_one_of);
        }

        if (s2c_schema_.contains("$defs") && s2c_schema_["$defs"].is_object()) {
            s2c_schema_["$defs"] = prune_defs_by_reachability(
                s2c_schema_["$defs"],
                allowed_messages,
                "#/$defs/"
            );
        }
    }

    return std::move(*this);
}

A2uiCatalog A2uiCatalog::with_pruned_common_types() && {
    if (common_types_schema_.empty() || !common_types_schema_.contains("$defs")) {
        return std::move(*this);
    }

    std::vector<std::string> external_refs;
    collect_refs(catalog_schema_, external_refs);
    collect_refs(s2c_schema_, external_refs);

    std::vector<std::string> root_common_types;
    std::string prefix = "common_types.json#/$defs/";
    for (const auto& ref : external_refs) {
        if (ref.rfind(prefix, 0) == 0) {
            root_common_types.push_back(ref.substr(prefix.length()));
        }
    }

    common_types_schema_["$defs"] = prune_defs_by_reachability(
        common_types_schema_["$defs"],
        root_common_types,
        "#/$defs/"
    );

    return std::move(*this);
}

} // namespace a2ui
