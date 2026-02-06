# A2UI Component Gallery Agent

This sample agent demonstrates the capabilities of the A2UI framework using the Python Agent Development Kit (ADK). It serves as a "Kitchen Sink" example, rendering every available component in the A2UI standard catalog to showcase their visual appearance and interactive behavior.

## Features

-   **Comprehensive Component Showcase**: Renders TextField, CheckBox, Slider, DateTimeInput, MultipleChoice (Checkbox, Chips, Filterable), Image, Button, Tabs, Icon, Divider, Card, Video, Modal, List, and AudioPlayer.
-   **Server-Driven UI**: Demonstrates how to define and structure UI surfaces entirely from the backend using the ADK.
-   **Interactive Logic**: Includes examples of handling user actions (e.g., button clicks, form submissions) content updates.

## Getting Started

### Prerequisites

-   Python 3.10+
-   `uv` package manager (recommended) or `pip`

### Running the Agent

1.  Navigate to the agent directory:
    ```bash
    cd samples/agent/adk/component_gallery
    ```

2.  Install dependencies and run the agent:
    ```bash
    uv run .
    ```
    The agent will start on port `10005`.

## Attribution

This project uses media assets from the following sources:

*   **Video**: "Big Buck Bunny" (c) Copyright 2008, Blender Foundation / www.bigbuckbunny.org. Licensed under the Creative Commons Attribution 3.0 License.
