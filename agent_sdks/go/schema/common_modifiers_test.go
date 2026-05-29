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
	"testing"
)

func TestRemoveStrictValidation(t *testing.T) {
	schema := map[string]any{
		"type": "object",
		"properties": map[string]any{
			"a": map[string]any{"type": "string", "additionalProperties": false},
			"b": map[string]any{
				"type":  "array",
				"items": map[string]any{"type": "object", "additionalProperties": false},
			},
		},
		"additionalProperties": false,
	}

	modified := RemoveStrictValidation(schema)
	modifiedMap := modified.(map[string]any)

	// Check that additionalProperties: false is removed at top level
	if _, ok := modifiedMap["additionalProperties"]; ok {
		t.Error("additionalProperties should be removed at top level")
	}

	// Check nested property "a"
	props := modifiedMap["properties"].(map[string]any)
	a := props["a"].(map[string]any)
	if _, ok := a["additionalProperties"]; ok {
		t.Error("additionalProperties should be removed from property 'a'")
	}

	// Check deeply nested items
	b := props["b"].(map[string]any)
	items := b["items"].(map[string]any)
	if _, ok := items["additionalProperties"]; ok {
		t.Error("additionalProperties should be removed from b.items")
	}

	// Check that original is not mutated
	if schema["additionalProperties"] != false {
		t.Error("original schema should not be mutated")
	}
	origProps := schema["properties"].(map[string]any)
	origA := origProps["a"].(map[string]any)
	if origA["additionalProperties"] != false {
		t.Error("original nested schema should not be mutated")
	}
}

func TestRemoveStrictValidationPreservesTrue(t *testing.T) {
	schema := map[string]any{
		"type":                 "object",
		"additionalProperties": true,
	}

	modified := RemoveStrictValidation(schema)
	modifiedMap := modified.(map[string]any)

	// additionalProperties: true should be preserved
	if val, ok := modifiedMap["additionalProperties"]; !ok || val != true {
		t.Error("additionalProperties: true should be preserved")
	}
}

func TestRemoveStrictValidationArray(t *testing.T) {
	schema := []any{
		map[string]any{"additionalProperties": false, "type": "object"},
		map[string]any{"additionalProperties": true, "type": "string"},
	}

	modified := RemoveStrictValidation(schema)
	modifiedArr := modified.([]any)

	first := modifiedArr[0].(map[string]any)
	if _, ok := first["additionalProperties"]; ok {
		t.Error("additionalProperties: false should be removed from array element")
	}

	second := modifiedArr[1].(map[string]any)
	if val, ok := second["additionalProperties"]; !ok || val != true {
		t.Error("additionalProperties: true should be preserved in array element")
	}
}

func TestRemoveStrictValidationPrimitive(t *testing.T) {
	// Primitive values should pass through unchanged
	if RemoveStrictValidation("hello") != "hello" {
		t.Error("string should pass through unchanged")
	}
	if RemoveStrictValidation(42) != 42 {
		t.Error("int should pass through unchanged")
	}
	if RemoveStrictValidation(nil) != nil {
		t.Error("nil should pass through unchanged")
	}
}
