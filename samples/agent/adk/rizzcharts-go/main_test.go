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
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/a2aproject/a2a-go/a2a"
	"github.com/a2aproject/a2a-go/a2asrv"
	"github.com/google/A2UI/a2a_agents/go/a2ui"
)

func init() {
	// Set dummy API key for tests to pass validation
	os.Setenv("GEMINI_API_KEY", "test-key")
}

// Helper to setup catalog builder for tests
func setupCatalogBuilder(t *testing.T) *ComponentCatalogBuilder {
	schemaContent, err := os.ReadFile("../../../../specification/v0_8/json/server_to_client.json")
	if err != nil {
		t.Fatalf("Failed to read schema: %v", err)
	}
	standardCatalogContent, err := os.ReadFile("../../../../specification/v0_8/json/standard_catalog_definition.json")
	if err != nil {
		t.Fatalf("Failed to read standard catalog: %v", err)
	}
	rizzchartsCatalogContent, err := os.ReadFile("rizzcharts_catalog_definition.json")
	if err != nil {
		t.Fatalf("Failed to read rizzcharts catalog: %v", err)
	}

	return NewComponentCatalogBuilder(
		string(schemaContent),
		map[string]string{
			a2ui.StandardCatalogID: string(standardCatalogContent),
			RizzchartsCatalogURI:   string(rizzchartsCatalogContent),
		},
		a2ui.StandardCatalogID,
	)
}

func TestGetAgentCard(t *testing.T) {
	builder := setupCatalogBuilder(t)
	agent := NewRizzchartsAgent(func(ctx context.Context) (bool, error) { return true, nil }, func(ctx context.Context) (map[string]interface{}, error) { return nil, nil })
	executor := NewRizzchartsAgentExecutor("http://localhost:10002", builder, agent)
	card := executor.GetAgentCard()

	if card.Name != "Ecommerce Dashboard Agent" {
		t.Errorf("Expected agent name 'Ecommerce Dashboard Agent', got '%s'", card.Name)
	}
	if len(card.Skills) != 2 {
		t.Errorf("Expected 2 skills, got %d", len(card.Skills))
	}
	foundExt := false
	for _, ext := range card.Capabilities.Extensions {
		if ext.URI == a2ui.ExtensionURI {
			foundExt = true
			break
		}
	}
	if !foundExt {
		t.Error("Expected A2UI extension in capabilities")
	}
}

func TestTools(t *testing.T) {
	// Test GetStoreSalesTool
	storeTool := &GetStoreSalesTool{}
	if storeTool.Name() != "get_store_sales" {
		t.Errorf("Expected tool name 'get_store_sales', got '%s'", storeTool.Name())
	}
	res, err := storeTool.Run(context.Background(), map[string]interface{}{"region": "all"}, nil)
	if err != nil {
		t.Fatalf("GetStoreSalesTool failed: %v", err)
	}
	if res["locations"] == nil {
		t.Error("Expected locations in response")
	}

	// Test GetSalesDataTool
	salesTool := &GetSalesDataTool{}
	if salesTool.Name() != "get_sales_data" {
		t.Errorf("Expected tool name 'get_sales_data', got '%s'", salesTool.Name())
	}
	res, err = salesTool.Run(context.Background(), map[string]interface{}{"time_period": "Q1"}, nil)
	if err != nil {
		t.Fatalf("GetSalesDataTool failed: %v", err)
	}
	if res["sales_data"] == nil {
		t.Error("Expected sales_data in response")
	}
}

func TestAgentInstructions(t *testing.T) {
	builder := setupCatalogBuilder(t)

	// Mock providers
	enabledProvider := func(ctx context.Context) (bool, error) { return true, nil }
	schemaProvider := func(ctx context.Context) (map[string]interface{}, error) { return nil, nil }

	agent := NewRizzchartsAgent(enabledProvider, schemaProvider)

	// Manually populate state as PrepareSession would
	schema, uri, err := builder.LoadA2UISchema(map[string]interface{}{
		a2ui.SupportedCatalogIDsKey: []interface{}{RizzchartsCatalogURI},
	})
	if err != nil {
		t.Fatalf("Failed to load schema: %v", err)
	}

	state := map[string]interface{}{
		a2uiEnabledKey:         true,
		a2uiSchemaKey:          schema,
		A2UICatalogURIStateKey: uri,
	}

	instr, err := agent.GetInstructions(context.Background(), state)
	if err != nil {
		t.Fatalf("GetInstructions failed: %v", err)
	}

	if !strings.Contains(instr, "---BEGIN CHART EXAMPLE---") {
		t.Error("Instructions missing chart example")
	}
	if !strings.Contains(instr, "send_a2ui_json_to_client") {
		t.Error("Instructions missing tool call instructions")
	}
}

func TestAgentCardEndpoint(t *testing.T) {
	// Setup request
	req := httptest.NewRequest("GET", "/.well-known/agent-card.json", nil)
	w := httptest.NewRecorder()

	// Recreate the handler logic from main (simplified)
	builder := setupCatalogBuilder(t)
	agent := NewRizzchartsAgent(func(ctx context.Context) (bool, error) { return true, nil }, func(ctx context.Context) (map[string]interface{}, error) { return nil, nil })
	executor := NewRizzchartsAgentExecutor("http://localhost:test", builder, agent)

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		card := executor.GetAgentCard()
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(card); err != nil {
			http.Error(w, "Failed to encode agent card", http.StatusInternalServerError)
		}
	})

	handler.ServeHTTP(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}
	if resp.Header.Get("Content-Type") != "application/json" {
		t.Errorf("Expected content type application/json, got %s", resp.Header.Get("Content-Type"))
	}

	var card a2a.AgentCard
	if err := json.NewDecoder(resp.Body).Decode(&card); err != nil {
		t.Fatalf("Failed to decode agent card: %v", err)
	}
	if card.Name != "Ecommerce Dashboard Agent" {
		t.Errorf("Expected agent name 'Ecommerce Dashboard Agent', got '%s'", card.Name)
	}
}

func TestPrepareSession(t *testing.T) {
	builder := setupCatalogBuilder(t)
	agent := NewRizzchartsAgent(func(ctx context.Context) (bool, error) { return true, nil }, func(ctx context.Context) (map[string]interface{}, error) { return nil, nil })
	executor := NewRizzchartsAgentExecutor("http://localhost:test", builder, agent)
	state := make(map[string]interface{})

	// Context with A2UI requested
	reqMeta := a2asrv.NewRequestMeta(map[string][]string{
		a2asrv.ExtensionsMetaKey: {a2ui.ExtensionURI},
	})
	ctx, _ := a2asrv.WithCallContext(context.Background(), reqMeta)

	reqCtx := &a2asrv.RequestContext{
		Message: &a2a.Message{
			Metadata: map[string]interface{}{
				a2ui.ClientCapabilitiesKey: map[string]interface{}{
					a2ui.SupportedCatalogIDsKey: []interface{}{RizzchartsCatalogURI},
				},
			},
		},
	}

	err := executor.PrepareSession(ctx, state, reqCtx)
	if err != nil {
		t.Fatalf("PrepareSession failed: %v", err)
	}

	if state[a2uiEnabledKey] != true {
		t.Error("Expected A2UI enabled in state")
	}
	if state[A2UICatalogURIStateKey] != RizzchartsCatalogURI {
		t.Errorf("Expected catalog URI %s, got %v", RizzchartsCatalogURI, state[A2UICatalogURIStateKey])
	}
	if state[a2uiSchemaKey] == nil {
		t.Error("Expected schema in state")
	}
}
