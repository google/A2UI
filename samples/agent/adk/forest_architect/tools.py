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

"""Forest calculation tools for the Forest Architect agent."""

import json
import logging
import math
from typing import Optional

from google.adk.tools.tool_context import ToolContext

logger = logging.getLogger(__name__)

# Constants for Miyawaki-style forest calculations
COST_PER_TREE_BASE = 150  # Base cost in INR
TREES_PER_SQ_METER_MIN = 2
TREES_PER_SQ_METER_MAX = 4
CO2_PER_TREE_PER_YEAR = 20  # kg
SURVIVAL_RATE = 0.95
SQ_FEET_TO_SQ_METER = 0.0929

# Layer distribution (Miyawaki method)
LAYER_DISTRIBUTION = {
    "canopy": 0.40,
    "subcanopy": 0.35,
    "shrub": 0.25,
}

# Native species recommendations by layer
NATIVE_SPECIES = {
    "canopy": [
        {"name": "Ficus benghalensis", "common_name": "Banyan Tree", "co2_rate": 25},
        {"name": "Azadirachta indica", "common_name": "Neem", "co2_rate": 22},
        {"name": "Pongamia pinnata", "common_name": "Pongamia", "co2_rate": 20},
        {"name": "Dalbergia sissoo", "common_name": "Shisham", "co2_rate": 24},
        {"name": "Terminalia arjuna", "common_name": "Arjun Tree", "co2_rate": 23},
    ],
    "subcanopy": [
        {"name": "Cassia fistula", "common_name": "Golden Shower", "co2_rate": 18},
        {
            "name": "Lagerstroemia speciosa",
            "common_name": "Pride of India",
            "co2_rate": 16,
        },
        {"name": "Bauhinia variegata", "common_name": "Kachnar", "co2_rate": 15},
        {"name": "Saraca asoca", "common_name": "Ashoka Tree", "co2_rate": 17},
    ],
    "shrub": [
        {"name": "Nerium oleander", "common_name": "Oleander", "co2_rate": 10},
        {"name": "Hibiscus rosa-sinensis", "common_name": "Hibiscus", "co2_rate": 8},
        {"name": "Murraya paniculata", "common_name": "Orange Jasmine", "co2_rate": 9},
        {"name": "Ixora coccinea", "common_name": "Jungle Geranium", "co2_rate": 7},
    ],
}


