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
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	a2ui "github.com/google/a2ui/agent_sdks/go"
)

// mockCatalogProvider returns a predefined catalog schema.
type mockCatalogProvider struct {
	Schema map[string]any
}

func (p *mockCatalogProvider) Load() (map[string]any, error) {
	return p.Schema, nil
}

func newTestManager(t *testing.T, catalogs []*CatalogConfig, opts ...func(*A2uiSchemaManagerConfig)) *A2uiSchemaManager {
	t.Helper()
	cfg := A2uiSchemaManagerConfig{
		Version:  Version09,
		Catalogs: catalogs,
	}
	for _, opt := range opts {
		opt(&cfg)
	}
	m, err := NewA2uiSchemaManager(cfg)
	if err != nil {
		t.Fatalf("NewA2uiSchemaManager failed: %v", err)
	}
	return m
}

func TestSchemaManagerInitInvalidVersion(t *testing.T) {
	_, err := NewA2uiSchemaManager(A2uiSchemaManagerConfig{
		Version: "invalid_version",
	})
	if err == nil {
		t.Fatal("expected error for invalid version")
	}
	if !strings.Contains(err.Error(), "Unknown A2UI specification version") &&
		!strings.Contains(err.Error(), "unknown A2UI specification version") {
		t.Errorf("expected version error, got: %v", err)
	}
}

func TestSchemaManagerInitWithCatalog(t *testing.T) {
	catalogSchema := map[string]any{
		"$schema":   "https://json-schema.org/draft/2020-12/schema",
		"catalogId": "test-catalog",
		"components": map[string]any{
			"Text": map[string]any{"type": "object"},
		},
	}
	config := &CatalogConfig{
		Name:     "test",
		Provider: &mockCatalogProvider{Schema: catalogSchema},
	}

	m := newTestManager(t, []*CatalogConfig{config})

	if len(m.supportedCatalogs) != 1 {
		t.Fatalf("expected 1 catalog, got %d", len(m.supportedCatalogs))
	}
	if m.supportedCatalogs[0].Name != "test" {
		t.Errorf("expected catalog name 'test', got %q", m.supportedCatalogs[0].Name)
	}
	comps := m.supportedCatalogs[0].CatalogSchema["components"].(map[string]any)
	if _, ok := comps["Text"]; !ok {
		t.Error("expected Text component in catalog")
	}
}

func TestSchemaManagerSupportedCatalogIDs(t *testing.T) {
	config := &CatalogConfig{
		Name: "test",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId": "id_test",
		}},
	}
	m := newTestManager(t, []*CatalogConfig{config})
	ids := m.SupportedCatalogIDs()
	if len(ids) != 1 || ids[0] != "id_test" {
		t.Errorf("expected [id_test], got %v", ids)
	}
}

func TestSelectCatalogDefault(t *testing.T) {
	config := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId": "id_basic",
		}},
	}
	m := newTestManager(t, []*CatalogConfig{config})

	// No capabilities -> returns first catalog
	catalog, err := m.selectCatalog(nil)
	if err != nil {
		t.Fatalf("selectCatalog failed: %v", err)
	}
	if catalog.Name != "basic" {
		t.Errorf("expected 'basic', got %q", catalog.Name)
	}

	// Empty capabilities -> returns first catalog
	catalog, err = m.selectCatalog(map[string]any{})
	if err != nil {
		t.Fatalf("selectCatalog failed: %v", err)
	}
	if catalog.Name != "basic" {
		t.Errorf("expected 'basic', got %q", catalog.Name)
	}
}

func TestSelectCatalogBySupportedIDs(t *testing.T) {
	basic := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId": "id_basic",
		}},
	}
	custom := &CatalogConfig{
		Name: "custom",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId": "id_custom",
		}},
	}
	m := newTestManager(t, []*CatalogConfig{basic, custom})

	// Select custom by ID
	catalog, err := m.selectCatalog(map[string]any{
		SupportedCatalogIDsKey: []any{"id_custom"},
	})
	if err != nil {
		t.Fatalf("selectCatalog failed: %v", err)
	}
	if catalog.Name != "custom" {
		t.Errorf("expected 'custom', got %q", catalog.Name)
	}

	// Priority follows client's order
	catalog, err = m.selectCatalog(map[string]any{
		SupportedCatalogIDsKey: []any{"id_custom", "id_basic"},
	})
	if err != nil {
		t.Fatalf("selectCatalog failed: %v", err)
	}
	if catalog.Name != "custom" {
		t.Errorf("expected 'custom' (first match), got %q", catalog.Name)
	}
}

