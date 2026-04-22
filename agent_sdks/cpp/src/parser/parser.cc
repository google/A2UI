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

#include "a2ui/parser/parser.h"
#include "streaming_v08.h"
#include "streaming_v09.h"
#include "a2ui/schema/constants.h"
#include <memory>
#include <regex>
#include <cctype>
#include <algorithm>
#include "streaming_impl.h"
#include "a2ui/parser/payload_fixer.h"

namespace a2ui {

std::unique_ptr<A2uiStreamParser> A2uiStreamParser::create(A2uiCatalog catalog) {
    std::string version = catalog.version();
    if (version == VERSION_0_9) {
        return std::make_unique<A2uiStreamParserV09>(std::move(catalog));
    } else {
        return std::make_unique<A2uiStreamParserV08>(std::move(catalog));
    }
}

bool has_a2ui_parts(const std::string& content) {
    return content.find(A2UI_OPEN_TAG) != std::string::npos && content.find(A2UI_CLOSE_TAG) != std::string::npos;
}

static std::string sanitize_json_string(const std::string& json_string) {
    std::string s = json_string;
    // Trim whitespace
    s.erase(s.begin(), std::find_if(s.begin(), s.end(), [](unsigned char ch) {
        return !std::isspace(ch);
    }));
    s.erase(std::find_if(s.rbegin(), s.rend(), [](unsigned char ch) {
        return !std::isspace(ch);
    }).base(), s.end());

    if (s.rfind("```json", 0) == 0) {
        s = s.substr(7);
    } else if (s.rfind("```", 0) == 0) {
        s = s.substr(3);
    }
    
    if (s.length() >= 3 && s.substr(s.length() - 3) == "```") {
        s = s.substr(0, s.length() - 3);
    }
    
    // Trim again
    s.erase(s.begin(), std::find_if(s.begin(), s.end(), [](unsigned char ch) {
        return !std::isspace(ch);
    }));
    s.erase(std::find_if(s.rbegin(), s.rend(), [](unsigned char ch) {
        return !std::isspace(ch);
    }).base(), s.end());
    
    return s;
}

std::vector<ResponsePart> parse_response(const std::string& content) {
    std::vector<ResponsePart> response_parts;
    
    static const std::regex pattern_dotall(std::string(A2UI_OPEN_TAG) + "([\\s\\S]*?)" + std::string(A2UI_CLOSE_TAG));
    
    auto words_begin = std::sregex_iterator(content.begin(), content.end(), pattern_dotall);
    auto words_end = std::sregex_iterator();
    
    if (words_begin == words_end) {
        throw std::runtime_error("A2UI tags not found in response.");
    }
    
    size_t last_end = 0;
    
    for (std::sregex_iterator i = words_begin; i != words_end; ++i) {
        std::smatch match = *i;
        size_t start = match.position();
        size_t end = start + match.length();
        
        std::string text_part = content.substr(last_end, start - last_end);
        text_part.erase(text_part.begin(), std::find_if(text_part.begin(), text_part.end(), [](unsigned char ch) {
            return !std::isspace(ch);
        }));
        text_part.erase(std::find_if(text_part.rbegin(), text_part.rend(), [](unsigned char ch) {
            return !std::isspace(ch);
        }).base(), text_part.end());
        
        std::string json_string = match[1].str();
        std::string clean_json = sanitize_json_string(json_string);
        
        if (clean_json.empty()) {
            throw std::runtime_error("A2UI JSON part is empty.");
        }
        
        nlohmann::json json_data;
        try {
            json_data = parse_and_fix(clean_json);
        } catch (const std::exception& e) {
             throw std::runtime_error("Failed to parse JSON: " + std::string(e.what()));
        }
        
        response_parts.push_back({text_part, json_data});
        last_end = end;
    }
    
    std::string trailing_text = content.substr(last_end);
    trailing_text.erase(trailing_text.begin(), std::find_if(trailing_text.begin(), trailing_text.end(), [](unsigned char ch) {
        return !std::isspace(ch);
    }));
    trailing_text.erase(std::find_if(trailing_text.rbegin(), trailing_text.rend(), [](unsigned char ch) {
        return !std::isspace(ch);
    }).base(), trailing_text.end());
    
    if (!trailing_text.empty()) {
        response_parts.push_back({trailing_text, std::nullopt});
    }
    
    return response_parts;
}

} // namespace a2ui
