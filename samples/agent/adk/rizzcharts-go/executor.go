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
	"context"
	"fmt"
	"log"
	"os"

	"github.com/a2aproject/a2a-go/a2a"
	"github.com/a2aproject/a2a-go/a2asrv"
	"github.com/a2aproject/a2a-go/a2asrv/eventqueue"
	"github.com/google/A2UI/a2a_agents/go/a2ui"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

const (
	a2uiEnabledKey = "system:a2ui_enabled"
	a2uiSchemaKey  = "system:a2ui_schema"
)

// RizzchartsAgentExecutor handles agent execution and A2A integration.
type RizzchartsAgentExecutor struct {
	baseURL                 string
	componentCatalogBuilder *ComponentCatalogBuilder
	agent                   *RizzchartsAgent
}

// NewRizzchartsAgentExecutor creates a new executor.
func NewRizzchartsAgentExecutor(baseURL string, builder *ComponentCatalogBuilder, agent *RizzchartsAgent) *RizzchartsAgentExecutor {
	return &RizzchartsAgentExecutor{
		baseURL:                 baseURL,
		componentCatalogBuilder: builder,
		agent:                   agent,
	}
}

// GetAgentCard returns the AgentCard defining this agent's metadata and skills.
func (e *RizzchartsAgentExecutor) GetAgentCard() *a2a.AgentCard {
	supportedContentTypes := []string{"text", "text/plain"}

	// Dereference the pointer returned by GetA2UIAgentExtension
	a2uiExt := *a2ui.GetA2UIAgentExtension(false, []string{a2ui.StandardCatalogID, RizzchartsCatalogURI})

	return &a2a.AgentCard{
		Name:               "Ecommerce Dashboard Agent",
		Description:        "This agent visualizes ecommerce data, showing sales breakdowns, YOY revenue performance, and regional sales outliers.",
		URL:                e.baseURL,
		Version:            "1.0.0",
		DefaultInputModes:  supportedContentTypes,
		DefaultOutputModes: supportedContentTypes,
		PreferredTransport: "JSONRPC",
		ProtocolVersion:    "0.3.0",
		Capabilities: a2a.AgentCapabilities{
			Streaming: true,
			Extensions: []a2a.AgentExtension{
				a2uiExt,
			},
		},
		Skills: []a2a.AgentSkill{
			{
				ID:          "view_sales_by_category",
				Name:        "View Sales by Category",
				Description: "Displays a pie chart of sales broken down by product category for a given time period.",
				Tags:        []string{"sales", "breakdown", "category", "pie chart", "revenue"},
				Examples: []string{
					"show my sales breakdown by product category for q3",
					"What's the sales breakdown for last month?",
				},
			},
			{
				ID:          "view_regional_outliers",
				Name:        "View Regional Sales Outliers",
				Description: "Displays a map showing regional sales outliers or store-level performance.",
				Tags:        []string{"sales", "regional", "outliers", "stores", "map", "performance"},
				Examples: []string{
					"interesting. were there any outlier stores",
					"show me a map of store performance",
				},
			},
		},
	}
}

// PrepareSession handles session preparation logic, including A2UI state setup.
// It matches the logic in the Python sample's _prepare_session method.
func (e *RizzchartsAgentExecutor) PrepareSession(ctx context.Context, state map[string]interface{}, reqCtx *a2asrv.RequestContext) error {
	log.Printf("Preparing session")
	state["base_url"] = e.baseURL

	// Check if A2UI is enabled for this request using the extension mechanism
	useUI := a2ui.TryActivateA2UIExtension(ctx)

	if useUI {
		log.Println("A2UI extension activated")

		// Extract client capabilities from the message metadata
		var clientCapabilities map[string]interface{}
		if reqCtx != nil && reqCtx.Message != nil && reqCtx.Message.Metadata != nil {
			if caps, ok := reqCtx.Message.Metadata[a2ui.ClientCapabilitiesKey].(map[string]interface{}); ok {
				clientCapabilities = caps
			}
		}

		a2uiSchema, catalogURI, err := e.componentCatalogBuilder.LoadA2UISchema(clientCapabilities)
		if err != nil {
			return err
		}

		// Update state with A2UI configuration
		state[a2uiEnabledKey] = true
		state[a2uiSchemaKey] = a2uiSchema
		state[A2UICatalogURIStateKey] = catalogURI
	} else {
		log.Println("A2UI extension NOT activated")
	}

	return nil
}

