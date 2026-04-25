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
	"sort"
	"strings"

	"github.com/google/a2ui/agent_sdks/go/schema"
)

// CuttableKeys contains keys whose string values can be safely auto-closed (healed)
// if fragmented in the stream. Structural or atomic keys (e.g., id, surfaceId, path)
// are NOT cuttable to prevent incorrect parsing or data binding.
var CuttableKeys = map[string]struct{}{
	"literalString": {},
	"valueString":   {},
	"label":         {},
	"hint":          {},
	"caption":       {},
	"altText":       {},
	"text":          {},
}

// braceEntry tracks the type and position of an opening brace/bracket.
type braceEntry struct {
	bType    string // "{" or "["
	startIdx int
}

// streamParserImpl defines the interface that version-specific parsers must implement.
type streamParserImpl interface {
	// placeholderComponent returns the version-specific placeholder component.
	placeholderComponent() map[string]any
	// yieldedSurfacesSet returns a reference to the yielded surfaces tracking set.
	yieldedSurfacesSet() map[string]struct{}
	// addToYieldedSurfaces adds a surface to the yielded set.
	addToYieldedSurfaces(sid string)
	// removeFromYieldedSurfaces removes a surface from the yielded set.
	removeFromYieldedSurfaces(sid string)
	// isProtocolMsg checks if the object is a recognized A2UI message for this version.
	isProtocolMsg(obj map[string]any) bool
	// dataModelMsgType returns the message type identifier for data model updates.
	dataModelMsgType() string
	// getActiveMsgTypeForComponents determines which msg_type to use when wrapping component updates.
	getActiveMsgTypeForComponents() string
	// handleCompleteObject handles an object that has been fully parsed.
	handleCompleteObject(obj map[string]any, sid string, messages *[]ResponsePart) (bool, error)
	// constructPartialMessage constructs a partial message for streaming.
	constructPartialMessage(components []map[string]any, activeMsgType string) map[string]any
	// sniffMetadata sniffs for surfaceId, root, and msg_types in the json_buffer.
	sniffMetadata()
	// deduplicateDataModel returns true if message should be yielded.
	deduplicateDataModel(m map[string]any, strictIntegrity bool) bool
	// sniffPartialDataModel sniffs for partial data model updates.
	sniffPartialDataModel(messages *[]ResponsePart)
	// constructSniffedDataModelMessage constructs a sniffed data model message.
	constructSniffedDataModelMessage(activeMsgType string, payload map[string]any) map[string]any
}

// A2uiStreamParser parses a stream of text for A2UI JSON messages with fine-grained
// component yielding. Use NewA2uiStreamParser to create a version-specific parser.
type A2uiStreamParser struct {
	impl streamParserImpl

	version      string
	refFieldsMap schema.RefFieldsMap
	validator    *schema.A2uiValidator

	foundDelimiter bool
	buffer         string
	jsonBuffer     string
	braceStack     []braceEntry
	braceCount     int
	inTopLevelList bool
	inString       bool
	stringEscaped  bool

	seenComponents map[string]map[string]any

	// Track data model for path resolution.
	yieldedDataModel map[string]any
	deletedSurfaces  map[string]struct{}

	// surfaceId -> set of cids
	yieldedIDs map[string]map[string]struct{}
	// (surfaceId, cid) -> hash of content for change detection
	yieldedContents map[[2]string]string

	rootIDs       map[string]string // root component IDs per surface
	defaultRootID string            // base default root ID for the protocol
	unboundRootID *string           // temporary holding when root arrives before surfaceId
	surfaceID     *string           // active surface ID

	msgTypes      []string // running list of message types seen in the block
	activeMsgType string   // current active message type for component grouping

	// A set of surface ids for which we have already yielded a start message.
	yieldedStartMessages map[string]struct{}

	// State for buffering updates until surface is ready.
	pendingMessages     map[string][]map[string]any
	bufferedStartMsg    map[string]any
	topologyDirty       bool
	foundValidJSONBlock bool
}

