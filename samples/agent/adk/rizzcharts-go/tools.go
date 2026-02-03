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
	"log"

	"github.com/google/A2UI/a2a_agents/go/a2ui"
)

// GetStoreSalesTool retrieves individual store sales.
type GetStoreSalesTool struct{}

func (t *GetStoreSalesTool) Name() string {
	return "get_store_sales"
}

func (t *GetStoreSalesTool) Description() string {
	return "Gets individual store sales"
}

func (t *GetStoreSalesTool) GetDeclaration() *a2ui.FunctionDeclaration {
	return &a2ui.FunctionDeclaration{
		Name:        t.Name(),
		Description: t.Description(),
		Parameters: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"region": map[string]interface{}{
					"type":        "string",
					"description": "The region to get store sales for.",
					"default":     "all",
				},
			},
			"required": []string{},
		},
	}
}

func (t *GetStoreSalesTool) ProcessLLMRequest(ctx context.Context, toolContext *a2ui.ToolContext, llmRequest *a2ui.LlmRequest) error {
	return nil
}

func (t *GetStoreSalesTool) Run(ctx context.Context, args map[string]interface{}, toolContext *a2ui.ToolContext) (map[string]interface{}, error) {
	region, _ := args["region"].(string)
	if region == "" {
		region = "all"
	}
	log.Printf("get_store_sales called with region=%s", region)

	return map[string]interface{}{
		"center": map[string]interface{}{"lat": 34, "lng": -118.2437},
		"zoom":   10,
		"locations": []interface{}{
			map[string]interface{}{
				"lat":            34.0195,
				"lng":            -118.4912,
				"name":           "Santa Monica Branch",
				"description":    "High traffic coastal location.",
				"outlier_reason": "Yes, 15% sales over baseline",
				"background":     "#4285F4",
				"borderColor":    "#FFFFFF",
				"glyphColor":     "#FFFFFF",
			},
			map[string]interface{}{"lat": 34.0488, "lng": -118.2518, "name": "Downtown Flagship"},
			map[string]interface{}{"lat": 34.1016, "lng": -118.3287, "name": "Hollywood Boulevard Store"},
			map[string]interface{}{"lat": 34.1478, "lng": -118.1445, "name": "Pasadena Location"},
			map[string]interface{}{"lat": 33.7701, "lng": -118.1937, "name": "Long Beach Outlet"},
			map[string]interface{}{"lat": 34.0736, "lng": -118.4004, "name": "Beverly Hills Boutique"},
		},
	}, nil
}

// GetSalesDataTool retrieves sales data.
type GetSalesDataTool struct{}

func (t *GetSalesDataTool) Name() string {
	return "get_sales_data"
}

func (t *GetSalesDataTool) Description() string {
	return "Gets the sales data."
}

func (t *GetSalesDataTool) GetDeclaration() *a2ui.FunctionDeclaration {
	return &a2ui.FunctionDeclaration{
		Name:        t.Name(),
		Description: t.Description(),
		Parameters: map[string]interface{}{
			"type": "object",
			"properties": map[string]interface{}{
				"time_period": map[string]interface{}{
					"type":        "string",
					"description": "The time period to get sales data for (e.g. 'Q1', 'year'). Defaults to 'year'.",
					"default":     "year",
				},
			},
			"required": []string{},
		},
	}
}

func (t *GetSalesDataTool) ProcessLLMRequest(ctx context.Context, toolContext *a2ui.ToolContext, llmRequest *a2ui.LlmRequest) error {
	return nil
}

func (t *GetSalesDataTool) Run(ctx context.Context, args map[string]interface{}, toolContext *a2ui.ToolContext) (map[string]interface{}, error) {
	timePeriod, _ := args["time_period"].(string)
	if timePeriod == "" {
		timePeriod = "year"
	}
	log.Printf("get_sales_data called with time_period=%s", timePeriod)

	return map[string]interface{}{
		"sales_data": []interface{}{
			map[string]interface{}{
				"label": "Apparel",
				"value": 41,
				"drillDown": []interface{}{
					map[string]interface{}{"label": "Tops", "value": 31},
					map[string]interface{}{"label": "Bottoms", "value": 38},
					map[string]interface{}{"label": "Outerwear", "value": 20},
					map[string]interface{}{"label": "Footwear", "value": 11},
				},
			},
			map[string]interface{}{
				"label": "Home Goods",
				"value": 15,
				"drillDown": []interface{}{
					map[string]interface{}{"label": "Pillow", "value": 8},
					map[string]interface{}{"label": "Coffee Maker", "value": 16},
					map[string]interface{}{"label": "Area Rug", "value": 3},
					map[string]interface{}{"label": "Bath Towels", "value": 14},
				},
			},
			map[string]interface{}{
				"label": "Electronics",
				"value": 28,
				"drillDown": []interface{}{
					map[string]interface{}{"label": "Phones", "value": 25},
					map[string]interface{}{"label": "Laptops", "value": 27},
					map[string]interface{}{"label": "TVs", "value": 21},
					map[string]interface{}{"label": "Other", "value": 27},
				},
			},
			map[string]interface{}{"label": "Health & Beauty", "value": 10},
			map[string]interface{}{"label": "Other", "value": 6},
		},
	}, nil
}
