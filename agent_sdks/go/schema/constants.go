// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package schema

import "fmt"

// Asset package and resource keys.
const (
	ServerToClientSchemaKey = "server_to_client"
	CommonTypesSchemaKey    = "common_types"
	CatalogSchemaKey        = "catalog"
	CatalogComponentsKey    = "components"
	CatalogIDKey            = "catalogId"
	CatalogStylesKey        = "styles"
	SurfaceIDKey            = "surfaceId"
)

// Protocol constants.
const (
	SupportedCatalogIDsKey    = "supportedCatalogIds"
	InlineCatalogsKey         = "inlineCatalogs"
	A2UIClientCapabilitiesKey = "a2uiClientCapabilities"
)

// Schema URL and catalog naming.
const (
	BaseSchemaURL     = "https://a2ui.org/"
	InlineCatalogName = "inline"
)

// Supported versions.
const (
	Version09 = "0.9"
)

// SpecVersionMap maps version strings to their schema resource paths.
var SpecVersionMap = map[string]map[string]string{
	Version09: {
		ServerToClientSchemaKey: "specification/v0_9/json/server_to_client.json",
		CommonTypesSchemaKey:    "specification/v0_9/json/common_types.json",
	},
}

const SpecificationDir = "specification"

// Tags and delimiters.
const (
	A2UIOpenTag  = "<a2ui-json>"
	A2UICloseTag = "</a2ui-json>"

	A2UISchemaBlockStart = "---BEGIN A2UI JSON SCHEMA---"
	A2UISchemaBlockEnd   = "---END A2UI JSON SCHEMA---"
)

// DefaultWorkflowRules is the default set of workflow rules for LLM output.
var DefaultWorkflowRules = fmt.Sprintf(`The generated response MUST follow these rules:
- The response can contain one or more A2UI JSON blocks.
- Each A2UI JSON block MUST be wrapped in %s and %s tags.
- Between or around these blocks, you can provide conversational text.
- The JSON part MUST be a single, raw JSON object (usually a list of A2UI messages) and MUST validate against the provided A2UI JSON SCHEMA.
- Top-Down Component Ordering: Within the `+"`components`"+` list of a message:
    - The 'root' component MUST be the FIRST element.
    - Parent components MUST appear before their child components.
    This specific ordering allows the streaming parser to yield and render the UI incrementally as it arrives.`, A2UIOpenTag, A2UICloseTag)