// NewA2uiStreamParser creates a streaming parser for A2UI v0.9.
func NewA2uiStreamParser(catalog *schema.A2uiCatalog) *A2uiStreamParser {
	version := ""
	if catalog != nil {
		version = catalog.Version
	}

	var refFieldsMap schema.RefFieldsMap
	if catalog != nil {
		refFieldsMap = schema.ExtractComponentRefFields(catalog)
	} else {
		refFieldsMap = make(schema.RefFieldsMap)
	}

	var validator *schema.A2uiValidator
	if catalog != nil {
		validator = schema.NewA2uiValidator(catalog)
	}

	p := &A2uiStreamParser{
		version:              version,
		refFieldsMap:         refFieldsMap,
		validator:            validator,
		seenComponents:       make(map[string]map[string]any),
		yieldedDataModel:     make(map[string]any),
		deletedSurfaces:      make(map[string]struct{}),
		yieldedIDs:           make(map[string]map[string]struct{}),
		yieldedContents:      make(map[[2]string]string),
		rootIDs:              make(map[string]string),
		yieldedStartMessages: make(map[string]struct{}),
		pendingMessages:      make(map[string][]map[string]any),
	}

	p.impl = newStreamParserV09(p)
	p.defaultRootID = DefaultRootID

	return p
}

// SurfaceID returns the current surface ID.
func (p *A2uiStreamParser) SurfaceID() string {
	if p.surfaceID == nil {
		return ""
	}
	return *p.surfaceID
}

// SetSurfaceID sets the current surface ID.
func (p *A2uiStreamParser) SetSurfaceID(value string) {
	p.surfaceID = &value
	if p.unboundRootID != nil {
		p.rootIDs[value] = *p.unboundRootID
		p.unboundRootID = nil
	}
}

// RootID returns the current root component ID.
func (p *A2uiStreamParser) RootID() string {
	if p.surfaceID != nil {
		if rid, ok := p.rootIDs[*p.surfaceID]; ok {
			return rid
		}
		return p.defaultRootID
	}
	if p.unboundRootID != nil {
		return *p.unboundRootID
	}
	return p.defaultRootID
}

// SetRootID sets the root component ID.
func (p *A2uiStreamParser) SetRootID(value string) {
	if p.surfaceID != nil {
		p.rootIDs[*p.surfaceID] = value
	} else {
		p.unboundRootID = &value
	}
}

// MsgTypes returns the list of message types seen.
func (p *A2uiStreamParser) MsgTypes() []string {
	return p.msgTypes
}

// AddMsgType adds a message type if not already present.
func (p *A2uiStreamParser) AddMsgType(msgType string) {
	found := false
	for _, mt := range p.msgTypes {
		if mt == msgType {
			found = true
			break
		}
	}
	if !found {
		p.msgTypes = append(p.msgTypes, msgType)
	}
	if msgType == MsgTypeUpdateComponents || msgType == MsgTypeCreateSurface {
		p.activeMsgType = msgType
	}
}

