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

#include <gtest/gtest.h>
#include "a2ui/schema/validator.h"
#include "a2ui/schema/catalog.h"
#include "../test_utils.h"
#include <filesystem>
#include <fstream>
#include <iostream>

namespace fs = std::filesystem;

namespace {


nlohmann::json load_json_file(const fs::path& path) {
    std::ifstream file(path);
    if (!file.is_open()) {
        throw std::runtime_error("Failed to open file: " + path.string());
    }
    nlohmann::json j;
    file >> j;
    return j;
}

a2ui::A2uiCatalog setup_catalog(const nlohmann::json& catalog_config, const fs::path& conformance_dir) {
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
}

TEST(ValidatorConformanceTest, RunAll) {
    fs::path repo_root = a2ui::tests::find_repo_root();
    ASSERT_FALSE(repo_root.empty()) << "Could not find repo root";
    
    fs::path conformance_dir = repo_root / "agent_sdks" / "conformance";
    fs::path validator_tests_path = conformance_dir / "validator.yaml";
    
    YAML::Node yaml_tests = YAML::LoadFile(validator_tests_path.string());
    nlohmann::json tests = a2ui::tests::yaml_to_json(yaml_tests);
    
    for (const auto& test_case : tests) {
        std::string name = test_case["name"];
        SCOPED_TRACE("Test case: " + name);
        
        nlohmann::json catalog_config = test_case["catalog"];
        a2ui::A2uiCatalog catalog = setup_catalog(catalog_config, conformance_dir);
        a2ui::A2uiValidator validator(catalog);
        
        for (const auto& step : test_case["validate"]) {
            nlohmann::json payload = step["payload"];
            
            if (step.contains("expect_error")) {
                EXPECT_THROW(validator.validate(payload), std::runtime_error);
            } else {
                EXPECT_NO_THROW(validator.validate(payload));
            }
        }
    }
}
