package main

// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/google/A2UI/a2a_agents/go/a2ui"
)

// ComponentCatalogBuilder handles loading and merging component catalogs.
type ComponentCatalogBuilder struct {
	a2uiSchemaContent        string
	uriToLocalCatalogContent map[string]string
	defaultCatalogURI        string
}

// NewComponentCatalogBuilder creates a new ComponentCatalogBuilder.
func NewComponentCatalogBuilder(schemaContent string, uriToLocalContent map[string]string, defaultURI string) *ComponentCatalogBuilder {
	return &ComponentCatalogBuilder{
		a2uiSchemaContent:        schemaContent,
		uriToLocalCatalogContent: uriToLocalContent,
		defaultCatalogURI:        defaultURI,
	}
}

// LoadA2UISchema loads the schema and catalog based on client capabilities.
func (b *ComponentCatalogBuilder) LoadA2UISchema(clientUICapabilities map[string]interface{}) (map[string]interface{}, string, error) {
	log.Printf("Loading A2UI client capabilities %v", clientUICapabilities)

	var catalogURI string
	var inlineCatalogStr string

	if clientUICapabilities != nil {
		supportedIDsRaw, _ := clientUICapabilities[a2ui.SupportedCatalogIDsKey].([]interface{})
		var supportedIDs []string
		for _, id := range supportedIDsRaw {
			if strID, ok := id.(string); ok {
				supportedIDs = append(supportedIDs, strID)
			}
		}

		// Check supported catalogs
		found := false
		for _, uri := range []string{RizzchartsCatalogURI, a2ui.StandardCatalogID} {
			for _, supported := range supportedIDs {
				if supported == uri {
					catalogURI = uri
					found = true
					break
				}
			}
			if found {
				break
			}
		}

		inlineCatalogStr, _ = clientUICapabilities[a2ui.InlineCatalogsKey].(string)
	} else if b.defaultCatalogURI != "" {
		log.Printf("Using default catalog %s since client UI capabilities not found", b.defaultCatalogURI)
		catalogURI = b.defaultCatalogURI
	} else {
		return nil, "", fmt.Errorf("client UI capabilities not provided")
	}

	var catalogJSON map[string]interface{}

	if catalogURI != "" && inlineCatalogStr != "" {
		return nil, "", fmt.Errorf("cannot set both supportedCatalogIds and inlineCatalogs")
	} else if catalogURI != "" {
		if content, ok := b.uriToLocalCatalogContent[catalogURI]; ok {
			log.Printf("Loading local component catalog with uri %s", catalogURI)
			if err := json.Unmarshal([]byte(content), &catalogJSON); err != nil {
				return nil, "", fmt.Errorf("failed to parse local catalog: %w", err)
			}
		} else {
			return nil, "", fmt.Errorf("local component catalog with URI %s not found", catalogURI)
		}
	} else if inlineCatalogStr != "" {
		log.Printf("Loading inline component catalog")
		if err := json.Unmarshal([]byte(inlineCatalogStr), &catalogJSON); err != nil {
			return nil, "", fmt.Errorf("failed to parse inline catalog: %w", err)
		}
	} else {
		return nil, "", fmt.Errorf("no supported catalogs found")
	}

	// Simple $ref resolution for the sample: if the catalog refs the standard catalog, merge them.
	if components, ok := catalogJSON["components"].(map[string]interface{}); ok {
		if ref, ok := components["$ref"].(string); ok {
			// Heuristic: if it looks like the standard catalog ref, merge standard components.
			if strings.Contains(ref, "standard_catalog_definition.json") {
				if standardContent, ok := b.uriToLocalCatalogContent[a2ui.StandardCatalogID]; ok {
					var standardJSON map[string]interface{}
					if err := json.Unmarshal([]byte(standardContent), &standardJSON); err == nil {
						if standardComps, ok := standardJSON["components"].(map[string]interface{}); ok {
							log.Println("Merging standard components into custom catalog")
							for k, v := range standardComps {
								if _, exists := components[k]; !exists {
									components[k] = v
								}
							}
							delete(components, "$ref")
						}
					}
				}
			}
		}
	}

	log.Println("Loading A2UI schema")
	var a2uiSchemaJSON map[string]interface{}
	if err := json.Unmarshal([]byte(b.a2uiSchemaContent), &a2uiSchemaJSON); err != nil {
		return nil, "", fmt.Errorf("failed to parse A2UI schema: %w", err)
	}

	// Merge catalog into schema
	// Path: properties -> surfaceUpdate -> properties -> components -> items -> properties -> component -> properties
	if props, ok := a2uiSchemaJSON["properties"].(map[string]interface{}); ok {
		if su, ok := props["surfaceUpdate"].(map[string]interface{}); ok {
			if suProps, ok := su["properties"].(map[string]interface{}); ok {
				if comps, ok := suProps["components"].(map[string]interface{}); ok {
					if items, ok := comps["items"].(map[string]interface{}); ok {
						if itemsProps, ok := items["properties"].(map[string]interface{}); ok {
							if comp, ok := itemsProps["component"].(map[string]interface{}); ok {
								// Correctly drill down to "components" in the catalog definition if it exists.
								// This matches how catalogs are structured (e.g., standard_catalog_definition.json has a top-level "components" key).
								if components, ok := catalogJSON["components"].(map[string]interface{}); ok {
									comp["properties"] = components
								} else {
									comp["properties"] = catalogJSON
								}
							}
						}
					}
				}
			}
		}
	}

	return a2uiSchemaJSON, catalogURI, nil
}