// ProcessChunk processes a chunk of text and returns any complete A2UI messages found.
// This is the primary entry point for the streaming parser.
func (p *A2uiStreamParser) ProcessChunk(chunk string) ([]ResponsePart, error) {
	var messages []ResponsePart
	p.buffer += chunk

	for {
		if !p.foundDelimiter {
			// Looking for <a2ui-json>
			if idx := strings.Index(p.buffer, schema.A2UIOpenTag); idx >= 0 {
				if idx > 0 {
					messages = append(messages, ResponsePart{Text: p.buffer[:idx]})
				}
				p.foundDelimiter = true
				p.buffer = p.buffer[idx+len(schema.A2UIOpenTag):]
				continue
			}
			// Yield conversational text while avoiding split tags.
			keepLen := 0
			for i := len(schema.A2UIOpenTag) - 1; i > 0; i-- {
				if strings.HasSuffix(p.buffer, schema.A2UIOpenTag[:i]) {
					keepLen = i
					break
				}
			}
			if len(p.buffer) > keepLen {
				safeToYield := len(p.buffer) - keepLen
				messages = append(messages, ResponsePart{Text: p.buffer[:safeToYield]})
				p.buffer = p.buffer[safeToYield:]
			}
			break
		}

		// Looking for </a2ui-json>
		if idx := strings.Index(p.buffer, schema.A2UICloseTag); idx >= 0 {
			jsonFragment := p.buffer[:idx]
			if err := p.processJSONChunk(jsonFragment, &messages); err != nil {
				return messages, err
			}
			if !p.foundValidJSONBlock {
				return messages, fmt.Errorf("failed to parse JSON: No valid JSON object found in A2UI block")
			}
			p.foundDelimiter = false
			p.resetJSONState()
			p.buffer = p.buffer[idx+len(schema.A2UICloseTag):]
			continue
		}
		// Avoid split close tag.
		keepLen := 0
		for i := 1; i < len(schema.A2UICloseTag); i++ {
			if strings.HasSuffix(p.buffer, schema.A2UICloseTag[:i]) {
				keepLen = i
			}
		}
		if keepLen < len(p.buffer) {
			toProcess := p.buffer[:len(p.buffer)-keepLen]
			p.buffer = p.buffer[len(p.buffer)-keepLen:]
			if err := p.processJSONChunk(toProcess, &messages); err != nil {
				return messages, err
			}
		}
		break
	}

	// Deduplicate updateComponents messages.
	for i := range messages {
		part := &messages[i]
		if len(part.A2UIJSON) == 0 {
			continue
		}
		var deduped []map[string]any
		seenUC := make(map[string]struct{})
		for j := len(part.A2UIJSON) - 1; j >= 0; j-- {
			m := part.A2UIJSON[j]
			isUC := false
			sid := ""
			if uc, ok := m[MsgTypeUpdateComponents].(map[string]any); ok {
				isUC = true
				sid, _ = uc[schema.SurfaceIDKey].(string)
			}
			if isUC && sid != "" {
				if _, seen := seenUC[sid]; !seen {
					deduped = append(deduped, m)
					seenUC[sid] = struct{}{}
				}
			} else {
				deduped = append(deduped, m)
			}
		}
		// Reverse deduped.
		for left, right := 0, len(deduped)-1; left < right; left, right = left+1, right-1 {
			deduped[left], deduped[right] = deduped[right], deduped[left]
		}
		part.A2UIJSON = deduped
	}

	return messages, nil
}

func (p *A2uiStreamParser) resetJSONState() {
	p.jsonBuffer = ""
	p.braceStack = nil
	p.braceCount = 0
	p.inTopLevelList = false
	p.inString = false
	p.stringEscaped = false
	p.msgTypes = nil
	p.foundValidJSONBlock = false
}

// fixJSON attempts to fix a partial JSON fragment by adding missing closing delimiters.
func (p *A2uiStreamParser) fixJSON(fragment string) string {
	fixed := strings.TrimRight(fragment, " \t\n\r")
	if fixed == "" {
		return ""
	}

	stack := []string{}
	inStr := false
	escaped := false
	lastQuoteIdx := -1

	for i, ch := range fixed {
		if escaped {
			escaped = false
			continue
		}
		if ch == '\\' {
			escaped = true
			continue
		}
		if ch == '"' {
			inStr = !inStr
			if inStr {
				lastQuoteIdx = i
			}
		} else if !inStr {
			if ch == '{' || ch == '[' {
				stack = append(stack, string(ch))
			} else if ch == '}' || ch == ']' {
				if len(stack) > 0 {
					stack = stack[:len(stack)-1]
				}
			}
		}
	}

	// Close open strings (healing).
	if inStr {
		prefix := strings.TrimRight(fixed[:lastQuoteIdx], " \t\n\r")
		if strings.HasSuffix(prefix, ":") {
			keyMatchRe := regexp.MustCompile(`"([^"]+)"\s*:\s*$`)
			keyMatches := keyMatchRe.FindStringSubmatch(prefix)
			if len(keyMatches) > 1 {
				key := keyMatches[1]
				if _, ok := CuttableKeys[key]; !ok {
					return ""
				}
				// Don't cut URL bindings.
				if key == "valueString" {
					stringVal := fixed[lastQuoteIdx+1:]
					if strings.HasPrefix(stringVal, "http://") || strings.HasPrefix(stringVal, "https://") ||
						strings.HasPrefix(stringVal, "data:") || strings.HasPrefix(stringVal, "/") {
						return ""
					}
					prevKeyRe := regexp.MustCompile(`"key"\s*:\s*"([^"]+)"`)
					lookback := prefix
					if len(lookback) > 200 {
						lookback = lookback[len(lookback)-200:]
					}
					prevKeyMatches := prevKeyRe.FindAllStringSubmatch(lookback, -1)
					if len(prevKeyMatches) > 0 {
						dataKey := strings.ToLower(prevKeyMatches[len(prevKeyMatches)-1][1])
						for _, urlKey := range []string{"url", "link", "src", "href", "image"} {
							if strings.Contains(dataKey, urlKey) {
								return ""
							}
						}
					}
				}
			}
		}
		fixed += `"`
	}

	// Clean up trailing comma.
	fixed = strings.TrimRight(fixed, " \t\n\r")
	if strings.HasSuffix(fixed, ",") {
		fixed = strings.TrimRight(fixed[:len(fixed)-1], " \t\n\r")
	}

	// Close braces and brackets.
	for i := len(stack) - 1; i >= 0; i-- {
		if stack[i] == "{" {
			fixed += "}"
		} else {
			fixed += "]"
		}
	}

	return fixed
}

