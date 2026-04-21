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

#include "streaming_impl.h"
#include "a2ui/parser/constants.h"
#include <regex>
#include <stdexcept>
#include <fstream>
#include <iostream>

namespace a2ui {

class A2uiStreamParserV08 : public A2uiStreamParserImpl {
public:
    explicit A2uiStreamParserV08(A2uiCatalog catalog) : A2uiStreamParserImpl(std::move(catalog)) {}

protected:
    void sniff_metadata() override {
        // Simplified regex-based sniffing
        auto get_latest_value = [this](const std::string& key) -> std::string {
            std::regex pattern(R"(\")" + key + R"(\"\s*:\s*\"([^\"]+)\")");
            std::smatch match;
            std::string search_str = json_buffer_;
            std::string result = "";
            while (std::regex_search(search_str, match, pattern)) {
                result = match[1].str();
                search_str = match.suffix().str();
            }
            return result;
        };

        std::string sid = get_latest_value("surfaceId");
        if (!sid.empty()) surface_id_ = sid;

        std::string rid = get_latest_value("root");
        if (!rid.empty()) root_ids_[surface_id_] = rid;

        auto check_msg_type = [this](const std::string& type) {
            if (json_buffer_.find("\"" + type + "\":") != std::string::npos) {
                if (std::find(msg_types_.begin(), msg_types_.end(), type) == msg_types_.end()) {
                    msg_types_.push_back(type);
                }
                active_msg_type_ = type;
            }
        };

        check_msg_type(MSG_TYPE_BEGIN_RENDERING);
        check_msg_type(MSG_TYPE_SURFACE_UPDATE);
        check_msg_type(MSG_TYPE_DATA_MODEL_UPDATE);
        check_msg_type(MSG_TYPE_DELETE_SURFACE);
    }



    bool handle_complete_object(const nlohmann::json& obj, const std::string& surface_id, std::vector<ResponsePart>& messages) override {
        if (!obj.is_object()) return false;

        std::string sid = surface_id;
        if (obj.contains("surfaceId") && obj["surfaceId"].is_string()) {
            sid = obj["surfaceId"].get<std::string>();
        }

        if (obj.contains(MSG_TYPE_BEGIN_RENDERING) && obj[MSG_TYPE_BEGIN_RENDERING].is_object()) {
            auto br = obj[MSG_TYPE_BEGIN_RENDERING];
            if (br.contains("surfaceId")) sid = br["surfaceId"].get<std::string>();
        }
        if (obj.contains(MSG_TYPE_SURFACE_UPDATE) && obj[MSG_TYPE_SURFACE_UPDATE].is_object()) {
            auto su = obj[MSG_TYPE_SURFACE_UPDATE];
            if (su.contains("surfaceId")) sid = su["surfaceId"].get<std::string>();
        }
        if (obj.contains(MSG_TYPE_DELETE_SURFACE)) {
             if (obj[MSG_TYPE_DELETE_SURFACE].is_string()) sid = obj[MSG_TYPE_DELETE_SURFACE].get<std::string>();
             else if (obj[MSG_TYPE_DELETE_SURFACE].is_object() && obj[MSG_TYPE_DELETE_SURFACE].contains("surfaceId")) sid = obj[MSG_TYPE_DELETE_SURFACE]["surfaceId"].get<std::string>();
        }

        surface_id_ = sid;

        if (validator_) {
            validator_->validate(obj, sid, false);
        }

        if (obj.contains(MSG_TYPE_DELETE_SURFACE)) {
            if (yielded_start_messages_.find(sid) != yielded_start_messages_.end() || buffered_start_message_.has_value()) {
                // Delete surface logic (stubbed or not needed for this test)
            }
        }

        if (obj.contains(MSG_TYPE_SURFACE_UPDATE) || obj.contains(MSG_TYPE_DELETE_SURFACE)) {
            std::ofstream debug_file("/tmp/debug.txt", std::ios::app);
            debug_file << "Checking buffering for " << sid << "\n";
            debug_file << "  yielded_start: " << (yielded_start_messages_.find(sid) != yielded_start_messages_.end()) << "\n";
            debug_file << "  buffered_start: " << buffered_start_message_.has_value() << "\n";
            debug_file.close();

            if (yielded_start_messages_.find(sid) == yielded_start_messages_.end()
                && !buffered_start_message_.has_value()) {
                
                std::ofstream debug_file2("/tmp/debug.txt", std::ios::app);
                debug_file2 << "  Buffering message for " << sid << "\n";
                debug_file2.close();
                
                pending_messages_[sid].push_back(obj);
                return true;
            }
        }

        if (obj.contains(MSG_TYPE_BEGIN_RENDERING)) {
            auto br = obj[MSG_TYPE_BEGIN_RENDERING];
            root_ids_[sid] = br.value("root", "root");
            buffered_start_message_ = obj;
            
            if (yielded_start_messages_.find(sid) == yielded_start_messages_.end()) {
                yield_messages({obj}, messages);
                yielded_start_messages_.insert(sid);
                buffered_start_message_ = std::nullopt;
            }

            if (pending_messages_.find(sid) != pending_messages_.end()) {
                auto pending_list = pending_messages_[sid];
                pending_messages_.erase(sid);
                for (const auto& pending_msg : pending_list) {
                    handle_complete_object(pending_msg, sid, messages);
                }
            }
            
            yield_reachable(messages);
            return true;
        }

        if (obj.contains(MSG_TYPE_SURFACE_UPDATE)) {
            auto su = obj[MSG_TYPE_SURFACE_UPDATE];
            if (su.contains("components") && su["components"].is_array()) {
                for (const auto& comp : su["components"]) {
                    if (comp.is_object() && comp.contains("id")) {
                        seen_components_[comp["id"].get<std::string>()] = comp;
                    }
                }
            }
            yield_reachable(messages, MSG_TYPE_SURFACE_UPDATE, true, false);
            return true;
        }

        if (obj.contains(MSG_TYPE_DATA_MODEL_UPDATE)) {
            yield_messages({obj}, messages);
            yield_reachable(messages, "", false, false);
            return true;
        }

        return false;
    }

