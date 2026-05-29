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
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"runtime"
	"strings"
	"testing"

	"github.com/google/a2ui/agent_sdks/go/schema"
	"gopkg.in/yaml.v3"
)

// ---------------------------------------------------------------------------
// YAML types
// ---------------------------------------------------------------------------

type conformanceCatalogConfig struct {
	Version           string `yaml:"version"`
	S2CSchema         any    `yaml:"s2c_schema"`
	CatalogSchema     any    `yaml:"catalog_schema"`
	CommonTypesSchema any    `yaml:"common_types_schema"`
}

type parserConformanceCase struct {
	Name         string                   `yaml:"name"`
	Catalog      conformanceCatalogConfig `yaml:"catalog"`
	ProcessChunk []struct {
		Input       string `yaml:"input"`
		Expect      []any  `yaml:"expect"`
		ExpectError string `yaml:"expect_error"`
	} `yaml:"process_chunk"`
}

type validatorConformanceCase struct {
	Name     string                   `yaml:"name"`
	Catalog  conformanceCatalogConfig `yaml:"catalog"`
	Validate []struct {
		Payload     any    `yaml:"payload"`
		ExpectError string `yaml:"expect_error"`
	} `yaml:"validate"`
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func conformancePath(filename string) string {
	_, thisFile, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(thisFile), "..", "..", "conformance", filename)
}

func loadConformanceJSON(filename string) (map[string]any, error) {
	data, err := os.ReadFile(conformancePath(filename))
	if err != nil {
		return nil, err
	}
	var result map[string]any
	return result, json.Unmarshal(data, &result)
}

// remapSchemaRefs rewrites $ref values so that conformance-specific
// filenames (e.g. simplified_catalog_v09.json) are mapped to the
// canonical names the Go validator registers (catalog.json, etc.).
func remapSchemaRefs(obj any) any {
	renames := map[string]string{
		"simplified_s2c_v09.json":          "server_to_client.json",
		"simplified_s2c_v08.json":          "server_to_client.json",
		"simplified_catalog_v09.json":      "catalog.json",
		"simplified_catalog_v08.json":      "catalog.json",
		"simplified_common_types_v09.json": "common_types.json",
	}

	switch v := obj.(type) {
	case map[string]any:
		out := make(map[string]any, len(v))
		for k, val := range v {
			if k == "$ref" {
				if s, ok := val.(string); ok {
					for old, repl := range renames {
						s = strings.Replace(s, old, repl, 1)
					}
					out[k] = s
				} else {
					out[k] = val
				}
			} else {
				out[k] = remapSchemaRefs(val)
			}
		}
		return out
	case []any:
		out := make([]any, len(v))
		for i, item := range v {
			out[i] = remapSchemaRefs(item)
		}
		return out
	default:
		return v
	}
}

func setupConformanceCatalog(t *testing.T, cfg conformanceCatalogConfig) *schema.A2uiCatalog {
	t.Helper()
	load := func(raw any) map[string]any {
		switch v := raw.(type) {
		case string:
			m, err := loadConformanceJSON(v)
			if err != nil {
				t.Fatalf("load schema %s: %v", v, err)
			}
			return remapSchemaRefs(m).(map[string]any)
		case map[string]any:
			return v
		}
		return map[string]any{}
	}

	s2c := load(cfg.S2CSchema)
	cat := load(cfg.CatalogSchema)
	ct := load(cfg.CommonTypesSchema)

	if cat == nil {
		cat = map[string]any{"catalogId": "test_catalog", "components": map[string]any{}}
	}
	if ct == nil {
		ct = map[string]any{}
	}

	// Ensure inline catalog schemas have necessary $defs so that the eager
	// Go jsonschema compiler can resolve all $ref pointers.
	if cfg.Version == schema.Version09 {
		defs, _ := cat["$defs"].(map[string]any)
		if defs == nil {
			defs = map[string]any{}
			cat["$defs"] = defs
		}
		stubs := map[string]map[string]any{
			"anyComponent":           {},
			"CatalogComponentCommon": {"type": "object"},
		}
		for k, v := range stubs {
			if _, exists := defs[k]; !exists {
				defs[k] = v
			}
		}
	}

	return &schema.A2uiCatalog{
		Version:           cfg.Version,
		Name:              "test_catalog",
		S2CSchema:         s2c,
		CommonTypesSchema: ct,
		CatalogSchema:     cat,
	}
}

// normalizeValue round-trips through JSON so YAML int → float64, etc.
func normalizeValue(v any) any {
	data, err := json.Marshal(v)
	if err != nil {
		return v
	}
	var out any
	_ = json.Unmarshal(data, &out)
	return out
}

func partsToSerializable(parts []ResponsePart) []any {
	out := make([]any, len(parts))
	for i, p := range parts {
		m := map[string]any{}
		if p.Text != "" {
			m["text"] = p.Text
		}
		if p.A2UIJSON != nil {
			m["a2ui"] = p.A2UIJSON
		}
		out[i] = m
	}
	return out
}

