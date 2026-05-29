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
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// CatalogConfig holds configuration for a catalog of components.
type CatalogConfig struct {
	// Name is the name of the catalog.
	Name string
	// Provider loads the catalog schema.
	Provider A2uiCatalogProvider
	// ExamplesPath is the path or glob pattern to the examples.
	ExamplesPath string
}

// NewCatalogConfigFromPath creates a CatalogConfig that loads from a local path or file:// URI.
func NewCatalogConfigFromPath(name, catalogPath string, examplesPath string) (*CatalogConfig, error) {
	parsed, err := url.Parse(catalogPath)
	if err != nil {
		return nil, fmt.Errorf("invalid catalog path: %w", err)
	}

	var provider A2uiCatalogProvider
	switch {
	case parsed.Scheme == "" || parsed.Scheme == "file":
		provider = &FileSystemCatalogProvider{Path: parsed.Path}
	case parsed.Scheme == "http" || parsed.Scheme == "https":
		return nil, fmt.Errorf("HTTP support is coming soon")
	default:
		return nil, fmt.Errorf("unsupported catalog URL scheme: %s", catalogPath)
	}

	resolvedExamples, err := resolveExamplesPath(examplesPath)
	if err != nil {
		return nil, err
	}

	return &CatalogConfig{
		Name:         name,
		Provider:     provider,
		ExamplesPath: resolvedExamples,
	}, nil
}

func resolveExamplesPath(path string) (string, error) {
	if path == "" {
		return "", nil
	}
	parsed, err := url.Parse(path)
	if err != nil {
		return "", err
	}
	if parsed.Scheme == "" || parsed.Scheme == "file" {
		return parsed.Path, nil
	}
	return "", fmt.Errorf("unsupported examples URL scheme: %s", path)
}

// collectRefs recursively collects all $ref values from a JSON object.
func collectRefs(obj any) map[string]struct{} {
	refs := make(map[string]struct{})
	collectRefsRecursive(obj, refs)
	return refs
}

func collectRefsRecursive(obj any, refs map[string]struct{}) {
	switch v := obj.(type) {
	case map[string]any:
		for k, val := range v {
			if k == "$ref" {
				if s, ok := val.(string); ok {
					refs[s] = struct{}{}
				}
			} else {
				collectRefsRecursive(val, refs)
			}
		}
	case []any:
		for _, item := range v {
			collectRefsRecursive(item, refs)
		}
	}
}

// pruneDefsByReachability prunes definitions not reachable from the provided roots.
func pruneDefsByReachability(defs map[string]any, rootDefNames []string, internalRefPrefix string) map[string]any {
	if internalRefPrefix == "" {
		internalRefPrefix = "#/$defs/"
	}

	visited := make(map[string]struct{})
	queue := make([]string, len(rootDefNames))
	copy(queue, rootDefNames)

	for len(queue) > 0 {
		defName := queue[0]
		queue = queue[1:]

		defVal, exists := defs[defName]
		if !exists {
			continue
		}
		if _, seen := visited[defName]; seen {
			continue
		}
		visited[defName] = struct{}{}

		internalRefs := collectRefs(defVal)
		for ref := range internalRefs {
			if strings.HasPrefix(ref, internalRefPrefix) {
				parts := strings.SplitAfter(ref, internalRefPrefix)
				if len(parts) > 1 {
					queue = append(queue, parts[len(parts)-1])
				}
			}
		}
	}

	result := make(map[string]any, len(visited))
	for k, v := range defs {
		if _, ok := visited[k]; ok {
			result[k] = v
		}
	}
	return result
}

// A2uiCatalog represents a processed component catalog with its schema.
type A2uiCatalog struct {
	// Version is the version of the catalog.
	Version string
	// Name is the name of the catalog.
	Name string
	// S2CSchema is the server-to-client schema.
	S2CSchema map[string]any
	// CommonTypesSchema is the common types schema.
	CommonTypesSchema map[string]any
	// CatalogSchema is the catalog schema.
	CatalogSchema map[string]any
}

// CatalogID returns the catalog ID from the catalog schema.
func (c *A2uiCatalog) CatalogID() (string, error) {
	id, ok := c.CatalogSchema[CatalogIDKey]
	if !ok {
		return "", fmt.Errorf("catalog '%s' missing catalogId", c.Name)
	}
	s, ok := id.(string)
	if !ok {
		return "", fmt.Errorf("catalog '%s' has non-string catalogId", c.Name)
	}
	return s, nil
}

