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

#include <string_view>
#include <map>

namespace a2ui {

inline constexpr std::string_view SERVER_TO_CLIENT_SCHEMA_KEY = "server_to_client";
inline constexpr std::string_view COMMON_TYPES_SCHEMA_KEY = "common_types";
inline constexpr std::string_view CATALOG_SCHEMA_KEY = "catalog";
inline constexpr std::string_view CATALOG_COMPONENTS_KEY = "components";
inline constexpr std::string_view CATALOG_ID_KEY = "catalogId";
inline constexpr std::string_view CATALOG_STYLES_KEY = "styles";
inline constexpr std::string_view SURFACE_ID_KEY = "surfaceId";

inline constexpr std::string_view SUPPORTED_CATALOG_IDS_KEY = "supportedCatalogIds";
inline constexpr std::string_view INLINE_CATALOGS_KEY = "inlineCatalogs";
inline constexpr std::string_view A2UI_CLIENT_CAPABILITIES_KEY = "a2uiClientCapabilities";
inline constexpr std::string_view BASE_SCHEMA_URL = "https://a2ui.org/";
inline constexpr std::string_view INLINE_CATALOG_NAME = "inline";

inline constexpr std::string_view VERSION_0_8 = "0.8";
inline constexpr std::string_view VERSION_0_9 = "0.9";

inline constexpr std::string_view A2UI_OPEN_TAG = "<a2ui-json>";
inline constexpr std::string_view A2UI_CLOSE_TAG = "</a2ui-json>";

inline constexpr std::string_view A2UI_SCHEMA_BLOCK_START = "---BEGIN A2UI JSON SCHEMA---";
inline constexpr std::string_view A2UI_SCHEMA_BLOCK_END = "---END A2UI JSON SCHEMA---";

inline constexpr std::string_view DEFAULT_WORKFLOW_RULES = R"(
The generated response MUST follow these rules:
- The response can contain one or more A2UI JSON blocks.
- Each A2UI JSON block MUST be wrapped in <a2ui-json> and </a2ui-json> tags.
- Between or around these blocks, you can provide conversational text.
- The JSON part MUST be a single, raw JSON object (usually a list of A2UI messages) and MUST validate against the provided A2UI JSON SCHEMA.
- Top-Down Component Ordering: Within the `components` list of a message:
    - The 'root' component MUST be the FIRST element.
    - Parent components MUST appear before their child components.
    This specific ordering allows the streaming parser to yield and render the UI incrementally as it arrives.
)";

} // namespace a2ui
