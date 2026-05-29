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

package parser

import (
	"encoding/json"
	"fmt"
	"strings"
	"testing"

	"github.com/google/a2ui/agent_sdks/go/schema"
)

// newTestCatalog creates a minimal catalog for testing purposes.
func newTestCatalog(t *testing.T) *schema.A2uiCatalog {
	t.Helper()
	return &schema.A2uiCatalog{
		Version: schema.Version09,
		Name:    "test",
		S2CSchema: map[string]any{
			"$schema": "https://json-schema.org/draft/2020-12/schema",
			"oneOf": []any{
				map[string]any{"$ref": "#/$defs/CreateSurfaceMessage"},
				map[string]any{"$ref": "#/$defs/UpdateComponentsMessage"},
			},
			"$defs": map[string]any{
				"CreateSurfaceMessage": map[string]any{
					"type":                 "object",
					"additionalProperties": true,
				},
				"UpdateComponentsMessage": map[string]any{
					"type":                 "object",
					"additionalProperties": true,
				},
			},
		},
		CommonTypesSchema: map[string]any{
			"$schema": "https://json-schema.org/draft/2020-12/schema",
			"$defs":   map[string]any{},
		},
		CatalogSchema: map[string]any{
			"catalogId": "test_catalog",
			"components": map[string]any{
				"Text": map[string]any{
					"type":       "object",
					"properties": map[string]any{"literalString": map[string]any{"type": "string"}},
				},
				"Row": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"children": map[string]any{"type": "array", "items": map[string]any{"type": "string"}},
					},
				},
				"Column": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"children": map[string]any{"type": "array", "items": map[string]any{"type": "string"}},
					},
				},
				"Button": map[string]any{
					"type":       "object",
					"properties": map[string]any{"label": map[string]any{"type": "string"}},
				},
			},
		},
	}
}

// feedChunked feeds content to the parser character by character.
func feedChunked(p *A2uiStreamParser, content string) ([]ResponsePart, error) {
	var allParts []ResponsePart
	for _, ch := range content {
		parts, err := p.ProcessChunk(string(ch))
		if err != nil {
			return allParts, err
		}
		allParts = append(allParts, parts...)
	}
	return allParts, nil
}

// feedAsOneChunk feeds all content as a single chunk.
func feedAsOneChunk(p *A2uiStreamParser, content string) ([]ResponsePart, error) {
	return p.ProcessChunk(content)
}

// collectA2UIMessages extracts all A2UI JSON messages from response parts.
func collectA2UIMessages(parts []ResponsePart) []map[string]any {
	var msgs []map[string]any
	for _, p := range parts {
		msgs = append(msgs, p.A2UIJSON...)
	}
	return msgs
}

// collectText extracts all text from response parts.
func collectText(parts []ResponsePart) string {
	var texts []string
	for _, p := range parts {
		if p.Text != "" {
			texts = append(texts, p.Text)
		}
	}
	return strings.Join(texts, "")
}

func TestStreamParser_ConversationalTextOnly(t *testing.T) {
	p := NewA2uiStreamParser(nil)
	parts, err := p.ProcessChunk("Hello, this is just text!")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	text := collectText(parts)
	if !strings.Contains(text, "Hello") {
		t.Errorf("expected text to contain 'Hello', got %q", text)
	}
	msgs := collectA2UIMessages(parts)
	if len(msgs) > 0 {
		t.Errorf("expected no A2UI messages for plain text, got %d", len(msgs))
	}
}

func TestStreamParser_SimpleCreateSurface(t *testing.T) {
	catalog := newTestCatalog(t)
	p := NewA2uiStreamParser(catalog)

	content := fmt.Sprintf(`Here is some UI:
%s
[{"createSurface": {"surfaceId": "s1", "root": "root", "components": [{"id": "root", "component": "Text", "literalString": "Hello"}]}}]
%s
Done!`, schema.A2UIOpenTag, schema.A2UICloseTag)

	parts, err := feedAsOneChunk(p, content)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	text := collectText(parts)
	if !strings.Contains(text, "Here is some UI:") {
		t.Errorf("expected leading text, got %q", text)
	}
}

