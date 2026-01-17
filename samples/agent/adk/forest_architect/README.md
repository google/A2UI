# Forest Architect Agent

A B2B micro-forest configuration tool for Corporate CSR heads, Housing Societies, and "Forests by Heartfulness" partners. This agent enables users to design micro-forests with real-time budget adjustments, species mix visualization, and automated proposal generation.

## Features

- 🌳 **Interactive Dashboard**: Budget slider, area input, real-time calculations
- 📊 **Species Mix Chart**: Dynamic pie chart showing Canopy/Sub-canopy/Shrub layers
- 🌿 **CO2 Projections**: Real-time carbon sequestration estimates
- 📄 **Proposal Generation**: PDF quotes and shareable summary cards

## Prerequisites

- Python 3.9 or higher
- [UV](https://docs.astral.sh/uv/)
- Access to an LLM and API Key (Gemini recommended)

## Running the Agent

1. Navigate to the agent directory:

    ```bash
    cd samples/agent/adk/forest_architect
    ```

2. Create an environment file with your API key:

   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

3. Run the server:

   ```bash
   uv run .
   ```

   The server will start on `http://localhost:10005`

## Example Queries

- "Design a micro-forest for 10,000 sq ft with a budget of ₹5 lakhs"
- "What species do you recommend for a corporate campus forest?"
- "Generate a proposal for our housing society plantation project"
- "Show me the species mix for my forest design"

## API Endpoints

- `GET /.well-known/agent-card.json` - Agent capabilities and metadata
- `POST /` - A2A message endpoint

## Forest Calculation Model

The agent uses a Miyawaki method-based calculation model:
- **Tree density**: 2-4 trees per sq meter (optimized for budget)
- **Layer distribution**: 40% Canopy, 35% Sub-canopy, 25% Shrub
- **CO2 sequestration**: ~20 kg per tree per year (averaged across species)
- **Survival rate**: 95% (with proper maintenance)
