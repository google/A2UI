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

#include "a2ui/parser/parser.h"
#include "a2ui/parser/streaming.h"
#include "a2ui/schema/catalog.h"
#include "a2ui/schema/validator.h"
#include "a2ui/schema/constants.h"
#include <string>
#include <vector>
#include <optional>
#include <map>
#include <set>
#include <memory>
#include <fstream>
#include <iostream>
#include <regex>
#include <cctype>
#include <queue>
#include <algorithm>
#include <functional>
#include <nlohmann/json.hpp>

namespace a2ui {

// Helper functions
std::string fix_json(const std::string& json_str);
std::set<std::string> get_reachable_components(
    const std::string& root_id,
    const std::map<std::string, nlohmann::json>& seen_components
);

class A2uiStreamParserImpl : public A2uiStreamParser {
protected:
    A2uiCatalog catalog_;
    std::string version_;
    std::string buffer_;
    
    bool found_delimiter_ = false;
    std::string json_buffer_;
    std::vector<std::pair<char, size_t>> brace_stack_;
    int brace_count_ = 0;
    bool in_top_level_list_ = false;
    bool in_string_ = false;
    bool string_escaped_ = false;

    std::map<std::string, nlohmann::json> seen_components_;
    nlohmann::json yielded_data_model_ = nlohmann::json::object();
    std::set<std::string> deleted_surfaces_;
    std::map<std::string, std::set<std::string>> yielded_ids_;
    std::map<std::pair<std::string, std::string>, std::string> yielded_contents_;

    std::map<std::string, std::string> root_ids_;
    std::string default_root_id_ = "root";
    std::optional<std::string> unbound_root_id_;
    std::string surface_id_;
    std::vector<std::string> msg_types_;
    std::set<std::string> yielded_start_messages_;
    mutable std::string active_msg_type_;

    std::map<std::string, std::vector<nlohmann::json>> pending_messages_;
    std::optional<nlohmann::json> buffered_start_message_;
    bool topology_dirty_ = false;
    bool found_valid_json_in_block_ = false;

    std::map<std::string, std::set<std::string>> required_fields_map_;
    std::unique_ptr<A2uiValidator> validator_;

public:
    explicit A2uiStreamParserImpl(A2uiCatalog catalog);

    std::vector<ResponsePart> process_chunk(const std::string& chunk) override;

protected:
    void process_json_chunk(const std::string& chunk, std::vector<ResponsePart>& messages);
    void reset_json_state();
    
    virtual void sniff_metadata() = 0;
    virtual bool handle_complete_object(const nlohmann::json& obj, const std::string& surface_id, std::vector<ResponsePart>& messages) = 0;
    virtual nlohmann::json create_placeholder_component(const std::string& id) const = 0;
    virtual bool is_protocol_msg(const nlohmann::json& obj) const = 0;
    virtual std::string_view get_active_msg_type_for_components() const = 0;
    virtual bool deduplicate_data_model(const nlohmann::json& m, bool strict_integrity) { return true; }

    void sniff_partial_component(std::vector<ResponsePart>& messages);
    nlohmann::json parse_contents_to_dict(const nlohmann::json& raw_contents) const;
    nlohmann::json prune_incomplete_datamodel_entries(const nlohmann::json& entries) const;
    void sniff_partial_data_model(std::vector<ResponsePart>& messages);
    bool has_empty_dict(const nlohmann::json& obj) const;
    void handle_partial_component(const nlohmann::json& comp, std::vector<ResponsePart>& messages);
    void yield_reachable(std::vector<ResponsePart>& messages, std::string_view msg_type = "", bool check_root = false, bool raise_on_orphans = false);
    void process_component_topology(nlohmann::json& comp, std::vector<nlohmann::json>& extra_components, bool inline_resolved);
    void yield_messages(const std::vector<nlohmann::json>& messages_to_yield, std::vector<ResponsePart>& messages, bool strict_integrity = true);
};

} // namespace a2ui
