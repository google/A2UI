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
	"fmt"
	"strings"
	"testing"

	"github.com/google/a2ui/agent_sdks/go/schema"
)

func TestParseEmptyResponse(t *testing.T) {
	_, err := ParseResponse("")
	if err == nil {
		t.Error("expected error for empty response")
	}
	if !strings.Contains(err.Error(), "not found in response") {
		t.Errorf("expected 'not found in response' error, got: %v", err)
	}
}

func TestParseResponseOnlyTextNoTags(t *testing.T) {
	_, err := ParseResponse("Only text, no tags.")
	if err == nil {
		t.Error("expected error for text-only response")
	}
	if !strings.Contains(err.Error(), "not found in response") {
		t.Errorf("expected 'not found in response' error, got: %v", err)
	}
}

func TestParseResponseEmptyTags(t *testing.T) {
	content := schema.A2UIOpenTag + schema.A2UICloseTag
	_, err := ParseResponse(content)
	if err == nil {
		t.Error("expected error for empty tags")
	}
	if !strings.Contains(err.Error(), "A2UI JSON part is empty") {
		t.Errorf("expected 'A2UI JSON part is empty' error, got: %v", err)
	}
}

func TestParseResponseOnlyJSONWithTags(t *testing.T) {
	content := fmt.Sprintf("%s\n[{\"id\": \"test\"}]\n%s", schema.A2UIOpenTag, schema.A2UICloseTag)
	parts, err := ParseResponse(content)
	if err != nil {
		t.Fatalf("ParseResponse failed: %v", err)
	}
	if len(parts) != 1 {
		t.Fatalf("expected 1 part, got %d", len(parts))
	}
	if parts[0].Text != "" {
		t.Errorf("expected empty text, got %q", parts[0].Text)
	}
	if len(parts[0].A2UIJSON) != 1 {
		t.Fatalf("expected 1 JSON element, got %d", len(parts[0].A2UIJSON))
	}
	if parts[0].A2UIJSON[0]["id"] != "test" {
		t.Errorf("expected id=test, got %v", parts[0].A2UIJSON[0]["id"])
	}
}

func TestParseResponseWithTextAndTags(t *testing.T) {
	content := fmt.Sprintf("Hello\n%s\n[{\"id\": \"test\"}]\n%s", schema.A2UIOpenTag, schema.A2UICloseTag)
	parts, err := ParseResponse(content)
	if err != nil {
		t.Fatalf("ParseResponse failed: %v", err)
	}
	if len(parts) != 1 {
		t.Fatalf("expected 1 part, got %d", len(parts))
	}
	if parts[0].Text != "Hello" {
		t.Errorf("expected text=Hello, got %q", parts[0].Text)
	}
	if parts[0].A2UIJSON[0]["id"] != "test" {
		t.Errorf("expected id=test, got %v", parts[0].A2UIJSON[0]["id"])
	}
}

func TestParseResponseWithTrailingText(t *testing.T) {
	content := fmt.Sprintf("Hello\n%s\n[{\"id\": \"test\"}]\n%s\nGoodbye",
		schema.A2UIOpenTag, schema.A2UICloseTag)
	parts, err := ParseResponse(content)
	if err != nil {
		t.Fatalf("ParseResponse failed: %v", err)
	}
	if len(parts) != 2 {
		t.Fatalf("expected 2 parts, got %d", len(parts))
	}
	if parts[0].Text != "Hello" {
		t.Errorf("expected text=Hello, got %q", parts[0].Text)
	}
	if parts[0].A2UIJSON[0]["id"] != "test" {
		t.Errorf("expected id=test, got %v", parts[0].A2UIJSON[0]["id"])
	}
	if parts[1].Text != "Goodbye" {
		t.Errorf("expected text=Goodbye, got %q", parts[1].Text)
	}
	if parts[1].A2UIJSON != nil {
		t.Errorf("expected nil A2UIJSON for trailing text, got %v", parts[1].A2UIJSON)
	}
}