// processJSONChunk processes a chunk of JSON characters.
func (p *A2uiStreamParser) processJSONChunk(chunk string, messages *[]ResponsePart) error {
	for _, char := range chunk {
		charHandled := false
		ch := string(char)

		if !p.inTopLevelList {
			if char == '[' {
				if p.braceCount == 0 {
					p.inTopLevelList = true
				}
				p.braceStack = append(p.braceStack, braceEntry{"[", len(p.jsonBuffer)})
				p.jsonBuffer += "["
				p.braceCount++
				charHandled = true
			} else {
				continue
			}
		}

		// Track string state.
		if !charHandled && p.inString {
			if p.stringEscaped {
				p.stringEscaped = false
				if p.braceCount > 0 {
					p.jsonBuffer += ch
				}
			} else if char == '\\' {
				p.stringEscaped = true
				if p.braceCount > 0 {
					p.jsonBuffer += ch
				}
			} else if char == '"' {
				p.inString = false
				if p.braceCount > 0 {
					p.jsonBuffer += ch
				}
			} else {
				if p.braceCount > 0 {
					p.jsonBuffer += ch
				}
			}
			charHandled = true
		}

		if !charHandled {
			switch char {
			case '"':
				p.inString = true
				p.stringEscaped = false
				if p.braceCount > 0 {
					p.jsonBuffer += ch
				}
			case '{':
				if p.braceCount == 0 {
					p.msgTypes = nil
				}
				p.braceStack = append(p.braceStack, braceEntry{"{", len(p.jsonBuffer)})
				p.jsonBuffer += "{"
				p.braceCount++
			case '}':
				if len(p.braceStack) > 0 {
					entry := p.braceStack[len(p.braceStack)-1]
					p.braceStack = p.braceStack[:len(p.braceStack)-1]
					p.jsonBuffer += "}"
					p.braceCount--

					if p.braceCount >= 0 {
						startIdx := entry.startIdx
						objBuffer := p.jsonBuffer[startIdx:]
						if strings.HasPrefix(objBuffer, "{") && strings.HasSuffix(objBuffer, "}") {
							var obj map[string]any
							if err := json.Unmarshal([]byte(objBuffer), &obj); err == nil {
								p.foundValidJSONBlock = true

								isProtocol := p.inTopLevelList && p.impl.isProtocolMsg(obj)
								_, hasID := obj["id"]
								_, hasComp := obj["component"]
								isComp := hasID && hasComp

								isTopLevel := (len(p.braceStack) == 0) ||
									(p.inTopLevelList && len(p.braceStack) == 1 && p.braceStack[0].bType == "[")

								if isComp {
									p.handlePartialComponent(obj, messages)
								} else if isTopLevel || isProtocol {
									handled, hErr := p.impl.handleCompleteObject(obj, p.SurfaceID(), messages)
									if hErr != nil {
										return hErr
									}
									if !handled {
										if err := p.yieldMessages([]map[string]any{obj}, messages, true); err != nil {
											return err
										}
									}
								}

								if p.braceCount == 0 || (p.inTopLevelList && len(p.braceStack) == 1) {
									if len(p.braceStack) == 1 && p.braceStack[0].bType == "[" {
										p.jsonBuffer = p.jsonBuffer[:startIdx] + p.jsonBuffer[startIdx+len(objBuffer):]
									} else {
										p.jsonBuffer = p.jsonBuffer[len(objBuffer):]
										if len(p.braceStack) > 0 {
											shift := len(objBuffer)
											for i := range p.braceStack {
												p.braceStack[i].startIdx -= shift
											}
										}
									}
								}
							}
						}
					}
				}
			case '[':
				p.braceStack = append(p.braceStack, braceEntry{"[", len(p.jsonBuffer)})
				p.jsonBuffer += "["
				p.braceCount++
			case ']':
				if len(p.braceStack) > 0 && p.braceStack[len(p.braceStack)-1].bType == "[" {
					p.braceStack = p.braceStack[:len(p.braceStack)-1]
					p.jsonBuffer += "]"
					p.braceCount--
					if p.braceCount == 0 {
						p.inTopLevelList = false
					}
				}
			default:
				if p.braceCount > 0 {
					p.jsonBuffer += ch
				}
			}
		}

		// Sniff metadata.
		if p.braceCount > 0 && (char == '"' || char == ':' || char == ',' || char == '}' || char == ']') {
			p.impl.sniffMetadata()
		}
	}

	// Sniff for partial components.
	if p.braceCount >= 1 && p.jsonBuffer != "" {
		p.sniffPartialComponent(messages)
		p.impl.sniffPartialDataModel(messages)
	}

	if p.topologyDirty {
		if err := p.yieldReachable(messages, false, false); err != nil {
			return err
		}
		p.topologyDirty = false
	}

	return nil
}

