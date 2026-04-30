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

#include "streaming_v09.h"
#include "a2ui/parser/constants.h"
#include <regex>
#include <stdexcept>
#include <fstream>
#include <iostream>
#include <algorithm>

namespace a2ui {

void A2uiStreamParserV09::sniff_metadata() {
    static const std::regex sid_pattern(R"(\"surfaceId\"\s*:\s*\"([^\"]+)\")");
    static const std::regex root_pattern(R"(\"root\"\s*:\s*\"([^\"]+)\")");

    auto get_latest_value = [this](std::string_view key, const std::regex& pattern) -> std::string_view {
        std::string pattern_str = "\"" + std::string(key) + "\"";
        size_t pos = json_buffer_.rfind(pattern_str);
        while (pos != std::string::npos) {
            std::smatch match;
            auto start = json_buffer_.cbegin() + pos;
            auto end = json_buffer_.cend();
            if (std::regex_search(start, end, match, pattern)) {
                return std::string_view(json_buffer_.data() + pos + match.position(1), match.length(1));
            }
            if (pos == 0) break;
            pos = json_buffer_.rfind(pattern_str, pos - 1);
        }
        return "";
    };

    std::string_view sid = get_latest_value("surfaceId", sid_pattern);
    if (!sid.empty()) surface_id_ = sid;

    std::string_view rid = get_latest_value("root", root_pattern);
    if (!rid.empty()) root_ids_[surface_id_] = rid;

    auto check_msg_type = [this](std::string_view type) {
        std::string search_str = "\"" + std::string(type) + "\":";
        if (json_buffer_.find(search_str) != std::string::npos) {
            if (std::find(msg_types_.begin(), msg_types_.end(), type) == msg_types_.end()) {
                msg_types_.push_back(std::string(type));
            }
            active_msg_type_ = type;
        }
    };

    check_msg_type(MSG_TYPE_CREATE_SURFACE);
    check_msg_type(MSG_TYPE_UPDATE_COMPONENTS);
    check_msg_type(MSG_TYPE_UPDATE_DATA_MODEL);
}

bool A2uiStreamParserV09::handle_complete_object(const nlohmann::json& obj, const std::string& surface_id, std::vector<ResponsePart>& messages) {
    if (!obj.is_object()) return false;

    if (validator_) {
        validator_->validate(obj, surface_id, false);
    }

    std::string sid = surface_id;
    if (obj.contains(MSG_TYPE_CREATE_SURFACE) && obj[MSG_TYPE_CREATE_SURFACE].is_object()) {
        auto cs = obj[MSG_TYPE_CREATE_SURFACE];
        if (cs.contains("surfaceId")) sid = cs["surfaceId"].get<std::string>();
    }
    if (obj.contains(MSG_TYPE_UPDATE_COMPONENTS) && obj[MSG_TYPE_UPDATE_COMPONENTS].is_object()) {
        auto uc = obj[MSG_TYPE_UPDATE_COMPONENTS];
        if (uc.contains("surfaceId")) sid = uc["surfaceId"].get<std::string>();
    }

    surface_id_ = sid;

    if (obj.contains(MSG_TYPE_CREATE_SURFACE)) {
        auto cs = obj[MSG_TYPE_CREATE_SURFACE];
        root_ids_[sid] = cs.value("root", "root");
        buffered_start_message_ = obj;

        if (yielded_start_messages_.find(sid) == yielded_start_messages_.end()) {
            yield_messages({obj}, messages);
            yielded_start_messages_.insert(sid);
            buffered_start_message_ = std::nullopt;
        }

        if (pending_messages_.find(sid) != pending_messages_.end()) {
            pending_messages_.erase(sid);
        }

        yield_reachable(messages, MSG_TYPE_UPDATE_COMPONENTS);
        return true;
    }

    if (obj.contains(MSG_TYPE_UPDATE_COMPONENTS)) {
        auto uc = obj[MSG_TYPE_UPDATE_COMPONENTS];
        root_ids_[sid] = uc.value("root", "root");
        if (uc.contains("components") && uc["components"].is_array()) {
            for (const auto& comp : uc["components"]) {
                if (comp.is_object() && comp.contains("id")) {
                    seen_components_[comp["id"].get<std::string>()] = comp;
                }
            }
        }
        yield_reachable(messages, MSG_TYPE_UPDATE_COMPONENTS, true, false);
        return true;
    }

    if (obj.contains(MSG_TYPE_DELETE_SURFACE)) {
        if (yielded_start_messages_.find(sid) == yielded_start_messages_.end()) {
            pending_messages_[sid].push_back(obj);
            return true;
        }
        yield_messages({obj}, messages);
        return true;
    }

    if (obj.contains(MSG_TYPE_UPDATE_DATA_MODEL)) {
        yield_messages({obj}, messages);
        return true;
    }

    return false;
}

nlohmann::json A2uiStreamParserV09::create_placeholder_component(const std::string& id) const {
    return {
        {"id", id},
        {"component", "Row"},
        {"children", nlohmann::json::array()}
    };
}

bool A2uiStreamParserV09::is_protocol_msg(const nlohmann::json& obj) const {
    return obj.contains(MSG_TYPE_CREATE_SURFACE) || obj.contains(MSG_TYPE_UPDATE_COMPONENTS) || obj.contains(MSG_TYPE_UPDATE_DATA_MODEL);
}

std::string_view A2uiStreamParserV09::get_active_msg_type_for_components() const {
    if (!active_msg_type_.empty()) return active_msg_type_;
    for (const auto& mt : msg_types_) {
        if (mt == MSG_TYPE_UPDATE_COMPONENTS || mt == MSG_TYPE_CREATE_SURFACE) {
            active_msg_type_ = mt;
            return mt;
        }
    }
    return msg_types_.empty() ? "" : msg_types_[0];
}

std::string_view A2uiStreamParserV09::get_data_model_msg_type() const {
    return MSG_TYPE_UPDATE_DATA_MODEL;
}

bool A2uiStreamParserV09::deduplicate_data_model(const nlohmann::json& m, bool strict_integrity) {
    if (m.contains(MSG_TYPE_UPDATE_DATA_MODEL)) {
        auto udm = m[MSG_TYPE_UPDATE_DATA_MODEL];
        if (udm.is_object()) {
            bool is_new = false;
            for (auto it = udm.begin(); it != udm.end(); ++it) {
                if (it.key() != "surfaceId" && it.key() != "root" && (yielded_data_model_.find(it.key()) == yielded_data_model_.end() || yielded_data_model_[it.key()] != it.value())) {
                    is_new = true;
                    break;
                }
            }
            if (!is_new && strict_integrity) {
                return false;
            }
            for (auto it = udm.begin(); it != udm.end(); ++it) {
                if (it.key() != "surfaceId" && it.key() != "root") {
                    yielded_data_model_[it.key()] = it.value();
                }
            }
        }
    }
    return true;
}

} // namespace a2ui
