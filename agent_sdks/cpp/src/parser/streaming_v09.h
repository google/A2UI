#pragma once

#include "streaming_impl.h"
#include "a2ui/parser/constants.h"
#include <regex>
#include <stdexcept>
#include <fstream>
#include <iostream>

namespace a2ui {

class A2uiStreamParserV09 : public A2uiStreamParserImpl {
public:
    explicit A2uiStreamParserV09(A2uiCatalog catalog) : A2uiStreamParserImpl(std::move(catalog)) {
        default_root_id_ = "root";
    }

protected:
    void sniff_metadata() override {
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

        check_msg_type(MSG_TYPE_CREATE_SURFACE);
        check_msg_type(MSG_TYPE_UPDATE_COMPONENTS);
        check_msg_type(MSG_TYPE_UPDATE_DATA_MODEL);
    }

    bool handle_complete_object(const nlohmann::json& obj, const std::string& surface_id, std::vector<ResponsePart>& messages) override {
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

    nlohmann::json create_placeholder_component(const std::string& id) const override {
        return {
            {"id", id},
            {"component", "Row"},
            {"children", nlohmann::json::array()}
        };
    }

    bool is_protocol_msg(const nlohmann::json& obj) const override {
        return obj.contains(MSG_TYPE_CREATE_SURFACE) || obj.contains(MSG_TYPE_UPDATE_COMPONENTS) || obj.contains(MSG_TYPE_UPDATE_DATA_MODEL);
    }

    std::string get_active_msg_type_for_components() const override {
        if (!active_msg_type_.empty()) return active_msg_type_;
        for (const auto& mt : msg_types_) {
            if (mt == MSG_TYPE_UPDATE_COMPONENTS || mt == MSG_TYPE_CREATE_SURFACE) {
                active_msg_type_ = mt;
                return mt;
            }
        }
        return msg_types_.empty() ? "" : msg_types_[0];
    }

    std::string get_data_model_msg_type() const override {
        return MSG_TYPE_UPDATE_DATA_MODEL;
    }

    bool deduplicate_data_model(const nlohmann::json& m, bool strict_integrity) override {
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
};

} // namespace a2ui
