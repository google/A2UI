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

"""Landscape analysis and design tools for the agent."""

import json
import logging
from typing import Any

from google.adk.tools.tool_context import ToolContext

logger = logging.getLogger(__name__)


def analyze_landscape_features(
    image_description: str,
    tool_context: ToolContext,
) -> str:
    """Analyze landscape features from a photo description.

    Args:
        image_description: Description of the landscape photo or features observed
        tool_context: The tool context for accessing session state

    Returns:
        JSON string containing identified features and recommendations
    """
    logger.info("--- TOOL CALLED: analyze_landscape_features ---")
    logger.info(f"  - Image description: {image_description[:100]}...")

    # This would typically use vision AI, but for demo we parse the description
    features = {
        "identified_elements": [],
        "condition_assessment": {},
        "transformation_potential": [],
    }

    # Common landscape elements to detect
    element_keywords = {
        "lawn": ["lawn", "grass", "turf", "yard"],
        "patio": ["patio", "deck", "terrace", "concrete pad"],
        "trees": ["tree", "trees", "oak", "maple", "pine"],
        "shrubs": ["shrub", "bush", "hedge", "bushes"],
        "flowers": ["flower", "flowers", "garden bed", "planter"],
        "fence": ["fence", "fencing", "wall", "barrier"],
        "path": ["path", "walkway", "pathway", "stepping stones"],
        "water_feature": ["pond", "fountain", "waterfall", "pool"],
        "outdoor_furniture": ["furniture", "seating", "table", "chairs"],
        "lighting": ["lights", "lighting", "lamp", "lantern"],
    }

    description_lower = image_description.lower()
    for element, keywords in element_keywords.items():
        if any(keyword in description_lower for keyword in keywords):
            features["identified_elements"].append(element)
            features["condition_assessment"][element] = "needs_evaluation"
            features["transformation_potential"].append(
                {
                    "element": element,
                    "options": get_element_options(element),
                }
            )

    # If no specific elements found, add default outdoor space analysis
    if not features["identified_elements"]:
        features["identified_elements"] = ["open_space", "potential_garden"]
        features["transformation_potential"] = [
            {
                "element": "open_space",
                "options": ["lawn", "patio", "garden", "mixed_use"],
            },
        ]

    result = {
        "analysis": features,
        "questionnaire_suggestions": generate_questionnaire_suggestions(features),
    }

    if tool_context:
        tool_context.state["landscape_features"] = features

    logger.info(f"  - Identified {len(features['identified_elements'])} elements")
    return json.dumps(result)


def get_element_options(element: str) -> list:
    """Get transformation options for a landscape element."""
    options_map = {
        "lawn": [
            "renovate",
            "replace_with_native",
            "add_flower_beds",
            "install_irrigation",
        ],
        "patio": ["resurface", "expand", "add_pergola", "replace_with_deck"],
        "trees": ["prune", "remove", "add_more", "add_lighting"],
        "shrubs": ["trim", "replace", "add_variety", "remove"],
        "flowers": ["expand", "redesign", "add_perennials", "add_annuals"],
        "fence": ["repair", "replace", "add_climbing_plants", "paint"],
        "path": ["widen", "replace_material", "add_borders", "add_lighting"],
        "water_feature": ["clean", "upgrade", "add_plants", "add_lighting"],
        "outdoor_furniture": ["replace", "add_more", "add_shade", "add_fire_pit"],
        "lighting": ["upgrade", "add_more", "solar_conversion", "smart_lighting"],
    }
    return options_map.get(element, ["evaluate", "improve", "replace"])


def generate_questionnaire_suggestions(features: dict) -> list:
    """Generate questionnaire questions based on identified features."""
    questions = []

    for element in features.get("identified_elements", []):
        if element == "lawn":
            questions.append(
                {
                    "type": "multiple_choice",
                    "question": "What would you like to do with your lawn?",
                    "options": [
                        "Keep as-is",
                        "Add flower beds",
                        "Replace with native plants",
                        "Install new sod",
                    ],
                }
            )
        elif element == "patio":
            questions.append(
                {
                    "type": "multiple_choice",
                    "question": "How would you like to update your patio area?",
                    "options": [
                        "Keep current patio",
                        "Expand the space",
                        "Add a pergola/shade structure",
                        "Replace with new material",
                    ],
                }
            )
        elif element in ["trees", "shrubs"]:
            questions.append(
                {
                    "type": "checkbox",
                    "question": f"Would you like to preserve existing {element}?",
                    "default": True,
                }
            )
        elif element == "fence":
            questions.append(
                {
                    "type": "multiple_choice",
                    "question": "What would you like to do with your fence?",
                    "options": [
                        "Keep as-is",
                        "Add climbing plants",
                        "Replace entirely",
                        "Paint/stain",
                    ],
                }
            )

    # Always add standard questions
    questions.extend(
        [
            {
                "type": "slider",
                "question": "What's your approximate budget?",
                "min": 1000,
                "max": 50000,
                "default": 10000,
            },
            {
                "type": "multiple_choice",
                "question": "What style appeals to you most?",
                "options": [
                    "Modern/Contemporary",
                    "Traditional/Classic",
                    "Cottage/English Garden",
                    "Mediterranean",
                    "Zen/Japanese",
                ],
            },
            {
                "type": "multiple_choice",
                "question": "How much maintenance are you willing to do?",
                "options": [
                    "Low - I want minimal upkeep",
                    "Medium - Weekly care is fine",
                    "High - I enjoy gardening",
                ],
            },
        ]
    )

    return questions


