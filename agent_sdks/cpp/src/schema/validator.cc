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

#include "a2ui/schema/validator.h"
#include "a2ui/schema/constants.h"
#include <stdexcept>
#include <set>
#include <fstream>
#include <queue>
#include <string>

namespace {
constexpr int kMaxGlobalDepth = 50;
constexpr int kMaxFunctionCallDepth = 5;
}
#include <iostream>
#include <map>
#include <functional>

namespace a2ui {

A2uiValidator::A2uiValidator(A2uiCatalog catalog)
    : catalog_(std::move(catalog)), version_(catalog_.version()) {
    auto catalog_schema = catalog_.catalog_schema();
    if (catalog_schema.contains("components")) {
        auto comps = catalog_schema["components"];
        for (auto it = comps.begin(); it != comps.end(); ++it) {
            std::string comp_name = it.key();
            if (it.value().contains("required")) {
                auto req = it.value()["required"];
                if (req.is_array()) {
                    for (const auto& field : req) {
                        required_fields_map_[comp_name].insert(field.get<std::string>());
                    }
                }
            }
        }
    }
}

static std::optional<std::string> find_root_id_in_messages(const nlohmann::json& messages, const std::string& surface_id, const std::string& version) {
    for (const auto& message : messages) {
        if (!message.is_object()) continue;
        if (message.contains("beginRendering") && message["beginRendering"].is_object()) {
            auto br = message["beginRendering"];
            if (br.contains("surfaceId") && br["surfaceId"] == surface_id) {
                if (br.contains("root") && br["root"].is_string()) {
                    return br["root"].get<std::string>();
                }
            }
        }
        if (message.contains("createSurface") && message["createSurface"].is_object()) {
             auto cs = message["createSurface"];
             if (cs.contains("surfaceId") && cs["surfaceId"] == surface_id) {
                 return "root"; // v0.9 default
             }
        }
    }
    return std::nullopt;
}

void A2uiValidator::validate(const nlohmann::json& a2ui_json,
                              const std::optional<std::string>& root_id,
                              bool strict_integrity) {
    nlohmann::json messages = a2ui_json.is_array() ? a2ui_json : nlohmann::json::array({a2ui_json});

    if (version_ == VERSION_0_9) {
        validate_0_9_custom(messages, root_id, strict_integrity);
    } else {
        validate_0_8_custom(messages, root_id, strict_integrity);
    }
}

void A2uiValidator::validate_0_9_custom(const nlohmann::json& messages, const std::optional<std::string>& root_id, bool strict_integrity) {
    for (const auto& message : messages) {
        if (!message.is_object()) continue;

        // Basic type checks based on conformance tests
        if (!message.contains("version")) {
             throw std::runtime_error("Validation failed: 'version' is a required property");
        }
        if (message["version"] != "v0.9") {
             throw std::runtime_error("Validation failed: 'v0.9' was expected");
        }

        nlohmann::json components;
        std::string surface_id;

        if (message.contains("createSurface") && message["createSurface"].is_object()) {
            auto cs = message["createSurface"];
            if (cs.contains("surfaceId") && !cs["surfaceId"].is_string()) {
                throw std::runtime_error("Validation failed: surfaceId is not of type 'string'");
            }
            if (!cs.contains("catalogId")) {
                throw std::runtime_error("Validation failed: 'catalogId' is a required property");
            }
        }

        if (message.contains("updateComponents") && message["updateComponents"].is_object()) {
            auto uc = message["updateComponents"];
            if (uc.contains("components") && uc["components"].is_array()) {
                components = uc["components"];
            } else if (uc.contains("components")) {
                throw std::runtime_error("Validation failed: Expected components to be an array");
            }
            if (uc.contains("surfaceId") && uc["surfaceId"].is_string()) {
                surface_id = uc["surfaceId"].get<std::string>();
            }
        }

        if (!components.empty()) {
            std::optional<std::string> resolved_root_id = root_id.has_value() ? root_id : find_root_id_in_messages(messages, surface_id, version_);
            check_component_integrity(resolved_root_id, components, !strict_integrity);
            check_topology(resolved_root_id, components, strict_integrity);
        }

        check_recursion_and_paths(message);
    }
}

void A2uiValidator::validate_0_8_custom(const nlohmann::json& messages, const std::optional<std::string>& root_id, bool strict_integrity) {
     for (const auto& message : messages) {
        if (!message.is_object()) continue;

        std::set<std::string> allowed_keys = {"beginRendering", "surfaceUpdate", "dataModelUpdate", "deleteSurface", "surfaceId", "version"};
        for (auto it = message.begin(); it != message.end(); ++it) {
            if (allowed_keys.find(it.key()) == allowed_keys.end()) {
                throw std::runtime_error("Validation failed: Unknown message type '" + it.key() + "'");
            }
        }

        // Basic type checks based on conformance tests
        if (message.contains("beginRendering") && message["beginRendering"].is_object()) {
            auto br = message["beginRendering"];
            if (br.contains("surfaceId") && !br["surfaceId"].is_string()) {
                throw std::runtime_error("Validation failed: surfaceId is not of type 'string'");
            }
            if (br.contains("styles") && !br["styles"].is_object()) {
                 throw std::runtime_error("Validation failed: styles is not of type 'object'");
            }
        }

        nlohmann::json components;
        std::string surface_id;

        if (message.contains("surfaceUpdate") && message["surfaceUpdate"].is_object()) {
            auto su = message["surfaceUpdate"];
            if (su.contains("components") && su["components"].is_array()) {
                components = su["components"];
            }
            if (su.contains("surfaceId") && su["surfaceId"].is_string()) {
                surface_id = su["surfaceId"].get<std::string>();
            }
        }

        if (!components.empty()) {
            std::optional<std::string> resolved_root_id = root_id.has_value() ? root_id : find_root_id_in_messages(messages, surface_id, version_);
            check_component_integrity(resolved_root_id, components, !strict_integrity);
            check_topology(resolved_root_id, components, strict_integrity);
        }

        check_recursion_and_paths(message);
    }
}

void A2uiValidator::check_component_integrity(const std::optional<std::string>& root_id, const nlohmann::json& components, bool skip_root_check) {
    std::set<std::string> ids;
    for (const auto& comp : components) {
        if (!comp.is_object()) {
            throw std::runtime_error("Validation failed: Component is not an object");
        }
        if (comp.contains("id") && comp["id"].is_string()) {
            std::string id = comp["id"].get<std::string>();
            if (ids.find(id) != ids.end()) {
                throw std::runtime_error("Duplicate component ID: " + id);
            }
            ids.insert(id);
        }
    }

    if (!skip_root_check && root_id.has_value() && ids.find(*root_id) == ids.end()) {
        throw std::runtime_error("Missing root component: No component has id='" + *root_id + "'");
    }

    auto check_ref = [&](const std::string& comp_id, const std::string& ref_id, const std::string& field_name) {
        if (ids.find(ref_id) == ids.end()) {
             throw std::runtime_error("Component '" + comp_id + "' references non-existent component '" + ref_id + "' in field '" + field_name + "'");
        }
    };

    for (const auto& comp : components) {
        if (comp.contains("component") && comp["component"].is_object()) {
            auto comp_def = comp["component"];
            if (!comp_def.empty()) {
                std::string comp_type = comp_def.begin().key();
                auto props = comp_def.begin().value();
                
                auto rit = required_fields_map_.find(comp_type);
                if (rit != required_fields_map_.end()) {
                    for (const auto& req_field : rit->second) {
                        if (!props.contains(req_field)) {
                            throw std::runtime_error("Validation failed: Component '" + comp.value("id", "") + "' is missing required field '" + req_field + "'");
                        }
                    }
                }
            }
        }

        if (comp.contains("component") && comp["component"].is_string()) {
            std::string comp_type = comp["component"].get<std::string>();
            auto catalog_schema = catalog_.catalog_schema();
            if (catalog_schema.contains("components")) {
                auto comps = catalog_schema["components"];
                if (comps.find(comp_type) == comps.end()) {
                    throw std::runtime_error("Validation failed: Unknown component: " + comp_type);
                }
            }
        }

        std::string comp_id = comp.value("id", "unknown");

        if (comp.contains("child")) {
            if (!comp["child"].is_string()) {
                throw std::runtime_error("Validation failed: 'child' must be a string");
            }
            if (!skip_root_check && root_id.has_value()) {
                check_ref(comp_id, comp["child"].get<std::string>(), "child");
            }
        }
        if (comp.contains("children")) {
            const auto& children = comp["children"];
            if (children.is_array()) {
                for (const auto& item : children) {
                    if (item.is_string()) {
                        if (!skip_root_check && root_id.has_value()) {
                            check_ref(comp_id, item.get<std::string>(), "children");
                        }
                    } else {
                        throw std::runtime_error("Validation failed: 'children' array items must be strings");
                    }
                }
            } else if (children.is_object()) {
                if (children.contains("explicitList")) {
                    if (!children["explicitList"].is_array()) {
                        throw std::runtime_error("Validation failed: 'explicitList' must be an array");
                    }
                    for (const auto& item : children["explicitList"]) {
                        if (item.is_string()) {
                            if (!skip_root_check && root_id.has_value()) {
                                check_ref(comp_id, item.get<std::string>(), "children.explicitList");
                            }
                        } else {
                            throw std::runtime_error("Validation failed: 'explicitList' array items must be strings");
                        }
                    }
                }
                if (children.contains("template")) {
                    if (!children["template"].is_object()) {
                        throw std::runtime_error("Validation failed: 'template' must be an object");
                    }
                    const auto& temp = children["template"];
                    if (temp.contains("componentId")) {
                        if (!temp["componentId"].is_string()) {
                            throw std::runtime_error("Validation failed: 'componentId' must be a string");
                        }
                        if (!skip_root_check && root_id.has_value()) {
                            check_ref(comp_id, temp["componentId"].get<std::string>(), "children.template.componentId");
                        }
                    }
                }
                if (children.contains("componentId")) {
                    if (!children["componentId"].is_string()) {
                        throw std::runtime_error("Validation failed: 'componentId' must be a string");
                    }
                    if (!skip_root_check && root_id.has_value()) {
                        check_ref(comp_id, children["componentId"].get<std::string>(), "children.componentId");
                    }
                }
            } else {
                throw std::runtime_error("Validation failed: 'children' must be an array or object");
            }
        }

        if (comp.contains("component") && comp["component"].is_object()) {
            for (auto it = comp["component"].begin(); it != comp["component"].end(); ++it) {
                if (it.value().is_object()) {
                    auto props = it.value();
                    if (props.contains("child")) {
                        if (!props["child"].is_string()) {
                            throw std::runtime_error("Validation failed: 'child' must be a string");
                        }
                        if (!skip_root_check && root_id.has_value()) {
                            check_ref(comp_id, props["child"].get<std::string>(), "child");
                        }
                    }

                    if (props.contains("children")) {
                        const auto& children = props["children"];
                        if (children.is_array()) {
                            for (const auto& item : children) {
                                if (item.is_string()) {
                                    if (!skip_root_check && root_id.has_value()) {
                                        check_ref(comp_id, item.get<std::string>(), "children");
                                    }
                                } else {
                                    throw std::runtime_error("Validation failed: 'children' array items must be strings");
                                }
                            }
                        } else if (children.is_object()) {
                            if (children.contains("explicitList")) {
                                if (!children["explicitList"].is_array()) {
                                    throw std::runtime_error("Validation failed: 'explicitList' must be an array");
                                }
                                for (const auto& item : children["explicitList"]) {
                                    if (item.is_string()) {
                                        if (!skip_root_check && root_id.has_value()) {
                                            check_ref(comp_id, item.get<std::string>(), "children.explicitList");
                                        }
                                    } else {
                                        throw std::runtime_error("Validation failed: 'explicitList' array items must be strings");
                                    }
                                }
                            }
                            if (children.contains("template")) {
                                if (!children["template"].is_object()) {
                                    throw std::runtime_error("Validation failed: 'template' must be an object");
                                }
                                const auto& temp = children["template"];
                                if (temp.contains("componentId")) {
                                    if (!temp["componentId"].is_string()) {
                                        throw std::runtime_error("Validation failed: 'componentId' must be a string");
                                    }
                                    if (!skip_root_check && root_id.has_value()) {
                                        check_ref(comp_id, temp["componentId"].get<std::string>(), "children.template.componentId");
                                    }
                                }
                            }
                            if (children.contains("componentId")) {
                                if (!children["componentId"].is_string()) {
                                    throw std::runtime_error("Validation failed: 'componentId' must be a string");
                                }
                                if (!skip_root_check && root_id.has_value()) {
                                    check_ref(comp_id, children["componentId"].get<std::string>(), "children.componentId");
                                }
                            }
                        } else {
                            throw std::runtime_error("Validation failed: 'children' must be an array or object");
                        }
                    }
                }
            }
        }
    }
}

void A2uiValidator::check_topology(const std::optional<std::string>& root_id, const nlohmann::json& components, bool raise_on_orphans) {
    std::map<std::string, std::vector<std::string>> adj_list;
    std::set<std::string> all_ids;

    for (const auto& comp : components) {
        if (!comp.is_object()) continue;
        if (comp.contains("id") && comp["id"].is_string()) {
            std::string id = comp["id"].get<std::string>();
            all_ids.insert(id);
            adj_list[id] = {};

            auto add_ref = [&](const std::string& ref_id, const std::string& field_name) {
                if (ref_id == id) {
                    throw std::runtime_error("Self-reference detected: Component '" + id + "' references itself in field '" + field_name + "'");
                }
                adj_list[id].push_back(ref_id);
            };

            if (comp.contains("child") && comp["child"].is_string()) {
                add_ref(comp["child"].get<std::string>(), "child");
            }
            if (comp.contains("children")) {
                const auto& children = comp["children"];
                if (children.is_array()) {
                    for (const auto& item : children) {
                        if (item.is_string()) {
                            add_ref(item.get<std::string>(), "children");
                        }
                    }
                } else if (children.is_object()) {
                    if (children.contains("explicitList") && children["explicitList"].is_array()) {
                        for (const auto& item : children["explicitList"]) {
                            if (item.is_string()) {
                                add_ref(item.get<std::string>(), "children.explicitList");
                            }
                        }
                    }
                    if (children.contains("template") && children["template"].is_object()) {
                        const auto& temp = children["template"];
                        if (temp.contains("componentId") && temp["componentId"].is_string()) {
                            add_ref(temp["componentId"].get<std::string>(), "children.template.componentId");
                        }
                    }
                    if (children.contains("componentId") && children["componentId"].is_string()) {
                        add_ref(children["componentId"].get<std::string>(), "children.componentId");
                    }
                }
            }
             if (comp.contains("component") && comp["component"].is_object()) {
                for (auto it = comp["component"].begin(); it != comp["component"].end(); ++it) {
                    if (it.value().is_object()) {
                        auto props = it.value();
                        if (props.contains("child") && props["child"].is_string()) {
                            add_ref(props["child"].get<std::string>(), "child");
                        }
                        if (props.contains("children")) {
                            const auto& children = props["children"];
                            if (children.is_array()) {
                                for (const auto& item : children) {
                                    if (item.is_string()) {
                                        add_ref(item.get<std::string>(), "children");
                                    }
                                }
                            } else if (children.is_object()) {
                                if (children.contains("explicitList") && children["explicitList"].is_array()) {
                                    for (const auto& item : children["explicitList"]) {
                                        if (item.is_string()) {
                                            add_ref(item.get<std::string>(), "children.explicitList");
                                        }
                                    }
                                }
                                if (children.contains("template") && children["template"].is_object()) {
                                    const auto& temp = children["template"];
                                    if (temp.contains("componentId") && temp["componentId"].is_string()) {
                                        add_ref(temp["componentId"].get<std::string>(), "children.template.componentId");
                                    }
                                }
                                if (children.contains("componentId") && children["componentId"].is_string()) {
                                    add_ref(children["componentId"].get<std::string>(), "children.componentId");
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    std::set<std::string> visited;
    std::set<std::string> recursion_stack;

    std::function<void(const std::string&, int)> dfs = [&](const std::string& node_id, int depth) {
        if (depth > kMaxGlobalDepth) {
            throw std::runtime_error("Global recursion limit exceeded: logical depth > " + std::to_string(kMaxGlobalDepth));
        }

        visited.insert(node_id);
        recursion_stack.insert(node_id);

        auto it = adj_list.find(node_id);
        if (it != adj_list.end()) {
            for (const auto& neighbor : it->second) {
                if (visited.find(neighbor) == visited.end()) {
                    dfs(neighbor, depth + 1);
                } else if (recursion_stack.find(neighbor) != recursion_stack.end()) {
                     throw std::runtime_error("Circular reference detected involving component '" + neighbor + "'");
                }
            }
        }

        recursion_stack.erase(node_id);
    };

    if (root_id.has_value() && all_ids.find(*root_id) != all_ids.end()) {
        dfs(*root_id, 0);

        if (raise_on_orphans) {
            for (const auto& id : all_ids) {
                if (visited.find(id) == visited.end()) {
                     throw std::runtime_error("Component '" + id + "' is not reachable from '" + *root_id + "'");
                }
            }
        }
    } else {
        for (const auto& id : all_ids) {
            if (visited.find(id) == visited.end()) {
                dfs(id, 0);
            }
        }
    }
}

void A2uiValidator::check_recursion_and_paths(const nlohmann::json& message) {
    dfs_check_recursion(message, 0, 0);
}

static bool is_valid_json_pointer(const std::string& path) {
    for (size_t i = 0; i < path.length(); ++i) {
        if (path[i] == '~') {
            if (i + 1 >= path.length() || (path[i+1] != '0' && path[i+1] != '1')) {
                return false;
            }
        }
    }
    return true;
}

void A2uiValidator::dfs_check_recursion(const nlohmann::json& j, int depth, int func_depth) {
    if (depth > kMaxGlobalDepth) {
        throw std::runtime_error("Global recursion limit exceeded: logical depth > " + std::to_string(kMaxGlobalDepth));
    }

    if (j.is_object()) {
        if (j.contains("functionCall")) {
            if (func_depth >= kMaxFunctionCallDepth) {
                throw std::runtime_error("Recursion limit exceeded: functionCall depth > " + std::to_string(kMaxFunctionCallDepth));
            }
            func_depth++;
        }

        for (auto it = j.begin(); it != j.end(); ++it) {
            if (it.key() == "path" && it.value().is_string()) {
                if (!is_valid_json_pointer(it.value().get<std::string>())) {
                    throw std::runtime_error("Invalid path syntax: " + it.value().get<std::string>());
                }
            }
            dfs_check_recursion(it.value(), depth + 1, func_depth);
        }
    } else if (j.is_array()) {
        for (const auto& item : j) {
            dfs_check_recursion(item, depth + 1, func_depth);
        }
    }
}

} // namespace a2ui
