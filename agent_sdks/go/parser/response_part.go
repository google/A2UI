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

// ResponsePart represents a part of the LLM response.
type ResponsePart struct {
	// Text is the conversational text part. Can be an empty string.
	Text string
	// A2UIJSON is the parsed A2UI JSON data. Always a list of maps if
	// it contains A2UI messages. Nil if this part only contains trailing text.
	A2UIJSON []map[string]any
}