// yieldMessages validates and appends messages to the final output list.
func (p *A2uiStreamParser) yieldMessages(messagesToYield []map[string]any, messages *[]ResponsePart, strictIntegrity bool) error {
	for _, m := range messagesToYield {
		if !p.impl.deduplicateDataModel(m, strictIntegrity) {
			continue
		}

		if p.validator != nil {
			if err := p.validator.Validate(m, p.RootID(), strictIntegrity); err != nil {
				if strictIntegrity {
					return fmt.Errorf("validation failed: %w", err)
				}
				logger.Printf("Validation failed for partial/sniffed message: %v", err)
				continue
			}
		}

		if len(*messages) > 0 && (*messages)[len(*messages)-1].A2UIJSON == nil {
			(*messages)[len(*messages)-1].A2UIJSON = []map[string]any{m}
		} else if len(*messages) > 0 && len((*messages)[len(*messages)-1].A2UIJSON) > 0 {
			(*messages)[len(*messages)-1].A2UIJSON = append((*messages)[len(*messages)-1].A2UIJSON, m)
		} else {
			*messages = append(*messages, ResponsePart{A2UIJSON: []map[string]any{m}})
		}
	}
	return nil
}

// deleteSurface clears all state related to a specific surface.
func (p *A2uiStreamParser) deleteSurface(sid string) {
	delete(p.pendingMessages, sid)
	delete(p.yieldedIDs, sid)

	newContents := make(map[[2]string]string)
	for k, v := range p.yieldedContents {
		if k[0] != sid {
			newContents[k] = v
		}
	}
	p.yieldedContents = newContents

	p.impl.removeFromYieldedSurfaces(sid)
	delete(p.yieldedStartMessages, sid)
	p.deletedSurfaces[sid] = struct{}{}
}

// handlePartialComponent handles a component discovered before its parent message is finished.
func (p *A2uiStreamParser) handlePartialComponent(comp map[string]any, messages *[]ResponsePart) {
	compID, _ := comp["id"].(string)
	if compID == "" {
		return
	}

	// Skip caching if component has empty dictionaries.
	if hasEmptyDict(comp) {
		return
	}

	p.seenComponents[compID] = comp
	p.topologyDirty = true
}