// Execute implements a2asrv.AgentExecutor.
func (e *RizzchartsAgentExecutor) Execute(ctx context.Context, reqCtx *a2asrv.RequestContext, queue eventqueue.Queue) error {
	log.Println("Executor: Execute started")
	state := make(map[string]interface{})

	// Task State: Submitted (if new)
	if reqCtx.StoredTask == nil {
		log.Println("Executor: Sending TaskStateSubmitted")
		event := a2a.NewStatusUpdateEvent(reqCtx, a2a.TaskStateSubmitted, nil)
		if err := queue.Write(ctx, event); err != nil {
			log.Printf("Executor: Failed to write submitted event: %v", err)
			return fmt.Errorf("failed to write state submitted: %w", err)
		}
	}

	// Prepare session (A2UI setup)
	if err := e.PrepareSession(ctx, state, reqCtx); err != nil {
		log.Printf("Executor: PrepareSession failed: %v", err)
		event := a2a.NewStatusUpdateEvent(reqCtx, a2a.TaskStateFailed, &a2a.Message{
			Role: a2a.MessageRoleUnspecified,
			Parts: []a2a.Part{
				&a2a.TextPart{Text: fmt.Sprintf("Failed to prepare session: %v", err)},
			},
		})
		queue.Write(ctx, event)
		return nil
	}

	// Task State: Working
	log.Println("Executor: Sending TaskStateWorking")
	event := a2a.NewStatusUpdateEvent(reqCtx, a2a.TaskStateWorking, nil)
	if err := queue.Write(ctx, event); err != nil {
		log.Printf("Executor: Failed to write working event: %v", err)
		return fmt.Errorf("failed to write state working: %w", err)
	}

	// Extract User Text
	var userText string
	if reqCtx.Message != nil {
		log.Printf("Executor: Inspecting %d parts", len(reqCtx.Message.Parts))
		for i, p := range reqCtx.Message.Parts {
			log.Printf("Executor: Part %d type: %T", i, p)
			if txtPart, ok := p.(*a2a.TextPart); ok {
				userText = txtPart.Text
			}
		}
	}
	log.Printf("Executor: User text: %q", userText)

	// --- Gemini Integration ---

	client, err := genai.NewClient(ctx, option.WithAPIKey(os.Getenv("GEMINI_API_KEY")))
	if err != nil {
		log.Printf("Failed to create Gemini client: %v", err)
		return err
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-2.5-flash")
	model.SetTemperature(0.0) // Deterministic

	// Convert tools
	var modelTools []*genai.FunctionDeclaration
	for _, t := range e.agent.Tools {
		decl := t.GetDeclaration()

		props := &genai.Schema{Type: genai.TypeObject, Properties: make(map[string]*genai.Schema)}
		if pMap, ok := decl.Parameters["properties"].(map[string]interface{}); ok {
			for name, pDef := range pMap {
				if defMap, ok := pDef.(map[string]interface{}); ok {
					s := &genai.Schema{}
					if typeStr, ok := defMap["type"].(string); ok {
						switch typeStr {
						case "number", "integer":
							s.Type = genai.TypeNumber
						case "boolean":
							s.Type = genai.TypeBoolean
						default:
							s.Type = genai.TypeString // Default to string for unknown types
						}
					} else {
						s.Type = genai.TypeString // Default to string if type is not specified
					}
					if desc, ok := defMap["description"].(string); ok {
						s.Description = desc
					}
					props.Properties[name] = s
				}
			}
		}
		required := []string{}
		if req, ok := decl.Parameters["required"].([]string); ok {
			required = req
		}
		props.Required = required

		modelTools = append(modelTools, &genai.FunctionDeclaration{
			Name:        decl.Name,
			Description: decl.Description,
			Parameters:  props,
		})
	}
	model.Tools = []*genai.Tool{
		{
			FunctionDeclarations: modelTools,
		},
	}

	// System Instruction
	instr, _ := e.agent.GetInstructions(ctx, state)

	// Inject schema into context for ProcessLLMRequest
	var rawSchema map[string]interface{}
	if val, ok := state[a2uiSchemaKey].(map[string]interface{}); ok {
		rawSchema = val
	}

	ctxWithSchema := ctx
	if rawSchema != nil {
		ctxWithSchema = context.WithValue(ctx, schemaContextKey, rawSchema)
	}

	// Collect additional instructions from tools (e.g. A2UI schema)
	llmReq := &a2ui.LlmRequest{}
	for _, t := range e.agent.Tools {
		if err := t.ProcessLLMRequest(ctxWithSchema, nil, llmReq); err != nil {
			log.Printf("Tool %s ProcessLLMRequest failed: %v", t.Name(), err)
		}
	}

	// Append tool instructions
	for _, toolInstr := range llmReq.Instructions {
		instr += "\n" + toolInstr
	}

	log.Printf("System Instruction Length: %d", len(instr))

	model.SystemInstruction = &genai.Content{Parts: []genai.Part{genai.Text(instr)}}

	cs := model.StartChat()

	// Send Message
	log.Println("Executor: Sending message to Gemini...")
	resp, err := cs.SendMessage(ctx, genai.Text(userText))
	if err != nil {
		log.Printf("Gemini SendMessage failed: %v", err)
		return err
	}

	var responseText string
	var a2uiPayloads []map[string]interface{}

	// Handle Tool Loop
	for {
		if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
			break
		}

		var functionCalls []genai.FunctionCall

		// Reset responseText for the current turn to avoid accumulating redundant text history
		// from previous turns (e.g. "I will do X" ... "I have done X").
		// We only want the latest text response.
		responseText = ""

		// Scan all parts for function calls or text
		for _, part := range resp.Candidates[0].Content.Parts {
			if fc, ok := part.(genai.FunctionCall); ok {
				functionCalls = append(functionCalls, fc)
			} else if txt, ok := part.(genai.Text); ok {
				responseText += string(txt)
			}
		}

		// If no function calls, we are done
		if len(functionCalls) == 0 {
			break
		}

		// Execute all function calls
		var functionResponses []genai.Part
		for _, fc := range functionCalls {
			log.Printf("Gemini called tool: %s", fc.Name)

			// Find tool
			var selectedTool a2ui.BaseTool
			for _, t := range e.agent.Tools {
				if t.Name() == fc.Name {
					selectedTool = t
					break
				}
			}

			var toolResult map[string]interface{}
			if selectedTool != nil {
				// Execute
				toolArgs := make(map[string]interface{})
				for k, v := range fc.Args {
					toolArgs[k] = v
				}

				// Inject schema into context
				ctxWithSchema := ctx
				if rawSchema != nil {
					log.Println("Executor: Injecting schema into context for tool execution")
					ctxWithSchema = context.WithValue(ctx, schemaContextKey, rawSchema)
				} else {
					log.Println("Executor: Warning: rawSchema is nil")
				}
				// Run
				res, err := selectedTool.Run(ctxWithSchema, toolArgs, nil)
				if err != nil {
					log.Printf("Executor: Tool execution failed: %v", err)
					toolResult = map[string]interface{}{"error": err.Error()}
				} else {
					toolResult = res
					// Capture A2UI payload if it's the send tool
					if fc.Name == "send_a2ui_json_to_client" {
						log.Println("Executor: Processing send_a2ui_json_to_client response")
						if validated, ok := res["validated_a2ui_json"].([]interface{}); ok {
							log.Printf("Executor: Found %d validated payloads", len(validated))
							for _, v := range validated {
								if m, ok := v.(map[string]interface{}); ok {
									a2uiPayloads = append(a2uiPayloads, m)
								}
							}
						} else {
							log.Println("Executor: validated_a2ui_json missing or invalid type")
						}
					}
				}
			} else {
				log.Printf("Executor: Tool %s not found in agent tools", fc.Name)
				toolResult = map[string]interface{}{"error": "tool not found"}
			}

			functionResponses = append(functionResponses, genai.FunctionResponse{
				Name:     fc.Name,
				Response: toolResult,
			})
		}

		// Send responses back
		resp, err = cs.SendMessage(ctx, functionResponses...)
		if err != nil {
			log.Printf("Gemini SendMessage (func response) failed: %v", err)
			return err
		}
	}

	// Construct Final Response
	log.Printf("Executor: Captured %d A2UI payloads", len(a2uiPayloads))

	var allParts []a2a.Part

	// Add text if present
	if responseText != "" {
		allParts = append(allParts, &a2a.TextPart{Text: responseText})
	}

	// Add artifacts and send Data Message if present
	var dataParts []a2a.Part
	for _, payload := range a2uiPayloads {
		dp := &a2a.DataPart{
			Data: payload,
			Metadata: map[string]interface{}{
				a2ui.MIMETypeKey: a2ui.MIMEType,
			},
		}
		dataParts = append(dataParts, dp)
		allParts = append(allParts, dp)
	}

	if len(dataParts) > 0 {
		log.Println("Executor: Sending TaskArtifactUpdateEvent")
		artifactEvent := a2a.NewArtifactEvent(reqCtx, dataParts...)
		if err := queue.Write(ctx, artifactEvent); err != nil {
			log.Printf("Executor: Failed to write artifact event: %v", err)
			return fmt.Errorf("failed to write artifact event: %w", err)
		}
	}

	if len(allParts) > 0 {
		log.Println("Executor: Sending Combined Response Message")
		msg := a2a.NewMessageForTask(a2a.MessageRole("model"), reqCtx, allParts...)
		if err := queue.Write(ctx, msg); err != nil {
			log.Printf("Executor: Failed to write response message: %v", err)
			return fmt.Errorf("failed to write response message: %w", err)
		}
	}

	log.Println("Executor: Sending TaskStateCompleted (Final)")
	completeEvent := a2a.NewStatusUpdateEvent(reqCtx, a2a.TaskStateCompleted, nil)
	completeEvent.Final = true
	if err := queue.Write(ctx, completeEvent); err != nil {
		log.Printf("Executor: Failed to write completed event: %v", err)
		return fmt.Errorf("failed to write state completed: %w", err)
	}

	log.Println("Executor: Execute finished successfully")
	return nil
}

// Cancel implements a2asrv.AgentExecutor.
func (e *RizzchartsAgentExecutor) Cancel(ctx context.Context, reqCtx *a2asrv.RequestContext, queue eventqueue.Queue) error {
	event := a2a.NewStatusUpdateEvent(reqCtx, a2a.TaskStateCanceled, nil)
	event.Final = true
	return queue.Write(ctx, event)
}

// Helper providers
func GetA2UISchema(state map[string]interface{}) map[string]interface{} {
	if val, ok := state[a2uiSchemaKey].(map[string]interface{}); ok {
		return val
	}
	return nil
}

func GetA2UIEnabled(state map[string]interface{}) bool {
	if val, ok := state[a2uiEnabledKey].(bool); ok {
		return val
	}
	return false
}
