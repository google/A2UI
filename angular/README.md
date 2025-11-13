# Angular A2UI

These are sample implementations of A2UI in Angular.

## Prerequisites

1. [nodejs](https://nodejs.org/en)

## Running

1. Build the shared dependencies by running `npm run build` in the `web/lib` directory
2. Install the dependencies: `npm i`
3. Run the relevant A2A server:
  * [For the restaurant app](../../a2a_agents/python/adk/samples/restaurant_finder/)
  * [For the contact app](../../a2a_agents/python/adk/samples/contact_lookup/)
4. Run the relevant app:
  * `npm start -- restaurant`
  * `npm start -- contact`
5. Open http://localhost:4200/