func TestParseResponseMultipleBlocks(t *testing.T) {
	content := fmt.Sprintf(`
Part 1
%s
[{"id": "1"}]
%s
Part 2
%s
[{"id": "2"}]
%s
Part 3
  `, schema.A2UIOpenTag, schema.A2UICloseTag, schema.A2UIOpenTag, schema.A2UICloseTag)
	parts, err := ParseResponse(content)
	if err != nil {
		t.Fatalf("ParseResponse failed: %v", err)
	}
	if len(parts) != 3 {
		t.Fatalf("expected 3 parts, got %d", len(parts))
	}

	if parts[0].Text != "Part 1" {
		t.Errorf("expected text='Part 1', got %q", parts[0].Text)
	}
	if parts[0].A2UIJSON[0]["id"] != "1" {
		t.Errorf("expected id=1, got %v", parts[0].A2UIJSON[0]["id"])
	}

	if parts[1].Text != "Part 2" {
		t.Errorf("expected text='Part 2', got %q", parts[1].Text)
	}
	if parts[1].A2UIJSON[0]["id"] != "2" {
		t.Errorf("expected id=2, got %v", parts[1].A2UIJSON[0]["id"])
	}

	if parts[2].Text != "Part 3" {
		t.Errorf("expected text='Part 3', got %q", parts[2].Text)
	}
	if parts[2].A2UIJSON != nil {
		t.Errorf("expected nil A2UIJSON for trailing text, got %v", parts[2].A2UIJSON)
	}
}

func TestParseResponseWithMarkdownBlocks(t *testing.T) {
	content := fmt.Sprintf("Text\n%s\n```json\n[{\"id\": \"test\"}]\n```\n%s",
		schema.A2UIOpenTag, schema.A2UICloseTag)
	parts, err := ParseResponse(content)
	if err != nil {
		t.Fatalf("ParseResponse failed: %v", err)
	}
	if len(parts) != 1 {
		t.Fatalf("expected 1 part, got %d", len(parts))
	}
	if parts[0].Text != "Text" {
		t.Errorf("expected text=Text, got %q", parts[0].Text)
	}
	if parts[0].A2UIJSON[0]["id"] != "test" {
		t.Errorf("expected id=test, got %v", parts[0].A2UIJSON[0]["id"])
	}
}

func TestParseResponseInvalidJSON(t *testing.T) {
	content := fmt.Sprintf("%s\ninvalid_json\n%s", schema.A2UIOpenTag, schema.A2UICloseTag)
	_, err := ParseResponse(content)
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
}

func TestHasA2UIParts(t *testing.T) {
	tests := []struct {
		content  string
		expected bool
	}{
		{
			content:  fmt.Sprintf("%s test %s", schema.A2UIOpenTag, schema.A2UICloseTag),
			expected: true,
		},
		{
			content:  "no tags here",
			expected: false,
		},
		{
			content:  schema.A2UIOpenTag + " only open tag",
			expected: false,
		},
		{
			content:  "only close tag " + schema.A2UICloseTag,
			expected: false,
		},
	}

	for _, tt := range tests {
		got := HasA2UIParts(tt.content)
		if got != tt.expected {
			t.Errorf("HasA2UIParts(%q) = %v, want %v", tt.content, got, tt.expected)
		}
	}
}

func TestSanitizeJSONString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"plain", `[{"id": "test"}]`, `[{"id": "test"}]`},
		{"with json fence", "```json\n[{\"id\": \"test\"}]\n```", `[{"id": "test"}]`},
		{"with plain fence", "```\n[{\"id\": \"test\"}]\n```", `[{"id": "test"}]`},
		{"with spaces", "  [  ]  ", "[  ]"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := sanitizeJSONString(tt.input)
			if got != tt.expected {
				t.Errorf("sanitizeJSONString(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}