func hasEmptyDict(obj any) bool {
	switch v := obj.(type) {
	case map[string]any:
		if len(v) == 0 {
			return true
		}
		for _, val := range v {
			if hasEmptyDict(val) {
				return true
			}
		}
	case []any:
		for _, item := range v {
			if hasEmptyDict(item) {
				return true
			}
		}
	}
	return false
}

// sniffPartialComponent attempts to parse a partial component from the current buffer.
func (p *A2uiStreamParser) sniffPartialComponent(messages *[]ResponsePart) {
	if !strings.Contains(p.jsonBuffer, `"`+schema.CatalogComponentsKey+`"`) {
		return
	}
	for i := len(p.braceStack) - 1; i >= 0; i-- {
		entry := p.braceStack[i]
		if entry.bType != "{" {
			continue
		}
		rawFragment := p.jsonBuffer[entry.startIdx:]
		if rawFragment == "" {
			continue
		}
		fixedFragment := p.fixJSON(rawFragment)
		var obj map[string]any
		if err := json.Unmarshal([]byte(fixedFragment), &obj); err != nil {
			continue
		}
		idVal, hasID := obj["id"]
		compVal, hasComp := obj["component"]
		if !hasID || !hasComp || idVal == nil {
			continue
		}
		switch cv := compVal.(type) {
		case string:
			p.handlePartialComponent(obj, messages)
		case map[string]any:
			if len(cv) > 0 {
				p.handlePartialComponent(obj, messages)
			}
		}
	}
}

// yieldReachable yields a partial message containing all reachable and seen components.
func (p *A2uiStreamParser) yieldReachable(messages *[]ResponsePart, checkRoot, raiseOnOrphans bool) error {
	activeMsgType := p.impl.getActiveMsgTypeForComponents()
	if p.RootID() == "" || activeMsgType == "" {
		return nil
	}
	if p.surfaceID == nil {
		return nil
	}
	sid := *p.surfaceID
	yieldedSurfaces := p.impl.yieldedSurfacesSet()
	if _, ok := yieldedSurfaces[sid]; !ok {
		if p.bufferedStartMsg == nil {
			return nil
		}
	}

	componentsToAnalyze := make([]map[string]any, 0, len(p.seenComponents))
	for _, comp := range p.seenComponents {
		componentsToAnalyze = append(componentsToAnalyze, comp)
	}

	rootID := p.RootID()
	if checkRoot {
		if _, ok := p.seenComponents[rootID]; !ok {
			logger.Printf("No root component (id='%s') found in %s", rootID, activeMsgType)
			return nil
		}
	}

	reachableIDs, err := schema.AnalyzeTopology(rootID, componentsToAnalyze, p.refFieldsMap, raiseOnOrphans)
	if err != nil {
		errLower := strings.ToLower(err.Error())
		if strings.Contains(errLower, "circular reference detected") || strings.Contains(errLower, "self-reference detected") {
			return err
		}
		if raiseOnOrphans || strings.Contains(errLower, "circular") || strings.Contains(errLower, "self-reference") ||
			strings.Contains(errLower, "recursion") {
			logger.Printf("yield_reachable error (strict=%v): %v", checkRoot, err)
			return nil
		}
		return nil
	}

	// Filter to available reachable IDs.
	availableReachable := make(map[string]struct{})
	for id := range reachableIDs {
		if _, ok := p.seenComponents[id]; ok {
			availableReachable[id] = struct{}{}
		}
	}

	if checkRoot && len(availableReachable) == 0 {
		logger.Printf("No root component (id='%s') found in %s", rootID, activeMsgType)
		return nil
	}

	// Process placeholders and partial children.
	var processedComponents []map[string]any
	var extraComponents []map[string]any
	surfaceID := p.SurfaceID()
	if surfaceID == "" {
		surfaceID = "unknown"
	}
	yieldedForSurface := p.yieldedIDs[surfaceID]

	sortedIDs := make([]string, 0, len(availableReachable))
	for id := range availableReachable {
		sortedIDs = append(sortedIDs, id)
	}
	sort.Strings(sortedIDs)

	for _, rid := range sortedIDs {
		comp := deepCopyAny(p.seenComponents[rid]).(map[string]any)
		_, reYielding := yieldedForSurface[rid]
		p.processComponentTopology(comp, &extraComponents, reYielding)
		processedComponents = append(processedComponents, comp)
	}
	processedComponents = append(processedComponents, extraComponents...)

	// Check if we have NEW or UPDATED reachable components.
	if surfaceID == "" || p.isDeletedSurface(surfaceID) {
		return nil
	}

	shouldYield := false
	for id := range availableReachable {
		if _, ok := yieldedForSurface[id]; !ok {
			shouldYield = true
			break
		}
	}
	if !shouldYield {
		for _, comp := range processedComponents {
			cid, _ := comp["id"].(string)
			contentStr := jsonMarshalSorted(comp)
			stateKey := [2]string{surfaceID, cid}
			if p.yieldedContents[stateKey] != contentStr {
				shouldYield = true
				break
			}
		}
	}

	if shouldYield {
		currentSID := surfaceID
		if _, ok := p.yieldedStartMessages[currentSID]; !ok {
			if p.bufferedStartMsg != nil {
				if err := p.yieldMessages([]map[string]any{p.bufferedStartMsg}, messages, true); err != nil {
					return err
				}
				p.yieldedStartMessages[currentSID] = struct{}{}
				p.impl.addToYieldedSurfaces(currentSID)
			}
		}

		partialMsg := p.impl.constructPartialMessage(processedComponents, activeMsgType)
		p.yieldMessages([]map[string]any{partialMsg}, messages, false)

		if p.yieldedIDs[surfaceID] == nil {
			p.yieldedIDs[surfaceID] = make(map[string]struct{})
		}
		for id := range availableReachable {
			p.yieldedIDs[surfaceID][id] = struct{}{}
		}

		for _, comp := range processedComponents {
			cid, _ := comp["id"].(string)
			p.yieldedContents[[2]string{surfaceID, cid}] = jsonMarshalSorted(comp)
		}
	}
	return nil
}