def calculate_forest_metrics(
    budget: int,
    area_sqft: int,
    tool_context: ToolContext,
) -> str:
    """Calculate comprehensive forest metrics based on budget and area.

    Uses Miyawaki method calculations for dense native forest plantations.

    Args:
        budget: Total budget in INR (e.g., 500000 for ₹5 Lakhs)
        area_sqft: Plantation area in square feet
        tool_context: The tool context for accessing session state

    Returns:
        JSON string containing:
        - total_trees: Number of trees that can be planted
        - species_mix: Breakdown by layer with percentages
        - co2_sequestration: Projected CO2 capture per year in tons
        - cost_per_tree: Average cost per tree
        - survival_rate: Expected survival rate percentage
        - recommended_species: Species recommendations by layer
    """
    logger.info("--- TOOL CALLED: calculate_forest_metrics ---")
    logger.info(f"  - Budget: ₹{budget:,}")
    logger.info(f"  - Area: {area_sqft:,} sq ft")

    # Convert area to square meters
    area_sqm = area_sqft * SQ_FEET_TO_SQ_METER

    # Calculate maximum trees based on area (dense planting)
    max_trees_by_area = int(area_sqm * TREES_PER_SQ_METER_MAX)

    # Calculate maximum trees based on budget
    max_trees_by_budget = int(budget / COST_PER_TREE_BASE)

    # Take the limiting factor
    total_trees = min(max_trees_by_area, max_trees_by_budget)

    # Calculate actual tree density achieved
    trees_per_sqm = total_trees / area_sqm if area_sqm > 0 else 0

    # Determine if budget or area is the constraint
    constraint = "budget" if max_trees_by_budget < max_trees_by_area else "area"

    # Calculate species distribution by layer
    species_mix = []
    layer_trees = {}

    for layer, percentage in LAYER_DISTRIBUTION.items():
        trees_in_layer = int(total_trees * percentage)
        layer_trees[layer] = trees_in_layer
        species_mix.append(
            {
                "label": layer.replace("_", " ").title() + " Trees",
                "value": int(percentage * 100),
                "trees": trees_in_layer,
                "color": {
                    "canopy": "#1B5E20",
                    "subcanopy": "#4CAF50",
                    "shrub": "#81C784",
                }.get(layer, "#43A047"),
            }
        )

    # Calculate CO2 sequestration
    # Weight by layer (canopy trees absorb more)
    co2_by_layer = {"canopy": 25, "subcanopy": 18, "shrub": 9}

    total_co2_kg = sum(
        layer_trees[layer] * co2_by_layer[layer] for layer in layer_trees
    )
    co2_tons = total_co2_kg / 1000

    # Calculate actual cost per tree
    cost_per_tree = budget / total_trees if total_trees > 0 else 0

    # Get species recommendations
    recommended_species = {
        layer: [
            {"scientific_name": s["name"], "common_name": s["common_name"]}
            for s in species[:3]  # Top 3 per layer
        ]
        for layer, species in NATIVE_SPECIES.items()
    }

    # Calculate ecological impact metrics
    oxygen_production = (
        total_trees * 118
    )  # kg/year (average tree produces 118kg O2/year)
    water_conservation = (
        total_trees * 50
    )  # liters/day (tree conserves ~50L/day through reduced evaporation)
    temperature_reduction = min(3.0, trees_per_sqm * 0.75)  # Up to 3°C reduction

    result = {
        "config": {
            "budget": budget,
            "budgetDisplay": f"₹{budget:,}",
            "areaSquareFeet": area_sqft,
            "areaSquareMeters": round(area_sqm, 2),
            "treeDensity": round(trees_per_sqm, 2),
            "constraint": constraint,
        },
        "projections": {
            "totalTrees": total_trees,
            "survivingTrees": int(total_trees * SURVIVAL_RATE),
            "co2SequestrationKg": round(total_co2_kg, 1),
            "co2SequestrationTons": round(co2_tons, 2),
            "co2SequestrationDisplay": f"{round(co2_tons, 1)} tons/year",
            "costPerTree": round(cost_per_tree, 2),
            "costPerTreeDisplay": f"₹{round(cost_per_tree)}/tree",
            "survivalRate": f"{int(SURVIVAL_RATE * 100)}%",
        },
        "speciesMix": {
            "chartData": species_mix,
            "layerBreakdown": {
                "canopy": layer_trees.get("canopy", 0),
                "subcanopy": layer_trees.get("subcanopy", 0),
                "shrub": layer_trees.get("shrub", 0),
            },
        },
        "recommendations": recommended_species,
        "ecologicalImpact": {
            "oxygenProductionKg": round(oxygen_production, 1),
            "oxygenProductionDisplay": f"{round(oxygen_production / 1000, 1)} tons/year",
            "waterConservationLiters": round(water_conservation * 365),
            "temperatureReduction": f"{round(temperature_reduction, 1)}°C",
        },
    }

    logger.info(f"  - Success: Calculated metrics for {total_trees} trees")
    logger.info(f"  - CO2 Sequestration: {co2_tons:.2f} tons/year")

    # Store in session state for use by other tools
    if tool_context:
        tool_context.state["forest_config"] = result["config"]
        tool_context.state["forest_projections"] = result["projections"]

    return json.dumps(result)


