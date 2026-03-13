/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <nlohmann/json.hpp>

namespace a2ui {

/**
 * Validates the A2UI JSON payload against the provided schema and checks for integrity.
 *
 * The payload can be a single message object or an array of message objects.
 *
 * Note: Does not support streaming or partial messages. 
 * TODO: Support streaming.
 *
 * Checks performed:
 * 1.  **JSON Schema Validation**: Ensures payload adheres to the A2UI schema.
 * 2.  **Component Integrity**:
 *     -   All component IDs are unique.
 *     -   A 'root' component exists.
 *     -   All unique component references point to valid IDs.
 * 3.  **Topology**:
 *     -   No circular references (including self-references).
 *     -   No orphaned components (all components must be reachable from 'root').
 * 4.  **Recursion Limits**:
 *     -   Global recursion depth limit (50).
 *     -   FunctionCall recursion depth limit (5).
 * 5.  **Path Syntax**:
 *     -   Validates JSON Pointer syntax for data paths.
 *
 * @param a2ui_json The JSON payload to validate.
 * @param a2ui_schema The schema to validate against.
 *
 * @throws std::invalid_argument If integrity, topology, or recursion checks fail, or if payload does not match schema.
 */
void validate_a2ui_json(const nlohmann::json& a2ui_json, const nlohmann::json& a2ui_schema);

} // namespace a2ui
