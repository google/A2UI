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

"""A2UI message processor and renderer for Reflex with template support."""

from typing import Any
import reflex as rx
from . import style

# Global data model for resolving paths
_data_model: dict = {}


def render_a2ui_messages(messages: list[dict]) -> rx.Component:
    """Render A2UI messages as Reflex components."""
    global _data_model
    _data_model = {}

    component_map = {}
    root_id = None

    for message in messages:
        if "beginRendering" in message:
            root_id = message["beginRendering"].get("root")
        elif "surfaceUpdate" in message:
            surface_update = message["surfaceUpdate"]
            for comp in surface_update.get("components", []):
                comp_id = comp.get("id")
                if comp_id:
                    component_map[comp_id] = comp
        elif "dataModelUpdate" in message:
            update_data_model(message["dataModelUpdate"])

    if not component_map:
        return rx.box()

    # Render from root with data context
    if root_id and root_id in component_map:
        rendered = render_component(component_map[root_id], component_map, "/")
        if rendered:
            return rx.box(rendered, style=style.surfaces_style)

    return rx.box()


def update_data_model(data_update: dict) -> None:
    """Update the global data model with new data."""
    global _data_model
    path = data_update.get("path", "/")
    contents = data_update.get("contents", [])

    # Convert contents to dict
    new_data = contents_to_dict(contents)

    if path == "/" or path == "":
        _data_model = new_data
    else:
        # Set at path
        parts = [p for p in path.split("/") if p]
        current = _data_model
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        if parts:
            current[parts[-1]] = new_data


def contents_to_dict(contents: list) -> dict:
    """Convert A2UI contents format to dict."""
    result = {}
    for entry in contents:
        key = entry.get("key", "")
        if not key:
            continue
        if "valueString" in entry:
            result[key] = entry["valueString"]
        elif "valueNumber" in entry:
            result[key] = entry["valueNumber"]
        elif "valueBoolean" in entry:
            result[key] = entry["valueBoolean"]
        elif "valueMap" in entry:
            result[key] = contents_to_dict(entry["valueMap"])
    return result


def get_data_at_path(path: str) -> Any:
    """Get data at a specific path."""
    if not path or path == "/":
        return _data_model
    parts = [p for p in path.split("/") if p]
    current = _data_model
    for part in parts:
        if isinstance(current, dict) and part in current:
            current = current[part]
        elif isinstance(current, list) and part.isdigit():
            idx = int(part)
            if 0 <= idx < len(current):
                current = current[idx]
            else:
                return None
        else:
            return None
    return current


def resolve_path(path: str, context: str) -> str:
    """Resolve a relative path against a context."""
    if path.startswith("/"):
        return path
    if context and context != "/":
        return f"{context.rstrip('/')}/{path}"
    return f"/{path}"


def resolve_value(value: Any, context: str = "/") -> Any:
    """Resolve an A2UI value to actual value."""
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        if "literalString" in value:
            return value["literalString"]
        if "literalNumber" in value:
            return value["literalNumber"]
        if "literalBoolean" in value:
            return value["literalBoolean"]
        if "path" in value:
            path = value["path"]
            full_path = resolve_path(path, context)
            result = get_data_at_path(full_path)
            return result if result is not None else ""
    return value


def render_component(
    component: dict, component_map: dict, context: str = "/"
) -> rx.Component | None:
    """Render a single A2UI component with data context."""
    # Support both component and componentProperties
    component_props = component.get("component") or component.get(
        "componentProperties", {}
    )
    if not component_props:
        return None

    comp_type = list(component_props.keys())[0]
    props = component_props[comp_type] or {}

    renderers = {
        "Text": render_text,
        "Heading": render_heading,
        "Image": render_image,
        "Card": render_card,
        "Row": render_row,
        "Column": render_column,
        "List": render_list,
        "Button": render_button,
        "Divider": render_divider,
    }

    renderer = renderers.get(comp_type)
    if renderer:
        return renderer(props, component_map, context)

    return None


