# A2UI Motia Implementation

A2UI (Agent-to-User Interface) Protocol v0.9 implemented using [Motia](https://motia.dev) - a modern backend framework for event-driven workflows.

## 🎯 Overview

This implementation provides a complete A2UI protocol server using Motia's step-based architecture. It enables AI agents to generate and update dynamic user interfaces in real-time with **Gemini AI integration**.

<p align="center">
  <img src="public/a2ui-demo.png" alt="A2UI Motia Demo" width="800">
</p>

*AI-powered UI generation with the A2UI × Motia Demo Client*

## ✨ Features

- **🤖 Gemini AI Integration** - Generate complex UIs from natural language prompts
- **📊 Visual Workbench** - See your A2UI flows as interactive diagrams
- **⚡ Real-time Streams** - WebSocket-based live updates
- **🔒 Session Isolation** - Per-session state management
- **📈 Production Ready** - Redis, BullMQ, horizontal scaling

## 🖼️ Screenshots

### Gemini-Generated Weather Dashboard

<p align="center">
  <img src="public/generate-ui-weather.png" alt="Weather Dashboard" width="700">
</p>

*Gemini generates a complete weather dashboard from a single prompt*

### Motia Workbench - Visual Flow Editor

<p align="center">
  <img src="public/workbench.png" alt="Motia Workbench" width="700">
</p>

*Visualize and debug your A2UI flows in the Workbench*

### Flight Booking Form (AI Generated)

<p align="center">
  <img src="public/gemini-flight.png" alt="Flight Booking" width="700">
</p>

*Complex forms generated with proper structure and actions*

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Gemini API Key (optional, for AI generation)

### Installation

```bash
cd server/motia
npm install

# Set your Gemini API key (optional)
echo "GEMINI_API_KEY=your_key_here" > .env
```

### Development

```bash
npm run dev
```

This starts:
- **Motia Server**: http://localhost:3000
- **Workbench UI**: http://localhost:3000 (visual flow editor)
- **Demo Client**: Serve `public/demo.html` separately

### Try the Demo

1. Start the server: `npm run dev`
2. Open the Workbench: http://localhost:3000
3. Serve the demo client: `npx serve public -p 8080`
4. Open demo: http://localhost:8080/demo.html
5. Click "Generate UI" to create AI-powered interfaces!

## 📡 API Endpoints

### Surface Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/a2ui/surfaces` | Create a new surface |
| GET | `/a2ui/surfaces` | List all surfaces |
| GET | `/a2ui/surfaces/:surfaceId` | Get a surface by ID |
| PUT | `/a2ui/surfaces/:surfaceId/components` | Update surface components |
| PATCH | `/a2ui/surfaces/:surfaceId/data` | Update surface data model |
| DELETE | `/a2ui/surfaces/:surfaceId` | Delete a surface |

### AI Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/demo/generate-ui` | Generate UI with Gemini AI |
| POST | `/demo/restaurant-agent` | Demo restaurant finder agent |

### User Actions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/a2ui/actions` | Handle user action from UI component |

All endpoints accept a `sessionId` query parameter for session isolation.

## 🧩 Supported Components

| Component | Description |
|-----------|-------------|
| Text | Display text with styling (h1, h2, body, caption) |
| Image | Display an image from URL |
| Icon | Display a Material Icon |
| Button | Clickable button with action |
| Card | Container with card styling |
| Row | Horizontal layout |
| Column | Vertical layout |
| List | Scrollable list |
| TextField | Text input |
| CheckBox | Boolean input |
| Slider | Numeric slider |
| Divider | Horizontal divider |

## 🔄 Event Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  CreateSurface  │────▶│  UpdateComponents │────▶│  UpdateDataModel │
│   (API Step)    │     │    (API Step)     │     │    (API Step)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   GenerateUI    │◀────│  ProcessAction   │◀────│  HandleUserAction│
│  (Event Step)   │     │   (Event Step)   │     │    (API Step)    │
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ ApplyGeneratedUI│
│  (Event Step)   │
└─────────────────┘
```

## 🤖 LLM Integration

The Gemini UI Generator creates complex UIs from natural language:

```bash
curl -X POST http://localhost:3000/demo/generate-ui \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create an analytics dashboard with stat cards for Users, Revenue, Orders",
    "sessionId": "demo"
  }'
```

Response:
```json
{
  "surfaceId": "gemini-ui-1234567890",
  "componentCount": 23,
  "prompt": "Create an analytics dashboard...",
  "generatedAt": "2025-12-15T23:55:44.369Z"
}
```

## 📁 Architecture

```
server/motia/
├── motia.config.ts          # Motia configuration
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── public/                  # Demo client and images
│   ├── demo.html            # Interactive demo client
│   └── *.png                # Screenshots
└── steps/                   # Motia steps (organized by flow)
    ├── streams/             # Real-time stream definitions
    │   ├── a2ui-surface.stream.ts
    │   └── a2ui-message.stream.ts
    ├── a2ui/                # A2UI protocol steps
    │   ├── create-surface.step.ts
    │   ├── update-components.step.ts
    │   ├── generate-ui.step.ts
    │   └── ...
    └── demo/                # Demo agents
        ├── restaurant-agent.step.ts
        └── gemini-ui-generator.step.ts
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google AI API key | - |
| `REDIS_HOST` | Redis host for production | localhost |
| `REDIS_PORT` | Redis port | 6379 |

## 📜 License

Apache 2.0 - See [LICENSE](../../LICENSE)

## 🔗 Related

- [A2UI Specification](../../specification/0.9/)
- [A2UI Documentation](../../docs/)
- [Motia Documentation](https://motia.dev/docs)
- [Proposal Document](../../PROPOSAL.md)
