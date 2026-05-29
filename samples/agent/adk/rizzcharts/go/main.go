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

// Package main implements a Go-based rizzcharts agent server that serves
// A2UI-powered ecommerce dashboard visualizations via the A2A protocol.
package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	a2ui "github.com/google/a2ui/agent_sdks/go"
	"github.com/google/a2ui/agent_sdks/go/basiccatalog"
	"github.com/google/a2ui/agent_sdks/go/schema"
)

const (
	host = "localhost"
	port = 10002
)

const roleDescription = `You are an expert A2UI Ecommerce Dashboard analyst. Your primary function is to translate user requests for ecommerce data into A2UI JSON payloads to display charts and visualizations. You MUST output the A2UI JSON payload wrapped in <a2ui-json> and </a2ui-json> tags.
`

const workflowDescription = `Your task is to analyze the user's request, fetch the necessary data, select the correct generic template, and output the corresponding A2UI JSON payload.

1.  **Analyze the Request:** Determine the user's intent (Visual Chart vs. Geospatial Map).
    * "show my sales breakdown by product category for q3" -> **Intent:** Chart.
    * "show revenue trends yoy by month" -> **Intent:** Chart.
    * "were there any outlier stores in the northeast region" -> **Intent:** Map.

2.  **Fetch Data:** Select and use the appropriate tool to retrieve the necessary data.
    * Use **get_sales_data** for general sales, revenue, and product category trends (typically for Charts).
    * Use **get_store_sales** for regional performance, store locations, and geospatial outliers (typically for Maps).

3.  **Select Example:** Based on the intent, choose the correct example block to use as your template.
    * **Intent** (Chart/Data Viz) -> Use the chart example.
    * **Intent** (Map/Geospatial) -> Use the map example.

4.  **Construct the JSON Payload:**
    * Use the **entire** JSON array from the chosen example as the base.
    * **Generate a new surfaceId:** You MUST generate a new, unique surfaceId for this request. This new ID must be used for the surfaceId in all three messages within the JSON array (createSurface, updateComponents, updateDataModel).
    * **Update the title Text:** You MUST update the text property of the Text component (the component with id: "page_header") to accurately reflect the specific user query.
    * Ensure the generated JSON perfectly matches the A2UI specification.

5.  **Output the JSON:** Wrap the constructed A2UI JSON array in <a2ui-json> and </a2ui-json> tags.
`

const uiDescription = `**Core Objective:** To provide a dynamic and interactive dashboard by constructing UI surfaces with the appropriate visualization components based on user queries.

**Key Components & Examples:**

You will be provided a schema that defines the A2UI message structure and two key generic component templates for displaying data.

1.  **Charts:** Used for requests about sales breakdowns, revenue performance, comparisons, or trends.
    * **Template:** Use the chart example.
2.  **Maps:** Used for requests about regional data, store locations, geography-based performance, or regional outliers.
    * **Template:** Use the map example.

You will also use layout components like Column (as the root) and Text (to provide a title).
`

// getSourceDir returns the directory of the current source file.
func getSourceDir() string {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		return "."
	}
	return filepath.Dir(filename)
}

func buildSystemPrompt() (string, error) {
	sourceDir := getSourceDir()
	version := schema.Version09

	catalogPath := filepath.Join(sourceDir, "..", "catalog_schemas", "0.9", "rizzcharts_catalog_definition.json")
	examplesPath := filepath.Join(sourceDir, "..", "examples", "rizzcharts_catalog", "0.9")
	stdExamplesPath := filepath.Join(sourceDir, "..", "examples", "standard_catalog", "0.9")

	rizzchartsCatalog, err := schema.NewCatalogConfigFromPath("rizzcharts", catalogPath, examplesPath)
	if err != nil {
		return "", fmt.Errorf("failed to create rizzcharts catalog config: %w", err)
	}

	basicCatalogCfg := basiccatalog.GetConfig(version, stdExamplesPath)

	mgr, err := schema.NewA2uiSchemaManager(schema.A2uiSchemaManagerConfig{
		Version:               version,
		Catalogs:              []*schema.CatalogConfig{rizzchartsCatalog, &basicCatalogCfg},
		AcceptsInlineCatalogs: true,
	})
	if err != nil {
		return "", fmt.Errorf("failed to create schema manager: %w", err)
	}

	prompt := mgr.GenerateSystemPrompt(a2ui.SystemPromptOptions{
		RoleDescription:     roleDescription,
		WorkflowDescription: workflowDescription,
		UIDescription:       uiDescription,
		IncludeSchema:       true,
		IncludeExamples:     true,
		ValidateExamples:    false,
	})

	return prompt, nil
}