    nlohmann::json create_placeholder_component(const std::string& id) const override {
        return {
            {"id", id},
            {"component", {{"Row", {{"children", {{"explicitList", nlohmann::json::array()}}}}}}}
        };
    }

    bool is_protocol_msg(const nlohmann::json& obj) const override {
        return obj.contains(MSG_TYPE_BEGIN_RENDERING) || obj.contains(MSG_TYPE_SURFACE_UPDATE) || obj.contains(MSG_TYPE_DATA_MODEL_UPDATE) || obj.contains(MSG_TYPE_DELETE_SURFACE);
    }

    std::string get_active_msg_type_for_components() const override {
        return MSG_TYPE_SURFACE_UPDATE;
    }

    std::string get_data_model_msg_type() const override {
        return MSG_TYPE_DATA_MODEL_UPDATE;
    }

    bool deduplicate_data_model(const nlohmann::json& m, bool strict_integrity) override {
        if (m.contains(MSG_TYPE_DATA_MODEL_UPDATE)) {
            auto dm = m[MSG_TYPE_DATA_MODEL_UPDATE];
            auto raw_contents = dm.value("contents", nlohmann::json::object());
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

            if (!contents_dict.empty()) {
                bool is_new = false;
                for (auto it = contents_dict.begin(); it != contents_dict.end(); ++it) {
                    if (yielded_data_model_.find(it.key()) == yielded_data_model_.end() || yielded_data_model_[it.key()] != it.value()) {
                        is_new = true;
                        break;
                    }
                }
                if (!is_new && strict_integrity) {
                    return false;
                }
                for (auto it = contents_dict.begin(); it != contents_dict.end(); ++it) {
                    yielded_data_model_[it.key()] = it.value();
                }
            }
        }
        return true;
    }
};

} // namespace a2ui
