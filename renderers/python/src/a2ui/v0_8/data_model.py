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

"""A2UI Data Model for path resolution."""

from typing import Any, Optional


class DataModel:
    """Manages data for a surface and resolves path references."""

    def __init__(self):
        self._data: dict[str, Any] = {}

    def update(self, path: Optional[str], contents: list[dict]) -> None:
        """Update the data model with new contents.

        Args:
            path: Optional path to update. If None or "/", replaces entire model.
            contents: List of data entries with key and value*.
        """
        # Convert contents list to dict
        new_data = self._contents_to_dict(contents)

        if not path or path == "/":
            # Replace entire data model
            self._data = new_data
        else:
            # Update at specific path
            self._set_at_path(path, new_data)

    def _contents_to_dict(self, contents: list[dict]) -> dict[str, Any]:
        """Convert contents array to dictionary."""
        result = {}
        for entry in contents:
            key = entry.get("key", "")
            if not key:
                continue

            # Extract value from entry
            if "valueString" in entry:
                result[key] = entry["valueString"]
            elif "valueNumber" in entry:
                result[key] = entry["valueNumber"]
            elif "valueBoolean" in entry:
                result[key] = entry["valueBoolean"]
            elif "valueMap" in entry:
                result[key] = self._contents_to_dict(entry["valueMap"])

        return result

    def _set_at_path(self, path: str, value: Any) -> None:
        """Set a value at a specific path."""
        parts = [p for p in path.split("/") if p]
        current = self._data

        for i, part in enumerate(parts[:-1]):
            if part not in current:
                current[part] = {}
            current = current[part]

        if parts:
            current[parts[-1]] = value

    def get(self, path: str, default: Any = None) -> Any:
        """Get a value at a specific path.

        Args:
            path: Path like "common_name" or "plant/category"
            default: Default value if path not found

        Returns:
            The value at the path, or default if not found.
        """
        parts = [p for p in path.split("/") if p]
        current = self._data

        for part in parts:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return default

        return current

    def resolve_value(self, value: Any, default: str = "") -> str:
        """Resolve an A2UI value to a string.

        Handles:
        - Plain strings
        - {"literalString": "..."}
        - {"literalNumber": 123}
        - {"literalBoolean": true}
        - {"path": "key"} - looks up in data model

        Args:
            value: The A2UI value to resolve
            default: Default if value is None/empty

        Returns:
            Resolved string value
        """
        if value is None:
            return default

        if isinstance(value, str):
            return value

        if isinstance(value, (int, float, bool)):
            return str(value)

        if isinstance(value, dict):
            if "literalString" in value:
                return value["literalString"]
            if "literalNumber" in value:
                return str(value["literalNumber"])
            if "literalBoolean" in value:
                return str(value["literalBoolean"]).lower()
            if "path" in value:
                path_value = self.get(value["path"])
                if path_value is not None:
                    return str(path_value)
                return default

        return str(value) if value else default

    def clear(self) -> None:
        """Clear all data."""
        self._data = {}

    @property
    def data(self) -> dict[str, Any]:
        """Get the raw data dictionary."""
        return self._data
