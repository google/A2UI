package a2ui

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
	"strings"
	"testing"

	"github.com/a2aproject/a2a-go/a2a"
	"github.com/a2aproject/a2a-go/a2asrv"
)

func TestA2UIPartSerialization(t *testing.T) {
	a2uiData := map[string]interface{}{
		"beginRendering": map[string]interface{}{
			"surfaceId": "test-surface",
			"root":      "root-column",
		},
	}

	part := CreateA2UIPart(a2uiData)

	if !IsA2UIPart(part) {
		t.Error("Should be identified as A2UI part")
	}

	dataPart, err := GetA2UIDataPart(part)
	if err != nil {
		t.Errorf("Should contain DataPart: %v", err)
	}

	// Compare data
	if dataPart.Data["beginRendering"].(map[string]interface{})["surfaceId"] != "test-surface" {
		t.Error("Deserialized data mismatch")
	}
}

func TestNonA2UIDataPart(t *testing.T) {
	part := &a2a.DataPart{
		Data: map[string]interface{}{"foo": "bar"},
		Metadata: map[string]interface{}{
			"mimeType": "application/json",
		},
	}

	if IsA2UIPart(part) {
		t.Error("Should not be identified as A2UI part")
	}

	if _, err := GetA2UIDataPart(part); err == nil {
		t.Error("Should not return A2UI DataPart")
	}
}

func TestGetA2UIAgentExtension(t *testing.T) {
	ext := GetA2UIAgentExtension(false, nil)
	if ext.URI != ExtensionURI {
		t.Errorf("Expected URI %s, got %s", ExtensionURI, ext.URI)
	}
	if ext.Params != nil {
		t.Error("Expected nil params")
	}

	supported := []string{"cat1", "cat2"}
	ext = GetA2UIAgentExtension(true, supported)
	if ext.Params[AgentExtensionAcceptsInlineCatalogsKey] != true {
		t.Error("Expected acceptsInlineCatalogs to be true")
	}
	if len(ext.Params[AgentExtensionSupportedCatalogIDsKey].([]string)) != 2 {
		t.Error("Expected 2 supported catalogs")
	}
}

func TestTryActivateA2UIExtension(t *testing.T) {
	// Setup context with extensions
	ctx := context.Background()
	reqMeta := a2asrv.NewRequestMeta(map[string][]string{
		a2asrv.ExtensionsMetaKey: {ExtensionURI},
	})
	ctx, _ = a2asrv.WithCallContext(ctx, reqMeta)

	activated := TryActivateA2UIExtension(ctx)
	if !activated {
		t.Error("Expected extension to be activated")
	}

	exts, _ := a2asrv.ExtensionsFrom(ctx)
	if !exts.Active(&a2a.AgentExtension{URI: ExtensionURI}) {
		t.Error("Expected A2UI extension to be active")
	}

	// Test not requested
	ctx2 := context.Background()
	ctx2, _ = a2asrv.WithCallContext(ctx2, a2asrv.NewRequestMeta(nil))
	if TryActivateA2UIExtension(ctx2) {
		t.Error("Expected extension not to be activated")
	}
}

func TestWrapAsJSONArray(t *testing.T) {
	schema := map[string]interface{}{"type": "object"}
	wrapped, err := WrapAsJSONArray(schema)
	if err != nil {
		t.Fatalf("WrapAsJSONArray failed: %v", err)
	}

	if wrapped["type"] != "array" {
		t.Error("Expected type array")
	}
	if wrapped["items"] == nil {
		t.Error("Expected items field")
	}

	// Test Empty Schema
	_, err = WrapAsJSONArray(map[string]interface{}{})
	if err == nil {
		t.Error("Expected error for empty schema")
	}
}

// Test SendA2UIToClientToolset
func TestToolsetGetTools(t *testing.T) {
	// Test Enabled
	toolset := NewSendA2UIToClientToolset(true, map[string]interface{}{})
	tools, _ := toolset.GetTools(context.Background())
	if len(tools) != 1 {
		t.Error("Expected 1 tool when enabled")
	}

	// Test Disabled
	toolset = NewSendA2UIToClientToolset(false, map[string]interface{}{})
	tools, _ = toolset.GetTools(context.Background())
	if len(tools) != 0 {
		t.Error("Expected 0 tools when disabled")
	}

	// Test Provider
	provider := func(ctx context.Context) (bool, error) { return true, nil }
	toolset = NewSendA2UIToClientToolset(A2UIEnabledProvider(provider), map[string]interface{}{})
	tools, _ = toolset.GetTools(context.Background())
	if len(tools) != 1 {
		t.Error("Expected 1 tool with provider returning true")
	}
}

func TestSendA2UIJsonToClientTool_GetDeclaration(t *testing.T) {
	schema := map[string]interface{}{"type": "object"}
	tool := NewSendA2UIJsonToClientTool(schema)
	decl := tool.GetDeclaration()

	if decl.Name != "send_a2ui_json_to_client" {
		t.Errorf("Expected tool name send_a2ui_json_to_client, got %s", decl.Name)
	}
	props := decl.Parameters["properties"].(map[string]interface{})
	if _, ok := props["a2ui_json"]; !ok {
		t.Error("Expected a2ui_json property")
	}
}

