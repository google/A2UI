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

class A2uiStreamParserV09 : public A2uiStreamParserImpl {
public:
    explicit A2uiStreamParserV09(A2uiCatalog catalog) : A2uiStreamParserImpl(std::move(catalog)) {
        default_root_id_ = "root";
    }

protected:
    void sniff_metadata() override;
    bool handle_complete_object(const nlohmann::json& obj, const std::string& surface_id, std::vector<ResponsePart>& messages) override;
    nlohmann::json create_placeholder_component(const std::string& id) const override;
    bool is_protocol_msg(const nlohmann::json& obj) const override;
    std::string_view get_active_msg_type_for_components() const override;
    std::string_view get_data_model_msg_type() const override;
    bool deduplicate_data_model(const nlohmann::json& m, bool strict_integrity) override;
};

} // namespace a2ui