func TestStreamParser_ChunkedInput(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	content := fmt.Sprintf(`Text before %s[{"createSurface": {"surfaceId": "s1", "root": "root", "components": [{"id": "root", "component": "Text", "literalString": "Hello"}]}}]%s Text after`, schema.A2UIOpenTag, schema.A2UICloseTag)

	parts, err := feedChunked(p, content)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	text := collectText(parts)
	if !strings.Contains(text, "Text before") {
		t.Errorf("expected leading text 'Text before', got %q", text)
	}
	if !strings.Contains(text, "Text after") {
		t.Errorf("expected trailing text 'Text after', got %q", text)
	}
}

func TestStreamParser_MultipleBlocks(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	block1 := `[{"createSurface": {"surfaceId": "s1", "root": "root", "components": [{"id": "root", "component": "Text", "literalString": "First"}]}}]`
	block2 := `[{"updateComponents": {"surfaceId": "s1", "components": [{"id": "root", "component": "Text", "literalString": "Updated"}]}}]`
	content := fmt.Sprintf(`%s%s%s Middle text %s%s%s`, schema.A2UIOpenTag, block1, schema.A2UICloseTag, schema.A2UIOpenTag, block2, schema.A2UICloseTag)

	parts, err := feedAsOneChunk(p, content)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	text := collectText(parts)
	if !strings.Contains(text, "Middle text") {
		t.Errorf("expected middle text between blocks, got %q", text)
	}
}

func TestStreamParser_EmptyBlock(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	content := fmt.Sprintf(`%s%s`, schema.A2UIOpenTag, schema.A2UICloseTag)
	_, err := feedAsOneChunk(p, content)
	if err == nil {
		t.Error("expected error for empty A2UI block")
	}
	if !strings.Contains(err.Error(), "No valid JSON object found") {
		t.Errorf("expected 'No valid JSON object found' error, got: %v", err)
	}
}

func TestStreamParser_SplitOpenTag(t *testing.T) {
	// Test that the parser handles the open tag being split across chunks.
	p := NewA2uiStreamParser(nil)

	json := `[{"createSurface": {"surfaceId": "s1", "root": "root", "components": [{"id": "root", "component": "Text"}]}}]`

	// Split the open tag across chunks.
	tag := schema.A2UIOpenTag
	mid := len(tag) / 2
	chunk1 := "Hello " + tag[:mid]
	chunk2 := tag[mid:] + json + schema.A2UICloseTag

	parts1, err := p.ProcessChunk(chunk1)
	if err != nil {
		t.Fatalf("unexpected error on chunk1: %v", err)
	}
	parts2, err := p.ProcessChunk(chunk2)
	if err != nil {
		t.Fatalf("unexpected error on chunk2: %v", err)
	}

	allParts := append(parts1, parts2...)
	text := collectText(allParts)
	if !strings.Contains(text, "Hello") {
		t.Errorf("expected text 'Hello', got %q", text)
	}
}

func TestStreamParser_SplitCloseTag(t *testing.T) {
	// Test that the parser handles the close tag being split across chunks.
	p := NewA2uiStreamParser(nil)

	json := `[{"createSurface": {"surfaceId": "s1", "root": "root", "components": [{"id": "root", "component": "Text"}]}}]`

	tag := schema.A2UICloseTag
	mid := len(tag) / 2
	chunk1 := schema.A2UIOpenTag + json + tag[:mid]
	chunk2 := tag[mid:] + " Done"

	parts1, err := p.ProcessChunk(chunk1)
	if err != nil {
		t.Fatalf("unexpected error on chunk1: %v", err)
	}
	parts2, err := p.ProcessChunk(chunk2)
	if err != nil {
		t.Fatalf("unexpected error on chunk2: %v", err)
	}

	allParts := append(parts1, parts2...)
	text := collectText(allParts)
	if !strings.Contains(text, "Done") {
		t.Errorf("expected trailing text 'Done', got %q", text)
	}
}

