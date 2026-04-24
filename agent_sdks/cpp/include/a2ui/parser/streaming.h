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

#include "a2ui/schema/catalog.h"
#include <string>
#include <string_view>
#include <vector>
#include <optional>
#include <nlohmann/json.hpp>
#include <memory>
#include "a2ui/parser/response_part.h"

namespace a2ui {

class A2uiStreamParser {
public:
    virtual ~A2uiStreamParser() = default;
    virtual std::vector<ResponsePart> process_chunk(const std::string& chunk) = 0;

    virtual std::string_view get_active_msg_type_for_components() const = 0;
    virtual std::string_view get_data_model_msg_type() const = 0;
    virtual bool deduplicate_data_model(const nlohmann::json& m, bool strict_integrity) = 0;

    // Factory function
    static std::unique_ptr<A2uiStreamParser> create(A2uiCatalog catalog);
};

} // namespace a2ui