func TestSendA2UIJsonToClientTool_ProcessLLMRequest(t *testing.T) {
	schema := map[string]interface{}{"type": "object"}
	tool := NewSendA2UIJsonToClientTool(schema)
	llmReq := &LlmRequest{}

	err := tool.ProcessLLMRequest(context.Background(), nil, llmReq)
	if err != nil {
		t.Fatalf("ProcessLLMRequest failed: %v", err)
	}

	if len(llmReq.Instructions) == 0 {
		t.Error("Expected instructions to be appended")
	}
	if !strings.Contains(llmReq.Instructions[0], "---BEGIN A2UI JSON SCHEMA---") {
		t.Error("Expected A2UI schema instruction")
	}
}

func TestSendA2UIJsonToClientTool_Run(t *testing.T) {
	// Define a simple schema that requires a "text" field
	schema := map[string]interface{}{
		"type": "object",
		"properties": map[string]interface{}{
			"text": map[string]interface{}{"type": "string"},
		},
		"required": []string{"text"},
	}
	tool := NewSendA2UIJsonToClientTool(schema)

	// Valid JSON list
	validJSON := `[{"text": "Hello"}]`
	args := map[string]interface{}{"a2ui_json": validJSON}
	ctx := &ToolContext{Actions: ToolActions{}}

	result, _ := tool.Run(context.Background(), args, ctx)
	if result["validated_a2ui_json"] == nil {
		t.Error("Expected validated_a2ui_json in result")
	}
	if !ctx.Actions.SkipSummarization {
		t.Error("Expected SkipSummarization to be true")
	}

	// Valid Single Object (should wrap)
	validJSONSingle := `{"text": "Hello"}`
	args = map[string]interface{}{"a2ui_json": validJSONSingle}
	result, _ = tool.Run(context.Background(), args, ctx)
	list, ok := result["validated_a2ui_json"].([]interface{})
	if !ok || len(list) != 1 {
		t.Error("Expected wrapped list")
	}

	// Invalid JSON (missing required field "text")
	invalidJSON := `[{"other": "value"}]`
	args = map[string]interface{}{"a2ui_json": invalidJSON}
	result, _ = tool.Run(context.Background(), args, ctx)
	if result["error"] == nil {
		t.Error("Expected error for invalid JSON")
	} else if !strings.Contains(result["error"].(string), "missing properties: 'text'") {
		t.Errorf("Unexpected error message: %v", result["error"])
	}

	// Malformed JSON
	malformedJSON := `{"text": "Hello"` // Missing closing brace
	args = map[string]interface{}{"a2ui_json": malformedJSON}
	result, _ = tool.Run(context.Background(), args, ctx)
	if result["error"] == nil {
		t.Error("Expected error for malformed JSON")
	}

	// Missing Argument
	args = map[string]interface{}{}
	result, _ = tool.Run(context.Background(), args, ctx)
	if result["error"] == nil {
		t.Error("Expected error for missing argument")
	}

	// Empty string argument
	args = map[string]interface{}{"a2ui_json": ""}
	result, _ = tool.Run(context.Background(), args, ctx)
	if result["error"] == nil {
		t.Error("Expected error for empty string argument")
	}

	// Non-string argument (Map) - should be marshaled
	args = map[string]interface{}{"a2ui_json": map[string]interface{}{"text": "Hello"}}
	result, _ = tool.Run(context.Background(), args, ctx)
	if result["validated_a2ui_json"] == nil {
		t.Error("Expected validated_a2ui_json in result for map argument")
	}
	list, ok = result["validated_a2ui_json"].([]interface{})
	if !ok || len(list) != 1 {
		t.Error("Expected wrapped list for map argument")
	}
}

func TestConverter(t *testing.T) {
	// Valid Response
	validA2UI := []interface{}{
		map[string]interface{}{"type": "Text", "text": "Hello"},
	}
	resp := &FunctionResponse{
		Name: "send_a2ui_json_to_client",
		Response: map[string]interface{}{
			"validated_a2ui_json": validA2UI,
		},
	}
	part := &GenAIPart{FunctionResponse: resp}

	a2aParts := ConvertSendA2UIToClientGenAIPartToA2APart(part)
	if len(a2aParts) != 1 {
		t.Error("Expected 1 part")
	}
	if !IsA2UIPart(a2aParts[0]) {
		t.Error("Expected A2UI part")
	}

	// Error Response
	resp = &FunctionResponse{
		Name: "send_a2ui_json_to_client",
		Response: map[string]interface{}{
			"error": "Some error",
		},
	}
	part = &GenAIPart{FunctionResponse: resp}
	a2aParts = ConvertSendA2UIToClientGenAIPartToA2APart(part)
	if len(a2aParts) != 0 {
		t.Error("Expected 0 parts on error")
	}

	// FunctionCall (should be ignored)
	call := &FunctionCall{
		Name: "send_a2ui_json_to_client",
		Args: map[string]interface{}{"a2ui_json": "[]"},
	}
	part = &GenAIPart{FunctionCall: call}
	a2aParts = ConvertSendA2UIToClientGenAIPartToA2APart(part)
	if len(a2aParts) != 0 {
		t.Error("Expected 0 parts for function call")
	}

	// Other part type (should convert to TextPart)
	part = &GenAIPart{Text: "Some text"}
	a2aParts = ConvertSendA2UIToClientGenAIPartToA2APart(part)
	if len(a2aParts) != 1 {
		t.Error("Expected 1 part for text part")
	}
	if _, ok := a2aParts[0].(*a2a.TextPart); !ok {
		t.Error("Expected TextPart")
	}
}
