# A2A Agent Development Guide

This guide explains how to build AI agents that generate A2UI interfaces using the `a2ui_agent` SDK. The SDK simplifies schema management, prompt engineering, and message validation for A2A (Agent-to-Agent/Agent-to-Client) communication.

## Core Concepts

The `a2ui_agent` SDK revolves around three main classes:

*   **`CustomCatalogConfig`**: Defines the metadata for a component catalog (name, schema path, examples path).
*   **`A2uiCatalog`**: Represents a processed catalog, providing methods for validation and LLM instruction rendering.
*   **`A2uiSchemaManager`**: The central coordinator that loads catalogs, manages versioning, and generates system prompts.

## Generating A2UI Messages

### Step 1: Set up the Schema Manager

The first step in any A2UI-enabled agent is initializing the `A2uiSchemaManager`.

```python
from a2ui.inference.schema.manager import A2uiSchemaManager, CustomCatalogConfig

schema_manager = A2uiSchemaManager(
    version="0.8",
    basic_examples_path="path/to/basic/examples",
    custom_catalogs=[
        CustomCatalogConfig(
            name="my_custom_catalog",
            catalog_path="path/to/catalog.json",
            examples_path="path/to/examples"
        )
    ]
)
```

Notes:
- The `custom_catalogs` parameter is optional. If not provided, the schema manager will use the basic catalog maintained by the A2UI team.
- The provided custom catalog must be freestanding, i.e. it should not reference any external schemas or components, except for the common types.
- If you have a modular catalog that references other catalogs, refer to [Freestanding Catalogs](../../../docs/catalogs.md#freestanding-catalogs) for more information.

### Step 2: Generate System Prompt

Use the `generate_system_prompt` method to assemble the LLM's system instructions. This method takes your high-level descriptions (role, workflow, UI goals) and automatically injects the relevant A2UI JSON Schema and few-shot examples from your catalog configuration.

```python
instruction = schema_manager.generate_system_prompt(
    role_description="You are a helpful assistant...",
    workflow_description="Analyze the request and return UI...",
    ui_description="Use the following components...",
    include_schema=True,  # Injects the raw JSON schema
    include_examples=True, # Injects few-shot examples
    allowed_components=["Heading", "Text", "Button"] # Optional: prune schema to save tokens
)
```

### Step 3: Build an LLM Agent with the System Prompt

Configure your `LlmAgent` using the generated system instructions. This agent serves as the core logic for interpreting user queries and deciding when to generate rich UI responses.

```python
from google.adk.agents.llm_agent import LlmAgent
from google.adk.models.lite_llm import LiteLlm

agent = LlmAgent(
    model=LiteLlm(model=LITELLM_MODEL),
    name="Your agent name",
    description="Your agent description.",
    instruction=instruction,
    tools=[Your tools],
)
```

### Step 4: Process Request and Stream UI

The final step is to build an executor (or a custom streaming handler) that manages the runtime lifecycle of a request: running the LLM, validating the generated JSON, and streaming parts to the client.

#### 4a. Build an Agent Executor
Build an agent executor that uses the agent to process requests.

```python
from a2a.server.agent_execution import AgentExecutor

class MyAgentExecutor(AgentExecutor):
    def __init__(self, agent: LlmAgent, ...):
        self.agent = agent
        ...

agent_executor = MyAgentExecutor(
    agent=agent,
    ...
)
```

#### 4b. Parse, Validate, and Fix LLM Output
To ensure reliability, always validate the LLM's JSON output before returning it. The SDK's `A2uiCatalog` provides a validator that checks the payload against the A2UI schema. If the payload is invalid, the validator will attempt to fix it.

```python
# Get the catalog for the current request
selected_catalog = schema_manager.get_selected_catalog()

try:
    # Parse the LLM's JSON part
    parsed_json = json.loads(json_string)
    
    # Validate and fix against the schema
    selected_catalog.payload_fixer.validate_and_fix(parsed_json)
except Exception as e:
    # Handle validation errors (e.g., log error or retry with correction prompt)
    print(f"Validation failed: {e}")
```

#### 4c. Stream the A2UI Payload
After parsing and validating the A2UI JSON payloads, wrap them in an A2A DataPart and stream them to the client.

To ensure the A2UI Renderers on the frontend recognize the data, add `{"mimeType": "application/json+a2ui"}` to the DataPart's metadata.

**Recommendation:** Use the [create_a2ui_datapart](src/a2ui/extension/a2ui_extension.py#L37-L54) helper method to convert A2UI JSON payloads into an A2A DataPart.

## Use Cases

### 1. Simple Agents with Static Schemas

For agents with a fixed set of UI capabilities, simply use the `schema_manager` to generate the system instruction.

**Example Samples:** [contact_lookup](../../../samples/agent/adk/contact_lookup), [restaurant_finder](../../../samples/agent/adk/restaurant_finder)

```python
# Generate system prompt
instruction = schema_manager.generate_system_prompt(
    role_description="You are a helpful assistant...",
    workflow_description="Analyze the request and return UI...",
    ui_description="Use the following components...",
    include_schema=True,
    include_examples=True,
)

# Use with your LLM framework (e.g., ADK)
agent = LlmAgent(instruction=instruction, ...)
```

### 2. Dynamic Schemas (Context-Aware)

Some agents may need to attach different catalogs or examples depending on the user's request, client capabilities, or conversational context. This is common for dashboard-style agents that support multiple distinct visualization types (e.g., Charts vs. Maps).

**Example Sample:** [rizzcharts](../../../samples/agent/adk/rizzcharts)

#### 2a. Injecting Catalogs into Session State
In a dynamic scenario, you don't provide a static catalog to the agent. Instead, you resolve the selected catalog at runtime (e.g., during session preparation) and store it in the session state.

```python
# In your AgentExecutor subclass
async def _prepare_session(self, context, run_request, runner):
    session = await super()._prepare_session(context, run_request, runner)
    
    # 1. Determine client capabilities from metadata
    capabilities = context.message.metadata.get("a2ui_client_capabilities")
    
    # 2. Get selected catalog and load examples
    a2ui_catalog = self.schema_manager.get_selected_catalog(
        client_ui_capabilities=capabilities
    )
    examples = self.schema_manager.load_examples(a2ui_catalog, validate=True)

    # 3. Store in session state for tool access
    await runner.session_service.append_event(
        session,
        Event(
            actions=EventActions(
                state_delta={
                    "system:a2ui_enabled": True,
                    "system:a2ui_catalog": a2ui_catalog,
                    "system:a2ui_examples": examples,
                }
            ),
        ),
    )
    return session
```

#### 2b. Accessing Catalogs via Providers
The `SendA2uiToClientToolset` can use **Providers**—callables that retrieve the catalog and examples from the current context state at runtime.

```python
# Providers that read from context state
def get_a2ui_catalog(ctx: ReadonlyContext):
    return ctx.state.get("system:a2ui_catalog")

def get_a2ui_examples(ctx: ReadonlyContext):
    return ctx.state.get("system:a2ui_examples")

# Initialize the toolset with providers
ui_toolset = SendA2uiToClientToolset(
    a2ui_enabled=True,
    a2ui_catalog=get_a2ui_catalog,
    a2ui_examples=get_a2ui_examples,
)
```

#### 2c. Runtime Validation

When the LLM calls the UI tool, the toolset uses the dynamic catalog to:
1.  **Generate Instructions**: Automatically inject the specific schema and examples into the LLM's system prompt for that turn.
2.  **Validate and Fix Payloads**: Automatically validate and fix the LLM's generated JSON against the specific `A2uiCatalog` object's validator and auto-fixer.

### 3. Orchestration and Delegation

Orchestrator agents delegate work to sub-agents. They often need to propagate UI capabilities and handle cross-agent UI state.

**Example Sample:** [orchestrator](../../../samples/agent/adk/orchestrator)

The orchestrator inspects sub-agent capabilities and aggregates their supported catalog IDs into its own `AgentCard`.

```python
# Aggregating capabilities from sub-agents
supported_catalog_ids = set()
for subagent in subagents:
    # ... fetch subagent_card ...
    for extension in subagent_card.capabilities.extensions:
        if extension.uri == A2UI_EXTENSION_URI:
            supported_catalog_ids.update(extension.params.get("supportedCatalogIds") or [])

# Creating the orchestrator's AgentCard
agent_card = AgentCard(
    capabilities=AgentCapabilities(
        extensions=[
            get_a2ui_agent_extension(supported_catalog_ids=list(supported_catalog_ids))
        ]
    )
)
```



