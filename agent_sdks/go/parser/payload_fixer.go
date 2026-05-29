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
	"regexp"
	"strings"
)

// ParseAndFix validates and applies autofixes to a raw JSON string and returns the parsed payload.
func ParseAndFix(payload string) ([]map[string]any, error) {
	normalized := normalizeSmartQuotes(payload)

	result, err := parseJSON(normalized)
	if err != nil {
		logger.Printf("initial A2UI payload validation failed: %v", err)
		updated := removeTrailingCommas(normalized)
		return parseJSON(updated)
	}
	return result, nil
}

// parseJSON parses the payload and returns a list of A2UI JSON objects.
func parseJSON(payload string) ([]map[string]any, error) {
	var raw any
	if err := json.Unmarshal([]byte(payload), &raw); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	switch v := raw.(type) {
	case []any:
		result := make([]map[string]any, 0, len(v))
		for _, item := range v {
			if m, ok := item.(map[string]any); ok {
				result = append(result, m)
			}
		}
		return result, nil
	case map[string]any:
		logger.Printf("received a single JSON object, wrapping in a list for validation")
		return []map[string]any{v}, nil
	default:
		return nil, fmt.Errorf("unexpected JSON type: %T", raw)
	}
}

// normalizeSmartQuotes replaces smart (curly) quotes with standard straight quotes.
func normalizeSmartQuotes(s string) string {
	s = strings.ReplaceAll(s, "\u201C", "\"")
	s = strings.ReplaceAll(s, "\u201D", "\"")
	s = strings.ReplaceAll(s, "\u2018", "'")
	s = strings.ReplaceAll(s, "\u2019", "'")
	return s
}

var trailingCommaRe = regexp.MustCompile(`,\s*([\]}])`)

// removeTrailingCommas attempts to remove trailing commas from a JSON string.
func removeTrailingCommas(s string) string {
	fixed := trailingCommaRe.ReplaceAllString(s, "$1")
	if fixed != s {
		logger.Printf("detected trailing commas in LLM output; applied autofix")
	}
	return fixed
}
