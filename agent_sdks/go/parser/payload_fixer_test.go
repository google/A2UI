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
	"testing"
)

func TestRemoveTrailingCommas(t *testing.T) {
	// Malformed JSON with a trailing comma in the list
	malformedList := `[{"type": "Text", "text": "Hello"},]`
	fixedList := removeTrailingCommas(malformedList)
	expected := `[{"type": "Text", "text": "Hello"}]`
	if fixedList != expected {
		t.Errorf("removeTrailingCommas list: got %q, want %q", fixedList, expected)
	}

	// Malformed JSON with a trailing comma in the object
	malformedObj := `{"type": "Text", "text": "Hello",}`
	fixedObj := removeTrailingCommas(malformedObj)
	expectedObj := `{"type": "Text", "text": "Hello"}`
	if fixedObj != expectedObj {
		t.Errorf("removeTrailingCommas obj: got %q, want %q", fixedObj, expectedObj)
	}
}

func TestRemoveTrailingCommasNoChange(t *testing.T) {
	validJSON := `[{"type": "Text", "text": "Hello"}]`
	fixed := removeTrailingCommas(validJSON)
	if fixed != validJSON {
		t.Errorf("removeTrailingCommas should not modify valid JSON: got %q, want %q", fixed, validJSON)
	}
}

func TestParseJSONWrapping(t *testing.T) {
	// _parse auto-wraps single objects in a list
	objJSON := `{"type": "Text", "text": "Hello"}`
	parsed, err := parseJSON(objJSON)
	if err != nil {
		t.Fatalf("parseJSON failed: %v", err)
	}
	if len(parsed) != 1 {
		t.Fatalf("expected 1 element, got %d", len(parsed))
	}
	if parsed[0]["type"] != "Text" {
		t.Errorf("expected type=Text, got %v", parsed[0]["type"])
	}
}

func TestParseAndFixSuccessFirstTime(t *testing.T) {
	validJSON := `[{"type": "Text", "text": "Hello"}]`
	result, err := ParseAndFix(validJSON)
	if err != nil {
		t.Fatalf("ParseAndFix failed: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("expected 1 element, got %d", len(result))
	}
	if result[0]["type"] != "Text" {
		t.Errorf("expected type=Text, got %v", result[0]["type"])
	}
	if result[0]["text"] != "Hello" {
		t.Errorf("expected text=Hello, got %v", result[0]["text"])
	}
}

func TestParseAndFixSuccessAfterFix(t *testing.T) {
	malformedJSON := `[{"type": "Text", "text": "Hello"},]`
	result, err := ParseAndFix(malformedJSON)
	if err != nil {
		t.Fatalf("ParseAndFix failed: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("expected 1 element, got %d", len(result))
	}
	if result[0]["type"] != "Text" {
		t.Errorf("expected type=Text, got %v", result[0]["type"])
	}
}

func TestNormalizesSmartQuotes(t *testing.T) {
	// Smart (curly) quotes should be replaced with standard quotes
	smartQuotesJSON := "{\u201Ctype\u201D: \u201CText\u201D, \u201Cother\u201D: \u201CValue\u2019s\u201D}"
	result, err := ParseAndFix(smartQuotesJSON)
	if err != nil {
		t.Fatalf("ParseAndFix failed: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("expected 1 element, got %d", len(result))
	}
	if result[0]["type"] != "Text" {
		t.Errorf("expected type=Text, got %v", result[0]["type"])
	}
	if result[0]["other"] != "Value's" {
		t.Errorf("expected other=Value's, got %v", result[0]["other"])
	}
}

func TestParseJSONInvalid(t *testing.T) {
	_, err := parseJSON("not valid json")
	if err == nil {
		t.Error("expected error for invalid JSON, got nil")
	}
}

func TestParseJSONArray(t *testing.T) {
	arrayJSON := `[{"a": 1}, {"b": 2}]`
	result, err := parseJSON(arrayJSON)
	if err != nil {
		t.Fatalf("parseJSON failed: %v", err)
	}
	if len(result) != 2 {
		t.Fatalf("expected 2 elements, got %d", len(result))
	}
}

func TestParseJSONUnexpectedType(t *testing.T) {
	_, err := parseJSON(`"just a string"`)
	if err == nil {
		t.Error("expected error for unexpected JSON type, got nil")
	}
}