func assertPartsMatch(t *testing.T, step int, actual []ResponsePart, expected []any) {
	t.Helper()
	if len(actual) != len(expected) {
		aj, _ := json.MarshalIndent(partsToSerializable(actual), "", "  ")
		ej, _ := json.MarshalIndent(expected, "", "  ")
		t.Fatalf("step %d: got %d parts, want %d\n  actual:   %s\n  expected: %s",
			step, len(actual), len(expected), aj, ej)
	}
	for i, part := range actual {
		exp, ok := expected[i].(map[string]any)
		if !ok {
			t.Fatalf("step %d, part[%d]: expected is %T, want map", step, i, expected[i])
		}

		wantText, _ := exp["text"].(string)
		if part.Text != wantText {
			t.Errorf("step %d, part[%d].Text = %q, want %q", step, i, part.Text, wantText)
		}

		if a2ui, has := exp["a2ui"]; has {
			if part.A2UIJSON == nil {
				t.Errorf("step %d, part[%d].A2UIJSON is nil, want %v", step, i, a2ui)
				continue
			}
			aN := normalizeValue(part.A2UIJSON)
			eN := normalizeValue(a2ui)
			if !reflect.DeepEqual(aN, eN) {
				aj, _ := json.MarshalIndent(aN, "      ", "  ")
				ej, _ := json.MarshalIndent(eN, "      ", "  ")
				t.Errorf("step %d, part[%d].A2UIJSON mismatch:\n      got:  %s\n      want: %s",
					step, i, aj, ej)
			}
		} else if part.A2UIJSON != nil {
			t.Errorf("step %d, part[%d].A2UIJSON = %v, want nil", step, i, part.A2UIJSON)
		}
	}
}

// ---------------------------------------------------------------------------
// Parser conformance
// ---------------------------------------------------------------------------

func TestParserConformance(t *testing.T) {
	data, err := os.ReadFile(conformancePath("parser.yaml"))
	if err != nil {
		t.Fatalf("read parser.yaml: %v", err)
	}
	var cases []parserConformanceCase
	if err := yaml.Unmarshal(data, &cases); err != nil {
		t.Fatalf("parse parser.yaml: %v", err)
	}

	for _, tc := range cases {
		if tc.Catalog.Version != schema.Version09 {
			continue // Go SDK only supports v0.9
		}
		t.Run(tc.Name, func(t *testing.T) {
			catalog := setupConformanceCatalog(t, tc.Catalog)
			p := NewA2uiStreamParser(catalog)

			for si, step := range tc.ProcessChunk {
				parts, err := p.ProcessChunk(step.Input)

				if step.ExpectError != "" {
					if err == nil {
						t.Errorf("step %d: expected error %q, got nil", si, step.ExpectError)
					} else {
						errLower := strings.ToLower(err.Error())
						expLower := strings.ToLower(step.ExpectError)
						re, reErr := regexp.Compile("(?i)" + step.ExpectError)
						if reErr != nil {
							if !strings.Contains(errLower, expLower) {
								t.Errorf("step %d: error %q doesn't contain %q", si, err.Error(), step.ExpectError)
							}
						} else if !re.MatchString(err.Error()) {
							t.Errorf("step %d: error %q doesn't match /%s/", si, err.Error(), step.ExpectError)
						}
					}
					continue
				}

				if err != nil {
					t.Fatalf("step %d: unexpected error: %v (input: %q)", si, err, step.Input)
				}

				assertPartsMatch(t, si, parts, step.Expect)
			}
		})
	}
}

// ---------------------------------------------------------------------------
// Validator conformance
// ---------------------------------------------------------------------------

func TestValidatorConformance(t *testing.T) {
	data, err := os.ReadFile(conformancePath("validator.yaml"))
	if err != nil {
		t.Fatalf("read validator.yaml: %v", err)
	}
	var cases []validatorConformanceCase
	if err := yaml.Unmarshal(data, &cases); err != nil {
		t.Fatalf("parse validator.yaml: %v", err)
	}

	for _, tc := range cases {
		if tc.Catalog.Version != schema.Version09 {
			continue // Go SDK only supports v0.9
		}
		t.Run(tc.Name, func(t *testing.T) {
			catalog := setupConformanceCatalog(t, tc.Catalog)
			validator := schema.NewA2uiValidator(catalog)

			for ci, vc := range tc.Validate {
				// Normalize the YAML payload through JSON for type consistency.
				payload := normalizeValue(vc.Payload)

				vErr := validator.Validate(payload, "", true)

				if vc.ExpectError != "" {
					if vErr == nil {
						t.Errorf("case %d: expected error %q, got nil", ci, vc.ExpectError)
					} else {
						errLower := strings.ToLower(vErr.Error())
						expLower := strings.ToLower(vc.ExpectError)
						re, reErr := regexp.Compile("(?i)" + vc.ExpectError)
						if reErr != nil {
							if !strings.Contains(errLower, expLower) {
								t.Errorf("case %d: error %q doesn't contain %q", ci, vErr.Error(), vc.ExpectError)
							}
						} else if !re.MatchString(vErr.Error()) {
							t.Errorf("case %d: error %q doesn't match /%s/", ci, vErr.Error(), vc.ExpectError)
						}
					}
				} else {
					if vErr != nil {
						t.Errorf("case %d: unexpected error: %v", ci, vErr)
					}
				}
			}
		})
	}
}