func TestSelectCatalogNoMatch(t *testing.T) {
	config := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId": "id_basic",
		}},
	}
	m := newTestManager(t, []*CatalogConfig{config})

	_, err := m.selectCatalog(map[string]any{
		SupportedCatalogIDsKey: []any{"id_not_exists"},
	})
	if err == nil {
		t.Fatal("expected error for no matching catalog")
	}
	if !strings.Contains(err.Error(), "No client-supported catalog found") &&
		!strings.Contains(err.Error(), "no client-supported catalog found") {
		t.Errorf("expected no match error, got: %v", err)
	}
}

func TestSelectCatalogInline(t *testing.T) {
	config := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId":  "id_basic",
			"components": map[string]any{"Text": map[string]any{}},
		}},
	}
	m := newTestManager(t, []*CatalogConfig{config}, func(cfg *A2uiSchemaManagerConfig) {
		cfg.AcceptsInlineCatalogs = true
	})

	inlineSchema := map[string]any{
		"components": map[string]any{"Button": map[string]any{}},
	}
	catalog, err := m.selectCatalog(map[string]any{
		InlineCatalogsKey: []any{inlineSchema},
	})
	if err != nil {
		t.Fatalf("selectCatalog failed: %v", err)
	}
	if catalog.Name != InlineCatalogName {
		t.Errorf("expected '%s', got %q", InlineCatalogName, catalog.Name)
	}
	// Should have merged components
	comps := catalog.CatalogSchema["components"].(map[string]any)
	if _, ok := comps["Text"]; !ok {
		t.Error("expected Text from base catalog")
	}
	if _, ok := comps["Button"]; !ok {
		t.Error("expected Button from inline catalog")
	}
}

func TestSelectCatalogInlineNotAccepted(t *testing.T) {
	config := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId": "id_basic",
		}},
	}
	m := newTestManager(t, []*CatalogConfig{config})
	// AcceptsInlineCatalogs defaults to false

	_, err := m.selectCatalog(map[string]any{
		InlineCatalogsKey: []any{map[string]any{"components": map[string]any{}}},
	})
	if err == nil {
		t.Fatal("expected error for inline catalogs not accepted")
	}
	if !strings.Contains(err.Error(), "does not accept inline catalogs") {
		t.Errorf("expected inline catalogs error, got: %v", err)
	}
}

func TestSelectCatalogNoCatalogs(t *testing.T) {
	m := newTestManager(t, nil)
	_, err := m.selectCatalog(nil)
	if err == nil {
		t.Fatal("expected error for no supported catalogs")
	}
	if !strings.Contains(err.Error(), "no supported catalogs found") {
		t.Errorf("expected no catalogs error, got: %v", err)
	}
}

func TestGetSelectedCatalog(t *testing.T) {
	config := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId": "id_basic",
			"components": map[string]any{
				"Text":   map[string]any{},
				"Button": map[string]any{},
			},
		}},
	}
	m := newTestManager(t, []*CatalogConfig{config})

	catalog, err := m.GetSelectedCatalog(nil, []string{"Text"}, nil)
	if err != nil {
		t.Fatalf("GetSelectedCatalog failed: %v", err)
	}
	comps := catalog.CatalogSchema["components"].(map[string]any)
	if _, ok := comps["Text"]; !ok {
		t.Error("expected Text in pruned components")
	}
	if _, ok := comps["Button"]; ok {
		t.Error("Button should be pruned")
	}
}