def get_species_recommendations(
    region: str,
    climate: str,
    tool_context: ToolContext,
    layer: Optional[str] = None,
) -> str:
    """Get recommended native species for a specific region and climate.

    Args:
        region: Geographic region (e.g., "North India", "South India", "Coastal")
        climate: Climate type (e.g., "tropical", "subtropical", "semi-arid")
        tool_context: The tool context for accessing session state
        layer: Optional - filter by forest layer ("canopy", "subcanopy", "shrub")

    Returns:
        JSON string containing species recommendations with:
        - Scientific names
        - Common names
        - CO2 absorption rates
        - Water requirements
    """
    logger.info("--- TOOL CALLED: get_species_recommendations ---")
    logger.info(f"  - Region: {region}")
    logger.info(f"  - Climate: {climate}")
    logger.info(f"  - Layer filter: {layer or 'all'}")

    # For now, return our default native species (can be expanded with region-specific data)
    result = {}

    if layer and layer.lower() in NATIVE_SPECIES:
        result[layer.lower()] = NATIVE_SPECIES[layer.lower()]
    else:
        result = NATIVE_SPECIES

    logger.info(f"  - Success: Returning species for {len(result)} layer(s)")
    return json.dumps(result)


def generate_proposal_summary(
    organization_name: str,
    budget: int,
    area_sqft: int,
    tool_context: ToolContext,
) -> str:
    """Generate a summary for the forest proposal.

    Args:
        organization_name: Name of the organization/society
        budget: Total budget in INR
        area_sqft: Plantation area in square feet
        tool_context: The tool context for accessing session state

    Returns:
        JSON string containing proposal summary with all calculated metrics
    """
    logger.info("--- TOOL CALLED: generate_proposal_summary ---")
    logger.info(f"  - Organization: {organization_name}")
    logger.info(f"  - Budget: ₹{budget:,}")
    logger.info(f"  - Area: {area_sqft:,} sq ft")

    # Get metrics from calculate_forest_metrics
    metrics_json = calculate_forest_metrics(budget, area_sqft, tool_context)
    metrics = json.loads(metrics_json)

    # Build proposal summary
    proposal = {
        "organizationName": organization_name,
        "proposalDate": "Generated by Forest Architect AI",
        "projectType": "Miyawaki Dense Forest",
        **metrics,
        "timeline": {
            "plantationDuration": "2-3 weeks",
            "maintenancePeriod": "3 years",
            "forestMaturity": "10-15 years (vs 75+ years for conventional)",
        },
        "benefits": [
            f"Plant {metrics['projections']['totalTrees']:,} native trees",
            f"Sequester {metrics['projections']['co2SequestrationDisplay']} of CO2",
            f"Produce {metrics['ecologicalImpact']['oxygenProductionDisplay']} of oxygen",
            f"Reduce local temperature by up to {metrics['ecologicalImpact']['temperatureReduction']}",
            "Create biodiversity habitat for local wildlife",
            "Minimal maintenance after 3 years",
        ],
        "forestsByHeartfulness": {
            "initiative": "Forests by Heartfulness",
            "goal": "30 million trees by 2030",
            "contribution": f"This project contributes {metrics['projections']['totalTrees']:,} trees to our goal",
        },
    }

    logger.info(f"  - Success: Generated proposal for {organization_name}")
    return json.dumps(proposal)


def adjust_budget(
    new_budget: int,
    tool_context: ToolContext,
) -> str:
    """Recalculate forest metrics when budget changes.

    Called when user adjusts the budget slider.

    Args:
        new_budget: New budget value in INR
        tool_context: The tool context for accessing session state

    Returns:
        JSON string containing updated metrics
    """
    logger.info("--- TOOL CALLED: adjust_budget ---")
    logger.info(f"  - New Budget: ₹{new_budget:,}")

    # Get current area from state, default to 10000 sq ft
    current_area = tool_context.state.get("forest_config", {}).get(
        "areaSquareFeet", 10000
    )

    return calculate_forest_metrics(new_budget, current_area, tool_context)


def adjust_area(
    new_area_sqft: int,
    tool_context: ToolContext,
) -> str:
    """Recalculate forest metrics when area changes.

    Called when user changes the area input.

    Args:
        new_area_sqft: New area value in square feet
        tool_context: The tool context for accessing session state

    Returns:
        JSON string containing updated metrics
    """
    logger.info("--- TOOL CALLED: adjust_area ---")
    logger.info(f"  - New Area: {new_area_sqft:,} sq ft")

    # Get current budget from state, default to 500000
    current_budget = tool_context.state.get("forest_config", {}).get("budget", 500000)

    return calculate_forest_metrics(current_budget, new_area_sqft, tool_context)
