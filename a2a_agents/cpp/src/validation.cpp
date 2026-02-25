/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include "a2ui/validation.hpp"

#include <nlohmann/json-schema.hpp>
#include <regex>
#include <set>
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <stdexcept>
#include <algorithm>
#include <iostream>

namespace a2ui {

namespace {

const std::regex JSON_POINTER_PATTERN(R"(^(?:\/(?:[^~\/]|~[01])*)*$)");
const int MAX_GLOBAL_DEPTH = 50;
const int MAX_FUNC_CALL_DEPTH = 5;

const std::string COMPONENTS = "components";
const std::string ID = "id";
const std::string COMPONENT_PROPERTIES = "componentProperties";
const std::string ROOT = "root";
const std::string PATH = "path";
const std::string FUNCTION_CALL = "functionCall";
const std::string CALL = "call";
const std::string ARGS = "args";

struct RefMap {
    std::unordered_set<std::string> single_refs;
    std::unordered_set<std::string> list_refs;
};

using RefFieldsMap = std::unordered_map<std::string, RefMap>;

bool is_component_id_ref(const nlohmann::json& prop_schema) {
    auto it = prop_schema.find("$ref");
    if (it != prop_schema.end() && it->is_string()) {
        std::string ref = it->get<std::string>();
        if (ref.size() >= 11 && ref.substr(ref.size() - 11) == "ComponentId") {
            return true;
        }
    }
    return false;
}

bool is_child_list_ref(const nlohmann::json& prop_schema) {
    auto it = prop_schema.find("$ref");
    if (it != prop_schema.end() && it->is_string()) {
        std::string ref = it->get<std::string>();
        if (ref.size() >= 9 && ref.substr(ref.size() - 9) == "ChildList") {
            return true;
        }
    }
    auto type_it = prop_schema.find("type");
    if (type_it != prop_schema.end() && *type_it == "array") {
        auto items_it = prop_schema.find("items");
        if (items_it != prop_schema.end()) {
            return is_component_id_ref(*items_it);
        }
    }
    return false;
}

RefFieldsMap _extract_component_ref_fields(const nlohmann::json& schema) {
    RefFieldsMap ref_map;

    if (!schema.contains("properties") || !schema["properties"].is_object()) return ref_map;
    const auto& props_schema = schema["properties"];
    if (!props_schema.contains(COMPONENTS) || !props_schema[COMPONENTS].is_object()) return ref_map;
    const auto& comps_schema = props_schema[COMPONENTS];
    
    if (!comps_schema.contains("items") || !comps_schema["items"].is_object()) return ref_map;
    const auto& items_schema = comps_schema["items"];

    if (!items_schema.contains("properties") || !items_schema["properties"].is_object()) return ref_map;
    const auto& items_props_schema = items_schema["properties"];

    if (!items_props_schema.contains(COMPONENT_PROPERTIES) || !items_props_schema[COMPONENT_PROPERTIES].is_object()) return ref_map;
    const auto& comp_props_schema = items_props_schema[COMPONENT_PROPERTIES];

    if (!comp_props_schema.contains("properties") || !comp_props_schema["properties"].is_object()) return ref_map;
    const auto& all_components = comp_props_schema["properties"];

    for (auto it = all_components.begin(); it != all_components.end(); ++it) {
        std::string comp_name = it.key();
        auto comp_schema = it.value();
        
        RefMap refs;
        if (!comp_schema.contains("properties") || !comp_schema["properties"].is_object()) continue;
        const auto& props = comp_schema["properties"];
        for (auto prop_it = props.begin(); prop_it != props.end(); ++prop_it) {
            std::string prop_name = prop_it.key();
            auto prop_schema = prop_it.value();
            if (is_component_id_ref(prop_schema)) {
                refs.single_refs.insert(prop_name);
            } else if (is_child_list_ref(prop_schema)) {
                refs.list_refs.insert(prop_name);
            }
        }
        if (!refs.single_refs.empty() || !refs.list_refs.empty()) {
            ref_map[comp_name] = refs;
        }
    }
    return ref_map;
}

std::vector<std::pair<std::string, std::string>> _get_component_references(
    const nlohmann::json& component, const RefFieldsMap& ref_fields_map) {
    
    std::vector<std::pair<std::string, std::string>> refs;
    
    auto comp_props_it = component.find(COMPONENT_PROPERTIES);
    if (comp_props_it == component.end() || !comp_props_it->is_object()) return refs;
    auto comp_props = *comp_props_it;

    for (auto it = comp_props.begin(); it != comp_props.end(); ++it) {
        std::string comp_type = it.key();
        auto props = it.value();
        if (!props.is_object()) continue;

        auto map_it = ref_fields_map.find(comp_type);
        if (map_it == ref_fields_map.end()) continue;
        const auto& [single_refs, list_refs] = map_it->second;

        for (auto prop_it = props.begin(); prop_it != props.end(); ++prop_it) {
            std::string key = prop_it.key();
            const auto& value = prop_it.value();

            if (single_refs.count(key) && value.is_string()) {
                refs.push_back({value.get<std::string>(), key});
            } else if (list_refs.count(key) && value.is_array()) {
                for (const auto& item : value) {
                    if (item.is_string()) {
                        refs.push_back({item.get<std::string>(), key});
                    }
                }
            }
        }
    }
    return refs;
}

void _validate_component_integrity(const nlohmann::json& components, const RefFieldsMap& ref_fields_map) {
    std::unordered_set<std::string> ids;
    
    for (const auto& comp : components) {
        auto id_it = comp.find(ID);
        if (id_it == comp.end() || !id_it->is_string()) continue;
        std::string comp_id = id_it->get<std::string>();

        if (ids.count(comp_id)) {
            throw std::invalid_argument("Duplicate component ID found: '" + comp_id + "'");
        }
        ids.insert(comp_id);
    }

    if (!ids.count(ROOT)) {
        throw std::invalid_argument("Missing 'root' component: One component must have 'id' set to 'root'.");
    }

    for (const auto& comp : components) {
        std::string comp_id = comp.value(ID, "");
        auto refs = _get_component_references(comp, ref_fields_map);
        for (const auto& ref : refs) {
            if (!ids.count(ref.first)) {
                throw std::invalid_argument("Component '" + comp_id + "' references missing ID '" + ref.first + "' in field '" + ref.second + "'");
            }
        }
    }
}

void _validate_topology(const nlohmann::json& components, const RefFieldsMap& ref_fields_map) {
    std::unordered_map<std::string, std::vector<std::string>> adj_list;
    std::set<std::string> all_ids;

    for (const auto& comp : components) {
        auto id_it = comp.find(ID);
        if (id_it == comp.end() || !id_it->is_string()) continue;
        std::string comp_id = id_it->get<std::string>();

        all_ids.insert(comp_id);
        if (adj_list.find(comp_id) == adj_list.end()) {
            adj_list[comp_id] = {};
        }

        auto refs = _get_component_references(comp, ref_fields_map);
        for (const auto& ref : refs) {
            if (ref.first == comp_id) {
                throw std::invalid_argument("Self-reference detected: Component '" + comp_id + "' references itself in field '" + ref.second + "'");
            }
            adj_list[comp_id].push_back(ref.first);
        }
    }

    std::unordered_set<std::string> visited;
    std::unordered_set<std::string> recursion_stack;

    std::function<void(const std::string&)> dfs = [&](const std::string& node_id) {
        visited.insert(node_id);
        recursion_stack.insert(node_id);

        for (const auto& neighbor : adj_list[node_id]) {
            if (!visited.count(neighbor)) {
                dfs(neighbor);
            } else if (recursion_stack.count(neighbor)) {
                throw std::invalid_argument("Circular reference detected involving component '" + neighbor + "'");
            }
        }

        recursion_stack.erase(node_id);
    };

    if (all_ids.count(ROOT)) {
        dfs(ROOT);
    }

    std::set<std::string> orphans;
    for (const auto& id : all_ids) {
        if (!visited.count(id)) {
            orphans.insert(id);
        }
    }
    
    if (!orphans.empty()) {
        std::string err = "Orphaned components detected (not reachable from 'root'): [";
        bool first = true;
        for (const auto& orphan : orphans) {
            if (!first) err += ", ";
            err += "'" + orphan + "'";
            first = false;
        }
        err += "]";
        throw std::invalid_argument(err);
    }
}

void _traverse(const nlohmann::json& item, int global_depth, int func_depth) {
    if (global_depth > MAX_GLOBAL_DEPTH) {
        throw std::invalid_argument("Global recursion limit exceeded: Depth > " + std::to_string(MAX_GLOBAL_DEPTH));
    }

    if (item.is_array()) {
        for (const auto& x : item) {
            _traverse(x, global_depth + 1, func_depth);
        }
        return;
    }

    if (item.is_object()) {
        auto path_it = item.find(PATH);
        if (path_it != item.end() && path_it->is_string()) {
            std::string path = path_it->get<std::string>();
            if (!std::regex_match(path, JSON_POINTER_PATTERN)) {
                throw std::invalid_argument("Invalid JSON Pointer syntax: '" + path + "'");
            }
        }

        bool is_func = item.contains(CALL) && item.contains(ARGS);
        if (is_func) {
            if (func_depth >= MAX_FUNC_CALL_DEPTH) {
                throw std::invalid_argument("Recursion limit exceeded: " + FUNCTION_CALL + " depth > " + std::to_string(MAX_FUNC_CALL_DEPTH));
            }
            for (auto it = item.begin(); it != item.end(); ++it) {
                if (it.key() == ARGS) {
                    _traverse(it.value(), global_depth + 1, func_depth + 1);
                } else {
                    _traverse(it.value(), global_depth + 1, func_depth);
                }
            }
        } else {
            for (auto it = item.begin(); it != item.end(); ++it) {
                _traverse(it.value(), global_depth + 1, func_depth);
            }
        }
    }
}

void _validate_recursion_and_paths(const nlohmann::json& data) {
    _traverse(data, 0, 0);
}

} // namespace

void validate_a2ui_json(const nlohmann::json& a2ui_json, const nlohmann::json& a2ui_schema) {
    nlohmann::json_schema::json_validator validator;
    try {
        validator.set_root_schema(a2ui_schema);
        validator.validate(a2ui_json);
    } catch (const std::exception& e) {
        throw std::invalid_argument(std::string("Schema validation failed: ") + e.what());
    }

    std::vector<nlohmann::json> messages;
    if (a2ui_json.is_array()) {
        for (const auto& item : a2ui_json) {
            messages.push_back(item);
        }
    } else {
        messages.push_back(a2ui_json);
    }

    for (const auto& message : messages) {
        if (!message.is_object()) continue;

        auto comps_it = message.find(COMPONENTS);
        if (comps_it != message.end() && comps_it->is_array()) {
            auto ref_map = _extract_component_ref_fields(a2ui_schema);
            _validate_component_integrity(*comps_it, ref_map);
            _validate_topology(*comps_it, ref_map);
        }

        _validate_recursion_and_paths(message);
    }
}

} // namespace a2ui