func TestGenerateSystemPrompt(t *testing.T) {
	config := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId":  "id_basic",
			"components": map[string]any{"Text": map[string]any{}},
		}},
	}
	m := newTestManager(t, []*CatalogConfig{config})

	prompt := m.GenerateSystemPrompt(a2ui.SystemPromptOptions{
		RoleDescription:     "You are a helpful assistant.",
		WorkflowDescription: "Manage workflow.",
		UIDescription:       "Render UI.",
		IncludeSchema:       true,
	})

	if !strings.Contains(prompt, "You are a helpful assistant.") {
		t.Error("expected role description in prompt")
	}
	if !strings.Contains(prompt, "## Workflow Description:") {
		t.Error("expected workflow description header")
	}
	if !strings.Contains(prompt, "Manage workflow.") {
		t.Error("expected workflow description in prompt")
	}
	if !strings.Contains(prompt, "## UI Description:") {
		t.Error("expected UI description header")
	}
	if !strings.Contains(prompt, "Render UI.") {
		t.Error("expected UI description in prompt")
	}
	if !strings.Contains(prompt, A2UISchemaBlockStart) {
		t.Error("expected schema block start in prompt")
	}
	if !strings.Contains(prompt, "### Server To Client Schema:") {
		t.Error("expected server to client schema header")
	}
	if !strings.Contains(prompt, A2UISchemaBlockEnd) {
		t.Error("expected schema block end in prompt")
	}
}

func TestGenerateSystemPromptMinimalArgs(t *testing.T) {
	config := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId":  "id_basic",
			"components": map[string]any{},
		}},
	}
	m := newTestManager(t, []*CatalogConfig{config})

	prompt := m.GenerateSystemPrompt(a2ui.SystemPromptOptions{
		RoleDescription: "Just Role",
	})

	if !strings.Contains(prompt, "Just Role") {
		t.Error("expected role description in prompt")
	}
	if !strings.Contains(prompt, "## Workflow Description:") {
		t.Error("expected default workflow description")
	}
	if !strings.Contains(prompt, DefaultWorkflowRules) {
		t.Error("expected default workflow rules in prompt")
	}
	if strings.Contains(prompt, "## UI Description:") {
		t.Error("UI description should not be present without ui_description arg")
	}
	if strings.Contains(prompt, A2UISchemaBlockStart) {
		t.Error("schema block should not be present without include_schema")
	}
}

func TestGenerateSystemPromptCustomWorkflowAppending(t *testing.T) {
	config := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId":  "id_basic",
			"components": map[string]any{},
		}},
	}
	m := newTestManager(t, []*CatalogConfig{config})

	customRule := "Custom Rule Content"
	prompt := m.GenerateSystemPrompt(a2ui.SystemPromptOptions{
		RoleDescription:     "Role",
		WorkflowDescription: customRule,
	})

	if !strings.Contains(prompt, DefaultWorkflowRules) {
		t.Error("expected default workflow rules")
	}
	if !strings.Contains(prompt, customRule) {
		t.Error("expected custom rule in prompt")
	}
	// Custom rule should be appended after default
	defaultIdx := strings.Index(prompt, DefaultWorkflowRules)
	customIdx := strings.Index(prompt, customRule)
	if customIdx <= defaultIdx {
		t.Error("custom rule should appear after default workflow rules")
	}
}

func TestGenerateSystemPromptWithExamples(t *testing.T) {
	tmpDir := t.TempDir()
	exampleDir := filepath.Join(tmpDir, "examples")
	os.Mkdir(exampleDir, 0755)
	os.WriteFile(filepath.Join(exampleDir, "example1.json"),
		[]byte(`[{"version": "v0.9", "createSurface": {"surfaceId": "id", "catalogId": "basic"}}]`), 0644)

	config := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId":  "id_basic",
			"components": map[string]any{},
		}},
		ExamplesPath: exampleDir,
	}
	m := newTestManager(t, []*CatalogConfig{config})

	prompt := m.GenerateSystemPrompt(a2ui.SystemPromptOptions{
		RoleDescription: "Role description",
		IncludeExamples: true,
	})

	if !strings.Contains(prompt, "### Examples:") {
		t.Error("expected examples section in prompt")
	}
	if !strings.Contains(prompt, "example1") {
		t.Error("expected example1 in prompt")
	}
}

