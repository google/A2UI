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

import json
import logging
import os
from pathlib import Path

from google.adk.tools.tool_context import ToolContext

logger = logging.getLogger(__name__)

# Path to the plant data (local assets folder)
ASSETS_DIR = Path(__file__).parent / "assets"
PLANTS_FILE = ASSETS_DIR / "heartyculture_plants.json"

# Cache for plant data
_plants_cache = None


def _load_plants() -> list:
    """Load and cache plant data."""
    global _plants_cache
    if _plants_cache is None:
        try:
            with open(PLANTS_FILE, "r", encoding="utf-8") as f:
                _plants_cache = json.load(f)
            logger.info(f"Loaded {len(_plants_cache)} plants from {PLANTS_FILE}")
        except Exception as e:
            logger.error(f"Failed to load plants: {e}")
            _plants_cache = []
    return _plants_cache


def search_plants(
    query: str, tool_context: ToolContext, category: str = "", limit: int = 10
) -> str:
    """Search for plants by name (common or scientific).

    Args:
        query: The search term to look for in plant names.
        tool_context: The tool context for accessing session state.
        category: Optional category to filter results.
        limit: Maximum number of results to return (default 10).

    Returns:
        JSON string containing matching plants.
    """
    logger.info("--- TOOL CALLED: search_plants ---")
    logger.info(f"  - Query: {query}")
    logger.info(f"  - Category: {category}")
    logger.info(f"  - Limit: {limit}")

    plants = _load_plants()
    query_lower = query.lower()
    category_lower = category.lower() if category else ""

    results = []
    for plant in plants:
        # Search in both scientific_name and common_name
        scientific = plant.get("scientific_name", "").lower()
        common = plant.get("common_name", "").lower()
        plant_category = plant.get("category", "").lower()

        if query_lower in scientific or query_lower in common:
            # If category filter is provided, apply it
            if category_lower and category_lower not in plant_category:
                continue

            # Update image URL with base_url if available
            plant_copy = plant.copy()
            if base_url := tool_context.state.get("base_url"):
                if plant_copy.get("image"):
                    plant_copy["image"] = f"{base_url}{plant_copy['image']}"

            results.append(plant_copy)

            if len(results) >= limit:
                break

    logger.info(f"  - Success: Found {len(results)} matching plants.")
    return json.dumps(results)


def get_plant_details(plant_id: int, tool_context: ToolContext) -> str:
    """Get detailed information about a specific plant.

    Args:
        plant_id: The ID of the plant to retrieve.
        tool_context: The tool context for accessing session state.

    Returns:
        JSON string containing the plant details, or empty object if not found.
    """
    logger.info("--- TOOL CALLED: get_plant_details ---")
    logger.info(f"  - Plant ID: {plant_id}")

    plants = _load_plants()

    for plant in plants:
        if plant.get("id") == plant_id:
            plant_copy = plant.copy()
            if base_url := tool_context.state.get("base_url"):
                if plant_copy.get("image"):
                    plant_copy["image"] = f"{base_url}{plant_copy['image']}"

            logger.info(
                f"  - Success: Found plant {plant_copy.get('common_name', plant_copy.get('scientific_name'))}"
            )
            return json.dumps(plant_copy)

    logger.info(f"  - Not found: Plant ID {plant_id}")
    return json.dumps({})


def list_categories(tool_context: ToolContext) -> str:
    """List all available plant categories.

    Args:
        tool_context: The tool context for accessing session state.

    Returns:
        JSON string containing a list of unique categories with counts.
    """
    logger.info("--- TOOL CALLED: list_categories ---")

    plants = _load_plants()

    # Count plants per category
    category_counts = {}
    for plant in plants:
        category = plant.get("category", "Unknown")
        category_counts[category] = category_counts.get(category, 0) + 1

    # Convert to list of dicts
    categories = [
        {"name": name, "count": count}
        for name, count in sorted(category_counts.items())
    ]

    logger.info(f"  - Success: Found {len(categories)} categories.")
    return json.dumps(categories)


def get_plants_by_category(
    category: str, tool_context: ToolContext, limit: int = 12
) -> str:
    """Get plants in a specific category.

    Args:
        category: The category name to filter by.
        tool_context: The tool context for accessing session state.
        limit: Maximum number of results to return (default 12).

    Returns:
        JSON string containing plants in the specified category.
    """
    logger.info("--- TOOL CALLED: get_plants_by_category ---")
    logger.info(f"  - Category: {category}")
    logger.info(f"  - Limit: {limit}")

    plants = _load_plants()
    category_lower = category.lower()

    results = []
    for plant in plants:
        plant_category = plant.get("category", "").lower()

        if category_lower in plant_category:
            plant_copy = plant.copy()
            if base_url := tool_context.state.get("base_url"):
                if plant_copy.get("image"):
                    plant_copy["image"] = f"{base_url}{plant_copy['image']}"

            results.append(plant_copy)

            if len(results) >= limit:
                break

    logger.info(f"  - Success: Found {len(results)} plants in category '{category}'.")
    return json.dumps(results)
