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

#include "streaming_impl.h"
#include <regex>
#include <stdexcept>
#include <iostream>
#include <cctype>
#include <queue>
#include <algorithm>
#include <fstream>
#include <functional>
#include <map>
#include <set>

namespace a2ui {

static std::set<std::string> CUTTABLE_KEYS = {
    "literalString", "valueString", "label", "hint", "caption", "altText", "text"
};

std::string fix_json(const std::string& json_str) {
    std::vector<char> stack;
    bool in_string = false;
    bool escaped = false;
    size_t last_quote_idx = std::string::npos;
    
    std::string fixed = json_str;
    while (!fixed.empty() && std::isspace(fixed.back())) {
        fixed.pop_back();
    }
    
    if (fixed.empty()) return "";

    for (size_t i = 0; i < fixed.length(); ++i) {
        char c = fixed[i];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (c == '\\') {
            escaped = true;
            continue;
        }
        if (c == '"') {
            in_string = !in_string;
            if (in_string) {
                last_quote_idx = i;
            }
            continue;
        }
        if (!in_string) {
            if (c == '{' || c == '[') {
                stack.push_back(c);
            } else if (c == '}' || c == ']') {
                if (!stack.empty()) stack.pop_back();
            }
        }
    }
    
    if (in_string) {
        if (last_quote_idx != std::string::npos) {
            std::string prefix = fixed.substr(0, last_quote_idx);
            while (!prefix.empty() && std::isspace(prefix.back())) {
                prefix.pop_back();
            }
            if (!prefix.empty() && prefix.back() == ':') {
                size_t colon_pos = prefix.length() - 1;
                size_t last_quote = prefix.rfind('"', colon_pos - 1);
                if (last_quote != std::string::npos) {
                    size_t first_quote = prefix.rfind('"', last_quote - 1);
                    if (first_quote != std::string::npos) {
                        std::string key = prefix.substr(first_quote + 1, last_quote - first_quote - 1);
                        if (CUTTABLE_KEYS.find(key) == CUTTABLE_KEYS.end()) {
                            return ""; // Not cuttable!
                        }
                        
                        std::string string_val = fixed.substr(last_quote_idx + 1);
                        if (key == "valueString") {
                            if (string_val.rfind("http://", 0) == 0 ||
                                string_val.rfind("https://", 0) == 0 ||
                                string_val.rfind("data:", 0) == 0 ||
                                string_val.rfind("/", 0) == 0) {
                                return "";
                            }
                        }
                        
                        size_t lookback_start = (prefix.length() > 200) ? prefix.length() - 200 : 0;
                        std::string lookback_str = prefix.substr(lookback_start);
                        static const std::regex key_pattern(R"(\"key\"\s*:\s*\"([^\"]+)\")");
                        std::smatch match;
                        std::string data_key = "";
                        auto words_begin = std::sregex_iterator(lookback_str.begin(), lookback_str.end(), key_pattern);
                        auto words_end = std::sregex_iterator();
                        for (std::sregex_iterator i = words_begin; i != words_end; ++i) {
                            match = *i;
                            data_key = match[1].str();
                        }
                        
                        if (!data_key.empty()) {
                            std::transform(data_key.begin(), data_key.end(), data_key.begin(), [](unsigned char c){ return std::tolower(c); });
                            if (data_key.find("url") != std::string::npos ||
                                data_key.find("link") != std::string::npos ||
                                data_key.find("src") != std::string::npos ||
                                data_key.find("href") != std::string::npos ||
                                data_key.find("image") != std::string::npos) {
                                return "";
                            }
                        }
                    }
                }
            }
        }
        fixed += '"'; // Close string
    }
    
    while (!fixed.empty() && std::isspace(fixed.back())) {
        fixed.pop_back();
    }
    if (!fixed.empty() && fixed.back() == ',') {
        fixed.pop_back();
        while (!fixed.empty() && std::isspace(fixed.back())) {
            fixed.pop_back();
        }
    }
    
    while (!stack.empty()) {
        char opening = stack.back();
        stack.pop_back();
        fixed += (opening == '{') ? '}' : ']';
    }
    
    return fixed;
}

std::set<std::string> get_reachable_components(
    const std::string& root_id,
    const std::map<std::string, nlohmann::json>& seen_components
) {
    std::map<std::string, std::vector<std::string>> adj_list;
    for (const auto& pair : seen_components) {
        const auto& id = pair.first;
        const auto& comp = pair.second;
        adj_list[id] = {};
        
        // Extract refs (heuristic)
        if (comp.contains("child") && comp["child"].is_string()) {
            adj_list[id].push_back(comp["child"].get<std::string>());
        }
        if (comp.contains("children")) {
            const auto& children = comp["children"];
            if (children.is_array()) {
                for (const auto& item : children) {
                    if (item.is_string()) adj_list[id].push_back(item.get<std::string>());
                }
            } else if (children.is_object()) {
                if (children.contains("explicitList") && children["explicitList"].is_array()) {
                    for (const auto& item : children["explicitList"]) {
                        if (item.is_string()) adj_list[id].push_back(item.get<std::string>());
                    }
                }
                if (children.contains("template") && children["template"].is_object()) {
                    const auto& temp = children["template"];
                    if (temp.contains("componentId") && temp["componentId"].is_string()) {
                        adj_list[id].push_back(temp["componentId"].get<std::string>());
                    }
                }
                if (children.contains("componentId") && children["componentId"].is_string()) {
                    adj_list[id].push_back(children["componentId"].get<std::string>());
                }
            }
        }
        if (comp.contains("component") && comp["component"].is_object()) {
             for (auto it = comp["component"].begin(); it != comp["component"].end(); ++it) {
                 if (it.value().is_object()) {
                     auto props = it.value();
                     if (props.contains("child") && props["child"].is_string()) {
                         adj_list[id].push_back(props["child"].get<std::string>());
                     }
                     if (props.contains("children")) {
                         const auto& children = props["children"];
                         if (children.is_array()) {
                             for (const auto& item : children) {
                                 if (item.is_string()) adj_list[id].push_back(item.get<std::string>());
                             }
                         } else if (children.is_object()) {
                             if (children.contains("explicitList") && children["explicitList"].is_array()) {
                                 for (const auto& item : children["explicitList"]) {
                                     if (item.is_string()) adj_list[id].push_back(item.get<std::string>());
                                 }
                             }
                             if (children.contains("template") && children["template"].is_object()) {
                                 const auto& temp = children["template"];
                                 if (temp.contains("componentId") && temp["componentId"].is_string()) {
                                     adj_list[id].push_back(temp["componentId"].get<std::string>());
                                 }
                             }
                             if (children.contains("componentId") && children["componentId"].is_string()) {
                                 adj_list[id].push_back(children["componentId"].get<std::string>());
                             }
                         }
                     }
                 }
             }
        }
    }

    std::set<std::string> visited;
    std::set<std::string> recursion_stack;

    std::function<void(const std::string&)> dfs = [&](const std::string& node_id) {
        visited.insert(node_id);
        recursion_stack.insert(node_id);

        auto it = adj_list.find(node_id);
        if (it != adj_list.end()) {
            for (const auto& neighbor : it->second) {
                if (neighbor == node_id) {
                     throw std::runtime_error("Self-reference detected");
                }
                if (visited.find(neighbor) == visited.end()) {
                    dfs(neighbor);
                } else if (recursion_stack.find(neighbor) != recursion_stack.end()) {
                     throw std::runtime_error("Circular reference detected");
                }
            }
        }

        recursion_stack.erase(node_id);
    };

    if (seen_components.find(root_id) != seen_components.end()) {
        dfs(root_id);
    }
    return visited;
}

} // namespace a2ui
