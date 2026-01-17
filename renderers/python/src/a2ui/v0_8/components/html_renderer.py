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

"""HTML Renderer for A2UI components."""

from html import escape
from typing import Any, Optional
from ..processor import MessageProcessor
from ..types import ComponentNode


class HTMLRenderer:
    """Renders A2UI component tree to HTML strings."""

    # Default styles for A2UI components
    DEFAULT_CSS = """
    .a2ui-surface {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
    .a2ui-card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(46, 125, 50, 0.15);
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .a2ui-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(46, 125, 50, 0.2);
    }
    .a2ui-row {
        display: flex;
        flex-direction: row;
        gap: 16px;
        align-items: center;
        padding: 12px;
    }
    .a2ui-column {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .a2ui-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .a2ui-image {
        width: 150px;
        height: 120px;
        border-radius: 12px;
        object-fit: cover;
    }
    .a2ui-title {
        font-weight: 600;
        color: #1b5e20;
        font-size: 16px;
        margin: 0;
    }
    .a2ui-text {
        color: #757575;
        font-size: 14px;
        margin: 0;
    }
    .a2ui-heading {
        color: #388e3c;
        font-weight: 600;
        margin: 0;
    }
    .a2ui-button {
        background: #388e3c;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }
    .a2ui-button:hover {
        background: #1b5e20;
    }
    .a2ui-divider {
        border: none;
        border-top: 1px solid #e0e0e0;
        margin: 8px 0;
    }
    """

    def __init__(
        self,
        processor: MessageProcessor,
        base_url: str = "http://localhost:10004",
    ):
        """Initialize the renderer."""
        self._processor = processor
        self._base_url = base_url

    def render_surface(self, surface_id: str) -> str:
        """Render a surface to HTML using component tree."""
        surface = self._processor.get_surface(surface_id)
        if not surface:
            return ""

        # Use component tree if available (with resolved properties)
        if surface.component_tree:
            html = self._render_node(surface.component_tree)
            return f'<div class="a2ui-surface">{html}</div>'

        return '<div class="a2ui-surface"></div>'

    def render_all_surfaces(self) -> str:
        """Render all surfaces to HTML."""
        surfaces = self._processor.get_surfaces()
        html_parts = []
        for surface_id in surfaces:
            html = self.render_surface(surface_id)
            if html:
                html_parts.append(html)
        return "".join(html_parts)

    def get_css(self) -> str:
        """Get the default CSS for A2UI components."""
        return self.DEFAULT_CSS

    def _render_node(self, node: ComponentNode) -> str:
        """Render a ComponentNode to HTML."""
        renderers = {
            "Text": self._render_text,
            "Heading": self._render_heading,
            "Image": self._render_image,
            "Card": self._render_card,
            "Row": self._render_row,
            "Column": self._render_column,
            "List": self._render_list,
            "Button": self._render_button,
            "Divider": self._render_divider,
            "Icon": self._render_icon,
        }

        renderer = renderers.get(node.comp_type)
        if renderer:
            return renderer(node)

        return ""

    def _get_prop(self, node: ComponentNode, key: str, default: Any = "") -> Any:
        """Get a property from node with a default value."""
        value = node.properties.get(key, default)
        if value is None:
            return default
        return value

    def _render_children(self, node: ComponentNode) -> str:
        """Render all children of a node."""
        if not node.children:
            return ""
        return "".join(self._render_node(child) for child in node.children)

    def _render_text(self, node: ComponentNode) -> str:
        """Render Text component."""
        text = escape(str(self._get_prop(node, "text")))
        hint = self._get_prop(node, "usageHint", "")

        if hint == "h1":
            return f'<h2 class="a2ui-heading">{text}</h2>'
        elif hint == "h2":
            return f'<h3 class="a2ui-heading">{text}</h3>'
        elif hint == "h3":
            return f'<p class="a2ui-title">{text}</p>'

        return f'<p class="a2ui-text">{text}</p>'

    def _render_heading(self, node: ComponentNode) -> str:
        """Render Heading component."""
        text = escape(str(self._get_prop(node, "text")))
        level = self._get_prop(node, "level", 2)
        level = max(1, min(6, int(level)))
        return f'<h{level} class="a2ui-heading">{text}</h{level}>'

    def _render_image(self, node: ComponentNode) -> str:
        """Render Image component."""
        url = str(self._get_prop(node, "url"))
        alt = escape(str(self._get_prop(node, "alt")))

        # Handle relative URLs
        if url.startswith("/"):
            url = f"{self._base_url}{url}"

        return f'<img src="{escape(url)}" alt="{alt}" class="a2ui-image" />'

    def _render_card(self, node: ComponentNode) -> str:
        """Render Card component."""
        children_html = self._render_children(node)
        return f'<div class="a2ui-card">{children_html}</div>'

    def _render_row(self, node: ComponentNode) -> str:
        """Render Row component."""
        children_html = self._render_children(node)
        return f'<div class="a2ui-row">{children_html}</div>'

    def _render_column(self, node: ComponentNode) -> str:
        """Render Column component."""
        children_html = self._render_children(node)
        return f'<div class="a2ui-column">{children_html}</div>'

    def _render_list(self, node: ComponentNode) -> str:
        """Render List component."""
        children_html = self._render_children(node)
        return f'<div class="a2ui-list">{children_html}</div>'

    def _render_button(self, node: ComponentNode) -> str:
        """Render Button component."""
        # Try label first, then check for child text
        label = self._get_prop(node, "label")
        if not label and node.children:
            # Find child text component
            for child in node.children:
                if child.comp_type == "Text":
                    label = self._get_prop(child, "text")
                    break
        label = escape(str(label)) if label else "Button"
        return f'<button class="a2ui-button">{label}</button>'

    def _render_divider(self, node: ComponentNode) -> str:
        """Render Divider component."""
        return '<hr class="a2ui-divider" />'

    def _render_icon(self, node: ComponentNode) -> str:
        """Render Icon component (as emoji or text)."""
        name = str(self._get_prop(node, "name", ""))
        # Map common icon names to emojis
        icon_map = {
            "eco": "🌿",
            "local_florist": "🌸",
            "menu_book": "📖",
            "tag": "🏷️",
            "shopping_cart": "🛒",
        }
        icon = icon_map.get(name, f"[{name}]")
        return f'<span class="a2ui-icon">{icon}</span>'
