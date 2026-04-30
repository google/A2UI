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
	"regexp"
	"sort"
	"strings"

	"github.com/santhosh-tekuri/jsonschema/v6"
	"github.com/santhosh-tekuri/jsonschema/v6/kind"
)

// Recursion limits.
const (
	MaxGlobalDepth   = 50
	MaxFuncCallDepth = 5
)

// Component field names.
const (
	FieldComponents   = "components"
	FieldID           = "id"
	FieldRoot         = "root"
	FieldPath         = "path"
	FieldFunctionCall = "functionCall"
	FieldCall         = "call"
	FieldArgs         = "args"
)

// RelaxedPathPattern is an A2UI relaxed path pattern (extends RFC 6901 to support relative paths).
var RelaxedPathPattern = regexp.MustCompile(
	`^(?:(?:/(?:[^~/]|~[01])*)*|(?:[^~/]|~[01])+(?:/(?:[^~/]|~[01])*)*)$`,
)

// RefFieldsMap maps component names to their (singleRefFields, listRefFields).
type RefFieldsMap map[string]RefFields

// RefFields holds the single and list reference field names for a component type.
type RefFields struct {
	SingleRefs map[string]struct{}
	ListRefs   map[string]struct{}
}

// A2uiValidator validates A2UI JSON payloads against the schema and checks integrity.
type A2uiValidator struct {
	catalog  *A2uiCatalog
	version  string
	compiler *jsonschema.Compiler
}

// NewA2uiValidator creates a new validator for the given catalog.
func NewA2uiValidator(catalog *A2uiCatalog) *A2uiValidator {
	version := Version09
	if catalog != nil {
		version = catalog.Version
	}
	v := &A2uiValidator{
		catalog: catalog,
		version: version,
	}
	v.compiler = v.buildCompiler()
	return v
}

// buildCompiler sets up a JSON Schema compiler with all schema resources registered.
func (v *A2uiValidator) buildCompiler() *jsonschema.Compiler {
	if v.catalog == nil {
		return nil
	}
	c := jsonschema.NewCompiler()

	baseURI := BaseSchemaURL
	if v.catalog.S2CSchema != nil {
		if id, ok := v.catalog.S2CSchema["$id"].(string); ok {
			baseURI = id
		}
	}

	// Derive sibling URIs from the base URI.
	base := baseURI
	if idx := strings.LastIndex(base, "/"); idx >= 0 {
		base = base[:idx+1]
	}
	catalogURI := base + "catalog.json"
	commonTypesURI := base + "common_types.json"

	// Register schemas. We re-marshal and re-parse through jsonschema.UnmarshalJSON
	// so the compiler receives the types it expects (e.g. json.Number).
	addResource := func(uri string, schema map[string]any) {
		if schema == nil {
			return
		}
		data, err := json.Marshal(schema)
		if err != nil {
			return
		}
		doc, err := jsonschema.UnmarshalJSON(strings.NewReader(string(data)))
		if err != nil {
			return
		}
		_ = c.AddResource(uri, doc)
	}

	addResource(baseURI, v.catalog.S2CSchema)
	addResource(catalogURI, v.catalog.CatalogSchema)
	addResource(commonTypesURI, v.catalog.CommonTypesSchema)

	// Fallbacks for relative references.
	addResource("catalog.json", v.catalog.CatalogSchema)
	addResource("common_types.json", v.catalog.CommonTypesSchema)

	// Register catalog by its catalogId if different.
	if catalogID, err := v.catalog.CatalogID(); err == nil && catalogID != catalogURI {
		addResource(catalogID, v.catalog.CatalogSchema)
	}

	return c
}

