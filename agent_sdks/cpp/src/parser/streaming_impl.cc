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

#include "streaming_impl.h"
#include <algorithm>
#include <cctype>
#include <iostream>
#include <fstream>
#include <regex>
#include <queue>
#include <functional>
#include <set>
#include <map>

namespace a2ui {

A2uiStreamParserImpl::A2uiStreamParserImpl(A2uiCatalog catalog)
    : catalog_(std::move(catalog)), version_(catalog_.version()) {
    validator_ = std::make_unique<A2uiValidator>(catalog_);
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

std::vector<ResponsePart> A2uiStreamParserImpl::process_chunk(const std::string& chunk) {
    std::vector<ResponsePart> messages;
    buffer_ += chunk;

    while (true) {
        if (!found_delimiter_) {
            size_t pos = buffer_.find(A2UI_OPEN_TAG);
            if (pos != std::string::npos) {
                if (pos > 0) {
                    messages.push_back({buffer_.substr(0, pos), std::nullopt});
                }
                found_delimiter_ = true;
                buffer_ = buffer_.substr(pos + A2UI_OPEN_TAG.length());
            } else {
                // Yield text avoiding split tags
                size_t keep_len = 0;
                for (size_t i = A2UI_OPEN_TAG.length() - 1; i > 0; --i) {
                    if (buffer_.length() >= i && buffer_.substr(buffer_.length() - i) == A2UI_OPEN_TAG.substr(0, i)) {
                        keep_len = i;
                        break;
                    }
                }

                if (buffer_.length() > keep_len) {
                    size_t safe_to_yield = buffer_.length() - keep_len;
                    messages.push_back({buffer_.substr(0, safe_to_yield), std::nullopt});
                    buffer_ = buffer_.substr(safe_to_yield);
                }
                break;
            }
        }

        if (found_delimiter_) {
            size_t pos = buffer_.find(A2UI_CLOSE_TAG);
            if (pos != std::string::npos) {
                std::string json_fragment = buffer_.substr(0, pos);
                process_json_chunk(json_fragment, messages);
                
                if (!found_valid_json_in_block_) {
                    throw std::runtime_error("Failed to parse JSON: No valid JSON object found in A2UI block.");
                }

                found_delimiter_ = false;
                reset_json_state();
                buffer_ = buffer_.substr(pos + A2UI_CLOSE_TAG.length());
            } else {
                size_t keep_len = 0;
                for (size_t i = 1; i < A2UI_CLOSE_TAG.length(); ++i) {
                    if (buffer_.length() >= i && buffer_.substr(buffer_.length() - i) == A2UI_CLOSE_TAG.substr(0, i)) {
                        keep_len = i;
                        break;
                    }
                }

                if (keep_len < buffer_.length()) {
                    std::string to_process = buffer_.substr(0, buffer_.length() - keep_len);
                    buffer_ = buffer_.substr(buffer_.length() - keep_len);
                    process_json_chunk(to_process, messages);
                }
                break;
            }
        }
    }

    // Deduplicate surfaceUpdate messages
    for (auto& part : messages) {
        if (!part.a2ui_json.has_value()) continue;
        
        std::vector<nlohmann::json> deduped_msgs;
        std::set<std::string> seen_su;
        
        std::reverse(part.a2ui_json->begin(), part.a2ui_json->end());
        
        for (const auto& m : *part.a2ui_json) {
            bool is_su = false;
            std::string sid;
            std::string_view su_key = get_active_msg_type_for_components();
            
            if (m.is_object() && m.contains(su_key)) {
                is_su = true;
                if (m[su_key].contains("surfaceId") && m[su_key]["surfaceId"].is_string()) {
                    sid = m[su_key]["surfaceId"].get<std::string>();
                }
            }

            if (is_su && !sid.empty()) {
                if (seen_su.find(sid) == seen_su.end()) {
                    deduped_msgs.push_back(m);
                    seen_su.insert(sid);
                }
            } else {
                deduped_msgs.push_back(m);
            }
        }
        
        std::reverse(deduped_msgs.begin(), deduped_msgs.end());
        part.a2ui_json = deduped_msgs;
    }

    return messages;
}

void A2uiStreamParserImpl::process_json_chunk(const std::string& chunk, std::vector<ResponsePart>& messages) {
    for (char c : chunk) {
        bool char_handled = false;
        if (!in_top_level_list_) {
            if (c == '[') {
                if (brace_count_ == 0) {
                    in_top_level_list_ = true;
                }
                brace_stack_.push_back({'[', json_buffer_.length()});
                json_buffer_ += '[';
                brace_count_++;
                char_handled = true;
            } else if (std::isspace(static_cast<unsigned char>(c))) {
                continue; // Skip leading whitespace
            }
        }

        if (!char_handled && in_string_) {
            if (string_escaped_) {
                string_escaped_ = false;
                if (brace_count_ > 0) json_buffer_ += c;
            } else if (c == '\\') {
                string_escaped_ = true;
                if (brace_count_ > 0) json_buffer_ += c;
            } else if (c == '"') {
                in_string_ = false;
                if (brace_count_ > 0) json_buffer_ += c;
            } else {
                if (brace_count_ > 0) json_buffer_ += c;
            }
            char_handled = true;
        }

        if (!char_handled) {
            if (c == '"') {
                in_string_ = true;
                string_escaped_ = false;
                if (brace_count_ > 0) json_buffer_ += c;
            } else if (c == '{') {
                if (brace_count_ == 0) {
                    msg_types_.clear();
                }
                brace_stack_.push_back({'{', json_buffer_.length()});
                json_buffer_ += '{';
                brace_count_++;
            } else if (c == '}') {
                if (!brace_stack_.empty()) {
                    auto [b_type, start_idx] = brace_stack_.back();
                    brace_stack_.pop_back();
                    json_buffer_ += '}';
                    brace_count_--;

                    if (brace_count_ >= 0) {
                        std::string obj_buffer = json_buffer_.substr(start_idx);
                        if (obj_buffer.front() == '{' && obj_buffer.back() == '}') {
                            try {
                                nlohmann::json obj = nlohmann::json::parse(obj_buffer);
                                if (obj.is_object()) {
                                    found_valid_json_in_block_ = true;
                                    
                                    bool is_protocol = in_top_level_list_ && is_protocol_msg(obj);
                                    bool is_comp = obj.contains("id") && obj.contains("component");
                                    bool is_top_level = (brace_stack_.empty()) || (in_top_level_list_ && brace_stack_.size() == 1 && brace_stack_[0].first == '[');

                                    if (is_comp) {
                                        handle_partial_component(obj, messages);
                                    } else if (is_top_level || is_protocol) {
                                        if (!handle_complete_object(obj, surface_id_, messages)) {
                                            yield_messages({obj}, messages);
                                        }
                                    }

                                    // Clear processed object from buffer
                                    if (brace_stack_.size() == 1 && brace_stack_[0].first == '[') {
                                         json_buffer_ = json_buffer_.substr(0, start_idx);
                                    } else if (brace_stack_.empty()) {
                                         json_buffer_.clear();
                                    }
                                }
                             } catch (const nlohmann::json::parse_error& e) {
                                  // Ignore parse errors during streaming as the JSON may be incomplete.
                                  // We will throw if no valid JSON is found by the end of the block.
                             }
                        }
                    }
                }
            } else if (c == '[') {
                brace_stack_.push_back({'[', json_buffer_.length()});
                json_buffer_ += '[';
                brace_count_++;
            } else if (c == ']') {
                if (!brace_stack_.empty() && brace_stack_.back().first == '[') {
                    brace_stack_.pop_back();
                    json_buffer_ += ']';
                    brace_count_--;
                    if (brace_count_ == 0) {
                        in_top_level_list_ = false;
                    }
                }
            } else {
                if (brace_count_ > 0) {
                    json_buffer_ += c;
                }
            }
        }

        // Sniffing
        if (brace_count_ > 0 && (c == '"' || c == ':' || c == ',' || c == '}' || c == ']')) {
            sniff_metadata();
        }
    }

    if (brace_count_ >= 1 && !json_buffer_.empty()) {
        sniff_partial_component(messages);
        sniff_partial_data_model(messages);
    }

    if (topology_dirty_) {
        yield_reachable(messages, "", false, false);
        topology_dirty_ = false;
    }
}

void A2uiStreamParserImpl::reset_json_state() {
    json_buffer_.clear();
    brace_stack_.clear();
    brace_count_ = 0;
    in_top_level_list_ = false;
    in_string_ = false;
    string_escaped_ = false;
    msg_types_.clear();
    found_valid_json_in_block_ = false;
}

void A2uiStreamParserImpl::sniff_partial_component(std::vector<ResponsePart>& messages) {
    if (json_buffer_.find(CATALOG_COMPONENTS_KEY) == std::string::npos) {
        return;
    }

    for (auto it = brace_stack_.rbegin(); it != brace_stack_.rend(); ++it) {
        if (it->first != '{') continue;
        std::string raw_fragment = json_buffer_.substr(it->second);
        if (raw_fragment.empty()) continue;

        std::string fixed_fragment = fix_json(raw_fragment);
        try {
            nlohmann::json obj = nlohmann::json::parse(fixed_fragment);
            if (obj.is_object() && obj.contains("id") && obj.contains("component")) {
                handle_partial_component(obj, messages);
            }
        } catch (...) {
            continue;
        }
    }
}

nlohmann::json A2uiStreamParserImpl::parse_contents_to_dict(const nlohmann::json& raw_contents) const {
    nlohmann::json contents_dict = nlohmann::json::object();
    if (raw_contents.is_array()) {
        for (const auto& entry : raw_contents) {
            if (entry.is_object() && entry.contains("key")) {
                std::string key = entry["key"].get<std::string>();
                nlohmann::json val;
                if (entry.contains("valueString")) val = entry["valueString"];
                else if (entry.contains("valueNumber")) val = entry["valueNumber"];
                else if (entry.contains("valueBoolean")) val = entry["valueBoolean"];
                else if (entry.contains("valueMap")) val = entry["valueMap"];
                
                if (!val.is_null()) {
                    contents_dict[key] = val;
                }
            }
        }
    } else if (raw_contents.is_object()) {
        contents_dict = raw_contents;
    }
    return contents_dict;
}

nlohmann::json A2uiStreamParserImpl::prune_incomplete_datamodel_entries(const nlohmann::json& entries) const {
    if (!entries.is_array()) return entries;
    
    nlohmann::json pruned = nlohmann::json::array();
    for (const auto& entry : entries) {
        if (!entry.is_object()) {
            pruned.push_back(entry);
            continue;
        }
        
        nlohmann::json entry_copy = entry;
        bool has_val = false;
        std::vector<std::string> vkeys = {"value", "valueString", "valueNumber", "valueBoolean"};
        for (const auto& vkey : vkeys) {
            if (entry_copy.contains(vkey)) {
                has_val = true;
                break;
            }
        }
        
        if (entry_copy.contains("valueMap")) {
            nlohmann::json pruned_map = prune_incomplete_datamodel_entries(entry_copy["valueMap"]);
            if (pruned_map.is_array()) {
                if (pruned_map.empty() && !entry_copy["valueMap"].empty()) {
                    entry_copy.erase("valueMap");
                } else {
                    entry_copy["valueMap"] = pruned_map;
                    has_val = true;
                }
            }
        }
        
        if (has_val && entry_copy.contains("key")) {
            pruned.push_back(entry_copy);
        }
    }
    return pruned;
}

void A2uiStreamParserImpl::sniff_partial_data_model(std::vector<ResponsePart>& messages) {

    std::string_view msg_type = get_data_model_msg_type();
    std::string search_pattern = "\"" + std::string(msg_type) + "\"";
    if (json_buffer_.find(search_pattern) == std::string::npos) {
        return;
    }

    for (auto it = brace_stack_.rbegin(); it != brace_stack_.rend(); ++it) {
        if (it->first != '{') continue;
        std::string raw_fragment = json_buffer_.substr(it->second);
        if (raw_fragment.empty()) continue;

        std::string fixed_fragment = fix_json(raw_fragment);
        nlohmann::json obj;
        try {
            obj = nlohmann::json::parse(fixed_fragment);
        } catch (...) {
            std::string trimmed = raw_fragment;
            size_t last_comma = trimmed.rfind(',');
            while (last_comma != std::string::npos) {
                trimmed = trimmed.substr(0, last_comma);
                try {
                    std::string fixed_trimmed = fix_json(trimmed);
                    obj = nlohmann::json::parse(fixed_trimmed);
                    break;
                } catch (...) {
                    last_comma = trimmed.rfind(',');
                }
            }
        }

        if (obj.is_object() && obj.contains(msg_type)) {
            auto dm_obj = obj[msg_type];
            if (version_ == VERSION_0_9) {
                if (dm_obj.is_object() && dm_obj.contains("value")) {
                    auto val = dm_obj["value"];
                    if (val.is_object()) {
                        nlohmann::json delta = nlohmann::json::object();
                        for (auto it = val.begin(); it != val.end(); ++it) {
                            if (yielded_data_model_.find(it.key()) == yielded_data_model_.end() || yielded_data_model_[it.key()] != it.value()) {
                                delta[it.key()] = it.value();
                            }
                        }
                        
                        if (!delta.empty()) {
                            std::string sid = dm_obj.value("surfaceId", surface_id_.empty() ? "default" : surface_id_);
                            nlohmann::json delta_msg = {
                                {"version", "v0.9"},
                                {"updateDataModel", {
                                    {"surfaceId", sid},
                                    {"value", delta}
                                }}
                            };
                            
                            yield_messages({delta_msg}, messages, false);
                            
                            for (auto it = val.begin(); it != val.end(); ++it) {
                                yielded_data_model_[it.key()] = it.value();
                            }
                            return;
                        }
                    }
                }
            } else if (dm_obj.is_object() && dm_obj.contains("contents")) {
                auto raw_contents = dm_obj["contents"];
                nlohmann::json contents_dict = parse_contents_to_dict(raw_contents);
                
                if (!contents_dict.empty()) {
                    nlohmann::json delta = nlohmann::json::object();
                    for (auto dit = contents_dict.begin(); dit != contents_dict.end(); ++dit) {
                        if (yielded_data_model_.find(dit.key()) == yielded_data_model_.end() || yielded_data_model_[dit.key()] != dit.value()) {
                            delta[dit.key()] = dit.value();
                        }
                    }
                    
                    if (!delta.empty()) {
                        std::string sid = dm_obj.value("surfaceId", surface_id_.empty() ? "default" : surface_id_);
                        
                        nlohmann::json delta_contents;
                        if (raw_contents.is_array()) {
                            nlohmann::json delta_list = nlohmann::json::array();
                            std::set<std::string> seen_keys;
                            for (auto rit = raw_contents.rbegin(); rit != raw_contents.rend(); ++rit) {
                                if (rit->is_object() && rit->contains("key")) {
                                    std::string k = (*rit)["key"].get<std::string>();
                                    if (contents_dict.contains(k) && seen_keys.find(k) == seen_keys.end()) {
                                        delta_list.push_back(*rit);
                                        seen_keys.insert(k);
                                    }
                                }
                            }
                            std::reverse(delta_list.begin(), delta_list.end());
                            delta_contents = prune_incomplete_datamodel_entries(delta_list);
                        } else {
                            delta_contents = delta;
                        }
                        
                        nlohmann::json delta_msg_payload = {
                            {"surfaceId", sid},
                            {"contents", delta_contents}
                        };
                        nlohmann::json delta_msg = {
                            {msg_type, delta_msg_payload}
                        };
                        yield_messages({delta_msg}, messages, false);
                        
                        for (auto dit = delta.begin(); dit != delta.end(); ++dit) {
                            yielded_data_model_[dit.key()] = dit.value();
                        }
                    }
                }
            }
        }
    }
}

bool A2uiStreamParserImpl::has_empty_dict(const nlohmann::json& obj) const {
    if (obj.is_object()) {
        if (obj.empty()) return true;
        for (auto it = obj.begin(); it != obj.end(); ++it) {
            if (has_empty_dict(it.value())) return true;
        }
    } else if (obj.is_array()) {
        for (const auto& item : obj) {
            if (has_empty_dict(item)) return true;
        }
    }
    return false;
}

void A2uiStreamParserImpl::handle_partial_component(const nlohmann::json& comp, std::vector<ResponsePart>& messages) {
    std::string id = comp["id"].get<std::string>();
    
    if (comp.contains("component")) {
        auto comp_def = comp["component"];
        if (comp_def.is_string()) {
            if (has_empty_dict(comp)) return;
            
            std::string comp_type = comp_def.get<std::string>();
            auto rit = required_fields_map_.find(comp_type);
            if (rit != required_fields_map_.end()) {
                for (const auto& req_field : rit->second) {
                    if (!comp.contains(req_field)) {
                        return; // Missing required field! Discard!
                    }
                }
            }
        } else if (comp_def.is_object()) {
            if (has_empty_dict(comp_def)) return;
            
            if (!comp_def.empty()) {
                std::string comp_type = comp_def.begin().key();
                auto props = comp_def.begin().value();
                
                auto rit = required_fields_map_.find(comp_type);
                if (rit != required_fields_map_.end()) {
                    for (const auto& req_field : rit->second) {
                        if (!props.contains(req_field)) {
                            return; // Missing required field! Discard!
                        }
                    }
                }
            }
        }
    }
    
    seen_components_[id] = comp;
    topology_dirty_ = true;
}

void A2uiStreamParserImpl::yield_reachable(std::vector<ResponsePart>& messages, std::string_view msg_type, bool check_root, bool raise_on_orphans) {
    std::string_view active_msg_type = msg_type;
    if (active_msg_type.empty()) active_msg_type = get_active_msg_type_for_components();
    if (surface_id_.empty() || active_msg_type.empty()) return;

    if (yielded_start_messages_.find(surface_id_) == yielded_start_messages_.end() && !buffered_start_message_.has_value()) {
        return;
    }

    std::string root_id = root_ids_[surface_id_];
    if (root_id.empty()) root_id = default_root_id_;

    std::set<std::string> reachable_ids = get_reachable_components(root_id, seen_components_);

    std::vector<nlohmann::json> processed_components;
    std::vector<nlohmann::json> extra_components;

    for (const auto& rid : reachable_ids) {
        auto it = seen_components_.find(rid);
        if (it != seen_components_.end()) {
            nlohmann::json comp = it->second;
            bool re_yielding = yielded_ids_[surface_id_].find(rid) != yielded_ids_[surface_id_].end();
            process_component_topology(comp, extra_components, re_yielding);
            processed_components.push_back(comp);
        }
    }

    processed_components.insert(processed_components.end(), extra_components.begin(), extra_components.end());

    bool should_yield = false;
    std::set<std::string> available_reachable;
    for (const auto& rid : reachable_ids) {
        if (seen_components_.find(rid) != seen_components_.end()) {
            available_reachable.insert(rid);
        }
    }

    std::set<std::string> new_ids;
    std::set_difference(available_reachable.begin(), available_reachable.end(),
                        yielded_ids_[surface_id_].begin(), yielded_ids_[surface_id_].end(),
                        std::inserter(new_ids, new_ids.begin()));

    if (!new_ids.empty()) {
        should_yield = true;
    } else {
        for (const auto& comp : processed_components) {
            std::string cid = comp["id"].get<std::string>();
            std::string content_str = comp.dump();
            auto key = std::make_pair(surface_id_, cid);
            if (yielded_contents_[key] != content_str) {
                should_yield = true;
                break;
            }
        }
    }

    if (should_yield) {
        nlohmann::json msg_payload = {
            {"surfaceId", surface_id_},
            {"components", processed_components}
        };
        nlohmann::json msg = nlohmann::json::object();
        if (version_ == VERSION_0_9) {
            msg["version"] = "v0.9";
        }
        msg[active_msg_type] = msg_payload;
        
        size_t old_size = messages.size();
        yield_messages({msg}, messages, false); // strict_integrity=false for partial yields

        if (messages.size() > old_size) {
            for (const auto& rid : available_reachable) {
                yielded_ids_[surface_id_].insert(rid);
            }
            for (const auto& comp : processed_components) {
                std::string cid = comp["id"].get<std::string>();
                yielded_contents_[std::make_pair(surface_id_, cid)] = comp.dump();
            }
        }
    }
}

void A2uiStreamParserImpl::process_component_topology(nlohmann::json& comp, std::vector<nlohmann::json>& extra_components, bool inline_resolved) {
    std::string comp_id = comp.value("id", "unknown");
    auto get_placeholder_id = [](const std::string& id) {
        return "loading_" + id;
    };

    std::set<std::string> extra_component_ids;
    for (const auto& ec : extra_components) {
        if (ec.contains("id")) {
            extra_component_ids.insert(ec["id"].get<std::string>());
        }
    }

    std::function<void(nlohmann::json&)> traverse = [&](nlohmann::json& obj) {
        if (obj.is_object()) {
            if (version_ == VERSION_0_8 && obj.contains("path")) {
                auto current_path = obj["path"];
                if (current_path.is_string()) {
                    std::string path_str = current_path.get<std::string>();
                    if (!path_str.empty() && path_str[0] != '/') {
                        obj["path"] = "/" + path_str;
                    }
                }
            }
            std::vector<std::string> fields = {"children", "explicitList", "child", "contentChild", "entryPointChild", "componentId"};
            for (const auto& field : fields) {
                if (obj.contains(field)) {
                    if (obj[field].is_array()) {
                        nlohmann::json valid_children = nlohmann::json::array();
                        
                        if (obj[field].empty() && (field == "children" || field == "explicitList")) {
                            std::string term = "\"" + field + "\"";
                            size_t pos = json_buffer_.rfind(term);
                            if (pos != std::string::npos) {
                                std::string after_field = json_buffer_.substr(pos + term.length());
                                size_t bracket_pos = after_field.find('[');
                                size_t close_bracket_pos = after_field.find(']');
                                if (bracket_pos != std::string::npos && (close_bracket_pos == std::string::npos || close_bracket_pos > bracket_pos)) {
                                    std::string placeholder_id = "loading_children_" + comp_id;
                                    valid_children.push_back(placeholder_id);
                                    
                                    nlohmann::json placeholder_comp = create_placeholder_component(placeholder_id);
                                    
                                    if (extra_component_ids.find(placeholder_id) == extra_component_ids.end()) {
                                        extra_components.push_back(placeholder_comp);
                                        extra_component_ids.insert(placeholder_id);
                                    }
                                }
                            }
                        } else {
                            for (const auto& item : obj[field]) {
                                if (item.is_string()) {
                                    std::string child_id = item.get<std::string>();
                                    if (seen_components_.find(child_id) != seen_components_.end()) {
                                        valid_children.push_back(child_id);
                                    } else {
                                        std::string pid = get_placeholder_id(child_id);
                                        valid_children.push_back(pid);
                                        
                                        nlohmann::json placeholder_comp = create_placeholder_component(pid);
                                        
                                        if (extra_component_ids.find(pid) == extra_component_ids.end()) {
                                            extra_components.push_back(placeholder_comp);
                                            extra_component_ids.insert(pid);
                                        }
                                    }
                                }
                            }
                        }
                        obj[field] = valid_children;
                    } else if (obj[field].is_string()) {
                        std::string child_id = obj[field].get<std::string>();
                        if (seen_components_.find(child_id) == seen_components_.end()) {
                            std::string placeholder_id = get_placeholder_id(child_id);
                            obj[field] = placeholder_id;
                            
                            nlohmann::json placeholder_comp = create_placeholder_component(placeholder_id);
                            
                            if (extra_component_ids.find(placeholder_id) == extra_component_ids.end()) {
                                extra_components.push_back(placeholder_comp);
                                extra_component_ids.insert(placeholder_id);
                            }
                        }
                    }
                }
            }

            for (auto it = obj.begin(); it != obj.end(); ++it) {
                traverse(it.value());
            }
        } else if (obj.is_array()) {
            for (auto& item : obj) {
                traverse(item);
            }
        }
    };

    traverse(comp);
}


void A2uiStreamParserImpl::yield_messages(const std::vector<nlohmann::json>& messages_to_yield, std::vector<ResponsePart>& messages, bool strict_integrity) {
    for (const auto& m : messages_to_yield) {
        if (!deduplicate_data_model(m, strict_integrity)) {
            continue;
        }
        
        if (validator_) {
            try {
                validator_->validate(m, surface_id_, strict_integrity);
            } catch (const std::exception& e) {
                if (strict_integrity) {
                    throw;
                } else {
                    continue;
                }
            }
        }

        if (messages.empty()) {
            messages.push_back({"", nlohmann::json::array({m})});
        } else if (!messages.back().a2ui_json.has_value()) {
             messages.back().a2ui_json = nlohmann::json::array({m});
        } else if (messages.back().a2ui_json->is_array()) {
             messages.back().a2ui_json->push_back(m);
        } else {
             messages.push_back({"", nlohmann::json::array({m})});
        }
    }
}

} // namespace a2ui
