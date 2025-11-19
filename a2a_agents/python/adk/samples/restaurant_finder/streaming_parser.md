# Design for True Streaming in the A2UI Restaurant Finder

This document outlines the plan to refactor the Restaurant Finder agent to achieve true, incremental streaming of A2UI messages to the client.

## 1. Rationale for Change

The current implementation, while using a streaming-enabled model, does not result in incremental UI updates on the client. The root cause is that the `google.adk.runners.Runner` abstraction buffers the entire response from the underlying `litellm` model before yielding any results.

Our diagnostic logging has confirmed this behavior:
- The `run_async` loop in `agent.py` only starts executing *after* the LLM has finished generating its complete response.
- All the "LLM raw chunk" logs appear in a single, rapid burst, rather than being spaced out over the duration of the model's generation time.

This proves that the `Runner` is the bottleneck. To achieve the desired real-time streaming effect, we must bypass this abstraction and interact with the `litellm` library directly.

## 2. Migration Plan

The core of the migration is to remove the ADK `LlmAgent` and `Runner` from `agent.py` and replace them with a direct, asynchronous call to `litellm.acompletion`.

### Step 1: Refactor `agent.py`

The `RestaurantAgent` class will be significantly simplified.

- **Remove ADK Dependencies:** The following imports will be removed:
  - `google.adk.agents.llm_agent.LlmAgent`
  - `google.adk.artifacts.InMemoryArtifactService`
  - `google.adk.memory.in_memory_memory_service`
  - `google.adk.models.lite_llm.LiteLlm`
  - `google.adk.runners.Runner`
  - `google.adk.sessions.InMemorySessionService`
  - `google.genai.types`

- **Update `__init__`:** The constructor will no longer need to build an agent or a runner. It will be simplified to:
  ```python
  def __init__(self, base_url: str, use_ui: bool = False):
      self.base_url = base_url
      self.use_ui = use_ui
  ```

- **Remove `_build_agent`:** This method will be deleted as we are no longer constructing an `LlmAgent`.

- **Rewrite `stream` Method:** This is the most critical change. The method will be rewritten to perform the following steps:
  1.  Construct the `messages` payload for the `litellm` call using the system prompt and the user query.
  2.  Call `await litellm.acompletion(model=..., messages=..., stream=True)`.
  3.  This returns a true asynchronous generator. The method will `async for` over the chunks from this generator.
  4.  Each chunk from the model will be fed into our existing `A2UIStreamParser`.
  5.  The `get_chunks()` method of the parser will be called after feeding each chunk.
  6.  Any complete A2UI messages returned by the parser will be `yield`ed immediately.
  7.  The logic for tracking `sent_component_ids` will remain to prevent duplicates.

### Step 2: `agent_executor.py` and `__main__.py`

No changes are required in these files. The `RestaurantAgentExecutor` is already designed to consume the async generator from `agent.stream` and send updates. By fixing the source of the stream in `agent.py`, the rest of the pipeline will function as intended.

## 3. Parser Logic (`A2UIStreamParser`)

The existing `A2UIStreamParser` is correctly designed for the task. Its logic is as follows:

- **State Machine:** The parser operates as a state machine with the following states:
  - `seeking_message`: The initial state. It looks for the start of a JSON object (`{`).
  - `in_message`: It has found the start of an object and is now buffering until it finds the matching closing brace (`}`).
  - `seeking_components`: A special state triggered when a complete `surfaceUpdate` message is detected. It looks for the opening bracket (`[`) of the `components` array.
  - `in_component`: The parser is now inside the `components` array. It looks for complete component objects (`{...}`).

- **Incremental Parsing Rules:**
  - **`beginRendering` / `dataModelUpdate`:** When in `in_message` state, if a complete object is found and it is *not* a `surfaceUpdate` message, it is yielded immediately, and the state returns to `seeking_message`.
  - **`surfaceUpdate`:**
    - When a complete `surfaceUpdate` message is found, the parser extracts the `surfaceId` and transitions to `seeking_components` mode.
    - It then finds the start of the `components` array and transitions to `in_component` mode.
    - In this mode, it parses each component object (`{...}`) one by one.
    - For each complete component it finds, it wraps it in a new `surfaceUpdate` message (using the saved `surfaceId`) and yields it.
    - When it encounters the closing bracket (`]`) of the `components` array, it transitions back to `seeking_message` mode to look for the next top-level message.

## 4. Expected Behavior

The end-to-end data flow will be:

1.  A request hits the `RestaurantAgentExecutor`.
2.  The executor calls `agent.stream()`.
3.  `agent.stream()` makes a direct, streaming call to `litellm`.
4.  The `litellm` library yields small text chunks as soon as they are received from the model API.
5.  The `async for` loop in `agent.stream()` receives a chunk.
6.  The chunk is fed to the `A2UIStreamParser`.
7.  The parser checks if a complete message or component can be extracted from its buffer.
8.  If a complete chunk (e.g., the `beginRendering` message or a single component) is parsed, `agent.stream()` yields it.
9.  The `async for` loop in `agent_executor.py` receives the chunk and immediately sends it to the client via the `TaskUpdater`.
10. The client receives the `beginRendering` message first and starts rendering the surface.
11. Subsequent `surfaceUpdate` messages containing one component at a time arrive, and the client adds them to the UI progressively.

This will result in a true, incremental rendering experience for the user.
