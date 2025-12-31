# A2UI Digital Botanist Agent Sample

This sample uses the Agent Development Kit (ADK) along with the A2A protocol to create a "Digital Botanist" agent that helps users explore and learn about plants. It is hosted as an A2A server with a rich UI powered by A2UI.

## Features

- 🌱 **Search Plants**: Find plants by common or scientific name
- 📁 **Browse Categories**: Explore 20+ plant categories (Flowering Shrubs, Palm Varieties, etc.)
- 🖼️ **Rich Plant Cards**: View detailed plant information with images
- 🛒 **Add to Cart**: Add plants to your shopping cart

## Plant Database

The agent uses the HeartyHorticulture plant catalogue with:
- **9,500+ plants** with scientific and common names
- **20+ categories** including Flowering Shrubs, Palm Varieties, Climbers & Creepers, etc.
- **900+ plant images** in the catalogue

## Prerequisites

- Python 3.9 or higher
- [UV](https://docs.astral.sh/uv/)
- Access to an LLM and API Key (Gemini recommended)

## Running the Sample

1. Navigate to the sample directory:

    ```bash
    cd samples/agent/adk/digital_botanist
    ```

2. Create an environment file with your API key:

   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

3. Run the server:

   ```bash
   uv run .
   ```

   The server will start on `http://localhost:10004`

## Example Queries

- "Find roses"
- "Search for palm trees"
- "What categories do you have?"
- "Show me flowering shrubs"
- "Tell me about Red Ginger"
- "What is the scientific name for Peacock Flower?"

## API Endpoints

- `GET /.well-known/agent-card.json` - Agent capabilities and metadata
- `POST /` - A2A message endpoint
- `GET /static/heartyculture_catalogue/*` - Plant images

## Disclaimer

Important: The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.
