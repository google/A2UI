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

#include "a2ui/schema/utils.h"
#include <stdexcept>

namespace a2ui {

nlohmann::json wrap_as_json_array(const nlohmann::json& schema) {
    if (schema.empty()) {
        throw std::runtime_error("A2UI schema is empty");
    }
    return {{"type", "array"}, {"items", schema}};
}

nlohmann::json deep_update(const nlohmann::json& d, const nlohmann::json& u) {
    nlohmann::json result = d;
    for (auto it = u.begin(); it != u.end(); ++it) {
        if (it.value().is_object() && result.contains(it.key()) && result[it.key()].is_object()) {
            result[it.key()] = deep_update(result[it.key()], it.value());
        } else {
            result[it.key()] = it.value();
        }
    }
    return result;
}

} // namespace a2ui
