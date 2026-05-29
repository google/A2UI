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
	"fmt"
	"path/filepath"
)

// LoadFromBundledResource loads a schema resource from the embedded assets.
func LoadFromBundledResource(version, resourceKey string, specMap map[string]map[string]string) (map[string]any, error) {
	versionMap, ok := specMap[version]
	if !ok {
		return nil, fmt.Errorf("unknown A2UI version: %s", version)
	}

	relPath, ok := versionMap[resourceKey]
	if !ok {
		return nil, nil // Resource key not present in spec version map; callers treat nil as "not available".
	}

	filename := filepath.Base(relPath)

	// Load from embedded assets
	assetPath := fmt.Sprintf("assets/%s/%s", version, filename)
	data, err := assetsFS.ReadFile(assetPath)
	if err != nil {
		return nil, fmt.Errorf("could not load schema %s for version %s: %w", filename, version, err)
	}

	var result map[string]any
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("could not parse schema %s: %w", filename, err)
	}

	return result, nil
}


