# A2UI Rizzcharts Agent Sample (Go)

This sample demonstrates how to build an ecommerce dashboard agent using the *
*Go A2UI SDK**. The agent interacts with users to visualize sales data through
interactive charts and maps, leveraging the Agent-to-UI (A2UI) protocol to
stream native UI components to the client.

## Overview

The Rizzcharts agent simulates a sales analytics assistant. It can:

1. **Retrieve Data**: Fetch sales statistics and store locations using defined
   tools.
2. **Generate UI**: Construct A2UI JSON payloads to render rich visualizations
   (Charts, Maps) on the client.
3. **Adapt**: dynamically select between a "Standard" component catalog and a
   custom "Rizzcharts" catalog based on the client's capabilities.

## Prerequisites

* **Go**: Version 1.24 or higher.
* **Gemini API Key**: You need an API key
  from [Google AI Studio](https://aistudio.google.com/apikey).

## Setup

1. **Navigate to the directory**:
   ```bash
   cd samples/agent/adk/rizzcharts-go
   ```

2. **Configure Environment**:
   Copy the example environment file and add your API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and paste your `GEMINI_API_KEY`.

3. **Install Dependencies**:
   ```bash
   go mod tidy
   ```

## Build and Run

To run the agent directly:

```bash
go run .
```

To build a binary and run it:

```bash
go build -o rizzcharts-agent
./rizzcharts-agent
```

The server listens on `localhost:10002` by default. You can override this with
flags:

```bash
./rizzcharts-agent --host 0.0.0.0 --port 8080
```

## How It Works

This sample illustrates the complete lifecycle of an A2UI-enabled agent in Go.

### 1. Initialization (`main.go`)

* The application starts by loading the **A2UI Schema** (
  `server_to_client.json`) and **Component Catalogs** (
  `standard_catalog_definition.json`, `rizzcharts_catalog_definition.json`) from
  the specification files.
* It initializes the `RizzchartsAgentExecutor`, which orchestrates the
  interaction between the A2A protocol, the Gemini model, and the A2UI tools.
* An HTTP server is started to handle A2A JSON-RPC requests.

### 2. Session Preparation (`executor.go`)

* When a request arrives, `PrepareSession` checks if the client supports A2UI by
  inspecting the `X-A2A-Extensions` header (handled via
  `a2ui.TryActivateA2UIExtension`).
* It analyzes the **Client Capabilities** to determine which Component Catalog
  to use (Standard vs. Custom).
* It uses `catalog.go` to **merge** the selected component definitions into the
  base A2UI schema. This ensures the LLM generates valid JSON for the specific
  set of components available on the client.

### 3. Instruction Generation (`agent.go`)

* The `RizzchartsAgent` constructs the system instructions for Gemini.
* It dynamically loads **Example Templates** (`chart.json`, `map.json`)
  corresponding to the active catalog.
* These templates are embedded into the system prompt, teaching Gemini how to
  construct valid A2UI payloads for specific intents (e.g., "Show Sales" ->
  Chart Template, "Show Locations" -> Map Template).

### 4. Execution Loop (`executor.go`)

* The executor manages the chat with Gemini.
* It registers the A2UI tool (`send_a2ui_json_to_client`) and the data retrieval
  tools (`get_sales_data`, `get_store_sales`) with the model.
* **Tool Execution**:
    1. Gemini calls a data tool (e.g., `get_sales_data`).
    2. The tool returns raw data.
    3. Gemini uses the data and the embedded templates to construct an A2UI JSON
       payload.
    4. Gemini calls `send_a2ui_json_to_client` with this payload.
* **Validation**: The `send_a2ui_json_to_client` tool (from the SDK) validates
  the generated JSON against the active schema to ensure correctness before
  sending.

### 5. Response Construction

* The executor captures the validated A2UI payload.
* It wraps the payload in an A2A `DataPart` with the MIME type
  `application/json+a2ui`.
* The final response, containing both the text reply and the UI payload, is sent
  back to the client.

## Project Structure

* **`main.go`**: Entry point; server setup; loads resources.
* **`agent.go`**: Agent definition; prompt engineering; loads JSON examples.
* **`executor.go`**: A2A/Gemini integration logic; session state management.
* **`catalog.go`**: Logic for selecting and merging A2UI schemas and catalogs.
* **`tools.go`**: Mock data tools (`get_store_sales`, `get_sales_data`).
* **`examples/`**: Contains the "Golden JSON" templates for the LLM to mimic.
    * `standard_catalog/`: Templates using standard A2UI components.
    * `rizzcharts_catalog/`: Templates using custom components defined in
      `rizzcharts_catalog_definition.json`.

## Disclaimer

**Important**: This code is for demonstration purposes. In a production
environment, ensure you treat all incoming agent data as untrusted. Implement
strict validation and security measures when rendering UI or processing tool
inputs.
