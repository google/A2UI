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

// Package basiccatalog provides the bundled basic A2UI catalog.
package basiccatalog

import (
	"github.com/google/a2ui/agent_sdks/go/schema"
)

// BasicCatalogName is the name of the basic catalog.
const BasicCatalogName = "basic"

// BasicCatalogPaths maps version to the relative path of the basic catalog schema.
var BasicCatalogPaths = map[string]map[string]string{
	schema.Version09: {
		schema.CatalogSchemaKey: "specification/v0_9/json/basic_catalog.json",
	},
}

// BundledCatalogProvider loads schemas from bundled package resources.
type BundledCatalogProvider struct {
	Version string
}

// Load loads the basic catalog schema from bundled resources.
func (p *BundledCatalogProvider) Load() (map[string]any, error) {
	resource, err := schema.LoadFromBundledResource(p.Version, schema.CatalogSchemaKey, BasicCatalogPaths)
	if err != nil {
		return nil, err
	}

	// Post-load processing for catalogs.
	if _, ok := resource[schema.CatalogIDKey]; !ok {
		specMap, ok := BasicCatalogPaths[p.Version]
		if ok {
			if relPath, ok := specMap[schema.CatalogSchemaKey]; ok {
				resource[schema.CatalogIDKey] = schema.BaseSchemaURL + relPath
			}
		}
	}

	if _, ok := resource["$schema"]; !ok {
		resource["$schema"] = "https://json-schema.org/draft/2020-12/schema"
	}

	return resource, nil
}

// GetConfig returns a CatalogConfig for the basic bundled catalog.
func GetConfig(version string, examplesPath string) schema.CatalogConfig {
	return schema.CatalogConfig{
		Name:         BasicCatalogName,
		Provider:     &BundledCatalogProvider{Version: version},
		ExamplesPath: examplesPath,
	}
}
