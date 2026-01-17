# A2UI React Demo

Interactive demo showcasing the A2UI React renderer with both spec-based and protocol-based rendering modes.

## Setup

**Important:** The renderer library must be built before running the demo.

```bash
# 1. Build the renderer library first
cd ../../renderers/react
npm install
npm run build:lib

# 2. Install demo dependencies and run
cd ../../samples/client/react
npm install
npm run dev
```

## Demo Modes

### Spec-Based Demo
Static JSON rendering using `A2UIRoot`. Demonstrates:
- Component catalog (Text, Button, Card, Row, Column, etc.)
- Data binding with path references
- Theme switching (light/dark)
- Action handling

### Protocol Demo (Streaming)
Simulates real-time A2UI protocol messages using `MessageProcessor`. Demonstrates:
- SSE-style message streaming
- Surface lifecycle (create, update, delete)
- Data model updates
- Buffering (components before `beginRendering`)
- Multiple concurrent surfaces

## Scenarios

The Protocol Demo includes 8 scenarios:
1. **Flashcard** - Buffered rendering with data binding
2. **Dashboard** - Stats display with lists
3. **Live Counter** - Real-time data updates
4. **Incremental Build** - Components added progressively
5. **Surface Lifecycle** - Create and delete surfaces
6. **Quiz Flow** - Multi-step interaction
7. **Settings Form** - Form inputs with validation
8. **Multiple Surfaces** - Independent parallel surfaces