func TestStreamParser_UpdateComponents(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	content := fmt.Sprintf(`%s[{"updateComponents": {"surfaceId": "s1", "root": "root", "components": [{"id": "root", "component": "Row", "children": ["c1"]}, {"id": "c1", "component": "Text", "literalString": "Child"}]}}]%s`,
		schema.A2UIOpenTag, schema.A2UICloseTag)

	_, err := feedAsOneChunk(p, content)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestStreamParser_UpdateDataModel(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	content := fmt.Sprintf(`%s[{"updateDataModel": {"surfaceId": "s1", "value": {"name": "test", "count": 42}}}]%s`,
		schema.A2UIOpenTag, schema.A2UICloseTag)

	parts, err := feedAsOneChunk(p, content)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	msgs := collectA2UIMessages(parts)
	found := false
	for _, m := range msgs {
		if _, ok := m[MsgTypeUpdateDataModel]; ok {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected an updateDataModel message")
	}
}

func TestStreamParser_DeleteSurface(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	// First create a surface, then delete it.
	createContent := fmt.Sprintf(`%s[{"createSurface": {"surfaceId": "s1", "root": "root", "components": [{"id": "root", "component": "Text"}]}}]%s`,
		schema.A2UIOpenTag, schema.A2UICloseTag)
	_, err := feedAsOneChunk(p, createContent)
	if err != nil {
		t.Fatalf("unexpected error creating surface: %v", err)
	}

	deleteContent := fmt.Sprintf(`%s[{"deleteSurface": {"surfaceId": "s1"}}]%s`,
		schema.A2UIOpenTag, schema.A2UICloseTag)
	parts, err := feedAsOneChunk(p, deleteContent)
	if err != nil {
		t.Fatalf("unexpected error deleting surface: %v", err)
	}

	msgs := collectA2UIMessages(parts)
	found := false
	for _, m := range msgs {
		if _, ok := m[MsgTypeDeleteSurface]; ok {
			found = true
			break
		}
	}
	if !found {
		t.Error("expected a deleteSurface message")
	}
}

func TestStreamParser_FixJSON_ClosesOpenBraces(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	tests := []struct {
		name     string
		fragment string
		valid    bool
	}{
		{"complete", `{"id": "test"}`, true},
		{"unclosed_brace", `{"id": "test"`, true},
		{"unclosed_bracket", `[{"id": "test"}`, true},
		{"empty", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := p.fixJSON(tt.fragment)
			if tt.valid {
				if result == "" {
					t.Error("expected non-empty result from fixJSON")
					return
				}
				var parsed any
				if err := json.Unmarshal([]byte(result), &parsed); err != nil {
					t.Errorf("fixJSON result is not valid JSON: %v, result=%q", err, result)
				}
			}
		})
	}
}

func TestStreamParser_FixJSON_ClosesOpenStrings(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	// A fragment with an unclosed cuttable string value.
	fragment := `{"literalString": "Hello wor`
	result := p.fixJSON(fragment)
	if result == "" {
		t.Fatal("expected non-empty result from fixJSON for cuttable key")
	}
	var parsed map[string]any
	if err := json.Unmarshal([]byte(result), &parsed); err != nil {
		t.Fatalf("fixJSON result is not valid JSON: %v", err)
	}
	val, ok := parsed["literalString"].(string)
	if !ok {
		t.Fatal("expected literalString to be a string")
	}
	if !strings.HasPrefix(val, "Hello wor") {
		t.Errorf("expected value starting with 'Hello wor', got %q", val)
	}
}

func TestStreamParser_FixJSON_NonCuttableKey(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	// A fragment with an unclosed non-cuttable string value.
	fragment := `{"id": "some_incomp`
	result := p.fixJSON(fragment)
	// Non-cuttable keys should return empty string (cannot safely close).
	if result != "" {
		t.Errorf("expected empty result for non-cuttable key, got %q", result)
	}
}

func TestStreamParser_FixJSON_TrailingComma(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	fragment := `{"id": "test", "component": "Text",`
	result := p.fixJSON(fragment)
	if result == "" {
		t.Fatal("expected non-empty result from fixJSON")
	}
	var parsed any
	if err := json.Unmarshal([]byte(result), &parsed); err != nil {
		t.Errorf("fixJSON result is not valid JSON: %v, result=%q", err, result)
	}
}

func TestStreamParser_V09_CreateSurfaceWithComponents(t *testing.T) {
	catalog := newTestCatalog(t)
	p := NewA2uiStreamParser(catalog)

	content := fmt.Sprintf(`%s[{"createSurface": {"surfaceId": "main", "root": "root", "components": [{"id": "root", "component": "Column", "children": ["t1"]}, {"id": "t1", "component": "Text", "literalString": "Welcome"}]}}]%s`,
		schema.A2UIOpenTag, schema.A2UICloseTag)

	parts, err := feedAsOneChunk(p, content)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	msgs := collectA2UIMessages(parts)
	foundCreate := false
	for _, m := range msgs {
		if _, ok := m[MsgTypeCreateSurface]; ok {
			foundCreate = true
			break
		}
	}
	if !foundCreate {
		t.Error("expected a createSurface message")
	}

	if p.SurfaceID() != "main" {
		t.Errorf("expected surfaceID=main, got %q", p.SurfaceID())
	}
	if p.RootID() != "root" {
		t.Errorf("expected rootID=root, got %q", p.RootID())
	}
}

func TestStreamParser_V09_SurfaceIDSniffing(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	// Feed createSurface chunk-by-chunk to test sniffing.
	content := fmt.Sprintf(`%s[{"createSurface": {"surfaceId": "sniffed_id", "root": "r1", "components": [{"id": "r1", "component": "Text"}]}}]%s`,
		schema.A2UIOpenTag, schema.A2UICloseTag)

	_, err := feedChunked(p, content)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if p.SurfaceID() != "sniffed_id" {
		t.Errorf("expected surfaceID=sniffed_id, got %q", p.SurfaceID())
	}
	if p.RootID() != "r1" {
		t.Errorf("expected rootID=r1, got %q", p.RootID())
	}
}

func TestStreamParser_V09_DataModelDeduplication(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	// Create a surface first.
	createContent := fmt.Sprintf(`%s[{"createSurface": {"surfaceId": "s1", "root": "root", "components": [{"id": "root", "component": "Text"}]}}]%s`,
		schema.A2UIOpenTag, schema.A2UICloseTag)
	_, err := feedAsOneChunk(p, createContent)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// First data model update.
	dm1 := fmt.Sprintf(`%s[{"updateDataModel": {"surfaceId": "s1", "value": {"name": "Alice"}}}]%s`,
		schema.A2UIOpenTag, schema.A2UICloseTag)
	parts1, err := feedAsOneChunk(p, dm1)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	msgs1 := collectA2UIMessages(parts1)
	if len(msgs1) == 0 {
		t.Error("expected at least one message from first data model update")
	}

	// Identical data model update should be deduplicated.
	dm2 := fmt.Sprintf(`%s[{"updateDataModel": {"surfaceId": "s1", "value": {"name": "Alice"}}}]%s`,
		schema.A2UIOpenTag, schema.A2UICloseTag)
	parts2, err := feedAsOneChunk(p, dm2)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// The identical update should be deduplicated (no new messages).
	msgs2 := collectA2UIMessages(parts2)
	dmCount := 0
	for _, m := range msgs2 {
		if _, ok := m[MsgTypeUpdateDataModel]; ok {
			dmCount++
		}
	}
	if dmCount > 0 {
		t.Errorf("expected deduplicated data model (0 new messages), got %d", dmCount)
	}
}

func TestStreamParser_V09_MsgTypeTracking(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	// Feed the content character by character and check msg types mid-stream.
	content := fmt.Sprintf(`%s[{"createSurface": {"surfaceId": "s1", "root": "root", "components": [{"id": "root", "component": "Text"}]}}]`,
		schema.A2UIOpenTag)

	// Feed just the open tag and JSON (without close tag) to observe internal state.
	for _, ch := range content {
		_, _ = p.ProcessChunk(string(ch))
	}

	// Mid-block, msg types should be tracked.
	msgTypes := p.MsgTypes()
	hasCreate := false
	for _, mt := range msgTypes {
		if mt == MsgTypeCreateSurface {
			hasCreate = true
		}
	}
	if !hasCreate {
		t.Error("expected createSurface in msg types during block processing")
	}

	// After close tag, msg types reset.
	_, err := p.ProcessChunk(schema.A2UICloseTag)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(p.MsgTypes()) != 0 {
		t.Errorf("expected msg types to be reset after block, got %v", p.MsgTypes())
	}
}

func TestStreamParser_ResetBetweenBlocks(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	// First block
	block1 := fmt.Sprintf(`%s[{"createSurface": {"surfaceId": "s1", "root": "root", "components": [{"id": "root", "component": "Text"}]}}]%s`,
		schema.A2UIOpenTag, schema.A2UICloseTag)
	_, err := feedAsOneChunk(p, block1)
	if err != nil {
		t.Fatalf("unexpected error on block1: %v", err)
	}

	// Second block should work independently.
	block2 := fmt.Sprintf(`%s[{"updateDataModel": {"surfaceId": "s1", "value": {"x": 1}}}]%s`,
		schema.A2UIOpenTag, schema.A2UICloseTag)
	_, err = feedAsOneChunk(p, block2)
	if err != nil {
		t.Fatalf("unexpected error on block2: %v", err)
	}
}

func TestStreamParser_NoNilPanic(t *testing.T) {
	// Parser created with nil catalog should not panic.
	p := NewA2uiStreamParser(nil)

	content := fmt.Sprintf(`%s[{"createSurface": {"surfaceId": "s1", "root": "root", "components": [{"id": "root", "component": "Text"}]}}]%s`,
		schema.A2UIOpenTag, schema.A2UICloseTag)

	// Should not panic.
	_, err := feedAsOneChunk(p, content)
	if err != nil {
		t.Fatalf("unexpected error with nil catalog: %v", err)
	}
}

func TestStreamParser_LargePayload(t *testing.T) {
	p := NewA2uiStreamParser(nil)

	// Build a large component tree.
	var components []string
	rootChildren := []string{}
	for i := 0; i < 20; i++ {
		cid := fmt.Sprintf("c%d", i)
		rootChildren = append(rootChildren, fmt.Sprintf("%q", cid))
		components = append(components, fmt.Sprintf(`{"id": %q, "component": "Text", "literalString": "Item %d"}`, cid, i))
	}
	childrenStr := strings.Join(rootChildren, ", ")
	componentsStr := strings.Join(components, ", ")
	json := fmt.Sprintf(`[{"createSurface": {"surfaceId": "s1", "root": "root", "components": [{"id": "root", "component": "Column", "children": [%s]}, %s]}}]`,
		childrenStr, componentsStr)

	content := fmt.Sprintf(`%s%s%s`, schema.A2UIOpenTag, json, schema.A2UICloseTag)
	_, err := feedAsOneChunk(p, content)
	if err != nil {
		t.Fatalf("unexpected error with large payload: %v", err)
	}
}