// Validate validates an A2UI message or list of messages.
func (v *A2uiValidator) Validate(a2uiJSON any, rootID string, strictIntegrity bool) error {
	var messages []map[string]any
	switch val := a2uiJSON.(type) {
	case []any:
		for _, item := range val {
			if m, ok := item.(map[string]any); ok {
				messages = append(messages, m)
			}
		}
	case map[string]any:
		messages = []map[string]any{val}
	default:
		return fmt.Errorf("a2ui_json must be a dict or list")
	}

	if v.version == Version09 {
		return v.validate09Custom(messages, rootID, strictIntegrity)
	}

	// Fallback for non-0.9 versions: integrity checks only.
	for _, message := range messages {
		var components []any
		var surfaceID string
		if uc, ok := message["updateComponents"].(map[string]any); ok {
			components, _ = toAnySlice(uc[FieldComponents])
			surfaceID, _ = uc[SurfaceIDKey].(string)
		}
		if len(components) > 0 {
			compList := toComponentList(components)
			refMap := ExtractComponentRefFields(v.catalog)
			if fid := findRootID(messages, surfaceID); fid != "" {
				rootID = fid
			}
			if err := ValidateComponentIntegrity(rootID, compList, refMap, !strictIntegrity); err != nil {
				return err
			}
			if _, err := AnalyzeTopology(rootID, compList, refMap, strictIntegrity); err != nil {
				return err
			}
		}
		if err := ValidateRecursionAndPaths(message); err != nil {
			return err
		}
	}
	return nil
}

// validate09Custom performs per-message JSON Schema validation followed by integrity checks,
func (v *A2uiValidator) validate09Custom(messages []map[string]any, rootID string, strictIntegrity bool) error {
	// Phase 1: JSON Schema validation per message.
	var allErrors []string
	for idx, message := range messages {
		if _, ok := message["createSurface"]; ok {
			allErrors = append(allErrors, v.getSubSchemaErrors("CreateSurfaceMessage", message, fmt.Sprintf("messages[%d]", idx))...)
		} else if _, ok := message["updateComponents"]; ok {
			allErrors = append(allErrors, v.getUpdateComponentsErrors(message, fmt.Sprintf("messages[%d]", idx))...)
		} else if _, ok := message["updateDataModel"]; ok {
			allErrors = append(allErrors, v.getSubSchemaErrors("UpdateDataModelMessage", message, fmt.Sprintf("messages[%d]", idx))...)
		} else if _, ok := message["deleteSurface"]; ok {
			allErrors = append(allErrors, v.getSubSchemaErrors("DeleteSurfaceMessage", message, fmt.Sprintf("messages[%d]", idx))...)
		} else {
			keys := make([]string, 0, len(message))
			for k := range message {
				keys = append(keys, k)
			}
			allErrors = append(allErrors, fmt.Sprintf("messages[%d]: Unknown message type with keys %v", idx, keys))
		}
	}
	if len(allErrors) > 0 {
		var sb strings.Builder
		sb.WriteString("Validation failed:")
		for _, e := range allErrors {
			sb.WriteString("\n  - ")
			sb.WriteString(e)
		}
		return fmt.Errorf("%s", sb.String())
	}

	// Phase 2: Integrity checks (component IDs, topology, recursion, paths).
	for _, message := range messages {
		var components []any
		var surfaceID string
		if uc, ok := message["updateComponents"].(map[string]any); ok {
			components, _ = toAnySlice(uc[FieldComponents])
			surfaceID, _ = uc[SurfaceIDKey].(string)
		}
		if len(components) > 0 {
			compList := toComponentList(components)
			refMap := ExtractComponentRefFields(v.catalog)
			if fid := findRootID(messages, surfaceID); fid != "" {
				rootID = fid
			}
			if err := ValidateComponentIntegrity(rootID, compList, refMap, !strictIntegrity); err != nil {
				return err
			}
			if _, err := AnalyzeTopology(rootID, compList, refMap, strictIntegrity); err != nil {
				return err
			}
		}
		if err := ValidateRecursionAndPaths(message); err != nil {
			return err
		}
	}
	return nil
}

// getSubSchemaErrors validates a message against s2c $defs sub-schema.
func (v *A2uiValidator) getSubSchemaErrors(defName string, instance map[string]any, basePath string) []string {
	if v.compiler == nil || v.catalog == nil || v.catalog.S2CSchema == nil {
		return nil
	}

	s2cID, _ := v.catalog.S2CSchema["$id"].(string)
	if s2cID == "" {
		s2cID = BaseSchemaURL
	}
	ref := s2cID + "#/$defs/" + defName

	sch, err := v.compiler.Compile(ref)
	if err != nil {
		return []string{fmt.Sprintf("%s: failed to compile schema for %s: %s", basePath, defName, err)}
	}

	inst := toJSONSchemaValue(instance)
	return formatValidationErrors(sch, inst, basePath)
}

