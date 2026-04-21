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

#include "a2ui/schema/common_modifiers.h"

namespace a2ui {

nlohmann::json remove_strict_validation(const nlohmann::json& schema) {
    if (schema.is_object()) {
        nlohmann::json new_schema = nlohmann::json::object();
        for (auto it = schema.begin(); it != schema.end(); ++it) {
            if (it.key() == "additionalProperties" && it.value().is_boolean() && !it.value().get<bool>()) {
                continue; // Skip additionalProperties: false
            }
            new_schema[it.key()] = remove_strict_validation(it.value());
        }
        return new_schema;
    } else if (schema.is_array()) {
        nlohmann::json new_schema = nlohmann::json::array();
        for (const auto& item : schema) {
            new_schema.push_back(remove_strict_validation(item));
        }
        return new_schema;
    }
    return schema;
}

} // namespace a2ui
