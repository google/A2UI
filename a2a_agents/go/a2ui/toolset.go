package a2ui

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
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/a2aproject/a2a-go/a2a"
	"github.com/santhosh-tekuri/jsonschema/v5"
)

// --- Simulated GenAI and ADK types ---

// FunctionDeclaration represents a function declaration for the LLM.
type FunctionDeclaration struct {
	Name        string
	Description string
	Parameters  map[string]interface{}
}

// FunctionCall represents a function call from the LLM.
type FunctionCall struct {
	Name string
	Args map[string]interface{}
}

// FunctionResponse represents a function response to the LLM.
type FunctionResponse struct {
	Name     string
	Response map[string]interface{}
}

// GenAIPart represents a part from the Generative AI model.
type GenAIPart struct {
	FunctionCall     *FunctionCall
	FunctionResponse *FunctionResponse
	Text             string
}

// ToolContext represents the context for a tool execution.
type ToolContext struct {
	Actions ToolActions
}

// ToolActions represents actions available in the tool context.
type ToolActions struct {
	SkipSummarization bool
}

// LlmRequest represents a request to the LLM.
type LlmRequest struct {
	Instructions []string
}

// AppendInstructions appends instructions to the LLM request.
func (r *LlmRequest) AppendInstructions(instructions []string) {
	r.Instructions = append(r.Instructions, instructions...)
}

// --- End Simulated types ---

// A2UIEnabledProvider is a function that returns whether A2UI is enabled.
type A2UIEnabledProvider func(ctx context.Context) (bool, error)

// A2UISchemaProvider is a function that returns the A2UI schema.
type A2UISchemaProvider func(ctx context.Context) (map[string]interface{}, error)

// BaseTool represents a base tool.
type BaseTool interface {
	Name() string
	Description() string
	GetDeclaration() *FunctionDeclaration
	ProcessLLMRequest(ctx context.Context, toolContext *ToolContext, llmRequest *LlmRequest) error
	Run(ctx context.Context, args map[string]interface{}, toolContext *ToolContext) (map[string]interface{}, error)
}

// SendA2UIToClientToolset provides A2UI Tools.
type SendA2UIToClientToolset struct {
	a2uiEnabled      interface{} // bool or A2UIEnabledProvider
	a2uiSchema       interface{} // map[string]interface{} or A2UISchemaProvider
	sendToolInstance *SendA2UIJsonToClientTool
}

// NewSendA2UIToClientToolset creates a new SendA2UIToClientToolset.
func NewSendA2UIToClientToolset(enabled interface{}, schema interface{}) *SendA2UIToClientToolset {
	return &SendA2UIToClientToolset{
		a2uiEnabled:      enabled,
		a2uiSchema:       schema,
		sendToolInstance: NewSendA2UIJsonToClientTool(schema),
	}
}

// resolveA2UIEnabled resolves the enabled state.
func (t *SendA2UIToClientToolset) resolveA2UIEnabled(ctx context.Context) (bool, error) {
	if enabled, ok := t.a2uiEnabled.(bool); ok {
		return enabled, nil
	}
	if provider, ok := t.a2uiEnabled.(A2UIEnabledProvider); ok {
		return provider(ctx)
	}
	return false, fmt.Errorf("invalid type for a2uiEnabled")
}

// GetTools returns the list of tools.
func (t *SendA2UIToClientToolset) GetTools(ctx context.Context) ([]BaseTool, error) {
	enabled, err := t.resolveA2UIEnabled(ctx)
	if err != nil {
		return nil, err
	}
	if enabled {
		log.Println("A2UI is ENABLED, adding ui tools")
		return []BaseTool{t.sendToolInstance}, nil
	}
	log.Println("A2UI is DISABLED, not adding ui tools")
	return []BaseTool{}, nil
}

// SendA2UIJsonToClientTool is the tool for sending A2UI JSON.
type SendA2UIJsonToClientTool struct {
	toolName     string
	description  string
	a2uiSchema   interface{}
	a2uiJSONArg  string
	validatedKey string
	toolErrorKey string
}

