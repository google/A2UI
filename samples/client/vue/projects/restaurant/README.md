# Vue Restaurant Demo

A Vue 3 implementation of the Restaurant Finder demo using @a2ui/vue renderer.

## Prerequisites

- Node.js 18+
- Python 3.10+ with `uv` installed (for the agent)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the @a2ui/web_core and @a2ui/vue dependencies:
```bash
cd ../../../renderers/web_core && npm install && npm run build
cd ../../../renderers/vue && npm install && npm run build
```

## Running

### Development Mode

Run both the agent and the web app:
```bash
npm run demo
```

Or run them separately:

1. Start the agent:
```bash
npm run serve:agent
```

2. Start the development server:
```bash
npm run dev
```

Then open http://localhost:4000 in your browser.

## Architecture

- `/src/App.vue` - Main application component
- `/src/client.ts` - A2A client for communicating with the agent
- `/src/theme.ts` - Theme configuration for A2UI components
- `/src/styles.css` - Global styles
