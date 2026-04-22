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
#include "a2ui/parser/parser.h"
#include "a2ui/parser/streaming.h"
#include "a2ui/schema/validator.h"
#include "a2ui/schema/catalog.h"
#include "a2ui/parser/payload_fixer.h"

#include "test_utils.h"
#include <filesystem>
#include <yaml-cpp/yaml.h>
#include <nlohmann/json.hpp>
#include <algorithm>
#include <cctype>

namespace fs = std::filesystem;

namespace {
using namespace a2ui::tests;

// --- Validator Conformance ---
TEST(ValidatorConformanceTest, RunAll) {
    fs::path repo_root = find_repo_root();
    ASSERT_FALSE(repo_root.empty()) << "Could not find repo root";
    
    fs::path conformance_dir = repo_root / "agent_sdks" / "conformance";
    fs::path validator_tests_path = conformance_dir / "validator.yaml";
    
    YAML::Node yaml_tests = YAML::LoadFile(validator_tests_path.string());
    nlohmann::json tests = yaml_to_json(yaml_tests);
    
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

// --- Streaming Parser Conformance (v0.8) ---
TEST(StreamingParserConformanceTest, RunV08) {
    fs::path repo_root = find_repo_root();
    ASSERT_FALSE(repo_root.empty()) << "Could not find repo root";
    
    fs::path conformance_dir = repo_root / "agent_sdks" / "conformance";
    fs::path parser_tests_path = conformance_dir / "streaming_parser.yaml";
    
    YAML::Node yaml_tests = YAML::LoadFile(parser_tests_path.string());
    nlohmann::json tests = yaml_to_json(yaml_tests);
    
    for (const auto& test_case : tests) {
        std::string name = test_case["name"];
        if (name.find("_v08") == std::string::npos) {
            continue;
        }
        SCOPED_TRACE("Test case: " + name);
        
        nlohmann::json catalog_config = test_case["catalog"];
        a2ui::A2uiCatalog catalog = setup_catalog(catalog_config, conformance_dir);
        auto parser = a2ui::A2uiStreamParser::create(catalog);
        
        for (const auto& step : test_case["process_chunk"]) {
            std::string input = step["input"];
            
            if (step.contains("expect_error")) {
                EXPECT_THROW(parser->process_chunk(input), std::runtime_error);
            } else {
                auto parts = parser->process_chunk(input);
                nlohmann::json expected = step["expect"];
                
                ASSERT_EQ(parts.size(), expected.size());
                for (size_t i = 0; i < parts.size(); ++i) {
                    EXPECT_EQ(parts[i].text, expected[i].value("text", ""));
                    if (expected[i].contains("a2ui")) {
                        ASSERT_TRUE(parts[i].a2ui_json.has_value());
                        EXPECT_EQ(*parts[i].a2ui_json, expected[i]["a2ui"]);
                    } else {
                        EXPECT_FALSE(parts[i].a2ui_json.has_value());
                    }
                }
            }
        }
    }
}

// --- Streaming Parser Conformance (v0.9) ---
TEST(StreamingParserConformanceTest, RunV09) {
    fs::path repo_root = find_repo_root();
    ASSERT_FALSE(repo_root.empty()) << "Could not find repo root";
    
    fs::path conformance_dir = repo_root / "agent_sdks" / "conformance";
    fs::path parser_tests_path = conformance_dir / "streaming_parser.yaml";
    
    YAML::Node yaml_tests = YAML::LoadFile(parser_tests_path.string());
    nlohmann::json tests = yaml_to_json(yaml_tests);
    
    for (const auto& test_case : tests) {
        std::string name = test_case["name"];
        if (name.find("_v09") == std::string::npos) {
            continue;
        }
        SCOPED_TRACE("Test case: " + name);
        
        nlohmann::json catalog_config = test_case["catalog"];
        a2ui::A2uiCatalog catalog = setup_catalog(catalog_config, conformance_dir);
        auto parser = a2ui::A2uiStreamParser::create(catalog);
        
        for (const auto& step : test_case["process_chunk"]) {
            std::string input = step["input"];
            
            if (step.contains("expect_error")) {
                EXPECT_THROW(parser->process_chunk(input), std::runtime_error);
            } else {
                auto parts = parser->process_chunk(input);
                nlohmann::json expected = step["expect"];
                
                ASSERT_EQ(parts.size(), expected.size());
                for (size_t i = 0; i < parts.size(); ++i) {
                    EXPECT_EQ(parts[i].text, expected[i].value("text", ""));
                    if (expected[i].contains("a2ui")) {
                        ASSERT_TRUE(parts[i].a2ui_json.has_value());
                        EXPECT_EQ(*parts[i].a2ui_json, expected[i]["a2ui"]);
                    } else {
                        EXPECT_FALSE(parts[i].a2ui_json.has_value());
                    }
                }
            }
        }
    }
}

// --- Non-Streaming Parser Conformance ---
TEST(ParserConformanceTest, RunNonStreaming) {
    fs::path repo_root = find_repo_root();
    ASSERT_FALSE(repo_root.empty()) << "Could not find repo root";
    
    fs::path conformance_dir = repo_root / "agent_sdks" / "conformance";
    fs::path parser_tests_path = conformance_dir / "parser.yaml";
    
    YAML::Node yaml_tests = YAML::LoadFile(parser_tests_path.string());
    nlohmann::json tests = yaml_to_json(yaml_tests);
    
    for (const auto& test_case : tests) {
        std::string name = test_case["name"];
        std::string action = test_case.value("action", "parse_full");
        
        if (action != "parse_full" && action != "has_parts" && action != "fix_payload") {
            continue;
        }
        SCOPED_TRACE("Test case: " + name);
        
        std::string input = test_case["input"];
        
        if (action == "parse_full") {
            if (test_case.contains("expect_error")) {
                EXPECT_THROW(a2ui::parse_response(input), std::runtime_error);
            } else {
                auto parts = a2ui::parse_response(input);
                nlohmann::json expected = test_case["expect"];
                
                ASSERT_EQ(parts.size(), expected.size());
                for (size_t i = 0; i < parts.size(); ++i) {
                    std::string actual_text = parts[i].text;
                    actual_text.erase(actual_text.begin(), std::find_if(actual_text.begin(), actual_text.end(), [](unsigned char ch) {
                        return !std::isspace(ch);
                    }));
                    actual_text.erase(std::find_if(actual_text.rbegin(), actual_text.rend(), [](unsigned char ch) {
                        return !std::isspace(ch);
                    }).base(), actual_text.end());
                    
                    std::string expected_text = expected[i].value("text", "");
                    expected_text.erase(expected_text.begin(), std::find_if(expected_text.begin(), expected_text.end(), [](unsigned char ch) {
                        return !std::isspace(ch);
                    }));
                    expected_text.erase(std::find_if(expected_text.rbegin(), expected_text.rend(), [](unsigned char ch) {
                        return !std::isspace(ch);
                    }).base(), expected_text.end());

                    EXPECT_EQ(actual_text, expected_text);
                    
                    if (expected[i].contains("a2ui")) {
                        ASSERT_TRUE(parts[i].a2ui_json.has_value());
                        EXPECT_EQ(*parts[i].a2ui_json, expected[i]["a2ui"]);
                    } else {
                        EXPECT_FALSE(parts[i].a2ui_json.has_value());
                    }
                }
            }
        } else if (action == "has_parts") {
            bool expected = test_case["expect"];
            EXPECT_EQ(a2ui::has_a2ui_parts(input), expected);
        } else if (action == "fix_payload") {
            nlohmann::json expected = test_case["expect"];
            nlohmann::json result = a2ui::parse_and_fix(input);
            EXPECT_EQ(result, expected);
        }
    }


}

} // namespace
