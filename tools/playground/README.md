# A2UI Playground

A web-based playground for building and testing AI agents that respond with A2UI (Agent-to-UI). 

![A2UI Playground Screenshot](../../docs/assets/playground_screenshot.png)

## Features

- **Chat Interface**: Conversational UI to interact with AI agents
- **Live Preview**: Real-time A2UI rendering as the agent responds
- **Skills System**: Switch between different design personas/instructions
- **Template Gallery**: Start from predefined templates (Landing, Dashboard, etc.)
- **JSON Inspector**: View raw A2UI JSONL messages for debugging
- **Theme Support**: Toggle between light and dark themes
- **Gemini Integration**: Powered by Google's Gemini API

## Prerequisites

1. Node.js (v18+)
2. A valid [Gemini API Key](https://aistudio.google.com/)

## Getting Started

### 1. Build the Renderer

First, build the A2UI Lit renderer:

```bash
cd renderers/lit
npm install
npm run build
```

### 2. Configure the Playground

Navigate to the playground directory and set up your environment:

```bash
cd tools/playground
cp .env.example .env
```

Edit `.env` and add your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

### 3. Install and Run

```bash
npm install
npm run dev
```

Open http://localhost:5174/ in your browser.

## Usage

1. **Type a prompt** in the chat input, e.g., "Show me a restaurant card"
2. **View the rendered A2UI** in the preview panel
3. **Inspect the raw JSONL** in the inspector panel (toggle with the code icon)
4. **Interact with the UI** - buttons and actions are sent back to the agent

## Example Prompts

- "Create a user profile card with an avatar, name, and bio"
- "Show me a list of 3 products with images, titles, and prices"
- "Build a login form with email and password fields"
- "Display a weather widget showing temperature and conditions"

## Project Structure

```
playground/
├── index.html           # Entry point
├── package.json         # Dependencies
├── vite.config.ts       # Vite configuration
├── playground.ts        # Main component
├── client.ts            # Gemini API client
├── theme/
│   └── default-theme.ts # Theme configuration
├── types/
│   └── types.ts         # TypeScript types
└── ui/
    ├── ui.ts            # UI exports
    └── surface.ts       # A2UI surface renderer
```

## Customization

### System Prompt

The default system prompt instructs Gemini to generate A2UI responses. You can customize this in `client.ts`.

### Theme

Modify `theme/default-theme.ts` to customize colors, spacing, and typography.

## Troubleshooting

### "GEMINI_API_KEY not found"

Make sure you've created a `.env` file with your API key:

```bash
cp .env.example .env
# Edit .env and add your key
```

### Build errors with @a2ui/lit

Ensure the renderer is built first:

```bash
cd renderers/lit
npm install
npm run build
```

## License

Apache 2.0 - See [LICENSE](../../LICENSE)
