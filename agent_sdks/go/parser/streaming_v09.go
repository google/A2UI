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
	"reflect"
	"regexp"
	"strings"

	"github.com/google/a2ui/agent_sdks/go/schema"
)

// streamParserV09 is the streaming parser implementation for A2UI v0.9 specification.
type streamParserV09 struct {
	p                     *A2uiStreamParser
	yieldedCreateSurfaces map[string]struct{}
}

func newStreamParserV09(p *A2uiStreamParser) *streamParserV09 {
	return &streamParserV09{
		p:                     p,
		yieldedCreateSurfaces: make(map[string]struct{}),
	}
}

func (v *streamParserV09) placeholderComponent() map[string]any {
	return map[string]any{
		"component": "Row",
		"children":  []any{},
	}
}

func (v *streamParserV09) yieldedSurfacesSet() map[string]struct{} {
	return v.yieldedCreateSurfaces
}

func (v *streamParserV09) addToYieldedSurfaces(sid string) {
	v.yieldedCreateSurfaces[sid] = struct{}{}
}

func (v *streamParserV09) removeFromYieldedSurfaces(sid string) {
	delete(v.yieldedCreateSurfaces, sid)
}

func (v *streamParserV09) isProtocolMsg(obj map[string]any) bool {
	for _, k := range []string{MsgTypeCreateSurface, MsgTypeUpdateComponents, MsgTypeUpdateDataModel} {
		if _, ok := obj[k]; ok {
			return true
		}
	}
	return false
}

func (v *streamParserV09) dataModelMsgType() string {
	return MsgTypeUpdateDataModel
}

func (v *streamParserV09) sniffMetadata() {
	getLatestValue := func(key string) *string {
		idx := len(v.p.jsonBuffer)
		for {
			needle := `"` + key + `"`
			pos := strings.LastIndex(v.p.jsonBuffer[:idx], needle)
			if pos == -1 {
				return nil
			}
			re := regexp.MustCompile(`"` + regexp.QuoteMeta(key) + `"\s*:\s*"([^"]+)"`)
			match := re.FindStringSubmatch(v.p.jsonBuffer[pos:])
			if match != nil {
				return &match[1]
			}
			idx = pos
			if idx <= 0 {
				return nil
			}
		}
	}

	if sid := getLatestValue("surfaceId"); sid != nil {
		v.p.SetSurfaceID(*sid)
	}
	if rootVal := getLatestValue("root"); rootVal != nil {
		v.p.SetRootID(*rootVal)
	}

	if strings.Contains(v.p.jsonBuffer, `"`+MsgTypeCreateSurface+`":`) {
		v.p.AddMsgType(MsgTypeCreateSurface)
	}
	if strings.Contains(v.p.jsonBuffer, `"`+MsgTypeUpdateComponents+`":`) {
		v.p.AddMsgType(MsgTypeUpdateComponents)
	}
	if strings.Contains(v.p.jsonBuffer, `"`+MsgTypeUpdateDataModel+`":`) {
		v.p.AddMsgType(MsgTypeUpdateDataModel)
	}
}

func (v *streamParserV09) handleCompleteObject(obj map[string]any, sid string, messages *[]ResponsePart) (bool, error) {
	if obj == nil {
		return false, nil
	}

	if v.p.validator != nil {
		if err := v.p.validator.Validate(obj, sid, false); err != nil {
			return true, err
		}
	}

	surfaceID := v.p.SurfaceID()
	if uc, ok := obj[MsgTypeUpdateComponents].(map[string]any); ok {
		if s, ok := uc[schema.SurfaceIDKey].(string); ok && s != "" {
			surfaceID = s
		}
	} else if cs, ok := obj[MsgTypeCreateSurface].(map[string]any); ok {
		if s, ok := cs[schema.SurfaceIDKey].(string); ok && s != "" {
			surfaceID = s
		}
	}

	if surfaceID != "" {
		v.p.SetSurfaceID(surfaceID)
	}
	sidStr := v.p.SurfaceID()
	if sidStr == "" {
		sidStr = "unknown"
	}

	// v0.9: createSurface
	if csVal, ok := obj[MsgTypeCreateSurface]; ok {
		if cs, ok := csVal.(map[string]any); ok {
			rootID := DefaultRootID
			if r, ok := cs["root"].(string); ok {
				rootID = r
			} else if v.p.RootID() != "" {
				rootID = v.p.RootID()
			}
			v.p.SetRootID(rootID)
		}
		v.p.bufferedStartMsg = obj

		if _, yielded := v.p.yieldedStartMessages[sidStr]; !yielded {
			if err := v.p.yieldMessages([]map[string]any{obj}, messages, true); err != nil {
				return true, err
			}
			v.p.yieldedStartMessages[sidStr] = struct{}{}
			v.yieldedCreateSurfaces[sidStr] = struct{}{}
			v.p.bufferedStartMsg = nil
		}

		delete(v.p.pendingMessages, sidStr)

		if err := v.p.yieldReachable(messages, false, false); err != nil {
			return true, err
		}
		return true, nil
	}

	// v0.9: updateComponents
	if ucVal, ok := obj[MsgTypeUpdateComponents]; ok {
		v.p.AddMsgType(MsgTypeUpdateComponents)
		if uc, ok := ucVal.(map[string]any); ok {
			rootID := DefaultRootID
			if r, ok := uc["root"].(string); ok {
				rootID = r
			} else if v.p.RootID() != "" {
				rootID = v.p.RootID()
			}
			v.p.SetRootID(rootID)

			if comps, ok := uc["components"].([]any); ok {
				for _, comp := range comps {
					if c, ok := comp.(map[string]any); ok {
						if id, ok := c["id"].(string); ok {
							v.p.seenComponents[id] = c
						}
					}
				}
			}
		}
		if err := v.p.yieldReachable(messages, true, false); err != nil {
			return true, err
		}
		return true, nil
	}

	// v0.9: deleteSurface
	if _, ok := obj[MsgTypeDeleteSurface]; ok {
		if _, yielded := v.p.yieldedStartMessages[sidStr]; !yielded {
			v.p.pendingMessages[sidStr] = append(v.p.pendingMessages[sidStr], obj)
			return true, nil
		}
		v.p.AddMsgType(MsgTypeDeleteSurface)
		if err := v.p.yieldMessages([]map[string]any{obj}, messages, true); err != nil {
			return true, err
		}
		v.p.deleteSurface(sidStr)
		return true, nil
	}

	// v0.9: updateDataModel
	if udmVal, ok := obj[MsgTypeUpdateDataModel]; ok {
		v.p.AddMsgType(MsgTypeUpdateDataModel)
		if udm, ok := udmVal.(map[string]any); ok {
			v.p.UpdateDataModel(udm, messages)
		}
		if err := v.p.yieldMessages([]map[string]any{obj}, messages, true); err != nil {
			return true, err
		}
		return true, nil
	}

	return false, nil
}