// NewSendA2UIJsonToClientTool creates a new tool instance.
func NewSendA2UIJsonToClientTool(schema interface{}) *SendA2UIJsonToClientTool {
	toolName := "send_a2ui_json_to_client"
	argName := "a2ui_json"
	return &SendA2UIJsonToClientTool{
		toolName:     toolName,
		a2uiJSONArg:  argName,
		description:  fmt.Sprintf("Sends A2UI JSON to the client to render rich UI for the user. This tool can be called multiple times in the same call to render multiple UI surfaces.Args: %s: Valid A2UI JSON Schema to send to the client. The A2UI JSON Schema definition is between ---BEGIN A2UI JSON SCHEMA--- and ---END A2UI JSON SCHEMA--- in the system instructions.", argName),
		a2uiSchema:   schema,
		validatedKey: "validated_a2ui_json",
		toolErrorKey: "error",
	}
}

func (t *SendA2UIJsonToClientTool) Name() string {
	return t.toolName
}

func (t *SendA2UIJsonToClientTool) Description() string {
	return t.description
}

func (t *SendA2UIJsonToClientTool) GetDeclaration() *FunctionDeclaration {
	return &FunctionDeclaration{
		Name:        t.toolName,
		Description: t.description,
		Parameters: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				t.a2uiJSONArg: map[string]interface{}{
					"type":        "string",
					"description": "valid A2UI JSON Schema to send to the client.",
				},
			},
			"required": []string{t.a2uiJSONArg},
		},
	}
}

func (t *SendA2UIJsonToClientTool) resolveA2UISchema(ctx context.Context) (map[string]interface{}, error) {
	if schema, ok := t.a2uiSchema.(map[string]interface{}); ok {
		return schema, nil
	}
	if provider, ok := t.a2uiSchema.(A2UISchemaProvider); ok {
		return provider(ctx)
	}
	return nil, fmt.Errorf("invalid type for a2uiSchema")
}

func (t *SendA2UIJsonToClientTool) getA2UISchema(ctx context.Context) (map[string]interface{}, error) {
	schema, err := t.resolveA2UISchema(ctx)
	if err != nil {
		return nil, err
	}
	return WrapAsJSONArray(schema)
}

func (t *SendA2UIJsonToClientTool) ProcessLLMRequest(ctx context.Context, toolContext *ToolContext, llmRequest *LlmRequest) error {
	schema, err := t.getA2UISchema(ctx)
	if err != nil {
		return err
	}

	schemaBytes, err := json.Marshal(schema)
	if err != nil {
		return err
	}

	instruction := fmt.Sprintf(`
---BEGIN A2UI JSON SCHEMA---
%s
---END A2UI JSON SCHEMA---
`, string(schemaBytes))
	llmRequest.AppendInstructions([]string{instruction})
	log.Println("Added a2ui_schema to system instructions")
	return nil
}

