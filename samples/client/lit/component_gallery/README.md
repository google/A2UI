# A2UI Component Gallery Client

This is the client-side application for the A2UI Component Gallery. It is a Lit-based web application that connects to the Component Gallery Agent to render the UI components defined by the server.

## Overview

The client uses the `@a2ui/lit` renderer to interpret the JSON-based UI descriptions sent by the agent and render them as standard Web Components. It demonstrates how to integrate the A2UI renderer into a modern web application build with Vite.

## Getting Started

### Prerequisites

-   Node.js 18+
-   `npm`

### Running the Client

1.  Ensure the **Component Gallery Agent** is running (see agent README).

2.  Navigate to the client directory:
    ```bash
    cd samples/client/lit/component_gallery
    ```

3.  Install dependencies:
    ```bash
    npm install
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```
    Open your browser to the URL shown in the console (usually `http://localhost:5173`).

## Attribution

This project uses media assets from the following sources:

*   **Video**: "Big Buck Bunny" (c) Copyright 2008, Blender Foundation / www.bigbuckbunny.org. Licensed under the Creative Commons Attribution 3.0 License.