func (p *A2uiStreamParser) isDeletedSurface(sid string) bool {
	_, ok := p.deletedSurfaces[sid]
	return ok
}

// getPlaceholderID returns the ID to use for a missing child placeholder.
func (p *A2uiStreamParser) getPlaceholderID(childID string) string {
	return "loading_" + childID
}

// processComponentTopology recursively processes path placeholders and child pruning.
func (p *A2uiStreamParser) processComponentTopology(comp map[string]any, extraComponents *[]map[string]any, inlineResolved bool) {
	compID, _ := comp["id"].(string)
	if compID == "" {
		compID = "unknown"
	}

	var traverse func(obj any, parentKey string)
	traverse = func(obj any, parentKey string) {
		switch v := obj.(type) {
		case map[string]any:
			// Handle path placeholders.
			if pathVal, ok := v["path"].(string); ok && strings.HasPrefix(pathVal, "/") {
				key := strings.TrimPrefix(pathVal, "/")
				if p.version != schema.Version09 {
					if _, hasCompID := v["componentId"]; !hasCompID {
						for k := range v {
							delete(v, k)
						}
					}
					v["path"] = "/" + key
				}
			} else if p.version != schema.Version09 {
				if currentPath, ok := v["path"]; ok {
					pathStr := fmt.Sprintf("%v", currentPath)
					if !strings.HasPrefix(pathStr, "/") {
						v["path"] = "/" + pathStr
					}
				}
			}

			// Handle child pruning.
			childFields := []string{"children", "explicitList", "child", "contentChild", "entryPointChild", "componentId"}
			for _, field := range childFields {
				val, ok := v[field]
				if !ok {
					continue
				}
				switch fieldVal := val.(type) {
				case []any:
					var validChildren []any
					for _, childItem := range fieldVal {
						childIDStr, ok := childItem.(string)
						if !ok {
							validChildren = append(validChildren, childItem)
							continue
						}
						if _, ok := p.seenComponents[childIDStr]; ok {
							validChildren = append(validChildren, childIDStr)
						} else {
							placeholderID := p.getPlaceholderID(childIDStr)
							validChildren = append(validChildren, placeholderID)
							placeholderComp := map[string]any{"id": placeholderID}
							for k, pv := range p.impl.placeholderComponent() {
								placeholderComp[k] = pv
							}
							if !containsID(*extraComponents, placeholderID) {
								*extraComponents = append(*extraComponents, placeholderComp)
							}
						}
					}
					if len(validChildren) == 0 && (field == "children" || field == "explicitList") {
						term := `"` + field + `"`
						if strings.Contains(p.jsonBuffer, term) {
							afterField := p.jsonBuffer[strings.LastIndex(p.jsonBuffer, term)+len(term):]
							if strings.Contains(afterField, "[") && !strings.Contains(strings.SplitN(afterField, "[", 2)[0], "]") {
								placeholderID := fmt.Sprintf("loading_children_%s", compID)
								validChildren = append(validChildren, placeholderID)
								placeholderComp := map[string]any{"id": placeholderID}
								for k, pv := range p.impl.placeholderComponent() {
									placeholderComp[k] = pv
								}
								if !containsID(*extraComponents, placeholderID) {
									*extraComponents = append(*extraComponents, placeholderComp)
								}
							}
						}
					}
					v[field] = validChildren
				case string:
					if _, ok := p.seenComponents[fieldVal]; !ok {
						placeholderID := p.getPlaceholderID(fieldVal)
						v[field] = placeholderID
						placeholderComp := map[string]any{"id": placeholderID}
						for k, pv := range p.impl.placeholderComponent() {
							placeholderComp[k] = pv
						}
						if !containsID(*extraComponents, placeholderID) {
							*extraComponents = append(*extraComponents, placeholderComp)
						}
					}
				}
			}

			// Continue traversal.
			for k, val := range v {
				traverse(val, k)
			}
		case []any:
			for _, item := range v {
				traverse(item, parentKey)
			}
		}
	}

	if compMap, ok := comp["component"].(map[string]any); ok {
		traverse(compMap, "")
	} else {
		traverse(comp, "")
	}
}