// getUpdateComponentsErrors validates an updateComponents message, checking
// structure and validating each component against its catalog schema.
func (v *A2uiValidator) getUpdateComponentsErrors(message map[string]any, path string) []string {
	var errors []string

	if ver, _ := message["version"].(string); ver != "v0.9" {
		errors = append(errors, fmt.Sprintf("%s: Invalid version, expected 'v0.9'", path))
	}

	uc, ok := message["updateComponents"].(map[string]any)
	if !ok {
		errors = append(errors, fmt.Sprintf("%s: Expected updateComponents to be an object", path))
		return errors
	}

	if sid, ok := uc["surfaceId"].(string); !ok || sid == "" {
		errors = append(errors, fmt.Sprintf("%s.updateComponents: Invalid or missing surfaceId", path))
	}

	components, cOk := toAnySlice(uc["components"])
	if !cOk {
		errors = append(errors, fmt.Sprintf("%s.updateComponents: Expected components to be an array", path))
		return errors
	}

	for idx, comp := range components {
		compMap, ok := comp.(map[string]any)
		if !ok {
			errors = append(errors, fmt.Sprintf("%s.updateComponents.components[%d]: Component is not an object", path, idx))
			continue
		}
		compID, _ := compMap[FieldID].(string)
		var compPath string
		if compID != "" {
			compPath = fmt.Sprintf("%s.updateComponents.components[id='%s']", path, compID)
		} else {
			compPath = fmt.Sprintf("%s.updateComponents.components[%d]", path, idx)
		}
		errors = append(errors, v.getSingleComponentErrors(compMap, compPath)...)
	}
	return errors
}

// getSingleComponentErrors validates a single component against catalog.json#/components/{type}.
func (v *A2uiValidator) getSingleComponentErrors(comp map[string]any, path string) []string {
	compType, _ := comp["component"].(string)
	if compType == "" {
		return []string{fmt.Sprintf("%s: Missing 'component' field", path)}
	}

	if v.catalog == nil || v.catalog.CatalogSchema == nil {
		return []string{fmt.Sprintf("%s: Catalog schema or components missing", path)}
	}

	allComponents, _ := v.catalog.CatalogSchema[CatalogComponentsKey].(map[string]any)
	if _, exists := allComponents[compType]; !exists {
		return []string{fmt.Sprintf("%s: Unknown component: %s", path, compType)}
	}

	if v.compiler == nil {
		return nil
	}

	// Build a $ref to the component schema in catalog.json, same as Python:
	// {"$schema": "...", "$ref": "catalog.json#/components/{type}"}
	ref := "catalog.json#/components/" + compType
	sch, err := v.compiler.Compile(ref)
	if err != nil {
		return []string{fmt.Sprintf("%s: failed to compile schema for component %s: %s", path, compType, err)}
	}

	inst := toJSONSchemaValue(comp)
	return formatValidationErrors(sch, inst, path)
}

// formatValidationErrors runs schema validation and returns formatted error strings.
func formatValidationErrors(sch *jsonschema.Schema, instance any, basePath string) []string {
	err := sch.Validate(instance)
	if err == nil {
		return nil
	}

	ve, ok := err.(*jsonschema.ValidationError)
	if !ok {
		return []string{fmt.Sprintf("%s: %s", basePath, err.Error())}
	}

	var results []string
	collectLeafErrors(ve, basePath, &results, instance)
	return results
}