func TestManagerWithModifiers(t *testing.T) {
	// Create a modifier that converts all "type" values to "modified"
	modifier := func(schema map[string]any) map[string]any {
		return RemoveStrictValidation(schema).(map[string]any)
	}

	catalogData, _ := json.Marshal(map[string]any{
		"catalogId":            "test",
		"additionalProperties": false,
		"components":           map[string]any{},
	})

	config := &CatalogConfig{
		Name:     "test",
		Provider: &RawCatalogProvider{Data: catalogData},
	}

	m := newTestManager(t, []*CatalogConfig{config}, func(cfg *A2uiSchemaManagerConfig) {
		cfg.SchemaModifiers = []SchemaModifier{modifier}
	})

	// Verify modifiers were applied to catalog
	catalog := m.supportedCatalogs[0]
	if _, ok := catalog.CatalogSchema["additionalProperties"]; ok {
		t.Error("additionalProperties should be removed by modifier")
	}
}

func TestManagerAcceptsInlineCatalogs(t *testing.T) {
	config := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId": "id_basic",
		}},
	}
	m := newTestManager(t, []*CatalogConfig{config}, func(cfg *A2uiSchemaManagerConfig) {
		cfg.AcceptsInlineCatalogs = true
	})
	if !m.AcceptsInlineCatalogs() {
		t.Error("expected AcceptsInlineCatalogs to be true")
	}

	m2 := newTestManager(t, []*CatalogConfig{config})
	if m2.AcceptsInlineCatalogs() {
		t.Error("expected AcceptsInlineCatalogs to be false by default")
	}
}

func TestSelectCatalogInlineWithSupportedIDs(t *testing.T) {
	basic := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId":  "id_basic",
			"components": map[string]any{"BasicComp": map[string]any{}},
		}},
	}
	custom := &CatalogConfig{
		Name: "custom",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId":  "id_custom",
			"components": map[string]any{"CustomComp": map[string]any{}},
		}},
	}
	m := newTestManager(t, []*CatalogConfig{basic, custom}, func(cfg *A2uiSchemaManagerConfig) {
		cfg.AcceptsInlineCatalogs = true
	})

	// Inline with supportedCatalogIds should use id_custom as base
	catalog, err := m.selectCatalog(map[string]any{
		InlineCatalogsKey:      []any{map[string]any{"components": map[string]any{"InlineComp": map[string]any{}}}},
		SupportedCatalogIDsKey: []any{"id_custom"},
	})
	if err != nil {
		t.Fatalf("selectCatalog failed: %v", err)
	}
	if catalog.Name != InlineCatalogName {
		t.Errorf("expected '%s', got %q", InlineCatalogName, catalog.Name)
	}
	comps := catalog.CatalogSchema["components"].(map[string]any)
	// Base should be custom (has CustomComp)
	if _, ok := comps["CustomComp"]; !ok {
		t.Error("expected CustomComp from custom base catalog")
	}
	if _, ok := comps["InlineComp"]; !ok {
		t.Error("expected InlineComp from inline catalog")
	}
}

func TestLoadExamplesForCatalog(t *testing.T) {
	tmpDir := t.TempDir()
	exampleDir := filepath.Join(tmpDir, "examples")
	os.Mkdir(exampleDir, 0755)
	os.WriteFile(filepath.Join(exampleDir, "ex.json"),
		[]byte(`[{"version": "v0.9", "createSurface": {"surfaceId": "id", "catalogId": "basic"}}]`), 0644)

	config := &CatalogConfig{
		Name: "basic",
		Provider: &mockCatalogProvider{Schema: map[string]any{
			"catalogId":  "id_basic",
			"components": map[string]any{},
		}},
		ExamplesPath: exampleDir,
	}
	m := newTestManager(t, []*CatalogConfig{config})

	catalog := m.supportedCatalogs[0]
	examples, err := m.LoadExamples(catalog, false)
	if err != nil {
		t.Fatalf("LoadExamples failed: %v", err)
	}
	if !strings.Contains(examples, "---BEGIN ex---") {
		t.Error("expected example in output")
	}
}
