
### 1. The "Static" Path: A2UI via MCP Resources
In the MCP specification, a **Resource** is essentially a piece of context or data that an agent can read. It acts somewhat like a standard file or a static API endpoint. 

**How it works:**
Instead of executing a function, the host client simply reads a specific MCP Resource URI. The MCP server responds with a static JSON payload representing the A2UI layout, tagged with the `application/json+a2ui` MIME type (similar to how an MCP App returns `text/html;profile=mcp-app`).

**When to use it:**
This path is ideal for **prescriptive, static, or heavily templated UIs** where the structure of the interface does not change based on user input. 
*   **Examples:** A standard configuration form, a predefined data privacy disclaimer, a static settings panel, or a base layout that a different process will populate later.
*   **Advantages:** It is highly performant, predictable, and easy to cache. It requires virtually no compute overhead because an LLM does not need to "reason" about how to build the UI; the server just serves a pre-written JSON file.

### 2. The "Dynamic/Generative" Path: A2UI via MCP Tool Calls
In the MCP specification, a **Tool** is an executable function that an agent can call with specific arguments. The tool performs an action, retrieves live data, and returns a `CallToolResult`.

**How it works:**
The agent decides to call a specific tool (e.g., `generate_recipe_card` or `get_weather_widget`) and passes in relevant arguments. The MCP server executes the backend logic, gathers the necessary data, and dynamically constructs the A2UI JSON layout. It then returns this A2UI payload embedded directly inside the `CallToolResult`.

**When to use it:**
As the author notes in the comments, this is the primary focus of the blog post because it enables true **Generative UI (GenUI)** and **dynamic data hydration**. 
*   **Examples:** A weather widget that dynamically renders different A2UI components based on whether it is raining or sunny; a recipe card whose layout adapts depending on whether the user asked for a quick snack versus a 5-course meal; or a custom data-visualization chart built on the fly using A2UI primitive components.
*   **Advantages:** It provides maximum flexibility. The UI isn't just a static template; its structure, text, and component choices are generated in real-time by combining backend logic, live data, and LLM reasoning.

### Why the Team Decided to Support Both
In the comments, Liad Yosef asked if there is a use case for defining A2UI as a *static* resource, pointing out that everything proposed in the draft seemed to rely on tool calls. 

The author agreed that while dynamic Tool calls are the star of the show for AI agents, forcing every UI to be generated via a Tool call is overkill if the developer just wants to render a static form. As reviewer James Wren noted, supporting both paths gives developers the right tool for the job. 

As a result of this thread, the team agreed to update their sample code (the "A2UI-over-MCP Quick Start" recipe app) to demonstrate both methods:
1.  **Reading a Resource** to fetch a static baseline A2UI component.
2.  **Executing a Tool Call** to dynamically generate and hydrate a customized A2UI component.