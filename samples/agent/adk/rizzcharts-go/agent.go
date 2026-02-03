package main

// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/A2UI/a2a_agents/go/a2ui"
	"github.com/santhosh-tekuri/jsonschema/v5"
)

const (
	RizzchartsCatalogURI   = "https://github.com/google/A2UI/blob/main/samples/agent/adk/rizzcharts/rizzcharts_catalog_definition.json"
	A2UICatalogURIStateKey = "user:a2ui_catalog_uri"
)

// RizzchartsAgent represents the ecommerce dashboard agent.
type RizzchartsAgent struct {
	Name                string
	Description         string
	Tools               []a2ui.BaseTool
	a2uiEnabledProvider a2ui.A2UIEnabledProvider
	a2uiSchemaProvider  a2ui.A2UISchemaProvider
}

// NewRizzchartsAgent creates a new RizzchartsAgent.
func NewRizzchartsAgent(enabledProvider a2ui.A2UIEnabledProvider, schemaProvider a2ui.A2UISchemaProvider) *RizzchartsAgent {
	toolset := a2ui.NewSendA2UIToClientToolset(enabledProvider, schemaProvider)
	// In a real app, we'd pass a context. Using background for init.
	tools, _ := toolset.GetTools(context.Background())

	allTools := []a2ui.BaseTool{
		&GetStoreSalesTool{},
		&GetSalesDataTool{},
	}
	allTools = append(allTools, tools...)

	return &RizzchartsAgent{
		Name:                "rizzcharts_agent",
		Description:         "An agent that lets sales managers request sales data.",
		Tools:               allTools,
		a2uiEnabledProvider: enabledProvider,
		a2uiSchemaProvider:  schemaProvider,
	}
}

// GetA2UISchema retrieves and wraps the A2UI schema.
func (a *RizzchartsAgent) GetA2UISchema(ctx context.Context) (map[string]interface{}, error) {
	schema, err := a.a2uiSchemaProvider(ctx)
	if err != nil {
		return nil, err
	}
	return a2ui.WrapAsJSONArray(schema)
}

// LoadExample loads and returns the example as interface{}
func (a *RizzchartsAgent) LoadExample(ctx context.Context, path string, a2uiSchema map[string]interface{}) (interface{}, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read example file %s: %w", path, err)
	}

	var exampleJSON interface{}
	if err := json.Unmarshal(data, &exampleJSON); err != nil {
		return nil, fmt.Errorf("failed to parse example JSON: %w", err)
	}

	schemaBytes, err := json.Marshal(a2uiSchema)
	if err != nil {
		return nil, err
	}

	c := jsonschema.NewCompiler()
	if err := c.AddResource("schema.json", strings.NewReader(string(schemaBytes))); err != nil {
		return nil, err
	}
	schema, err := c.Compile("schema.json")
	if err != nil {
		return nil, err
	}

	if err := schema.Validate(exampleJSON); err != nil {
		return nil, fmt.Errorf("example validation failed: %w", err)
	}

	return exampleJSON, nil
}

