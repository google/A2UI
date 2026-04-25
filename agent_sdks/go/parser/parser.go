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
	"regexp"
	"strings"

	"github.com/google/a2ui/agent_sdks/go/schema"
)

// a2uiBlockPattern matches content between <a2ui-json> and </a2ui-json> tags.
var a2uiBlockPattern = regexp.MustCompile(
	`(?s)` + regexp.QuoteMeta(schema.A2UIOpenTag) + `(.*?)` + regexp.QuoteMeta(schema.A2UICloseTag),
)

// HasA2UIParts checks if the content has A2UI parts.
func HasA2UIParts(content string) bool {
	return strings.Contains(content, schema.A2UIOpenTag) && strings.Contains(content, schema.A2UICloseTag)
}

// sanitizeJSONString removes markdown code blocks from the JSON string.
func sanitizeJSONString(jsonString string) string {
	jsonString = strings.TrimSpace(jsonString)
	jsonString = strings.TrimPrefix(jsonString, "```json")
	jsonString = strings.TrimPrefix(jsonString, "```")
	jsonString = strings.TrimSuffix(jsonString, "```")
	jsonString = strings.TrimSpace(jsonString)
	return jsonString
}

// ParseResponse parses the LLM response into a list of ResponsePart objects.
//
// It extracts A2UI JSON blocks delimited by <a2ui-json> and </a2ui-json> tags,
// sanitizes the JSON, and returns both text and structured parts.
func ParseResponse(content string) ([]ResponsePart, error) {
	matches := a2uiBlockPattern.FindAllStringSubmatchIndex(content, -1)

	if len(matches) == 0 {
		return nil, fmt.Errorf("A2UI tags '%s' and '%s' not found in response",
			schema.A2UIOpenTag, schema.A2UICloseTag)
	}

	var responseParts []ResponsePart
	lastEnd := 0

	for _, match := range matches {
		// match[0:2] is the full match, match[2:4] is group 1
		start := match[0]
		end := match[1]

		// Text preceding the JSON block.
		textPart := strings.TrimSpace(content[lastEnd:start])

		// The JSON content within the tags.
		jsonString := content[match[2]:match[3]]
		jsonStringCleaned := sanitizeJSONString(jsonString)
		if jsonStringCleaned == "" {
			return nil, fmt.Errorf("A2UI JSON part is empty")
		}

		jsonData, err := ParseAndFix(jsonStringCleaned)
		if err != nil {
			return nil, fmt.Errorf("failed to parse A2UI JSON: %w", err)
		}
		responseParts = append(responseParts, ResponsePart{
			Text:     textPart,
			A2UIJSON: jsonData,
		})
		lastEnd = end
	}

	// Trailing text after the last JSON block.
	trailingText := strings.TrimSpace(content[lastEnd:])
	if trailingText != "" {
		responseParts = append(responseParts, ResponsePart{
			Text:     trailingText,
			A2UIJSON: nil,
		})
	}

	return responseParts, nil
}