// agentCardJSON returns the agent card as a JSON-serializable map.
func agentCardJSON() map[string]any {
	return map[string]any{
		"name":        "Ecommerce Dashboard Agent (Go)",
		"description": "This agent visualizes ecommerce data, showing sales breakdowns, YOY revenue performance, and regional sales outliers. Powered by Go.",
		"url":         fmt.Sprintf("http://%s:%d", host, port),
		"version":     "1.0.0",
		"capabilities": map[string]any{
			"streaming": false,
			"extensions": []any{
				map[string]any{
					"uri": "https://a2ui.org/a2a-extension/a2ui/v0.9",
					"requiredFields": map[string]any{
						"supported_catalog_ids": []string{
							"https://a2ui.org/specification/v0_9/json/basic_catalog.json",
						},
						"accepts_inline_catalogs": true,
					},
				},
			},
		},
		"defaultInputModes":  []string{"text", "text/plain"},
		"defaultOutputModes": []string{"text", "text/plain"},
		"skills": []any{
			map[string]any{
				"id":          "view_sales_by_category",
				"name":        "View Sales by Category",
				"description": "Displays a pie chart of sales broken down by product category for a given time period.",
				"tags":        []string{"sales", "breakdown", "category", "pie chart", "revenue"},
				"examples":    []string{"show my sales breakdown by product category for q3"},
			},
			map[string]any{
				"id":          "view_regional_outliers",
				"name":        "View Regional Sales Outliers",
				"description": "Displays a map showing regional sales outliers or store-level performance.",
				"tags":        []string{"sales", "regional", "outliers", "stores", "map"},
				"examples":    []string{"were there any outlier stores in the northeast region"},
			},
		},
	}
}

// loadEnvFile loads environment variables from a .env file (simple key=value format).
// NOTE: This is a minimal loader for demo purposes. It does not handle quoted values,
// multi-line values, export prefixes, or variable interpolation.
func loadEnvFile(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		// Only set if not already defined in environment
		if os.Getenv(key) == "" {
			os.Setenv(key, val)
		}
	}
}

