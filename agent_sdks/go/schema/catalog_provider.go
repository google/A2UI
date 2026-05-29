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

// Package schema provides A2UI catalog schemas and resource loading.
package schema

import (
	"encoding/json"
	"fmt"
	"os"
)

// A2uiCatalogProvider is the interface for loading catalog definitions.
type A2uiCatalogProvider interface {
	// Load loads a catalog definition and returns it as a map.
	Load() (map[string]any, error)
}

// FileSystemCatalogProvider loads catalog definitions from the local filesystem.
type FileSystemCatalogProvider struct {
	Path string
}

// Load reads and parses a JSON catalog file from the filesystem.
func (p *FileSystemCatalogProvider) Load() (map[string]any, error) {
	data, err := os.ReadFile(p.Path)
	if err != nil {
		return nil, fmt.Errorf("could not load schema from %s: %w", p.Path, err)
	}

	var result map[string]any
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("could not parse schema from %s: %w", p.Path, err)
	}

	return result, nil
}

// RawCatalogProvider loads a catalog definition from raw JSON bytes.
type RawCatalogProvider struct {
	Data []byte
}

// Load parses the raw JSON bytes into a catalog definition map.
func (p *RawCatalogProvider) Load() (map[string]any, error) {
	var result map[string]any
	if err := json.Unmarshal(p.Data, &result); err != nil {
		return nil, fmt.Errorf("could not parse raw catalog JSON: %w", err)
	}
	return result, nil
}