def render_text(props: dict, component_map: dict, context: str) -> rx.Component:
    """Render a Text component."""
    text = str(resolve_value(props.get("text"), context))
    usage_hint = props.get("usageHint", "")

    text_style = dict(style.text_style)

    if usage_hint == "h1":
        text_style.update(
            {"font_size": "24px", "font_weight": "bold", "color": "#388e3c"}
        )
    elif usage_hint == "h3":
        text_style.update(style.card_title_style)
    elif usage_hint == "subtitle":
        text_style.update(style.card_subtitle_style)

    return rx.text(text, style=text_style)


def render_heading(props: dict, component_map: dict, context: str) -> rx.Component:
    """Render a Heading component."""
    text = str(resolve_value(props.get("text"), context))
    level = props.get("level", 2)

    return rx.heading(text, style=style.heading_style, size=str(9 - level))


def render_image(props: dict, component_map: dict, context: str) -> rx.Component:
    """Render an Image component."""
    url = str(resolve_value(props.get("url"), context))
    alt = str(resolve_value(props.get("alt"), context))

    # Handle relative URLs from the agent
    if url.startswith("/"):
        url = f"http://localhost:10004{url}"

    return rx.image(src=url, alt=alt, style=style.card_image_style)


def render_card(props: dict, component_map: dict, context: str) -> rx.Component:
    """Render a Card component."""
    child_id = props.get("child")

    child_component = None
    if child_id and child_id in component_map:
        child_component = render_component(
            component_map[child_id], component_map, context
        )

    return rx.box(
        child_component if child_component else rx.box(),
        style=style.card_style,
    )


def render_row(props: dict, component_map: dict, context: str) -> rx.Component:
    """Render a Row component."""
    children = render_children(props, component_map, context)
    return rx.hstack(*children, style=style.card_row_style)


def render_column(props: dict, component_map: dict, context: str) -> rx.Component:
    """Render a Column component."""
    children = render_children(props, component_map, context)
    return rx.vstack(*children, style=style.card_column_style, align="start")


def render_list(props: dict, component_map: dict, context: str) -> rx.Component:
    """Render a List component."""
    children = render_children(props, component_map, context)
    return rx.vstack(*children, style=style.list_style, align="stretch")


def render_button(props: dict, component_map: dict, context: str) -> rx.Component:
    """Render a Button component."""
    # Try to resolve label or use child text
    label = resolve_value(props.get("label"), context)

    # If label is a child reference, look it up
    child_id = props.get("child")
    if not label and child_id and child_id in component_map:
        child_comp = component_map[child_id]
        child_props = child_comp.get("component", {}).get("Text", {})
        if child_props:
            label = str(resolve_value(child_props.get("text"), context))

    label = str(label) if label else "Button"

    return rx.button(label, style=style.card_button_style)


def render_divider(props: dict, component_map: dict, context: str) -> rx.Component:
    """Render a Divider component."""
    return rx.divider()


def render_children(
    props: dict, component_map: dict, context: str
) -> list[rx.Component]:
    """Render children of a container component with template support."""
    children_prop = props.get("children", {})
    rendered_children = []

    # Handle explicitList
    if "explicitList" in children_prop:
        for child_id in children_prop["explicitList"]:
            if child_id in component_map:
                child = render_component(
                    component_map[child_id], component_map, context
                )
                if child:
                    rendered_children.append(child)

    # Handle template with dataBinding
    elif "template" in children_prop:
        template = children_prop["template"]
        template_id = template.get("componentId")
        data_binding = template.get("dataBinding", "")

        if template_id and template_id in component_map:
            full_data_path = resolve_path(data_binding, context)
            data = get_data_at_path(full_data_path)

            if isinstance(data, list):
                for i, _ in enumerate(data):
                    child_context = f"{full_data_path}/{i}"
                    child = render_component(
                        component_map[template_id], component_map, child_context
                    )
                    if child:
                        rendered_children.append(child)
            elif isinstance(data, dict):
                for key in data.keys():
                    child_context = f"{full_data_path}/{key}"
                    child = render_component(
                        component_map[template_id], component_map, child_context
                    )
                    if child:
                        rendered_children.append(child)

    return rendered_children