func main() {
	// Load .env from current dir and source dir
	loadEnvFile(".env")
	loadEnvFile(filepath.Join(getSourceDir(), ".env"))

	// Support OpenAI-compatible API (same as Python restaurant_finder)
	apiKey := os.Getenv("OPENAI_API_KEY")
	apiBase := os.Getenv("OPENAI_API_BASE")
	modelName := os.Getenv("LITELLM_MODEL")

	// Fallback to Gemini-style env vars
	if apiKey == "" {
		apiKey = os.Getenv("GEMINI_API_KEY")
	}
	if apiBase == "" {
		apiBase = "https://generativelanguage.googleapis.com/v1beta/openai"
	}
	if modelName == "" {
		modelName = os.Getenv("GEMINI_MODEL")
	}
	if modelName == "" {
		modelName = "gemini-2.5-flash"
	}

	// Strip "openai/" prefix from model name (LiteLLM convention)
	modelName = strings.TrimPrefix(modelName, "openai/")

	if apiKey == "" {
		log.Fatal("API key required. Set OPENAI_API_KEY or GEMINI_API_KEY in .env or environment.")
	}

	log.Printf("Using model: %s", modelName)
	log.Printf("Using API base: %s", apiBase)

	log.Println("Building A2UI system prompt...")
	systemPrompt, err := buildSystemPrompt()
	if err != nil {
		log.Fatalf("Failed to build system prompt: %v", err)
	}
	log.Printf("System prompt built (%d chars)", len(systemPrompt))

	agent := NewRizzchartsAgent(apiKey, apiBase, modelName, systemPrompt)
	defer agent.Close()

	mux := http.NewServeMux()

	// Agent Card endpoint (A2A protocol)
	mux.HandleFunc("/.well-known/agent-card.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		json.NewEncoder(w).Encode(agentCardJSON())
	})

	// A2A message endpoint
	// NOTE: This is a minimal A2A JSON-RPC implementation for demo purposes only.
	// It supports message/send but omits streaming, task lifecycle, and other
	// A2A v1.0 methods. For production use, consider the official Go SDK:
	// https://github.com/a2aproject/a2a-go
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var reqBody map[string]any
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
			writeJSONRPCError(w, nil, -32700, "Parse error")
			return
		}

		method, _ := reqBody["method"].(string)
		id := reqBody["id"]

		if method != "message/send" {
			writeJSONRPCError(w, id, -32601, fmt.Sprintf("Method not found: %s", method))
			return
		}

		// Extract user message from A2A params
		userText := extractUserText(reqBody)
		if userText == "" {
			writeJSONRPCError(w, id, -32602, "No text message found in request")
			return
		}

		log.Printf("Received user message: %s", userText)

		// Call the agent
		messages, err := agent.Chat(r.Context(), userText)
		if err != nil {
			log.Printf("Agent error: %v", err)
			writeJSONRPCError(w, id, -32000, fmt.Sprintf("Agent error: %v", err))
			return
		}

		// Build A2A response
		writeA2AResponse(w, id, messages)
	})

	addr := fmt.Sprintf("%s:%d", host, port)
	log.Printf("Starting Go Rizzcharts Agent on http://%s", addr)
	log.Printf("Agent Card: http://%s/.well-known/agent-card.json", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

// WARNING: Wildcard CORS is used here for demo convenience only.
// Do not use wildcard CORS in production — restrict origins to known domains.
func setCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "*")
}

// extractUserText extracts the user text message from the A2A JSON-RPC request.
func extractUserText(reqBody map[string]any) string {
	params, _ := reqBody["params"].(map[string]any)
	if params == nil {
		return ""
	}
	msg, _ := params["message"].(map[string]any)
	if msg == nil {
		return ""
	}
	parts, _ := msg["parts"].([]any)
	for _, part := range parts {
		p, _ := part.(map[string]any)
		if p == nil {
			continue
		}
		if kind, _ := p["kind"].(string); kind == "text" {
			if text, ok := p["text"].(string); ok {
				return text
			}
		}
		// Handle JSON/data parts (like UI events)
		if kind, _ := p["kind"].(string); kind == "data" {
			if data, ok := p["data"].(map[string]any); ok {
				b, _ := json.Marshal(data)
				return string(b)
			}
		}
	}
	return ""
}

// writeA2AResponse writes a JSON-RPC success response with A2UI data parts.
func writeA2AResponse(w http.ResponseWriter, id any, messages []map[string]any) {
	// Build parts - each A2UI message becomes a data part
	parts := make([]any, 0, len(messages))
	for _, msg := range messages {
		parts = append(parts, map[string]any{
			"kind": "data",
			"data": msg,
			"metadata": map[string]any{
				"mimeType": "application/json+a2ui",
			},
		})
	}

	result := map[string]any{
		"kind": "task",
		"id":   "task-1",
		"status": map[string]any{
			"state": "completed",
			"message": map[string]any{
				"messageId": "resp-1",
				"role":      "agent",
				"parts":     parts,
				"kind":      "message",
			},
		},
	}

	resp := map[string]any{
		"jsonrpc": "2.0",
		"id":      id,
		"result":  result,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// writeJSONRPCError writes a JSON-RPC error response.
func writeJSONRPCError(w http.ResponseWriter, id any, code int, message string) {
	resp := map[string]any{
		"jsonrpc": "2.0",
		"id":      id,
		"error": map[string]any{
			"code":    code,
			"message": message,
		},
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK) // JSON-RPC errors are 200 with error in body
	json.NewEncoder(w).Encode(resp)
}
