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

from typing import List, Dict, Any
import json
import logging
import os
import time

import instrumentation
from google.adk.tools.tool_context import ToolContext
from ui_schema import Restaurant

logger = logging.getLogger(__name__)

def fetch_restaurant_data(cuisine: str, location: str, count: int = 5, base_url: str = "http://localhost:10002") -> List[Dict[str, Any]]:
    """Fetches restaurant data from the JSON file."""
    items = []
    if "new york" in location.lower() or "ny" in location.lower():
        try:
            script_dir = os.path.dirname(__file__)
            file_path = os.path.join(script_dir, "restaurant_data.json")
            with open(file_path) as f:
                restaurant_data_str = f.read()
                restaurant_data_str = restaurant_data_str.replace("http://localhost:10002", base_url)
                all_items = json.loads(restaurant_data_str)

            items = all_items[:count]
            logger.info(
                f"  - Success: Found {len(all_items)} restaurants, returning {len(items)}."
            )
            validated_items = [Restaurant(**item).model_dump() for item in items]
            return validated_items

        except FileNotFoundError:
            logger.error(f"  - Error: restaurant_data.json not found at {file_path}")
        except json.JSONDecodeError:
            logger.error(f"  - Error: Failed to decode JSON from {file_path}")
        except Exception as e:
            logger.error(f"  - Error processing restaurant data: {e}")
    return []


def get_restaurants(cuisine: str, location: str,  tool_context: ToolContext, count: int = 5) -> List[Dict[str, Any]]:
    """Call this tool to get a list of restaurants based on a cuisine and location.
    'count' is the number of restaurants to return.
    """
    logger.info(f"--- TOOL CALLED: get_restaurants (count: {count}) ---")
    logger.info(f"  - Cuisine: {cuisine}")
    logger.info(f"  - Location: {location}")

    start_time = time.time()
    try:
        base_url = tool_context.state.get("base_url", "http://localhost:10002")
        return fetch_restaurant_data(cuisine, location, count, base_url)
    finally:
        duration = (time.time() - start_time) * 1000
        instrumentation.track_tool_call("get_restaurants", duration)
