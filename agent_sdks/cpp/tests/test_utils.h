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

#include <yaml-cpp/yaml.h>
#include <nlohmann/json.hpp>
#include <string>
#include <algorithm>
#include <cctype>
#include <fstream>
#include <filesystem>

namespace fs = std::filesystem;

namespace a2ui {
namespace tests {

inline nlohmann::json yaml_to_json(const YAML::Node& node) {
    switch (node.Type()) {
        case YAML::NodeType::Null:
            return nullptr;
        case YAML::NodeType::Scalar: {
            std::string s = node.as<std::string>();
            
            if (node.Tag() == "!") {
                return s; // Quoted string, preserve as string
            }
            
            if (s == "true") return true;
            if (s == "false") return false;
            if (s == "null") return nullptr;
            
            try {
                size_t pos;
                int i = std::stoi(s, &pos);
                if (pos == s.length()) return i;
            } catch (...) {}
            
            try {
                size_t pos;
                double d = std::stod(s, &pos);
                if (pos == s.length()) return d;
            } catch (...) {}
            
            return s;
        }
        case YAML::NodeType::Sequence: {
            nlohmann::json j = nlohmann::json::array();
            for (const auto& item : node) {
                j.push_back(yaml_to_json(item));
            }
            return j;
        }
        case YAML::NodeType::Map: {
            nlohmann::json j = nlohmann::json::object();
            for (auto it = node.begin(); it != node.end(); ++it) {
                j[it->first.as<std::string>()] = yaml_to_json(it->second);
            }
            return j;
        }
        default:
            return nullptr;
    }
}

inline fs::path find_repo_root() {
    fs::path current = fs::current_path();
    while (true) {
        if (fs::is_directory(current / "specification")) {
            return current;
        }
        fs::path parent = current.parent_path();
        if (parent == current) {
            return "";
        }
        current = parent;
    }
}

inline nlohmann::json load_json_file(const fs::path& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        throw std::runtime_error("Failed to open file: " + path.string());
    }
    nlohmann::json j;
    file >> j;
    return j;
}

inline a2ui::A2uiCatalog setup_catalog(const nlohmann::json& catalog_config, const fs::path& conformance_dir) {
    std::string version = catalog_config["version"];
    
    nlohmann::json s2c_schema;
    if (catalog_config.contains("s2c_schema")) {
        if (catalog_config["s2c_schema"].is_string()) {
            s2c_schema = load_json_file(conformance_dir / catalog_config["s2c_schema"].get<std::string>());
        } else {
            s2c_schema = catalog_config["s2c_schema"];
        }
    }
    
    nlohmann::json catalog_schema;
    if (catalog_config.contains("catalog_schema")) {
        if (catalog_config["catalog_schema"].is_string()) {
             catalog_schema = load_json_file(conformance_dir / catalog_config["catalog_schema"].get<std::string>());
        } else {
            catalog_schema = catalog_config["catalog_schema"];
        }
    } else {
        catalog_schema = {{"catalogId", "test_catalog"}, {"components", nlohmann::json::object()}};
    }
    
    nlohmann::json common_types_schema;
    if (catalog_config.contains("common_types_schema")) {
        if (catalog_config["common_types_schema"].is_string()) {
             common_types_schema = load_json_file(conformance_dir / catalog_config["common_types_schema"].get<std::string>());
        } else {
            common_types_schema = catalog_config["common_types_schema"];
        }
    }
    
    return a2ui::A2uiCatalog(version, "test_catalog", s2c_schema, common_types_schema, catalog_schema);
}

} // namespace tests
} // namespace a2ui
