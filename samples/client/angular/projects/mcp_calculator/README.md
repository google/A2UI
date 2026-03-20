# MCP Calculator

Sample application using the Chat-Canvas component with MCP Calculator Agent.

## Prerequisites

1. [nodejs](https://nodejs.org/en)
2. An endpoint hosting the MCP Calculator A2AService. ([Review the instructions on how to run MCP Calculator A2AService](../../../../agent/adk/mcp_app_proxy/README.md).)

## Running

1. Build the shared dependencies by running `npm run build` in the `renderers/web_core` directory
2. Install the dependencies: `npm i`
3. Run the A2A server for all of the agents. ([Link to instructions](../../../../agent/adk/mcp_app_proxy/README.md))
4. Build the `sandbox.js` for testing MCP Apps in A2UI demo

- `npm run build:sandbox`

5. Run the app:

- `npm start -- mcp_calculator`

6. Open http://localhost:4200/
