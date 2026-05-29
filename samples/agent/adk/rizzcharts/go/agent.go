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

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
)

// RizzchartsAgent wraps an OpenAI-compatible LLM with A2UI system prompt and tool calling.
type RizzchartsAgent struct {
	apiKey       string
	apiBase      string
	model        string
	systemPrompt string
	httpClient   *http.Client
}

// NewRizzchartsAgent creates a new agent.
func NewRizzchartsAgent(apiKey, apiBase, model, systemPrompt string) *RizzchartsAgent {
	return &RizzchartsAgent{
		apiKey:       apiKey,
		apiBase:      strings.TrimRight(apiBase, "/"),
		model:        model,
		systemPrompt: systemPrompt,
		httpClient:   &http.Client{},
	}
}

// Close is a no-op for the HTTP-based agent (satisfies cleanup pattern).
func (a *RizzchartsAgent) Close() {}

// openAI request/response types

type chatMessage struct {
	Role       string     `json:"role"`
	Content    string     `json:"content,omitempty"`
	ToolCalls  []toolCall `json:"tool_calls,omitempty"`
	ToolCallID string     `json:"tool_call_id,omitempty"`
}

type toolCall struct {
	ID       string       `json:"id"`
	Type     string       `json:"type"`
	Function functionCall `json:"function"`
}

type functionCall struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"`
}

type toolDef struct {
	Type     string      `json:"type"`
	Function toolFuncDef `json:"function"`
}

type toolFuncDef struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Parameters  any    `json:"parameters"`
}

type chatRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
	Tools    []toolDef     `json:"tools,omitempty"`
}

type chatResponse struct {
	Choices []chatChoice `json:"choices"`
	Error   *apiError    `json:"error,omitempty"`
}

type chatChoice struct {
	Message      chatMessage `json:"message"`
	FinishReason string      `json:"finish_reason"`
}

type apiError struct {
	Message string `json:"message"`
	Type    string `json:"type"`
}

// tools definitions for the OpenAI tools format
var openAITools = []toolDef{
	{
		Type: "function",
		Function: toolFuncDef{
			Name:        "get_sales_data",
			Description: "Gets the sales data. Returns sales breakdown by product category.",
			Parameters: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"time_period": map[string]any{
						"type":        "string",
						"description": "The time period to get sales data for (e.g. 'Q1', 'year'). Defaults to 'year'.",
					},
				},
			},
		},
	},
	{
		Type: "function",
		Function: toolFuncDef{
			Name:        "get_store_sales",
			Description: "Gets individual store sales with locations. Returns store locations with sales data and outlier information.",
			Parameters: map[string]any{
				"type": "object",
				"properties": map[string]any{
					"region": map[string]any{
						"type":        "string",
						"description": "The region to get store sales for. Defaults to 'all'.",
					},
				},
			},
		},
	},
}

// Chat sends a user message and handles the multi-turn tool-calling loop.
func (a *RizzchartsAgent) Chat(ctx context.Context, userMessage string) ([]map[string]any, error) {
	messages := []chatMessage{
		{Role: "system", Content: a.systemPrompt},
		{Role: "user", Content: userMessage},
	}

	maxIterations := 10
	for i := 0; i < maxIterations; i++ {
		resp, err := a.callChatAPI(ctx, messages)
		if err != nil {
			return nil, fmt.Errorf("chat API call failed: %w", err)
		}

		if resp.Error != nil {
			return nil, fmt.Errorf("API error: %s", resp.Error.Message)
		}

		if len(resp.Choices) == 0 {
			return nil, fmt.Errorf("no choices in API response")
		}

		choice := resp.Choices[0]
		assistantMsg := choice.Message

		// Append assistant message to history
		messages = append(messages, assistantMsg)

		// Check for tool calls
		if len(assistantMsg.ToolCalls) > 0 {
			for _, tc := range assistantMsg.ToolCalls {
				result := a.executeTool(tc.Function.Name, tc.Function.Arguments)
				resultJSON, _ := json.Marshal(result)
				messages = append(messages, chatMessage{
					Role:       "tool",
					Content:    string(resultJSON),
					ToolCallID: tc.ID,
				})
			}
			continue
		}

		// No tool calls → final text response
		text := assistantMsg.Content
		if text == "" {
			return nil, fmt.Errorf("no text response from model")
		}

		log.Printf("Model response:\n%s", text)
		return parseA2UIFromText(text)
	}

	return nil, fmt.Errorf("exceeded maximum tool calling iterations")
}

func (a *RizzchartsAgent) callChatAPI(ctx context.Context, messages []chatMessage) (*chatResponse, error) {
	reqBody := chatRequest{
		Model:    a.model,
		Messages: messages,
		Tools:    openAITools,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	url := a.apiBase + "/chat/completions"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+a.apiKey)

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var chatResp chatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return nil, fmt.Errorf("failed to parse API response: %w", err)
	}

	return &chatResp, nil
}

func (a *RizzchartsAgent) executeTool(name string, argsJSON string) map[string]any {
	var args map[string]any
	if err := json.Unmarshal([]byte(argsJSON), &args); err != nil {
		log.Printf("Failed to parse tool args: %v", err)
		args = map[string]any{}
	}

	switch name {
	case "get_sales_data":
		timePeriod := "year"
		if tp, ok := args["time_period"].(string); ok && tp != "" {
			timePeriod = tp
		}
		log.Printf("Executing tool: get_sales_data(time_period=%s)", timePeriod)
		return getSalesData(timePeriod)

	case "get_store_sales":
		region := "all"
		if r, ok := args["region"].(string); ok && r != "" {
			region = r
		}
		log.Printf("Executing tool: get_store_sales(region=%s)", region)
		return getStoreSales(region)

	default:
		log.Printf("Unknown tool: %s", name)
		return map[string]any{"error": fmt.Sprintf("unknown tool: %s", name)}
	}
}

// a2uiOpenRe matches <a2ui-json> with optional whitespace (some LLMs add spaces inside tags).
var a2uiOpenRe = regexp.MustCompile(`<\s*a2ui-json\s*>`)

// a2uiCloseRe matches </a2ui-json> with optional whitespace.
var a2uiCloseRe = regexp.MustCompile(`<\s*/\s*a2ui-json\s*>`)

// parseA2UIFromText extracts A2UI JSON blocks from the model's text response.
func parseA2UIFromText(text string) ([]map[string]any, error) {
	var allMessages []map[string]any
	remaining := text

	for {
		openLoc := a2uiOpenRe.FindStringIndex(remaining)
		if openLoc == nil {
			break
		}
		remaining = remaining[openLoc[1]:]

		closeLoc := a2uiCloseRe.FindStringIndex(remaining)
		if closeLoc == nil {
			break
		}
		jsonStr := remaining[:closeLoc[0]]
		remaining = remaining[closeLoc[1]:]

		jsonStr = cleanJSON(jsonStr)

		var raw any
		if err := json.Unmarshal([]byte(jsonStr), &raw); err != nil {
			log.Printf("Failed to parse A2UI JSON block: %v", err)
			continue
		}

		switch v := raw.(type) {
		case []any:
			for _, item := range v {
				if m, ok := item.(map[string]any); ok {
					allMessages = append(allMessages, m)
				}
			}
		case map[string]any:
			allMessages = append(allMessages, v)
		}
	}

	if len(allMessages) == 0 {
		return nil, fmt.Errorf("no A2UI JSON blocks found in response")
	}

	return allMessages, nil
}

func cleanJSON(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	s = strings.TrimSpace(s)
	return s
}
