# A2UI React Sample

A sample React application demonstrating the A2UI React renderer.

## Prerequisites

1. [Node.js](https://nodejs.org/en) 18+
2. [uv](https://docs.astral.sh/uv/) (for running Python agents)

## Running

Here is the quickstart for the restaurant app:

```bash
# Export your Gemini API key
export GEMINI_API_KEY=your_gemini_api_key
echo "export GEMINI_API_KEY=your_gemini_api_key" >> .env
cp .env ../../agent/adk/restaurant_finder/.env

# Start the restaurant app frontend and backend
npm run demo:restaurant
```

Here are the instructions if you want to do each step manually:

1. **Build the renderer:**
   ```bash
   cd ../../../renderers/react
   npm install
   npm run build
   ```

2. **Install dependencies:**
   ```bash
   cd - # back to the sample directory
   npm install
   ```

3. **Run the servers:**
   - Run the [A2A server](../../agent/adk/restaurant_finder/)
   - Run the dev server: `npm run dev`

After starting the dev server, you can open http://localhost:5173/ to view the sample.

## Available Demos

| Demo | Command | Agent |
|------|---------|-------|
| Restaurant | `npm run demo:restaurant` | [restaurant_finder](../../agent/adk/restaurant_finder/) |
| All agents | `npm run demo:all` | restaurant_finder + contact_lookup |

## Features

- Full A2UI v0.8 protocol support
- React 19 compatible
- Semi UI component library integration
- Real-time streaming updates from A2A agents

## Project Structure

```
src/
├── main.tsx      # Entry point
├── App.tsx       # Main application component
├── client.ts     # A2A client for communicating with agents
└── index.css     # Global styles
```

## Security Notice

**Important:** The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent—including its AgentCard, messages, artifacts, and task statuses—should be handled as untrusted input. For example, a malicious agent could provide crafted data in its fields (e.g., name, skills.description) that, if used without sanitization to construct prompts for a Large Language Model (LLM), could expose your application to prompt injection attacks.

Similarly, any UI definition or data stream received must be treated as untrusted. Malicious agents could attempt to spoof legitimate interfaces to deceive users (phishing), inject malicious scripts via property values (XSS), or generate excessive layout complexity to degrade client performance (DoS). If your application supports optional embedded content (such as iframes or web views), additional care must be taken to prevent exposure to malicious external sites.

**Developer Responsibility:** Failure to properly validate data and strictly sandbox rendered content can introduce severe vulnerabilities. Developers are responsible for implementing appropriate security measures—such as input sanitization, Content Security Policies (CSP), strict isolation for optional embedded content, and secure credential handling—to protect their systems and users.

## License

Apache-2.0
