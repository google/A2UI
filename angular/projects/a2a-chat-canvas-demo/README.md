# A2A Chat-Canvas Demo

Sample application using the Chat-Canvas component working with A2A and A2UI.

## Prerequisites

1. [nodejs](https://nodejs.org/en)
2. GoogleMap API ([How to get the API key](https://developers.google.com/maps/documentation/javascript/get-api-key))
3. An endpoint hosting the A2AService

## Running

1. Update the `src/environments/environment.ts` file with your Google Maps API key.
2. Build the shared dependencies by running `npm run build` in the `renderers/lit` directory
3. Install the dependencies: `npm i`
4. Run the A2A server for an agent
5. Run the app:

- `npm start -- a2a-chat-canvas-demo`

6. Open http://localhost:4200/
