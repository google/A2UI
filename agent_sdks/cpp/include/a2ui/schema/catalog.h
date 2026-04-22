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
#include <vector>
#include <memory>
#include <optional>
#include <nlohmann/json.hpp>

namespace a2ui {

class A2uiCatalogProvider {
public:
    virtual ~A2uiCatalogProvider() = default;
    virtual nlohmann::json load() = 0;
};

class FileSystemCatalogProvider : public A2uiCatalogProvider {
public:
    explicit FileSystemCatalogProvider(std::string path);
    nlohmann::json load() override;
private:
    std::string path_;
};

struct CatalogConfig {
    std::string name;
    std::shared_ptr<A2uiCatalogProvider> provider;
    std::optional<std::string> examples_path;

    static CatalogConfig from_path(std::string name, std::string catalog_path, std::optional<std::string> examples_path = std::nullopt);
};

class A2uiValidator; // Forward declaration

class A2uiCatalog {
public:
    A2uiCatalog(std::string version,
                std::string name,
                nlohmann::json s2c_schema,
                nlohmann::json common_types_schema,
                nlohmann::json catalog_schema);

    std::string version() const { return version_; }
    std::string name() const { return name_; }
    std::string catalog_id() const;

    std::unique_ptr<A2uiValidator> validator() const;

    const nlohmann::json& s2c_schema() const { return s2c_schema_; }
    const nlohmann::json& common_types_schema() const { return common_types_schema_; }
    const nlohmann::json& catalog_schema() const { return catalog_schema_; }

    A2uiCatalog with_pruning(const std::vector<std::string>& allowed_components = {},
                             const std::vector<std::string>& allowed_messages = {}) &&;

    std::string render_as_llm_instructions() const;
    std::string load_examples(const std::string& path, bool validate = false) const;

private:
    std::string version_;
    std::string name_;
    nlohmann::json s2c_schema_;
    nlohmann::json common_types_schema_;
    nlohmann::json catalog_schema_;

    A2uiCatalog with_pruned_components(const std::vector<std::string>& allowed_components) &&;
    A2uiCatalog with_pruned_messages(const std::vector<std::string>& allowed_messages) &&;
    A2uiCatalog with_pruned_common_types() &&;
    void validate_example(const std::string& full_path, const std::string& content) const;
};

std::optional<std::string> resolve_examples_path(std::optional<std::string> path);

} // namespace a2ui
