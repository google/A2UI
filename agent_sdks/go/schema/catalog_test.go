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

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCatalogIDProperty(t *testing.T) {
	catalogID := "https://a2ui.org/basic_catalog.json"
	catalog := &A2uiCatalog{
		Version:           Version09,
		Name:              "basic",
		S2CSchema:         map[string]any{},
		CommonTypesSchema: map[string]any{},
		CatalogSchema:     map[string]any{"catalogId": catalogID},
	}
	id, err := catalog.CatalogID()
	if err != nil {
		t.Fatalf("CatalogID() returned error: %v", err)
	}
	if id != catalogID {
		t.Errorf("CatalogID() = %q, want %q", id, catalogID)
	}
}

func TestCatalogIDMissingRaisesError(t *testing.T) {
	catalog := &A2uiCatalog{
		Version:           Version09,
		Name:              "basic",
		S2CSchema:         map[string]any{},
		CommonTypesSchema: map[string]any{},
		CatalogSchema:     map[string]any{}, // No catalogId
	}
	_, err := catalog.CatalogID()
	if err == nil {
		t.Fatal("expected error for missing catalogId")
	}
	if !strings.Contains(err.Error(), "missing catalogId") {
		t.Errorf("expected 'missing catalogId' error, got: %v", err)
	}
}

func TestLoadExamples(t *testing.T) {
	tmpDir := t.TempDir()
	exampleDir := filepath.Join(tmpDir, "examples")
	if err := os.Mkdir(exampleDir, 0755); err != nil {
		t.Fatal(err)
	}

	os.WriteFile(filepath.Join(exampleDir, "example1.json"),
		[]byte(`[{"beginRendering": {"surfaceId": "id"}}]`), 0644)
	os.WriteFile(filepath.Join(exampleDir, "example2.json"),
		[]byte(`[{"beginRendering": {"surfaceId": "id"}}]`), 0644)
	os.WriteFile(filepath.Join(exampleDir, "ignored.txt"),
		[]byte("should not be loaded"), 0644)

	catalog := &A2uiCatalog{
		Version:           Version09,
		Name:              "basic",
		S2CSchema:         map[string]any{},
		CommonTypesSchema: map[string]any{},
		CatalogSchema:     map[string]any{},
	}

	examplesStr, err := catalog.LoadExamples(exampleDir, false)
	if err != nil {
		t.Fatalf("LoadExamples failed: %v", err)
	}
	if !strings.Contains(examplesStr, "---BEGIN example1---") {
		t.Error("expected example1 in output")
	}
	if !strings.Contains(examplesStr, "---BEGIN example2---") {
		t.Error("expected example2 in output")
	}
	if strings.Contains(examplesStr, "ignored") {
		t.Error("expected ignored.txt to be excluded")
	}
}

func TestLoadExamplesValidationFailsOnBadJSON(t *testing.T) {
	tmpDir := t.TempDir()
	exampleDir := filepath.Join(tmpDir, "examples")
	os.Mkdir(exampleDir, 0755)
	os.WriteFile(filepath.Join(exampleDir, "bad.json"),
		[]byte("{ this is bad json }"), 0644)

	catalog := &A2uiCatalog{
		Version:       Version09,
		Name:          "basic",
		S2CSchema:     map[string]any{},
		CatalogSchema: map[string]any{"catalogId": "basic"},
	}

	_, err := catalog.LoadExamples(exampleDir, true)
	if err == nil {
		t.Fatal("expected error for bad JSON example")
	}
	if !strings.Contains(err.Error(), "bad.json") {
		t.Errorf("expected error mentioning bad.json, got: %v", err)
	}
}

func TestLoadExamplesEmptyPath(t *testing.T) {
	catalog := &A2uiCatalog{
		Version:       Version09,
		Name:          "basic",
		S2CSchema:     map[string]any{},
		CatalogSchema: map[string]any{},
	}

	result, err := catalog.LoadExamples("", false)
	if err != nil {
		t.Fatalf("LoadExamples with empty path failed: %v", err)
	}
	if result != "" {
		t.Errorf("expected empty string, got %q", result)
	}
}

