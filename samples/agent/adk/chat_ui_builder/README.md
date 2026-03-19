# Chat UI Builder Demo

This demo turns natural-language descriptions into incremental A2UI frames.
It uses a local OpenAI-compatible model via LiteLLM, asks the model to emit
**NDJSON deltas** (one JSON object per line), validates those deltas with
Pydantic, and compiles them into strict A2UI v0.8 envelopes before streaming
those envelopes to the client.

## Why this demo exists

Unlike the restaurant sample, this demo does **not** lock the model to a
single domain template. Instead, the model chooses from a curated set of A2UI
components and emits small semantic deltas that the backend converts into
A2UI frames.

## Local model configuration

The server defaults match a local OpenAI-compatible endpoint:

```bash
export OPENAI_API_BASE="http://10.50.95.196:8000/v1"
export OPENAI_API_KEY="sk-1234"
export LITELLM_MODEL="openai/qwen3.5"
```

## Run the backend

```bash
cd samples/agent/adk/chat_ui_builder
uv run .
```

The API starts on `http://localhost:8010` by default.

## API

### `POST /api/chat/stream`

Request body:

```json
{ "message": "Build a customer dashboard with name, tier, recent orders, and a follow-up button." }
```

Response:
- `application/x-ndjson`
- each line is a valid A2UI envelope (`beginRendering`, `surfaceUpdate`, `dataModelUpdate`, or `deleteSurface`)

## Frontend demo

A matching React frontend lives in:

```bash
samples/client/react/chat_ui_builder
```