func (v *streamParserV09) constructPartialMessage(components []map[string]any, activeMsgType string) map[string]any {
	payload := map[string]any{
		schema.CatalogComponentsKey: components,
	}
	if sid := v.p.SurfaceID(); sid != "" {
		payload[schema.SurfaceIDKey] = sid
	}
	return map[string]any{
		"version":               "v0.9",
		MsgTypeUpdateComponents: payload,
	}
}

func (v *streamParserV09) getActiveMsgTypeForComponents() string {
	if v.p.activeMsgType != "" {
		return v.p.activeMsgType
	}
	for _, mt := range v.p.msgTypes {
		if mt == MsgTypeUpdateComponents || mt == MsgTypeCreateSurface {
			v.p.activeMsgType = mt
			return mt
		}
	}
	if len(v.p.msgTypes) > 0 {
		return v.p.msgTypes[0]
	}
	return ""
}

func (v *streamParserV09) deduplicateDataModel(m map[string]any, strictIntegrity bool) bool {
	udmVal, ok := m[MsgTypeUpdateDataModel]
	if !ok {
		return true
	}
	udm, ok := udmVal.(map[string]any)
	if !ok {
		return true
	}
	isNew := false
	for k, val := range udm {
		if k == schema.SurfaceIDKey || k == "root" {
			continue
		}
		if !reflect.DeepEqual(v.p.yieldedDataModel[k], val) {
			isNew = true
			break
		}
	}
	if !isNew && strictIntegrity {
		return false
	}
	for k, val := range udm {
		if k != schema.SurfaceIDKey && k != "root" {
			v.p.yieldedDataModel[k] = val
		}
	}
	return true
}

func (v *streamParserV09) sniffPartialDataModel(messages *[]ResponsePart) {
	// v0.9 has a specialized sniff for "value" property.
	msgType := MsgTypeUpdateDataModel
	if !strings.Contains(v.p.jsonBuffer, `"`+msgType+`"`) {
		return
	}

	for i := len(v.p.braceStack) - 1; i >= 0; i-- {
		entry := v.p.braceStack[i]
		if entry.bType != "{" {
			continue
		}
		rawFragment := v.p.jsonBuffer[entry.startIdx:]
		if rawFragment == "" {
			continue
		}

		fixedFragment := v.p.fixJSON(rawFragment)
		var obj map[string]any
		if err := json.Unmarshal([]byte(fixedFragment), &obj); err != nil {
			trimmed := rawFragment
			for strings.Contains(trimmed, ",") {
				idx := strings.LastIndex(trimmed, ",")
				trimmed = trimmed[:idx]
				fixedTrimmed := v.p.fixJSON(trimmed)
				if fixedTrimmed != "" {
					if err := json.Unmarshal([]byte(fixedTrimmed), &obj); err == nil {
						break
					}
				}
			}
		}

		if obj == nil {
			continue
		}
		dmValRaw, ok := obj[msgType]
		if !ok {
			continue
		}
		dmObj, ok := dmValRaw.(map[string]any)
		if !ok {
			continue
		}

		valueMap, ok := dmObj["value"].(map[string]any)
		if !ok {
			continue
		}

		delta := make(map[string]any)
		for k, val := range valueMap {
			if !reflect.DeepEqual(v.p.yieldedDataModel[k], val) {
				delta[k] = val
			}
		}
		if len(delta) == 0 {
			continue
		}

		sid := ""
		if s, ok := dmObj[schema.SurfaceIDKey].(string); ok {
			sid = s
		} else if v.p.surfaceID != nil {
			sid = *v.p.surfaceID
		} else {
			sid = "default"
		}

		deltaMsgPayload := map[string]any{
			schema.SurfaceIDKey: sid,
			"value":             delta,
		}
		deltaMsg := v.constructSniffedDataModelMessage(msgType, deltaMsgPayload)
		v.p.yieldMessages([]map[string]any{deltaMsg}, messages, false)
		for k, val := range delta {
			v.p.yieldedDataModel[k] = val
		}
	}
}

func (v *streamParserV09) constructSniffedDataModelMessage(activeMsgType string, payload map[string]any) map[string]any {
	return map[string]any{
		"version":     "v0.9",
		activeMsgType: payload,
	}
}