func TestLoadExamplesNonExistentPath(t *testing.T) {
	catalog := &A2uiCatalog{
		Version:       Version09,
		Name:          "basic",
		S2CSchema:     map[string]any{},
		CatalogSchema: map[string]any{},
	}

	result, err := catalog.LoadExamples("/non/existent/path", false)
	if err != nil {
		t.Fatalf("LoadExamples with non-existent path failed: %v", err)
	}
	if result != "" {
		t.Errorf("expected empty string for non-existent path, got %q", result)
	}
}

func TestWithPruningComponents(t *testing.T) {
	catalogSchema := map[string]any{
		"catalogId": "basic",
		"components": map[string]any{
			"Text":   map[string]any{"type": "object"},
			"Button": map[string]any{"type": "object"},
			"Image":  map[string]any{"type": "object"},
		},
	}
	catalog := &A2uiCatalog{
		Version:           Version09,
		Name:              "basic",
		S2CSchema:         map[string]any{},
		CommonTypesSchema: map[string]any{},
		CatalogSchema:     catalogSchema,
	}

	pruned := catalog.WithPruning([]string{"Text", "Button"}, nil)
	prunedComps := pruned.CatalogSchema["components"].(map[string]any)
	if _, ok := prunedComps["Text"]; !ok {
		t.Error("expected Text in pruned components")
	}
	if _, ok := prunedComps["Button"]; !ok {
		t.Error("expected Button in pruned components")
	}
	if _, ok := prunedComps["Image"]; ok {
		t.Error("Image should be pruned")
	}
	// Should be a new instance
	if pruned == catalog {
		t.Error("pruned should be a new instance")
	}

	// Test anyComponent oneOf filtering
	catalogSchemaWithDefs := map[string]any{
		"catalogId": "basic",
		"$defs": map[string]any{
			"anyComponent": map[string]any{
				"oneOf": []any{
					map[string]any{"$ref": "#/components/Text"},
					map[string]any{"$ref": "#/components/Button"},
					map[string]any{"$ref": "#/components/Image"},
				},
			},
		},
		"components": map[string]any{
			"Text":   map[string]any{},
			"Button": map[string]any{},
			"Image":  map[string]any{},
		},
	}
	catalogWithDefs := &A2uiCatalog{
		Version:           Version09,
		Name:              "basic",
		S2CSchema:         map[string]any{},
		CommonTypesSchema: map[string]any{},
		CatalogSchema:     catalogSchemaWithDefs,
	}

	prunedDefs := catalogWithDefs.WithPruning([]string{"Text"}, nil)
	anyComp := prunedDefs.CatalogSchema["$defs"].(map[string]any)["anyComponent"].(map[string]any)
	oneOf := anyComp["oneOf"].([]any)
	if len(oneOf) != 1 {
		t.Fatalf("expected 1 oneOf entry, got %d", len(oneOf))
	}
	ref := oneOf[0].(map[string]any)["$ref"].(string)
	if ref != "#/components/Text" {
		t.Errorf("expected #/components/Text, got %q", ref)
	}

	// Test empty allowed components
	emptyPruned := catalog.WithPruning(nil, nil)
	if emptyPruned.CatalogSchema == nil {
		t.Error("expected non-nil CatalogSchema")
	}
}

func TestWithPruningMessages(t *testing.T) {
	s2cSchema := map[string]any{
		"oneOf": []any{
			map[string]any{"$ref": "#/$defs/MessageA"},
			map[string]any{"$ref": "#/$defs/MessageB"},
			map[string]any{"$ref": "#/$defs/MessageC"},
		},
		"$defs": map[string]any{
			"MessageA": map[string]any{"type": "object", "properties": map[string]any{"a": map[string]any{"type": "string"}}},
			"MessageB": map[string]any{"type": "object", "properties": map[string]any{"b": map[string]any{"type": "string"}}},
			"MessageC": map[string]any{"type": "object", "properties": map[string]any{"c": map[string]any{"type": "string"}}},
		},
	}
	catalog := &A2uiCatalog{
		Version:           Version09,
		Name:              "basic",
		S2CSchema:         s2cSchema,
		CommonTypesSchema: map[string]any{},
		CatalogSchema:     map[string]any{"catalogId": "basic"},
	}

	pruned := catalog.WithPruning(nil, []string{"MessageA", "MessageC"})
	prunedS2C := pruned.S2CSchema
	oneOf := prunedS2C["oneOf"].([]any)
	if len(oneOf) != 2 {
		t.Fatalf("expected 2 oneOf entries, got %d", len(oneOf))
	}

	prunedDefs := prunedS2C["$defs"].(map[string]any)
	if _, ok := prunedDefs["MessageA"]; !ok {
		t.Error("expected MessageA in pruned defs")
	}
	if _, ok := prunedDefs["MessageC"]; !ok {
		t.Error("expected MessageC in pruned defs")
	}
	if _, ok := prunedDefs["MessageB"]; ok {
		t.Error("MessageB should be pruned from defs")
	}
}