func (t *SendA2UIJsonToClientTool) Run(ctx context.Context, args map[string]interface{}, toolContext *ToolContext) (map[string]interface{}, error) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered in Run: %v", r)
		}
	}()

	var a2uiJSONStr string
	argVal, ok := args[t.a2uiJSONArg]
	if !ok || argVal == nil {
		errStr := fmt.Sprintf("Failed to call tool %s because missing required arg %s", t.toolName, t.a2uiJSONArg)
		log.Println(errStr)
		return map[string]interface{}{t.toolErrorKey: errStr}, nil
	}

	switch v := argVal.(type) {
	case string:
		a2uiJSONStr = v
	default:
		// If it's not a string (e.g. map or slice), marshal it back to JSON string
		log.Printf("Received non-string argument for %s (type %T), marshaling to JSON", t.a2uiJSONArg, v)
		bytes, err := json.Marshal(v)
		if err != nil {
			errStr := fmt.Sprintf("Failed to marshal argument %s: %v", t.a2uiJSONArg, err)
			log.Println(errStr)
			return map[string]interface{}{t.toolErrorKey: errStr}, nil
		}
		a2uiJSONStr = string(bytes)
	}

	if a2uiJSONStr == "" {
		errStr := fmt.Sprintf("Failed to call tool %s because arg %s is empty", t.toolName, t.a2uiJSONArg)
		log.Println(errStr)
		return map[string]interface{}{t.toolErrorKey: errStr}, nil
	}

	var a2uiJSONPayload interface{}
	if err := json.Unmarshal([]byte(a2uiJSONStr), &a2uiJSONPayload); err != nil {
		errStr := fmt.Sprintf("Failed to call A2UI tool %s: %v", t.toolName, err)
		log.Println(errStr)
		return map[string]interface{}{t.toolErrorKey: errStr}, nil
	}

	// Auto-wrap single object in list
	var payloadList []interface{}
	if list, ok := a2uiJSONPayload.([]interface{}); ok {
		payloadList = list
	} else {
		log.Println("Received a single JSON object, wrapping in a list for validation.")
		payloadList = []interface{}{a2uiJSONPayload}
	}

	// Get Schema
	schemaMap, err := t.getA2UISchema(ctx)
	if err != nil {
		errStr := fmt.Sprintf("Failed to resolve schema: %v", err)
		log.Println(errStr)
		return map[string]interface{}{t.toolErrorKey: errStr}, nil
	}

	schemaBytes, err := json.Marshal(schemaMap)
	if err != nil {
		errStr := fmt.Sprintf("Failed to marshal schema: %v", err)
		log.Println(errStr)
		return map[string]interface{}{t.toolErrorKey: errStr}, nil
	}

	// Compile Schema
	c := jsonschema.NewCompiler()
	if err := c.AddResource("schema.json", strings.NewReader(string(schemaBytes))); err != nil {
		errStr := fmt.Sprintf("Failed to add resource to compiler: %v", err)
		log.Println(errStr)
		return map[string]interface{}{t.toolErrorKey: errStr}, nil
	}
	schema, err := c.Compile("schema.json")
	if err != nil {
		errStr := fmt.Sprintf("Failed to compile schema: %v", err)
		log.Println(errStr)
		return map[string]interface{}{t.toolErrorKey: errStr}, nil
	}

	// Validate
	if err := schema.Validate(payloadList); err != nil {
		errStr := fmt.Sprintf("Failed to call A2UI tool %s: %v", t.toolName, err)
		log.Println(errStr)
		return map[string]interface{}{t.toolErrorKey: errStr}, nil
	}

	log.Printf("Validated call to tool %s with %s", t.toolName, t.a2uiJSONArg)

	if toolContext != nil {
		toolContext.Actions.SkipSummarization = true
	}

	return map[string]interface{}{t.validatedKey: payloadList}, nil
}

// ConvertGenAIPartToA2APart converts a GenAI part to an A2A part.
//
// This function corresponds to `google.adk.a2a.converters.part_converter.convert_genai_part_to_a2a_part`
// in the Python ADK. It is implemented here because an equivalent Go ADK with this
// functionality is currently unavailable in this environment.
//
// It currently supports converting Text parts. Future expansions should handle
// FunctionCalls and other GenAI part types as needed.
func ConvertGenAIPartToA2APart(part *GenAIPart) a2a.Part {
	if part.Text != "" {
		return &a2a.TextPart{Text: part.Text}
	}
	// TODO: Handle other part types if necessary (e.g. inline data, function calls)
	return nil
}

// ConvertSendA2UIToClientGenAIPartToA2APart converts a GenAI part to A2A parts.
func ConvertSendA2UIToClientGenAIPartToA2APart(part *GenAIPart) []a2a.Part {
	toolName := "send_a2ui_json_to_client"
	validatedKey := "validated_a2ui_json"
	toolErrorKey := "error"

	if part.FunctionResponse != nil && part.FunctionResponse.Name == toolName {
		response := part.FunctionResponse.Response
		if _, ok := response[toolErrorKey]; ok {
			log.Printf("A2UI tool call failed: %v", response[toolErrorKey])
			return []a2a.Part{}
		}

		jsonData, ok := response[validatedKey].([]interface{})
		if !ok || jsonData == nil {
			log.Println("No result in A2UI tool response")
			return []a2a.Part{}
		}

		var finalParts []a2a.Part
		log.Printf("Found %d messages. Creating individual DataParts.", len(jsonData))
		for _, message := range jsonData {
			if msgMap, ok := message.(map[string]interface{}); ok {
				finalParts = append(finalParts, CreateA2UIPart(msgMap))
			}
		}
		return finalParts
	} else if part.FunctionCall != nil && part.FunctionCall.Name == toolName {
		// Don't send a2ui tool call to client
		return []a2a.Part{}
	}

	// Use default converter for other types
	convertedPart := ConvertGenAIPartToA2APart(part)
	if convertedPart != nil {
		log.Printf("Returning converted part: %v", convertedPart)
		return []a2a.Part{convertedPart}
	}

	return []a2a.Part{}
}