// collectLeafErrors walks the validation error tree and collects leaf error messages.
func collectLeafErrors(ve *jsonschema.ValidationError, basePath string, results *[]string, instance any) {
	if len(ve.Causes) == 0 {
		// Leaf error.
		pathStr := strings.Join(ve.InstanceLocation, ".")
		fullPath := basePath
		if pathStr != "" {
			fullPath = basePath + "." + pathStr
		}
		var msg string
		if kt, ok := ve.ErrorKind.(*kind.Type); ok {
			// Resolve the actual instance value for Python-compatible error format.
			want := strings.Join(kt.Want, " or ")
			if val := resolveInstanceValue(instance, []string(ve.InstanceLocation)); val != nil {
				if s, ok := val.(string); ok {
					msg = fmt.Sprintf("'%s' is not of type '%s'", s, want)
				} else {
					msg = fmt.Sprintf("%v is not of type '%s'", val, want)
				}
			} else {
				msg = fmt.Sprintf("%s is not of type '%s'", kt.Got, want)
			}
		} else {
			msg = formatErrorKind(ve.ErrorKind)
		}
		// Simplify "unevaluated/additional properties" messages.
		if (strings.Contains(msg, "unevaluated properties") || strings.Contains(msg, "additional properties")) &&
			strings.Contains(msg, "(") && strings.Contains(msg, ")") {
			msg = msg[strings.Index(msg, "(")+1 : strings.LastIndex(msg, ")")]
		}
		*results = append(*results, fmt.Sprintf("%s: %s", fullPath, msg))
		return
	}
	for _, cause := range ve.Causes {
		collectLeafErrors(cause, basePath, results, instance)
	}
}

// resolveInstanceValue walks the instance document using a JSON pointer path
// to find the actual value at that location.
func resolveInstanceValue(instance any, location []string) any {
	current := instance
	for _, token := range location {
		switch v := current.(type) {
		case map[string]any:
			var ok bool
			current, ok = v[token]
			if !ok {
				return nil
			}
		default:
			return nil
		}
	}
	return current
}

// formatErrorKind produces human-readable error messages from jsonschema error kinds,
// matching the style used in Python's jsonschema library for conformance compatibility.
func formatErrorKind(ek jsonschema.ErrorKind) string {
	switch k := ek.(type) {
	case *kind.Required:
		if len(k.Missing) == 1 {
			return fmt.Sprintf("'%s' is a required property", k.Missing[0])
		}
		quoted := make([]string, len(k.Missing))
		for i, m := range k.Missing {
			quoted[i] = "'" + m + "'"
		}
		return fmt.Sprintf("required properties %s are missing", strings.Join(quoted, ", "))
	case *kind.Type:
		want := strings.Join(k.Want, " or ")
		return fmt.Sprintf("%s is not of type '%s'", k.Got, want)
	case *kind.Const:
		return fmt.Sprintf("'%v' was expected", k.Want)
	case *kind.Enum:
		return "is not one of the allowed values"
	case *kind.AdditionalProperties:
		return fmt.Sprintf("additional properties are not allowed (%s)", strings.Join(k.Properties, ", "))
	default:
		return fmt.Sprintf("%v", ek)
	}
}

// toJSONSchemaValue re-parses a Go value through jsonschema.UnmarshalJSON
// so that numbers are represented as json.Number (required by the validator).
// toAnySlice converts []map[string]any to []any, or returns []any as-is.
// This handles the Go type system mismatch where the parser constructs
// []map[string]any but type assertions expect []any.
func toAnySlice(v any) ([]any, bool) {
	switch s := v.(type) {
	case []any:
		return s, true
	case []map[string]any:
		result := make([]any, len(s))
		for i, m := range s {
			result[i] = m
		}
		return result, true
	}
	return nil, false
}

// toJSONSchemaValue re-parses a Go value through jsonschema.UnmarshalJSON so that
// numbers are represented as json.Number (required by the schema validator library).
// When called from the streaming parser (which already uses json.Decoder with
// UseNumber), the re-serialization is largely a no-op for numeric types. This
// conversion remains necessary for values originating from external callers that
// use standard json.Unmarshal (which decodes numbers as float64).
func toJSONSchemaValue(v any) any {
	data, err := json.Marshal(v)
	if err != nil {
		return v
	}
	parsed, err := jsonschema.UnmarshalJSON(strings.NewReader(string(data)))
	if err != nil {
		return v
	}
	return parsed
}

func toComponentList(items []any) []map[string]any {
	var result []map[string]any
	for _, item := range items {
		if m, ok := item.(map[string]any); ok {
			result = append(result, m)
		}
	}
	return result
}

