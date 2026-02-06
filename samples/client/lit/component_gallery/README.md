# A2UI Component Gallery Client

This is the client-side application for the A2UI Component Gallery. It is a Lit-based web application that connects to the Component Gallery Agent to render the UI components defined by the server.

## Overview

The client uses the `@a2ui/lit` renderer to interpret the JSON-based UI descriptions sent by the agent and render them as standard Web Components. It demonstrates how to integrate the A2UI renderer into a modern web application build with Vite.

## Getting Started

To fully run the sample, you need to start **both** the Agent (frontend logic) and the Client (web renderer).

### Prerequisites

-   Python 3.10+ & `uv` (for Agent)
-   Node.js 18+ & `npm` (for Client)

### 1. Run the Agent (Backend)

The agent serves the UI definitions and handles user interactions.

1.  Navigate to the agent directory:
    ```bash
    cd samples/agent/adk/component_gallery
    ```

2.  Install dependencies and start the server:
    ```bash
    uv run .
    ```
    The agent will run on `http://localhost:10005`.

### 2. Run the Client (Frontend)

The client connects to the agent and renders the UI.

1.  Open a **new terminal** and navigate to the client directory:
    ```bash
    cd samples/client/lit/component_gallery
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```
    Open your browser to the URL shown (usually `http://localhost:5173`).

## Attribution

This project uses media assets from the following sources:

*   **Video**: "Big Buck Bunny" (c) Copyright 2008, Blender Foundation / www.bigbuckbunny.org. Licensed under the Creative Commons Attribution 3.0 License.