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

"""A2UI Message Processor - handles A2UI messages and manages surfaces."""

from typing import Any, Optional
from .types import A2UIMessage, Component, Surface, ComponentNode
from .data_model import DataModel


class MessageProcessor:
    """Processes A2UI messages and manages surfaces."""

    def __init__(self):
        self._surfaces: dict[str, Surface] = {}

    def process_messages(self, messages: list[A2UIMessage]) -> None:
        """Process a list of A2UI messages."""
        for message in messages:
            self.process_message(message)

    def process_message(self, message: A2UIMessage) -> None:
        """Process a single A2UI message."""
        if "beginRendering" in message:
            self._handle_begin_rendering(message["beginRendering"])
        elif "surfaceUpdate" in message:
            self._handle_surface_update(message["surfaceUpdate"])
        elif "dataModelUpdate" in message:
            self._handle_data_model_update(message["dataModelUpdate"])
        elif "deleteSurface" in message:
            self._handle_delete_surface(message["deleteSurface"])

    def _handle_begin_rendering(self, data: dict) -> None:
        """Handle beginRendering message."""
        surface_id = data.get("surfaceId", "default")
        root_id = data.get("root")
        styles = data.get("styles", {})

        self._surfaces[surface_id] = Surface(
            surface_id=surface_id,
            root_id=root_id,
            components={},
            data_model={},
            styles=styles,
        )
        self._rebuild_component_tree(surface_id)

    def _handle_surface_update(self, data: dict) -> None:
        """Handle surfaceUpdate message."""
        surface_id = data.get("surfaceId", "default")
        components = data.get("components", [])

        if surface_id not in self._surfaces:
            self._surfaces[surface_id] = Surface(
                surface_id=surface_id,
                components={},
                data_model={},
            )

        surface = self._surfaces[surface_id]
        for comp in components:
            comp_id = comp.get("id")
            if comp_id:
                surface.components[comp_id] = comp

        self._rebuild_component_tree(surface_id)

    def _handle_data_model_update(self, data: dict) -> None:
        """Handle dataModelUpdate message."""
        surface_id = data.get("surfaceId", "default")
        path = data.get("path")
        contents = data.get("contents", [])

        if surface_id not in self._surfaces:
            self._surfaces[surface_id] = Surface(
                surface_id=surface_id,
                components={},
                data_model={},
            )

        surface = self._surfaces[surface_id]
        data_model = DataModel()
        data_model._data = surface.data_model
        data_model.update(path, contents)
        surface.data_model = data_model.data

        self._rebuild_component_tree(surface_id)

    def _handle_delete_surface(self, data: dict) -> None:
        """Handle deleteSurface message."""
        surface_id = data.get("surfaceId")
        if surface_id and surface_id in self._surfaces:
            del self._surfaces[surface_id]

    def _rebuild_component_tree(self, surface_id: str) -> None:
        """Rebuild the component tree from root."""
        surface = self._surfaces.get(surface_id)
        if not surface or not surface.root_id:
            return

        if surface.root_id not in surface.components:
            return

        data_model = DataModel()
        data_model._data = surface.data_model

        visited: set[str] = set()
        surface.component_tree = self._build_node(
            surface.root_id,
            surface,
            data_model,
            "/",
            visited,
        )

    def _build_node(
        self,
        comp_id: str,
        surface: Surface,
        data_model: DataModel,
        data_context_path: str,
        visited: set[str],
    ) -> Optional[ComponentNode]:
        """Recursively build a component node."""
        full_id = f"{comp_id}:{data_context_path}"
        if full_id in visited:
            return None
        visited.add(full_id)

        comp_data = surface.components.get(comp_id)
        if not comp_data:
            return None

        # Get component type and properties
        comp_wrapper = comp_data.get("component") or comp_data.get(
            "componentProperties", {}
        )
        if not comp_wrapper:
            return None

        comp_type = list(comp_wrapper.keys())[0]
        raw_props = comp_wrapper[comp_type] or {}

        # Resolve property values
        resolved_props = {}
        for key, value in raw_props.items():
            resolved_props[key] = self._resolve_value(
                value, data_model, data_context_path
            )

        # Create the node
        node = ComponentNode(
            id=comp_id,
            comp_type=comp_type,
            properties=resolved_props,
            data_context_path=data_context_path,
            weight=comp_data.get("weight", 1.0),
        )

        # Handle child references
        if "child" in resolved_props:
            child_id = raw_props.get("child")
            if isinstance(child_id, str) and child_id in surface.components:
                child_node = self._build_node(
                    child_id, surface, data_model, data_context_path, visited
                )
                if child_node:
                    node.children.append(child_node)

        # Handle children (explicitList or template)
        if "children" in raw_props:
            children_prop = raw_props["children"]
            node.children = self._resolve_children(
                children_prop, surface, data_model, data_context_path, visited
            )

        visited.discard(full_id)
        return node

    def _resolve_children(
        self,
        children_prop: dict,
        surface: Surface,
        data_model: DataModel,
        data_context_path: str,
        visited: set[str],
    ) -> list[ComponentNode]:
        """Resolve children from explicitList or template."""
        children: list[ComponentNode] = []

        # Handle explicitList
        if "explicitList" in children_prop:
            for child_id in children_prop["explicitList"]:
                if isinstance(child_id, str) and child_id in surface.components:
                    child_node = self._build_node(
                        child_id, surface, data_model, data_context_path, visited
                    )
                    if child_node:
                        children.append(child_node)

        # Handle template with dataBinding
        elif "template" in children_prop:
            template = children_prop["template"]
            template_id = template.get("componentId")
            data_binding = template.get("dataBinding", "")

            if not template_id or template_id not in surface.components:
                return children

            # Resolve the full data path
            full_data_path = self._resolve_path(data_binding, data_context_path)
            data = data_model.get(full_data_path.lstrip("/"))

            if isinstance(data, dict):
                # Iterate over map entries
                for key in data.keys():
                    child_context = f"{full_data_path}/{key}"
                    child_node = self._build_node(
                        template_id, surface, data_model, child_context, visited.copy()
                    )
                    if child_node:
                        child_node.id = f"{template_id}:{key}"
                        children.append(child_node)

            elif isinstance(data, list):
                # Iterate over array items
                for i, _ in enumerate(data):
                    child_context = f"{full_data_path}/{i}"
                    child_node = self._build_node(
                        template_id, surface, data_model, child_context, visited.copy()
                    )
                    if child_node:
                        child_node.id = f"{template_id}:{i}"
                        children.append(child_node)

        return children

    def _resolve_path(self, path: str, context_path: str) -> str:
        """Resolve a path against a context path."""
        if path.startswith("/"):
            return path
        if context_path and context_path != "/":
            return f"{context_path.rstrip('/')}/{path}"
        return f"/{path}"

    def _resolve_value(
        self, value: Any, data_model: DataModel, context_path: str
    ) -> Any:
        """Resolve a property value against the data model."""
        if value is None:
            return None

        if isinstance(value, dict):
            if "literalString" in value:
                return value["literalString"]
            if "literalNumber" in value:
                return value["literalNumber"]
            if "literalBoolean" in value:
                return value["literalBoolean"]
            if "path" in value:
                path = value["path"]
                full_path = self._resolve_path(path, context_path)
                result = data_model.get(full_path.lstrip("/"))
                return result if result is not None else ""

        return value

    def get_surface(self, surface_id: str) -> Optional[Surface]:
        """Get a surface by ID."""
        return self._surfaces.get(surface_id)

    def get_surfaces(self) -> dict[str, Surface]:
        """Get all surfaces."""
        return self._surfaces.copy()

    def clear_surfaces(self) -> None:
        """Clear all surfaces."""
        self._surfaces.clear()

    def get_data_model(self, surface_id: str) -> DataModel:
        """Get a DataModel instance for a surface."""
        surface = self._surfaces.get(surface_id)
        data_model = DataModel()
        if surface:
            data_model._data = surface.data_model.copy()
        return data_model