// findRootID finds the root ID from A2UI messages for a given surface.
func findRootID(messages []map[string]any, surfaceID string) string {
	for _, message := range messages {
		if cs, ok := message["createSurface"].(map[string]any); ok {
			if surfaceID != "" {
				if sid, _ := cs[SurfaceIDKey].(string); sid != surfaceID {
					continue
				}
			}
			if r, ok := cs[FieldRoot].(string); ok {
				return r
			}
			return FieldRoot
		}
	}
	return ""
}

// ValidateComponentIntegrity validates component IDs uniqueness, root existence, and dangling refs.
func ValidateComponentIntegrity(rootID string, components []map[string]any, refMap RefFieldsMap, skipRootCheck bool) error {
	ids := make(map[string]struct{})

	// 1. Collect IDs and check for duplicates
	for _, comp := range components {
		compID, _ := comp[FieldID].(string)
		if compID == "" {
			continue
		}
		if _, exists := ids[compID]; exists {
			return fmt.Errorf("duplicate component ID: %s", compID)
		}
		ids[compID] = struct{}{}
	}

	// 2. Check for root component
	if !skipRootCheck && rootID != "" {
		if _, exists := ids[rootID]; !exists {
			return fmt.Errorf("missing root component: no component has id='%s'", rootID)
		}
	}

	// 3. Check for dangling references
	if rootID != "" && !skipRootCheck {
		for _, comp := range components {
			for refID, fieldName := range getComponentReferencesFlat(comp, refMap) {
				if _, exists := ids[refID]; !exists {
					compID, _ := comp[FieldID].(string)
					return fmt.Errorf("component '%s' references non-existent component '%s' in field '%s'",
						compID, refID, fieldName)
				}
			}
		}
	}

	return nil
}

// AnalyzeTopology analyzes the component tree topology and returns reachable IDs.
func AnalyzeTopology(rootID string, components []map[string]any, refMap RefFieldsMap, raiseOnOrphans bool) (map[string]struct{}, error) {
	adjList := make(map[string][]string)
	allIDs := make(map[string]struct{})

	for _, comp := range components {
		compID, _ := comp[FieldID].(string)
		if compID == "" {
			continue
		}
		allIDs[compID] = struct{}{}
		if _, exists := adjList[compID]; !exists {
			adjList[compID] = nil
		}

		for refID, fieldName := range getComponentReferencesFlat(comp, refMap) {
			if refID == compID {
				return nil, fmt.Errorf("self-reference detected: component '%s' references itself in field '%s'", compID, fieldName)
			}
			adjList[compID] = append(adjList[compID], refID)
		}
	}

	visited := make(map[string]struct{})
	recStack := make(map[string]struct{})

	var dfs func(nodeID string, depth int) error
	dfs = func(nodeID string, depth int) error {
		if depth > MaxGlobalDepth {
			return fmt.Errorf("global recursion limit exceeded: logical depth > %d", MaxGlobalDepth)
		}
		visited[nodeID] = struct{}{}
		recStack[nodeID] = struct{}{}

		for _, neighbor := range adjList[nodeID] {
			if _, seen := visited[neighbor]; !seen {
				if err := dfs(neighbor, depth+1); err != nil {
					return err
				}
			} else if _, inStack := recStack[neighbor]; inStack {
				return fmt.Errorf("circular reference detected involving component '%s'", neighbor)
			}
		}

		delete(recStack, nodeID)
		return nil
	}

	if rootID != "" {
		if _, exists := allIDs[rootID]; exists {
			if err := dfs(rootID, 0); err != nil {
				return nil, err
			}
		}

		if raiseOnOrphans {
			var orphans []string
			for id := range allIDs {
				if _, ok := visited[id]; !ok {
					orphans = append(orphans, id)
				}
			}
			if len(orphans) > 0 {
				sort.Strings(orphans)
				return nil, fmt.Errorf("component '%s' is not reachable from '%s'", orphans[0], rootID)
			}
		}
	} else {
		// No root: traverse everything to check for cycles
		sortedIDs := make([]string, 0, len(allIDs))
		for id := range allIDs {
			sortedIDs = append(sortedIDs, id)
		}
		sort.Strings(sortedIDs)
		for _, nodeID := range sortedIDs {
			if _, ok := visited[nodeID]; !ok {
				if err := dfs(nodeID, 0); err != nil {
					return nil, err
				}
			}
		}
	}

	return visited, nil
}

