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

logger = logging.getLogger(__name__)

def get_office_map_url(location: str) -> str:
    """
    Returns a valid OpenStreetMap embed URL for a given office location.
    Args:
        location: The city or office name (e.g. "New York", "San Francisco")
    """
    # In a real app, you might look up exact lat/long from a database
    coords = {
        "New York": "-74.00,40.71,-73.98,40.73",
        "San Francisco": "-122.42,37.77,-122.41,37.78",
        "London": "-0.13,51.50,-0.12,51.51"
    }
    
    bbox = coords.get(location, "-122.42,37.77,-122.41,37.78") # Default to SF
    return f"https://www.openstreetmap.org/export/embed.html?bbox={bbox}&layer=mapnik"


def get_contact_info(name: str, department: str = "") -> str:
    """Call this tool to get a list of contacts based on a name and optional department.
    'name' is the person's name to search for.
    'department' is the optional department to filter by.
    """
    logger.info("--- TOOL CALLED: get_contact_info ---")
    logger.info(f"  - Name: {name}")
    logger.info(f"  - Department: {department}")

    results = []
    try:
        script_dir = os.path.dirname(__file__)
        file_path = os.path.join(script_dir, "contact_data.json")
        with open(file_path) as f:
            all_contacts = json.load(f)

        name_lower = name.lower()

        dept_lower = department.lower() if department else ""

        # Filter by name
        results = [
            contact for contact in all_contacts if name_lower in contact["name"].lower()
        ]

        # If department is provided, filter results further
        if dept_lower:
            results = [
                contact
                for contact in results
                if dept_lower in contact["department"].lower()
            ]

        logger.info(f"  - Success: Found {len(results)} matching contacts.")

    except FileNotFoundError:
        logger.error(f"  - Error: contact_data.json not found at {file_path}")
    except json.JSONDecodeError:
        logger.error(f"  - Error: Failed to decode JSON from {file_path}")

    return json.dumps(results)
