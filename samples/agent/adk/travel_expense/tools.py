# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
from typing import Any
import os
import json

logger = logging.getLogger(__name__)


def get_store_sales(region: str = "all", **kwargs: Any) -> dict[str, Any]:
  """
  Gets individual store sales

  Args:
      region: The region to get store sales for.
      **kwargs: Additional arguments.

  Returns:
      A dict containing the stores with locations and their sales, and with outlier stores highlighted
  """
  logger.info("get_store_sales called with region=%s, kwargs=%s", region, kwargs)

  return {
      "center": {"lat": 34, "lng": -118.2437},
      "zoom": 10,
      "locations": [
          {
              "lat": 34.0195,
              "lng": -118.4912,
              "name": "Santa Monica Branch",
              "description": "High traffic coastal location.",
              "outlier_reason": "Yes, 15% sales over baseline",
              "background": "#4285F4",
              "borderColor": "#FFFFFF",
              "glyphColor": "#FFFFFF",
          },
          {"lat": 34.0488, "lng": -118.2518, "name": "Downtown Flagship"},
          {"lat": 34.1016, "lng": -118.3287, "name": "Hollywood Boulevard Store"},
          {"lat": 34.1478, "lng": -118.1445, "name": "Pasadena Location"},
          {"lat": 33.7701, "lng": -118.1937, "name": "Long Beach Outlet"},
          {"lat": 34.0736, "lng": -118.4004, "name": "Beverly Hills Boutique"},
      ],
  }

def get_trips_data() -> str:
  """Call this tool to get a list of fake trips.
  
  Returns:
      A JSON string containing a list of trips with id and title.
  """
  logger.info("--- TOOL CALLED: get_trips_data ---")
  
  try:
    script_dir = os.path.dirname(__file__)
    file_path = os.path.join(script_dir, "trips_data.json")
    with open(file_path) as f:
      return f.read()
  except FileNotFoundError:
    logger.error(f"  - Error: trips_data.json not found at {file_path}")
    return "[]"
  except json.JSONDecodeError:
    logger.error(f"  - Error: Failed to decode JSON from {file_path}")
    return "[]"