// WithPruning returns a new catalog with pruned components and messages.
func (c *A2uiCatalog) WithPruning(allowedComponents, allowedMessages []string) *A2uiCatalog {
	catalog := c
	if len(allowedComponents) > 0 {
		catalog = catalog.withPrunedComponents(allowedComponents)
	}
	if len(allowedMessages) > 0 {
		catalog = catalog.withPrunedMessages(allowedMessages)
	}
	return catalog.withPrunedCommonTypes()
}

func (c *A2uiCatalog) withPrunedComponents(allowedComponents []string) *A2uiCatalog {
	if len(allowedComponents) == 0 {
		return c
	}

	schemaCopy := deepCopyMap(c.CatalogSchema)
	allowed := toSet(allowedComponents)

	if comps, ok := schemaCopy[CatalogComponentsKey].(map[string]any); ok {
		filtered := make(map[string]any, len(allowed))
		for k, v := range comps {
			if _, ok := allowed[k]; ok {
				filtered[k] = v
			}
		}
		schemaCopy[CatalogComponentsKey] = filtered
	}

	// Filter anyComponent oneOf
	if defs, ok := schemaCopy["$defs"].(map[string]any); ok {
		if anyComp, ok := defs["anyComponent"].(map[string]any); ok {
			if oneOf, ok := anyComp["oneOf"].([]any); ok {
				var filtered []any
				prefix := fmt.Sprintf("#/%s/", CatalogComponentsKey)
				for _, item := range oneOf {
					itemMap, ok := item.(map[string]any)
					if !ok {
						continue
					}
					ref, ok := itemMap["$ref"].(string)
					if !ok {
						logger.Printf("skipping non-ref item in anyComponent oneOf: %v", item)
						continue
					}
					if strings.HasPrefix(ref, prefix) {
						parts := strings.Split(ref, "/")
						compName := parts[len(parts)-1]
						if _, ok := allowed[compName]; ok {
							filtered = append(filtered, item)
						}
					} else {
						logger.Printf("skipping unknown ref format: %s", ref)
					}
				}
				anyComp["oneOf"] = filtered
			}
		}
	}

	return &A2uiCatalog{
		Version:           c.Version,
		Name:              c.Name,
		S2CSchema:         c.S2CSchema,
		CommonTypesSchema: c.CommonTypesSchema,
		CatalogSchema:     schemaCopy,
	}
}

func (c *A2uiCatalog) withPrunedMessages(allowedMessages []string) *A2uiCatalog {
	if len(allowedMessages) == 0 {
		return c
	}

	s2cCopy := deepCopyMap(c.S2CSchema)
	allowed := toSet(allowedMessages)

	if oneOf, ok := s2cCopy["oneOf"].([]any); ok {
		var filtered []any
		for _, item := range oneOf {
			itemMap, ok := item.(map[string]any)
			if !ok {
				continue
			}
			ref, ok := itemMap["$ref"].(string)
			if !ok || !strings.HasPrefix(ref, "#/$defs/") {
				continue
			}
			parts := strings.Split(ref, "/")
			name := parts[len(parts)-1]
			if _, ok := allowed[name]; ok {
				filtered = append(filtered, item)
			}
		}
		s2cCopy["oneOf"] = filtered
	}

	if defs, ok := s2cCopy["$defs"].(map[string]any); ok {
		rootNames := make([]string, 0, len(allowed))
		for k := range allowed {
			rootNames = append(rootNames, k)
		}
		s2cCopy["$defs"] = pruneDefsByReachability(defs, rootNames, "#/$defs/")
	}

	return &A2uiCatalog{
		Version:           c.Version,
		Name:              c.Name,
		S2CSchema:         s2cCopy,
		CommonTypesSchema: c.CommonTypesSchema,
		CatalogSchema:     c.CatalogSchema,
	}
}

func (c *A2uiCatalog) withPrunedCommonTypes() *A2uiCatalog {
	if c.CommonTypesSchema == nil {
		return c
	}
	defs, ok := c.CommonTypesSchema["$defs"].(map[string]any)
	if !ok {
		return c
	}

	externalRefs := collectRefs(c.CatalogSchema)
	s2cRefs := collectRefs(c.S2CSchema)
	for ref := range s2cRefs {
		externalRefs[ref] = struct{}{}
	}

	var rootCommonTypes []string
	for ref := range externalRefs {
		if strings.HasPrefix(ref, "common_types.json#/$defs/") {
			parts := strings.SplitAfter(ref, "#/$defs/")
			if len(parts) > 1 {
				rootCommonTypes = append(rootCommonTypes, parts[len(parts)-1])
			}
		}
	}

	newCommon := deepCopyMap(c.CommonTypesSchema)
	newCommon["$defs"] = pruneDefsByReachability(defs, rootCommonTypes, "#/$defs/")

	return &A2uiCatalog{
		Version:           c.Version,
		Name:              c.Name,
		S2CSchema:         c.S2CSchema,
		CommonTypesSchema: newCommon,
		CatalogSchema:     c.CatalogSchema,
	}
}