def generate_design_options(
    budget: int,
    style: str,
    maintenance_level: str,
    features_to_keep: list[str] | None = None,
    tool_context: ToolContext = None,
) -> str:
    """Generate landscape design options based on user preferences.

    Args:
        budget: Budget in dollars
        style: Preferred design style
        maintenance_level: low, medium, or high
        features_to_keep: List of existing features to preserve (e.g. ["lawn", "trees"])
        tool_context: The tool context for accessing session state

    Returns:
        JSON string containing design options
    """
    logger.info("--- TOOL CALLED: generate_design_options ---")
    logger.info(f"  - Budget: ${budget}")
    logger.info(f"  - Style: {style}")
    logger.info(f"  - Maintenance: {maintenance_level}")

    features_to_keep = features_to_keep or []

    # Generate options based on budget tiers
    options = []

    if budget >= 5000:
        options.append(
            {
                "name": "Essential Garden Refresh",
                "description": "A budget-friendly update focusing on key improvements.",
                "price_range": "$3,000 - $5,000",
                "timeline": "1-2 weeks",
                "includes": [
                    "New plant selections",
                    "Mulching and edging",
                    "Basic lighting",
                    "Lawn renovation",
                ],
                "maintenance_level": "low",
            }
        )

    if budget >= 15000:
        options.append(
            {
                "name": f"{style.title()} Transformation",
                "description": f"A comprehensive redesign in the {style} style.",
                "price_range": "$10,000 - $15,000",
                "timeline": "3-4 weeks",
                "includes": [
                    "Complete landscape redesign",
                    "New patio or deck",
                    "Professional plantings",
                    "Irrigation system",
                    "Landscape lighting",
                ],
                "maintenance_level": "medium",
            }
        )

    if budget >= 30000:
        options.append(
            {
                "name": "Premium Outdoor Living",
                "description": "The ultimate outdoor transformation with luxury features.",
                "price_range": "$25,000 - $40,000",
                "timeline": "6-8 weeks",
                "includes": [
                    "Custom hardscape design",
                    "Water feature",
                    "Outdoor kitchen/fire pit",
                    "Premium plant selection",
                    "Smart irrigation and lighting",
                    "Pergola or shade structure",
                ],
                "maintenance_level": "medium",
            }
        )

    result = {
        "design_options": options,
        "preserved_features": features_to_keep,
        "style_applied": style,
        "budget_utilized": budget,
    }

    if tool_context:
        tool_context.state["design_options"] = result

    logger.info(f"  - Generated {len(options)} design options")
    return json.dumps(result)


def create_project_estimate(
    design_name: str,
    design_price: str,
    tool_context: ToolContext,
) -> str:
    """Create a detailed project estimate for the selected design.

    Args:
        design_name: Name of the selected design
        design_price: Price range of the design
        tool_context: The tool context for accessing session state

    Returns:
        JSON string containing project estimate details
    """
    logger.info("--- TOOL CALLED: create_project_estimate ---")
    logger.info(f"  - Design: {design_name}")
    logger.info(f"  - Price: {design_price}")

    # Parse price range
    try:
        price_nums = [
            int(p.replace("$", "").replace(",", "").strip())
            for p in design_price.split("-")
        ]
        base_price = sum(price_nums) // len(price_nums)
    except:
        base_price = 10000

    estimate = {
        "project_name": design_name,
        "estimate_number": f"LA-{hash(design_name) % 10000:04d}",
        "line_items": [
            {"item": "Design & Planning", "cost": int(base_price * 0.1)},
            {"item": "Materials & Plants", "cost": int(base_price * 0.4)},
            {"item": "Labor & Installation", "cost": int(base_price * 0.35)},
            {"item": "Equipment & Rentals", "cost": int(base_price * 0.1)},
            {"item": "Cleanup & Finishing", "cost": int(base_price * 0.05)},
        ],
        "subtotal": base_price,
        "tax": int(base_price * 0.08),
        "total": int(base_price * 1.08),
        "timeline": {
            "design_phase": "1 week",
            "material_procurement": "1-2 weeks",
            "installation": "2-4 weeks",
            "total": "4-7 weeks",
        },
        "next_steps": [
            "Schedule on-site consultation",
            "Finalize design details",
            "Review and sign contract",
            "Schedule installation date",
        ],
        "warranty": "2-year workmanship warranty",
        "contact": {
            "phone": "(555) 123-4567",
            "email": "projects@landscapearchitect.ai",
        },
    }

    if tool_context:
        tool_context.state["project_estimate"] = estimate

    logger.info(f"  - Created estimate #{estimate['estimate_number']}")
    return json.dumps(estimate)