// GetInstructions generates the system instructions for the agent.
func (a *RizzchartsAgent) GetInstructions(ctx context.Context, state map[string]interface{}) (string, error) {
	// Check enabled state from state map if present, or fallback to provider
	// In Python: use_ui = self._a2ui_enabled_provider(readonly_context)
	// where the provider reads from ctx.state

	// Since we updated PrepareSession to populate state[a2uiEnabledKey], we can read it directly
	// or assume the provider passed to constructor does it (which is mocked in main.go).
	// To be consistent with the dynamic update, we should check the state.

	useUI := false
	if val, ok := state[a2uiEnabledKey].(bool); ok {
		useUI = val
	}

	if !useUI {
		return "", fmt.Errorf("A2UI must be enabled to run rizzcharts agent")
	}

	// Retrieve schema from state
	var a2uiSchema map[string]interface{}
	if val, ok := state[a2uiSchemaKey].(map[string]interface{}); ok {
		a2uiSchema, _ = a2ui.WrapAsJSONArray(val)
	} else {
		return "", fmt.Errorf("A2UI schema not found in state")
	}

	catalogURI, _ := state[A2UICatalogURIStateKey].(string)

	var mapExample, chartExample interface{}

	// Determine paths based on catalog URI
	// Note: Paths are relative to the working directory when running the executable
	var baseExampleDir string
	if catalogURI == RizzchartsCatalogURI {
		baseExampleDir = "examples/rizzcharts_catalog"
	} else if catalogURI == a2ui.StandardCatalogID {
		baseExampleDir = "examples/standard_catalog"
	} else {
		return "", fmt.Errorf("unsupported catalog uri: %s", catalogURI)
	}

	var err error
	mapExample, err = a.LoadExample(ctx, filepath.Join(baseExampleDir, "map.json"), a2uiSchema)
	if err != nil {
		return "", err
	}
	chartExample, err = a.LoadExample(ctx, filepath.Join(baseExampleDir, "chart.json"), a2uiSchema)
	if err != nil {
		return "", err
	}

	mapExampleBytes, _ := json.Marshal(mapExample)
	chartExampleBytes, _ := json.Marshal(chartExample)

	finalPrompt := `
### System Instructions

You are an expert A2UI Ecommerce Dashboard analyst. Your primary function is to translate user requests for ecommerce data into A2UI JSON payloads to display charts and visualizations. You MUST use the ` + "`send_a2ui_json_to_client`" + ` tool with the ` + "`a2ui_json`" + ` argument set to the A2UI JSON payload to send to the client. You should also include a brief text message with each response saying what you did and asking if you can help with anything else.

**Core Objective:** To provide a dynamic and interactive dashboard by constructing UI surfaces with the appropriate visualization components based on user queries.

**Key Components & Examples:**

You will be provided a schema that defines the A2UI message structure and two key generic component templates for displaying data.

1.  **Charts:** Used for requests about sales breakdowns, revenue performance, comparisons, or trends.
    * **Template:** Use the JSON from ` + "`---BEGIN CHART EXAMPLE---`" + `.
2.  **Maps:** Used for requests about regional data, store locations, geography-based performance, or regional outliers.
    * **Template:** Use the JSON from ` + "`---BEGIN MAP EXAMPLE---`" + `.

You will also use layout components like ` + "`Column`" + ` (as the ` + "`root`" + `) and ` + "`Text`" + ` (to provide a title).

---

### Workflow and Rules

Your task is to analyze the user's request, fetch the necessary data, select the correct generic template, and send the corresponding A2UI JSON payload.

1.  **Analyze the Request:** Determine the user's intent (Visual Chart vs. Geospatial Map).
    * "show my sales breakdown by product category for q3" -> **Intent:** Chart.
    * "show revenue trends yoy by month" -> **Intent:** Chart.
    * "were there any outlier stores in the northeast region" -> **Intent:** Map.

2.  **Fetch Data:** Select and use the appropriate tool to retrieve the necessary data.
    * Use **` + "`get_sales_data`" + `** for general sales, revenue, and product category trends (typically for Charts).
    * Use **` + "`get_store_sales`" + `** for regional performance, store locations, and geospatial outliers (typically for Maps).

3.  **Select Example:** Based on the intent, choose the correct example block to use as your template.
    * **Intent** (Chart/Data Viz) -> Use ` + "`---BEGIN CHART EXAMPLE---`" + `.
    * **Intent** (Map/Geospatial) -> Use ` + "`---BEGIN MAP EXAMPLE---`" + `.

4.  **Construct the JSON Payload:**
    * Use the **entire** JSON array from the chosen example as the base value for the ` + "`a2ui_json`" + ` argument.
    * **Generate a new ` + "`surfaceId`" + `:** You MUST generate a new, unique ` + "`surfaceId`" + ` for this request (e.g., ` + "`sales_breakdown_q3_surface`" + `, ` + "`regional_outliers_northeast_surface`" + `). This new ID must be used for the ` + "`surfaceId`" + ` in all three messages within the JSON array (` + "`beginRendering`" + `, ` + "`surfaceUpdate`" + `, ` + "`dataModelUpdate`" + `).
    * **Update the title Text:** You MUST update the ` + "`literalString`" + ` value for the ` + "`Text`" + ` component (the component with ` + "`id: \"page_header\"`" + `) to accurately reflect the specific user query. For example, if the user asks for "Q3" sales, update the generic template text to "Q3 2025 Sales by Product Category".
    * Ensure the generated JSON perfectly matches the A2UI specification. It will be validated against the json_schema and rejected if it does not conform.  
    * If you get an error in the tool response apologize to the user and let them know they should try again.

5.  **Call the Tool:** Call the ` + "`send_a2ui_json_to_client`" + ` tool with the fully constructed ` + "`a2ui_json`" + ` payload. The ` + "`a2ui_json`" + ` argument MUST be a string containing the JSON structure.
    *   **NEVER provide the map description in text.**
    *   **IMMEDIATELY call the ` + "`send_a2ui_json_to_client`" + ` tool after receiving data from a data tool.**

**Thought Process:**
Always think step-by-step before answering.
1. Identify the user's intent.
2. Identify the necessary data and tool to fetch it.
3. Call the data tool.
4. **IMMEDIATELY** select the A2UI template based on data and intent.
5. Construct the A2UI JSON.
6. Call ` + "`send_a2ui_json_to_client`" + `.

---BEGIN CHART EXAMPLE---
%s
---END CHART EXAMPLE---

---BEGIN MAP EXAMPLE---
%s
---END MAP EXAMPLE---
`

	finalPrompt = fmt.Sprintf(finalPrompt, string(chartExampleBytes), string(mapExampleBytes))

	log.Printf("Generated system instructions for A2UI ENABLED and catalog %s", catalogURI)
	return finalPrompt, nil
}
