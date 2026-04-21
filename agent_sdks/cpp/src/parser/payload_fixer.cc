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

#include "a2ui/parser/payload_fixer.h"
#include <regex>
#include <iostream>
#include <fstream>

namespace a2ui {

std::string normalize_smart_quotes(const std::string& json_str) {
    std::string s = json_str;
    // Replace smart quotes with standard quotes (UTF-8 hex codes)
    s = std::regex_replace(s, std::regex("\xE2\x80\x9C"), "\"");
    s = std::regex_replace(s, std::regex("\xE2\x80\x9D"), "\"");
    s = std::regex_replace(s, std::regex("\xE2\x80\x98"), "'");
    s = std::regex_replace(s, std::regex("\xE2\x80\x99"), "'");
    
    return s;
}

std::string remove_trailing_commas(const std::string& json_str) {
    // Fix trailing commas: identifying commas followed by optional whitespace and a closing bracket (]) or brace (}).
    std::regex pattern(R"(,(?=\s*[\]}]))");
    std::string fixed = std::regex_replace(json_str, pattern, "");

    return fixed;
}

static nlohmann::json _parse(const std::string& payload) {
    try {
        nlohmann::json a2ui_json = nlohmann::json::parse(payload);
        if (!a2ui_json.is_array()) {
            a2ui_json = nlohmann::json::array({a2ui_json});
        }
        return a2ui_json;
    } catch (const std::exception& e) {
        throw std::runtime_error("Failed to parse JSON: " + std::string(e.what()));
    }
}

nlohmann::json parse_and_fix(const std::string& payload) {
    std::string normalized_payload = normalize_smart_quotes(payload);
    try {
        return _parse(normalized_payload);
    } catch (const std::exception& e) {
        std::string updated_payload = remove_trailing_commas(normalized_payload);
        return _parse(updated_payload);
    }
}

} // namespace a2ui
