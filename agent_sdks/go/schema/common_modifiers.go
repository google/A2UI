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

// RemoveStrictValidation recursively removes additionalProperties: false
// from a JSON schema, making it more lenient for LLM-generated output.
func RemoveStrictValidation(schema any) any {
	switch v := schema.(type) {
	case map[string]any:
		newSchema := make(map[string]any, len(v))
		for k, val := range v {
			newSchema[k] = RemoveStrictValidation(val)
		}
		if ap, ok := newSchema["additionalProperties"]; ok {
			if b, isBool := ap.(bool); isBool && !b {
				delete(newSchema, "additionalProperties")
			}
		}
		return newSchema
	case []any:
		result := make([]any, len(v))
		for i, item := range v {
			result[i] = RemoveStrictValidation(item)
		}
		return result
	default:
		return schema
	}
}