// ExtractComponentRefFields parses the catalog to identify which component properties reference other components.
func ExtractComponentRefFields(catalog *A2uiCatalog) RefFieldsMap {
	refMap := make(RefFieldsMap)
	if catalog == nil {
		return refMap
	}

	var allComponents map[string]any
	if catalog.CatalogSchema != nil {
		allComponents, _ = catalog.CatalogSchema[FieldComponents].(map[string]any)
	}

	for compName, compSchema := range allComponents {
		cs, ok := compSchema.(map[string]any)
		if !ok {
			continue
		}
		singleRefs := make(map[string]struct{})
		listRefs := make(map[string]struct{})
		extractRefFieldsFromProps(cs, singleRefs, listRefs)

		if len(singleRefs) > 0 || len(listRefs) > 0 {
			refMap[compName] = RefFields{SingleRefs: singleRefs, ListRefs: listRefs}
		}
	}

	return refMap
}

func extractRefFieldsFromProps(cs map[string]any, singleRefs, listRefs map[string]struct{}) {
	props, _ := cs["properties"].(map[string]any)
	for propName, propSchema := range props {
		ps, _ := propSchema.(map[string]any)
		if ps == nil {
			continue
		}
		if isComponentIDRef(ps) || propName == "child" || propName == "contentChild" || propName == "entryPointChild" {
			singleRefs[propName] = struct{}{}
		} else if isChildListRef(ps) || propName == "children" {
			listRefs[propName] = struct{}{}
		}
	}

	for _, key := range []string{"allOf", "oneOf", "anyOf"} {
		if arr, ok := cs[key].([]any); ok {
			for _, sub := range arr {
				if subMap, ok := sub.(map[string]any); ok {
					extractRefFieldsFromProps(subMap, singleRefs, listRefs)
				}
			}
		}
	}
}

func isComponentIDRef(ps map[string]any) bool {
	if ref, ok := ps["$ref"].(string); ok {
		if strings.HasSuffix(ref, "ComponentId") || strings.HasSuffix(ref, "child") || strings.Contains(ref, "/child") {
			return true
		}
	}
	if ps["type"] == "string" && ps["title"] == "ComponentId" {
		return true
	}
	for _, key := range []string{"oneOf", "anyOf", "allOf"} {
		if arr, ok := ps[key].([]any); ok {
			for _, sub := range arr {
				if subMap, ok := sub.(map[string]any); ok && isComponentIDRef(subMap) {
					return true
				}
			}
		}
	}
	return false
}

func isChildListRef(ps map[string]any) bool {
	if ref, ok := ps["$ref"].(string); ok {
		if strings.HasSuffix(ref, "ChildList") || strings.HasSuffix(ref, "children") || strings.Contains(ref, "/children") {
			return true
		}
	}
	if ps["type"] == "object" {
		if props, ok := ps["properties"].(map[string]any); ok {
			if _, ok := props["explicitList"]; ok {
				return true
			}
			if _, ok := props["template"]; ok {
				return true
			}
			if _, ok := props["componentId"]; ok {
				return true
			}
		}
	}
	if ps["type"] == "array" {
		if items, ok := ps["items"].(map[string]any); ok && isComponentIDRef(items) {
			return true
		}
	}
	for _, key := range []string{"oneOf", "anyOf", "allOf"} {
		if arr, ok := ps[key].([]any); ok {
			for _, sub := range arr {
				if subMap, ok := sub.(map[string]any); ok && isChildListRef(subMap) {
					return true
				}
			}
		}
	}
	return false
}

// getComponentReferencesFlat returns referenced component IDs mapped to their field names.
func getComponentReferencesFlat(component map[string]any, refMap RefFieldsMap) map[string]string {
	result := make(map[string]string)

	compVal := component["component"]
	switch cv := compVal.(type) {
	case string:
		// v0.9 flattened
		getRefsRecursively(cv, component, refMap, result)
	case map[string]any:
		// structured
		for cType, cProps := range cv {
			if propsMap, ok := cProps.(map[string]any); ok {
				getRefsRecursively(cType, propsMap, refMap, result)
			}
		}
	}
	return result
}

