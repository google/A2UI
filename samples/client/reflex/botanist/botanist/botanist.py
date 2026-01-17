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

"""Digital Botanist Reflex Client - A2UI Composer Style.

A beautiful split-pane interface showing A2UI JSON and rendered output.
"""

import httpx
import uuid
import json
import reflex as rx
from a2ui.v0_8 import MessageProcessor, HTMLRenderer

# Digital Botanist agent URL
AGENT_BASE_URL = "http://localhost:10004"


class BotanistState(rx.State):
    """State for the Digital Botanist A2UI viewer."""

    a2ui_json: str = ""
    rendered_html: str = ""
    input_value: str = ""
    is_loading: bool = False
    error_message: str = ""
    active_tab: str = "results"

    def set_tab(self, tab: str):
        """Set the active tab."""
        self.active_tab = tab

    async def handle_submit(self, form_data: dict):
        """Handle form submission."""
        query = form_data.get("message", "").strip()
        if not query:
            return

        self.input_value = ""
        self.is_loading = True
        self.error_message = ""
        self.a2ui_json = ""
        self.rendered_html = ""
        yield

        try:
            json_str, html_str = await self._send_to_agent(query)
            self.a2ui_json = json_str
            self.rendered_html = html_str
        except Exception as e:
            self.error_message = str(e)
        finally:
            self.is_loading = False

    async def quick_action(self, query: str):
        """Handle quick action button click."""
        self.input_value = query
        await self.handle_submit({"message": query})

    async def _send_to_agent(self, query: str) -> tuple[str, str]:
        """Send query to the botanist agent and return (JSON, HTML)."""
        message_id = str(uuid.uuid4())
        a2a_message = {
            "jsonrpc": "2.0",
            "id": message_id,
            "method": "message/send",
            "params": {
                "message": {
                    "messageId": message_id,
                    "role": "user",
                    "parts": [{"kind": "text", "text": query}],
                    "kind": "message",
                }
            },
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                AGENT_BASE_URL,
                json=a2a_message,
                headers={
                    "Content-Type": "application/json",
                    "X-A2A-Extensions": "https://a2ui.org/a2a-extension/a2ui/v0.8",
                },
            )

            if response.status_code != 200:
                raise Exception(f"Server returned status {response.status_code}")

            data = response.json()
            return self._process_a2ui_response(data)

    def _process_a2ui_response(self, response: dict) -> tuple[str, str]:
        """Process A2UI response and return (JSON string, HTML string)."""
        if "result" not in response:
            return "", ""

        result = response["result"]
        if not isinstance(result, dict) or result.get("kind") != "task":
            return "", ""

        status = result.get("status", {})
        message = status.get("message", {})
        parts = message.get("parts", [])

        a2ui_messages = []
        for part in parts:
            if part.get("kind") == "data":
                data = part.get("data", {})
                if data:
                    a2ui_messages.append(data)

        if not a2ui_messages:
            return "", ""

        # Get formatted JSON
        json_str = json.dumps(a2ui_messages, indent=2)

        # Process and render HTML
        processor = MessageProcessor()
        processor.process_messages(a2ui_messages)

        renderer = HTMLRenderer(processor, base_url=AGENT_BASE_URL)
        html_str = renderer.render_all_surfaces()

        return json_str, html_str


# ========== UI Components ==========


def header() -> rx.Component:
    """Render the header bar."""
    return rx.box(
        rx.hstack(
            rx.hstack(
                rx.text("🌱", font_size="1.5rem"),
                rx.heading("Digital Botanist", size="5", font_weight="600"),
                rx.badge("A2UI Viewer", color_scheme="green", variant="soft"),
                gap="12px",
                align_items="center",
            ),
            rx.spacer(),
            rx.hstack(
                rx.button(
                    rx.icon("copy", size=16),
                    rx.text("Copy JSON"),
                    variant="ghost",
                    size="2",
                ),
                rx.button(
                    rx.icon("download", size=16),
                    rx.text("Download"),
                    color_scheme="green",
                    size="2",
                ),
                gap="8px",
            ),
            width="100%",
        ),
        padding="12px 24px",
        border_bottom="1px solid #e5e7eb",
        background="white",
    )


def json_panel() -> rx.Component:
    """JSON viewer panel."""
    return rx.box(
        rx.box(
            rx.text("A2UI JSON", font_weight="600", color="#1f2937"),
            padding="12px 16px",
            border_bottom="1px solid #e5e7eb",
            background="#f9fafb",
        ),
        rx.box(
            rx.cond(
                BotanistState.a2ui_json != "",
                rx.html(
                    f'<pre style="margin:0;font-size:13px;font-family:monospace;white-space:pre-wrap;color:#1f2937;">{BotanistState.a2ui_json}</pre>'
                ),
                rx.box(
                    rx.vstack(
                        rx.icon("file-json-2", size=48, color="#9ca3af"),
                        rx.text("No A2UI response yet", color="#9ca3af"),
                        rx.text(
                            "Try a search to see the JSON",
                            color="#9ca3af",
                            font_size="14px",
                        ),
                        align_items="center",
                        gap="8px",
                    ),
                    display="flex",
                    align_items="center",
                    justify_content="center",
                    height="100%",
                ),
            ),
            padding="16px",
            overflow_y="auto",
            flex="1",
            font_family="monospace",
            font_size="13px",
            line_height="1.6",
        ),
        display="flex",
        flex_direction="column",
        flex="1",
        background="white",
        border_right="1px solid #e5e7eb",
        min_width="0",
    )