// RenderAsLLMInstructions renders the catalog and schema as LLM instructions.
func (c *A2uiCatalog) RenderAsLLMInstructions() string {
	var parts []string
	parts = append(parts, A2UISchemaBlockStart)

	s2cStr := "{}"
	if c.S2CSchema != nil {
		if b, err := json.MarshalIndent(c.S2CSchema, "", "  "); err == nil {
			s2cStr = string(b)
		}
	}
	parts = append(parts, fmt.Sprintf("### Server To Client Schema:\n%s", s2cStr))

	if c.CommonTypesSchema != nil {
		if defs, ok := c.CommonTypesSchema["$defs"].(map[string]any); ok && len(defs) > 0 {
			if b, err := json.MarshalIndent(c.CommonTypesSchema, "", "  "); err == nil {
				parts = append(parts, fmt.Sprintf("### Common Types Schema:\n%s", string(b)))
			}
		}
	}

	if b, err := json.MarshalIndent(c.CatalogSchema, "", "  "); err == nil {
		parts = append(parts, fmt.Sprintf("### Catalog Schema:\n%s", string(b)))
	}

	parts = append(parts, A2UISchemaBlockEnd)
	return strings.Join(parts, "\n\n")
}

// LoadExamples loads and optionally validates examples from a directory or glob pattern.
func (c *A2uiCatalog) LoadExamples(path string, validate bool) (string, error) {
	if path == "" {
		return "", nil
	}
	return c.loadExamplesFromDisk(path, validate)
}

// loadExamplesFromDisk loads examples from the OS filesystem.
func (c *A2uiCatalog) loadExamplesFromDisk(path string, validate bool) (string, error) {
	pattern := path
	info, err := os.Stat(path)
	if err == nil && info.IsDir() {
		pattern = filepath.Join(path, "*.json")
	}

	matches, err := filepath.Glob(pattern)
	if err != nil {
		return "", fmt.Errorf("invalid glob pattern %s: %w", pattern, err)
	}

	if len(matches) == 0 {
		return "", nil
	}

	sort.Strings(matches)
	return c.buildExamplesOutput(matches, validate, func(p string) ([]byte, error) {
		return os.ReadFile(p)
	}, func(p string) (bool, error) {
		info, err := os.Stat(p)
		if err != nil {
			return false, err
		}
		return info.IsDir(), nil
	})
}

// buildExamplesOutput builds the merged examples string from matched paths.
func (c *A2uiCatalog) buildExamplesOutput(
	matches []string,
	validate bool,
	readFile func(string) ([]byte, error),
	isDir func(string) (bool, error),
) (string, error) {
	var validator *A2uiValidator
	if validate {
		validator = NewA2uiValidator(c)
	}

	var merged []string
	for _, fullPath := range matches {
		if dir, err := isDir(fullPath); err != nil || dir {
			continue
		}
		basename := strings.TrimSuffix(filepath.Base(fullPath), filepath.Ext(fullPath))
		content, err := readFile(fullPath)
		if err != nil {
			continue
		}

		if validator != nil {
			var jsonData any
			if err := json.Unmarshal(content, &jsonData); err != nil {
				return "", fmt.Errorf("failed to validate example %s: %w", fullPath, err)
			}
			if err := validator.Validate(jsonData, "", false); err != nil {
				return "", fmt.Errorf("failed to validate example %s: %w", fullPath, err)
			}
		}

		merged = append(merged, fmt.Sprintf("---BEGIN %s---\n%s\n---END %s---", basename, string(content), basename))
	}

	if len(merged) == 0 {
		return "", nil
	}
	return strings.Join(merged, "\n\n"), nil
}

// deepCopyMap creates a deep copy of a map[string]any using recursive traversal.
func deepCopyMap(m map[string]any) map[string]any {
	if m == nil {
		return nil
	}
	result := make(map[string]any, len(m))
	for k, v := range m {
		result[k] = deepCopyAny(v)
	}
	return result
}

// deepCopyAny creates a deep copy of any JSON-compatible value.
func deepCopyAny(v any) any {
	switch val := v.(type) {
	case map[string]any:
		return deepCopyMap(val)
	case []any:
		s := make([]any, len(val))
		for i, item := range val {
			s[i] = deepCopyAny(item)
		}
		return s
	default:
		return v
	}
}

// toSet converts a string slice to a set (map[string]struct{}).
func toSet(items []string) map[string]struct{} {
	s := make(map[string]struct{}, len(items))
	for _, item := range items {
		s[item] = struct{}{}
	}
	return s
}