func TestWithPruningMessagesInternalReachability(t *testing.T) {
	s2cSchema := map[string]any{
		"oneOf": []any{
			map[string]any{"$ref": "#/$defs/MessageA"},
		},
		"$defs": map[string]any{
			"MessageA":   map[string]any{"type": "object", "properties": map[string]any{"shared": map[string]any{"$ref": "#/$defs/SharedType"}}},
			"SharedType": map[string]any{"type": "string"},
			"UnusedType": map[string]any{"type": "number"},
		},
	}
	catalog := &A2uiCatalog{
		Version:           Version09,
		Name:              "basic",
		S2CSchema:         s2cSchema,
		CommonTypesSchema: map[string]any{},
		CatalogSchema:     map[string]any{"catalogId": "basic"},
	}

	pruned := catalog.WithPruning(nil, []string{"MessageA"})
	prunedDefs := pruned.S2CSchema["$defs"].(map[string]any)
	if _, ok := prunedDefs["MessageA"]; !ok {
		t.Error("expected MessageA in pruned defs")
	}
	if _, ok := prunedDefs["SharedType"]; !ok {
		t.Error("expected SharedType in pruned defs (reachable from MessageA)")
	}
	if _, ok := prunedDefs["UnusedType"]; ok {
		t.Error("UnusedType should be pruned (unreachable)")
	}
}

func TestRenderAsLLMInstructions(t *testing.T) {
	catalog := &A2uiCatalog{
		Version:           Version09,
		Name:              "basic",
		S2CSchema:         map[string]any{"s2c": "schema"},
		CommonTypesSchema: map[string]any{"$defs": map[string]any{"common": "types"}},
		CatalogSchema: map[string]any{
			"$schema":   "https://json-schema.org/draft/2020-12/schema",
			"catalog":   "schema",
			"catalogId": "id_basic",
		},
	}

	schemaStr := catalog.RenderAsLLMInstructions()
	if !strings.Contains(schemaStr, A2UISchemaBlockStart) {
		t.Error("expected schema block start")
	}
	if !strings.Contains(schemaStr, "### Server To Client Schema:") {
		t.Error("expected server to client schema header")
	}
	if !strings.Contains(schemaStr, `"s2c": "schema"`) {
		t.Error("expected s2c schema content")
	}
	if !strings.Contains(schemaStr, "### Common Types Schema:") {
		t.Error("expected common types schema header")
	}
	if !strings.Contains(schemaStr, "### Catalog Schema:") {
		t.Error("expected catalog schema header")
	}
	if !strings.Contains(schemaStr, A2UISchemaBlockEnd) {
		t.Error("expected schema block end")
	}
}

func TestRenderAsLLMInstructionsDropsEmptyCommonTypes(t *testing.T) {
	// Empty common_types_schema
	catalog := &A2uiCatalog{
		Version:           Version09,
		Name:              "basic",
		S2CSchema:         map[string]any{"s2c": "schema"},
		CommonTypesSchema: map[string]any{},
		CatalogSchema:     map[string]any{"catalogId": "id_basic"},
	}
	schemaStr := catalog.RenderAsLLMInstructions()
	if strings.Contains(schemaStr, "### Common Types Schema:") {
		t.Error("empty common types should be dropped")
	}

	// common_types_schema with empty $defs
	catalog2 := &A2uiCatalog{
		Version:           Version09,
		Name:              "basic",
		S2CSchema:         map[string]any{"s2c": "schema"},
		CommonTypesSchema: map[string]any{"$defs": map[string]any{}},
		CatalogSchema:     map[string]any{"catalogId": "id_basic"},
	}
	schemaStr2 := catalog2.RenderAsLLMInstructions()
	if strings.Contains(schemaStr2, "### Common Types Schema:") {
		t.Error("empty $defs common types should be dropped")
	}
}