// parseContentsToDict recursively parses A2UI contents into a flat dictionary.
func (p *A2uiStreamParser) parseContentsToDict(rawContents any) map[string]any {
	switch v := rawContents.(type) {
	case map[string]any:
		return v
	case []any:
		res := make(map[string]any)
		for _, entry := range v {
			e, ok := entry.(map[string]any)
			if !ok {
				continue
			}
			key, _ := e["key"].(string)
			var val any
			for _, vkey := range []string{"value", "valueString", "valueNumber", "valueBoolean"} {
				if vv, ok := e[vkey]; ok {
					val = vv
					break
				}
			}
			if val == nil {
				if vm, ok := e["valueMap"]; ok {
					val = p.parseContentsToDict(vm)
				}
			}
			if key != "" && val != nil {
				res[key] = val
			}
		}
		return res
	}
	return nil
}

// UpdateDataModel updates the internal data model and marks affected components as dirty.
func (p *A2uiStreamParser) UpdateDataModel(update map[string]any, messages *[]ResponsePart) {
	rawContents := update["contents"]
	if rawContents != nil {
		_ = p.parseContentsToDict(rawContents)
	}
}

// Helper functions.

func containsID(components []map[string]any, id string) bool {
	for _, c := range components {
		if cid, _ := c["id"].(string); cid == id {
			return true
		}
	}
	return false
}

func deepCopyAny(v any) any {
	switch val := v.(type) {
	case map[string]any:
		m := make(map[string]any, len(val))
		for k, v := range val {
			m[k] = deepCopyAny(v)
		}
		return m
	case []any:
		s := make([]any, len(val))
		for i, v := range val {
			s[i] = deepCopyAny(v)
		}
		return s
	default:
		return v
	}
}

func jsonMarshalSorted(v any) string {
	b, err := json.Marshal(v)
	if err != nil {
		logger.Printf("jsonMarshalSorted failed: %v", err)
		return ""
	}
	return string(b)
}
