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

// getStoreSales returns mock store sales data.
func getStoreSales(region string) map[string]any {
	return map[string]any{
		"center": map[string]any{"lat": 34.0, "lng": -118.2437},
		"zoom":   10,
		"locations": []any{
			map[string]any{
				"lat":            34.0195,
				"lng":            -118.4912,
				"name":           "Santa Monica Branch",
				"description":    "High traffic coastal location.",
				"outlier_reason": "Yes, 15% sales over baseline",
				"background":     "#4285F4",
				"borderColor":    "#FFFFFF",
				"glyphColor":     "#FFFFFF",
			},
			map[string]any{"lat": 34.0488, "lng": -118.2518, "name": "Downtown Flagship"},
			map[string]any{"lat": 34.1016, "lng": -118.3287, "name": "Hollywood Boulevard Store"},
			map[string]any{"lat": 34.1478, "lng": -118.1445, "name": "Pasadena Location"},
			map[string]any{"lat": 33.7701, "lng": -118.1937, "name": "Long Beach Outlet"},
			map[string]any{"lat": 34.0736, "lng": -118.4004, "name": "Beverly Hills Boutique"},
		},
	}
}

// getSalesData returns mock sales data.
func getSalesData(timePeriod string) map[string]any {
	return map[string]any{
		"sales_data": []any{
			map[string]any{
				"label": "Apparel",
				"value": 41,
				"drillDown": []any{
					map[string]any{"label": "Tops", "value": 31},
					map[string]any{"label": "Bottoms", "value": 38},
					map[string]any{"label": "Outerwear", "value": 20},
					map[string]any{"label": "Footwear", "value": 11},
				},
			},
			map[string]any{
				"label": "Home Goods",
				"value": 15,
				"drillDown": []any{
					map[string]any{"label": "Pillow", "value": 8},
					map[string]any{"label": "Coffee Maker", "value": 16},
					map[string]any{"label": "Area Rug", "value": 3},
					map[string]any{"label": "Bath Towels", "value": 14},
				},
			},
			map[string]any{
				"label": "Electronics",
				"value": 28,
				"drillDown": []any{
					map[string]any{"label": "Phones", "value": 25},
					map[string]any{"label": "Laptops", "value": 27},
					map[string]any{"label": "TVs", "value": 21},
					map[string]any{"label": "Other", "value": 27},
				},
			},
			map[string]any{"label": "Health & Beauty", "value": 10},
			map[string]any{"label": "Other", "value": 6},
		},
	}
}