func TestWithPruningCommonTypes(t *testing.T) {
	commonTypes := map[string]any{
		"$defs": map[string]any{
			"TypeForCompA": map[string]any{"type": "string"},
			"TypeForCompB": map[string]any{"type": "number"},
		},
	}
	catalogSchema := map[string]any{
		"catalogId": "basic",
		"components": map[string]any{
			"CompA": map[string]any{"$ref": "common_types.json#/$defs/TypeForCompA"},
			"CompB": map[string]any{"$ref": "common_types.json#/$defs/TypeForCompB"},
		},
	}
	catalog := &A2uiCatalog{
		Version:           Version09,
		Name:              "basic",
		S2CSchema:         map[string]any{},
		CommonTypesSchema: commonTypes,
		CatalogSchema:     catalogSchema,
	}

	pruned := catalog.WithPruning([]string{"CompA"}, nil)
	prunedDefs := pruned.CommonTypesSchema["$defs"].(map[string]any)

	if _, ok := prunedDefs["TypeForCompA"]; !ok {
		t.Error("expected TypeForCompA in pruned common types")
	}
	if _, ok := prunedDefs["TypeForCompB"]; ok {
		t.Error("TypeForCompB should be pruned from common types")
	}
}

func TestLoadExamplesWithGlob(t *testing.T) {
	tmpDir := t.TempDir()
	exampleDir := filepath.Join(tmpDir, "examples")
	os.Mkdir(exampleDir, 0755)

	os.WriteFile(filepath.Join(exampleDir, "top.json"),
		[]byte(`[{"beginRendering": {"surfaceId": "top"}}]`), 0644)
	os.WriteFile(filepath.Join(exampleDir, "ignored.txt"),
		[]byte("not json"), 0644)

	catalog := &A2uiCatalog{
		Version:       Version09,
		Name:          "basic",
		S2CSchema:     map[string]any{},
		CatalogSchema: map[string]any{},
	}

	// Match only *.json
	examples, err := catalog.LoadExamples(filepath.Join(exampleDir, "*.json"), false)
	if err != nil {
		t.Fatalf("LoadExamples failed: %v", err)
	}
	if !strings.Contains(examples, "---BEGIN top---") {
		t.Error("expected top.json in output")
	}
	if strings.Contains(examples, "ignored") {
		t.Error("expected ignored.txt to be excluded")
	}
}

func TestLoadExamplesWithGlobPrefixSuffix(t *testing.T) {
	tmpDir := t.TempDir()
	exampleDir := filepath.Join(tmpDir, "examples")
	os.Mkdir(exampleDir, 0755)

	os.WriteFile(filepath.Join(exampleDir, "user_profile.json"),
		[]byte(`[{"beginRendering": {"surfaceId": "user"}}]`), 0644)
	os.WriteFile(filepath.Join(exampleDir, "user_settings.json"),
		[]byte(`[{"beginRendering": {"surfaceId": "settings"}}]`), 0644)
	os.WriteFile(filepath.Join(exampleDir, "admin_profile.json"),
		[]byte(`[{"beginRendering": {"surfaceId": "admin"}}]`), 0644)

	catalog := &A2uiCatalog{
		Version:       Version09,
		Name:          "basic",
		S2CSchema:     map[string]any{},
		CatalogSchema: map[string]any{},
	}

	// Filter by prefix: user_*.json
	userExamples, err := catalog.LoadExamples(filepath.Join(exampleDir, "user_*.json"), false)
	if err != nil {
		t.Fatalf("LoadExamples failed: %v", err)
	}
	if !strings.Contains(userExamples, "---BEGIN user_profile---") {
		t.Error("expected user_profile in output")
	}
	if !strings.Contains(userExamples, "---BEGIN user_settings---") {
		t.Error("expected user_settings in output")
	}
	if strings.Contains(userExamples, "admin_profile") {
		t.Error("expected admin_profile to be excluded")
	}
}

