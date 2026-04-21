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

#include <string>
#include <map>

namespace a2ui {

const std::string SERVER_TO_CLIENT_SCHEMA_KEY = "server_to_client";
const std::string COMMON_TYPES_SCHEMA_KEY = "common_types";
const std::string CATALOG_SCHEMA_KEY = "catalog";
const std::string CATALOG_COMPONENTS_KEY = "components";
const std::string CATALOG_ID_KEY = "catalogId";
const std::string CATALOG_STYLES_KEY = "styles";
const std::string SURFACE_ID_KEY = "surfaceId";

const std::string SUPPORTED_CATALOG_IDS_KEY = "supportedCatalogIds";
const std::string INLINE_CATALOGS_KEY = "inlineCatalogs";
const std::string A2UI_CLIENT_CAPABILITIES_KEY = "a2uiClientCapabilities";
const std::string BASE_SCHEMA_URL = "https://a2ui.org/";
const std::string INLINE_CATALOG_NAME = "inline";

const std::string VERSION_0_8 = "0.8";
const std::string VERSION_0_9 = "0.9";

const std::string A2UI_OPEN_TAG = "<a2ui-json>";
const std::string A2UI_CLOSE_TAG = "</a2ui-json>";

const std::string A2UI_SCHEMA_BLOCK_START = "---BEGIN A2UI JSON SCHEMA---";
const std::string A2UI_SCHEMA_BLOCK_END = "---END A2UI JSON SCHEMA---";

const std::string DEFAULT_WORKFLOW_RULES = R"(
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
