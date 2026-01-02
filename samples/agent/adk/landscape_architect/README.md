# Landscape Architect Agent

An AI-powered landscape architect that analyzes photos of outdoor spaces and generates custom landscaping questionnaires using the A2UI protocol.

## Features

- **Photo Analysis**: Upload a photo of your yard/garden and the AI will identify key features
- **Dynamic Questionnaires**: Get customized questions based on what's in your photo
- **Design Options**: Receive personalized landscaping design proposals
- **Project Estimates**: Get detailed cost breakdowns and timelines

## Prerequisites

- Python 3.11+
- [UV](https://docs.astral.sh/uv/) package manager
- A Gemini API Key from [AI Studio](https://ai.google.dev/aistudio)

## Running the Server

1. Navigate to this directory:
   ```bash
   cd samples/agent/adk/landscape_architect
   ```

2. Create a `.env` file with your API key:
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

3. Install dependencies and run:
   ```bash
   uv run .
   ```

The server will start on `http://localhost:10003`.

### Running on Android Emulator

When running with an Android emulator, use:
```bash
uv run . --base-url="http://10.0.2.2:10003"
```

## API Endpoints

- `GET /.well-known/agent.json` - Agent card metadata
- `POST /` - JSON-RPC message endpoint

## Agent Skills

- **analyze_landscape**: Analyzes uploaded photos to identify landscape features
- **generate_design_options**: Creates design proposals based on preferences
- **create_project_estimate**: Generates detailed cost estimates

## Client Integration

This agent is designed to work with Flutter clients using the GenUI SDK. The agent generates A2UI messages that render as native UI components.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Gemini API key | Required |
| `LITELLM_MODEL` | LLM model to use | `gemini/gemini-2.5-flash` |
| `GOOGLE_GENAI_USE_VERTEXAI` | Set to "TRUE" to use Vertex AI instead | - |