func TestLoadExamplesWithGlobAdvancedCases(t *testing.T) {
	tmpDir := t.TempDir()
	exampleDir := filepath.Join(tmpDir, "examples")
	os.Mkdir(exampleDir, 0755)

	os.WriteFile(filepath.Join(exampleDir, "step1.json"),
		[]byte(`[{"beginRendering": {"surfaceId": "1"}}]`), 0644)
	os.WriteFile(filepath.Join(exampleDir, "step2.json"),
		[]byte(`[{"beginRendering": {"surfaceId": "2"}}]`), 0644)
	os.WriteFile(filepath.Join(exampleDir, "step3.json"),
		[]byte(`[{"beginRendering": {"surfaceId": "3"}}]`), 0644)

	// Create a directory named *.json that should be skipped
	os.Mkdir(filepath.Join(exampleDir, "directory.json"), 0755)

	catalog := &A2uiCatalog{
		Version:       Version09,
		Name:          "basic",
		S2CSchema:     map[string]any{},
		CatalogSchema: map[string]any{},
	}

	// Test that directory matching *.json is skipped correctly
	allExamples, err := catalog.LoadExamples(filepath.Join(exampleDir, "*.json"), false)
	if err != nil {
		t.Fatalf("LoadExamples failed: %v", err)
	}
	if !strings.Contains(allExamples, "---BEGIN step1---") {
		t.Error("expected step1 in output")
	}
	if strings.Contains(allExamples, "directory") {
		t.Error("directory.json dir should be skipped")
	}

	// Test zero matches returns empty string
	result, err := catalog.LoadExamples(filepath.Join(exampleDir, "*.yaml"), false)
	if err != nil {
		t.Fatalf("LoadExamples failed: %v", err)
	}
	if result != "" {
		t.Errorf("expected empty string, got %q", result)
	}
}

func TestCatalogConfigFromPathSchemes(t *testing.T) {
	// Test local path
	config, err := NewCatalogConfigFromPath("test_file", "relative_path/to/catalog.json", "")
	if err != nil {
		t.Fatalf("NewCatalogConfigFromPath failed: %v", err)
	}
	if fsp, ok := config.Provider.(*FileSystemCatalogProvider); ok {
		if fsp.Path != "relative_path/to/catalog.json" {
			t.Errorf("expected path 'relative_path/to/catalog.json', got %q", fsp.Path)
		}
	} else {
		t.Error("expected FileSystemCatalogProvider")
	}

	// Test file:// scheme
	config, err = NewCatalogConfigFromPath("test_file", "file:///absolute_path/to/catalog.json", "")
	if err != nil {
		t.Fatalf("NewCatalogConfigFromPath failed: %v", err)
	}
	if fsp, ok := config.Provider.(*FileSystemCatalogProvider); ok {
		if fsp.Path != "/absolute_path/to/catalog.json" {
			t.Errorf("expected path '/absolute_path/to/catalog.json', got %q", fsp.Path)
		}
	}

	// Test HTTP raises error
	_, err = NewCatalogConfigFromPath("test_http", "http://a2ui.org/catalog.json", "")
	if err == nil {
		t.Fatal("expected error for HTTP scheme")
	}
	if !strings.Contains(err.Error(), "HTTP support is coming soon") {
		t.Errorf("expected HTTP not supported error, got: %v", err)
	}

	// Test unsupported scheme
	_, err = NewCatalogConfigFromPath("test_ftp", "ftp://a2ui.org/catalog.json", "")
	if err == nil {
		t.Fatal("expected error for unsupported scheme")
	}
	errStr := strings.ToLower(err.Error())
	if !strings.Contains(errStr, "unsupported") {
		t.Errorf("expected unsupported scheme error, got: %v", err)
	}
}

func TestResolveExamplesPath(t *testing.T) {
	// Empty path
	result, err := resolveExamplesPath("")
	if err != nil || result != "" {
		t.Errorf("expected empty result for empty path, got %q, err %v", result, err)
	}

	// Absolute path
	result, err = resolveExamplesPath("/absolute/examples")
	if err != nil || result != "/absolute/examples" {
		t.Errorf("expected /absolute/examples, got %q, err %v", result, err)
	}

	// file:// scheme
	result, err = resolveExamplesPath("file:///absolute/examples")
	if err != nil || result != "/absolute/examples" {
		t.Errorf("expected /absolute/examples, got %q, err %v", result, err)
	}

	// Unsupported scheme
	_, err = resolveExamplesPath("https://a2ui.org/examples")
	if err == nil {
		t.Fatal("expected error for unsupported scheme")
	}
}