def preview_panel() -> rx.Component:
    """Preview panel with rendered A2UI."""
    return rx.box(
        rx.box(
            rx.text("Preview", font_weight="600", color="#1f2937"),
            padding="12px 16px",
            border_bottom="1px solid #e5e7eb",
            background="#f9fafb",
        ),
        rx.box(
            rx.cond(
                BotanistState.is_loading,
                rx.box(
                    rx.vstack(
                        rx.spinner(size="3"),
                        rx.text("Generating A2UI...", color="#6b7280"),
                        align_items="center",
                        gap="12px",
                    ),
                    display="flex",
                    align_items="center",
                    justify_content="center",
                    height="100%",
                ),
                rx.cond(
                    BotanistState.rendered_html != "",
                    rx.html(BotanistState.rendered_html),
                    rx.box(
                        rx.vstack(
                            rx.icon("layout", size=48, color="#9ca3af"),
                            rx.text("A2UI Preview", color="#9ca3af"),
                            rx.text(
                                "Search to see rendered components",
                                color="#9ca3af",
                                font_size="14px",
                            ),
                            align_items="center",
                            gap="8px",
                        ),
                        display="flex",
                        align_items="center",
                        justify_content="center",
                        height="100%",
                    ),
                ),
            ),
            padding="24px",
            overflow_y="auto",
            flex="1",
            background="#f9fafb",
        ),
        display="flex",
        flex_direction="column",
        flex="1",
        min_width="0",
    )


def split_pane() -> rx.Component:
    """Split pane view with JSON and preview."""
    return rx.box(
        json_panel(),
        preview_panel(),
        display="flex",
        flex="1",
        min_height="0",
    )


def quick_actions() -> rx.Component:
    """Quick action buttons."""
    return rx.hstack(
        rx.button(
            "🌸 Flowering Shrubs",
            variant="outline",
            size="2",
            on_click=lambda: BotanistState.quick_action("Show me flowering shrubs"),
        ),
        rx.button(
            "🌴 Palm Varieties",
            variant="outline",
            size="2",
            on_click=lambda: BotanistState.quick_action(
                "What palm varieties do you have?"
            ),
        ),
        rx.button(
            "📁 Browse Categories",
            variant="outline",
            size="2",
            on_click=lambda: BotanistState.quick_action("Show plant categories"),
        ),
        rx.button(
            "🐦 Bird-Friendly",
            variant="outline",
            size="2",
            on_click=lambda: BotanistState.quick_action("Plants that attract birds"),
        ),
        gap="8px",
        flex_wrap="wrap",
        justify_content="center",
    )


def input_area() -> rx.Component:
    """Chat input area at the bottom."""
    return rx.box(
        rx.vstack(
            quick_actions(),
            rx.form(
                rx.hstack(
                    rx.input(
                        name="message",
                        placeholder="Type a message...",
                        value=BotanistState.input_value,
                        on_change=BotanistState.set_input_value,
                        flex="1",
                        size="3",
                        variant="soft",
                    ),
                    rx.button(
                        rx.icon("arrow-up", size=18),
                        type="submit",
                        disabled=BotanistState.is_loading,
                        color_scheme="green",
                        size="3",
                        border_radius="full",
                    ),
                    gap="12px",
                    width="100%",
                ),
                on_submit=BotanistState.handle_submit,
                width="100%",
            ),
            rx.text(
                "Powered by A2UI",
                font_size="12px",
                color="#9ca3af",
            ),
            gap="12px",
            width="100%",
            align_items="center",
        ),
        padding="16px 24px",
        border_top="1px solid #e5e7eb",
        background="white",
    )


# A2UI CSS styles
A2UI_CSS = """
.a2ui-surface {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.a2ui-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    overflow: hidden;
    border: 1px solid #e5e7eb;
}
.a2ui-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
.a2ui-row {
    display: flex;
    gap: 16px;
    align-items="center";
    padding: 16px;
}
.a2ui-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
}
.a2ui-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.a2ui-image {
    width: 120px;
    height: 90px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
    background: #f3f4f6;
}
.a2ui-title {
    font-weight: 600;
    color: #1f2937;
    font-size: 15px;
    margin: 0;
}
.a2ui-text {
    color: #6b7280;
    font-size: 14px;
    margin: 0;
}
.a2ui-heading {
    color: #059669;
    font-weight: 600;
    font-size: 18px;
    margin: 0 0 12px 0;
}
.a2ui-button {
    background: #059669;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
}
.a2ui-button:hover {
    background: #047857;
}
.a2ui-divider {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 12px 0;
}
"""


def index() -> rx.Component:
    """Main page with A2UI Composer-style layout."""
    return rx.box(
        rx.script(
            f"const a2uiStyle = document.createElement('style'); a2uiStyle.textContent = `{A2UI_CSS}`; document.head.appendChild(a2uiStyle);"
        ),
        rx.box(
            header(),
            split_pane(),
            input_area(),
            display="flex",
            flex_direction="column",
            height="100vh",
            background="white",
        ),
        min_height="100vh",
    )


# Create app
app = rx.App(
    theme=rx.theme(
        accent_color="green",
        gray_color="slate",
        radius="medium",
    )
)
app.add_page(index, title="Digital Botanist | A2UI Viewer")
