# React A2UI

These are sample implementations of A2UI in React.

## Prerequisites

1. [nodejs](https://nodejs.org/en)

NOTE: [For the rizzcharts app](../../agent/adk/rizzcharts/), you will need GoogleMap API ([How to get the API key](https://developers.google.com/maps/documentation/javascript/get-api-key)) to display Google Map custom components. Please refer to [Rizzcharts README](./projects/rizzcharts/README.md)

## Running

Here is the quickstart for the restaurant app:

```bash
# Export your Gemini API key
export GEMINI_API_KEY=your_gemini_api_key
echo "export GEMINI_API_KEY=your_gemini_api_key" >> .env
cp .env ../../agent/adk/restaurant_finder/.env

# Start the restaurant app frontend
npm install
npm run demo:restaurant
```

Here are the instructions if you want to do each step manually.

1. Build the shared dependencies by running `npm install && npm run build` in the `renderers/lit` directory
2. Build the React renderer by running `npm install && npm run build` in the `renderers/react` directory
3. Install the dependencies: `npm install`
4. Run the relevant A2A server:
  * [For the restaurant app](../../agent/adk/restaurant_finder/)
  * [For the contact app](../../agent/adk/contact_lookup/)
  * [For the rizzcharts app](../../agent/adk/rizzcharts/)
5. Run the relevant app:
  * `npm run dev:restaurant`
  * `npm run dev:contact`
  * `npm run dev:rizzcharts`
  * `npm run dev:gallery` (Client-only, no server required)
6. Open http://localhost:4200/ (or the port shown in the terminal)

## Available Scripts

- `npm run dev:<app>` - Start development server for a specific app
- `npm run build` - Build all apps for production
- `npm run demo:contact` - Run the contact app with its backend agent
- `npm run demo:restaurant` - Run the restaurant app with its backend agent

## Project Structure

- `projects/contact` - Contact lookup sample app
- `projects/restaurant` - Restaurant finder sample app
- `projects/rizzcharts` - Data visualization sample app
- `projects/orchestrator` - Multi-agent orchestrator sample app
- `projects/gallery` - Component gallery (no backend required)
- `projects/a2a-chat-canvas` - Reusable chat canvas component
- `projects/lib` - Shared Vite middleware for A2A proxy

Important: The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent--including its AgentCard, messages, artifacts, and task statuses--should be handled as untrusted input. For example, a malicious agent could provide crafted data in its fields (e.g., name, skills.description) that, if used without sanitization to construct prompts for a Large Language Model (LLM), could expose your application to prompt injection attacks.

Similarly, any UI definition or data stream received must be treated as untrusted. Malicious agents could attempt to spoof legitimate interfaces to deceive users (phishing), inject malicious scripts via property values (XSS), or generate excessive layout complexity to degrade client performance (DoS). If your application supports optional embedded content (such as iframes or web views), additional care must be taken to prevent exposure to malicious external sites.

Developer Responsibility: Failure to properly validate data and strictly sandbox rendered content can introduce severe vulnerabilities. Developers are responsible for implementing appropriate security measures--such as input sanitization, Content Security Policies (CSP), strict isolation for optional embedded content, and secure credential handling--to protect their systems and users.