// Heuristic field sets for reference detection.
var (
	heuristicSingle = map[string]struct{}{
		"child": {}, "contentChild": {}, "entryPointChild": {},
		"detail": {}, "summary": {}, "root": {},
	}
	heuristicList = map[string]struct{}{
		"children": {}, "explicitList": {}, "template": {},
	}
)

func getRefsRecursively(compType string, props map[string]any, refMap RefFieldsMap, result map[string]string) {
	if compType == "" || props == nil {
		return
	}

	rf := refMap[compType]

	for key, value := range props {
		_, isSingleRef := rf.SingleRefs[key]
		_, isHeuristicSingle := heuristicSingle[key]
		_, isListRef := rf.ListRefs[key]
		_, isHeuristicList := heuristicList[key]

		if isSingleRef || isHeuristicSingle {
			if s, ok := value.(string); ok {
				result[s] = key
			} else if vm, ok := value.(map[string]any); ok {
				if cid, ok := vm["componentId"].(string); ok {
					result[cid] = key + ".componentId"
				}
			}
		} else if isListRef || isHeuristicList {
			switch v := value.(type) {
			case []any:
				for _, item := range v {
					if s, ok := item.(string); ok {
						result[s] = key
					}
				}
			case map[string]any:
				if explList, ok := v["explicitList"].([]any); ok {
					for _, item := range explList {
						if s, ok := item.(string); ok {
							result[s] = key + ".explicitList"
						}
					}
				} else if tpl, ok := v["template"].(map[string]any); ok {
					if cid, ok := tpl["componentId"].(string); ok {
						result[cid] = key + ".template.componentId"
					}
				} else if cid, ok := v["componentId"].(string); ok {
					result[cid] = key + ".componentId"
				}
			}
		}

		// Handle nested arrays (e.g., tabs)
		if arr, ok := value.([]any); ok && !isListRef {
			for i, item := range arr {
				if itemMap, ok := item.(map[string]any); ok {
					if childID, ok := itemMap["child"].(string); ok {
						result[childID] = fmt.Sprintf("%s[%d].child", key, i)
					}
				}
			}
		}
	}
}

// ValidateRecursionAndPaths validates recursion depth limits and path syntax.
func ValidateRecursionAndPaths(data any) error {
	return validateRecursionAndPathsRecursive(data, 0, 0)
}

func validateRecursionAndPathsRecursive(item any, globalDepth, funcDepth int) error {
	if globalDepth > MaxGlobalDepth {
		return fmt.Errorf("global recursion limit exceeded: depth > %d", MaxGlobalDepth)
	}

	switch v := item.(type) {
	case []any:
		for _, x := range v {
			if err := validateRecursionAndPathsRecursive(x, globalDepth+1, funcDepth); err != nil {
				return err
			}
		}
	case map[string]any:
		// Check path
		if p, ok := v[FieldPath].(string); ok {
			if !RelaxedPathPattern.MatchString(p) {
				return fmt.Errorf("invalid path syntax: '%s'", p)
			}
		}

		// Check for FunctionCall
		_, hasCall := v[FieldCall]
		_, hasArgs := v[FieldArgs]
		isFunc := hasCall && hasArgs

		if isFunc {
			if funcDepth >= MaxFuncCallDepth {
				return fmt.Errorf("recursion limit exceeded: %s depth > %d", FieldFunctionCall, MaxFuncCallDepth)
			}
			for k, val := range v {
				if k == FieldArgs {
					if err := validateRecursionAndPathsRecursive(val, globalDepth+1, funcDepth+1); err != nil {
						return err
					}
				} else {
					if err := validateRecursionAndPathsRecursive(val, globalDepth+1, funcDepth); err != nil {
						return err
					}
				}
			}
		} else {
			for _, val := range v {
				if err := validateRecursionAndPathsRecursive(val, globalDepth+1, funcDepth); err != nil {
					return err
				}
			}
		}
	}

	return nil
}
