# Angular A2UI

These are sample implementations of A2UI in Angular.

## Prerequisites

1. [nodejs](https://nodejs.org/en)
2. [uv](https://docs.astral.sh/uv/getting-started/installation/)

## Quickstart

To run any demo with its corresponding agent automatically:

```bash
# 1. Set up your Gemini API key (for Rizzcharts as an example)
cp ../../agent/adk/rizzcharts/.env.example ../../agent/adk/rizzcharts/.env
# Edit the .env file with your actual API key

# 2. Install dependencies (Automatic via .npmrc)
npm install

# 3. Run the demo (Automatically builds renderers via prestart)
npm run demo:rizzcharts
```

Available demo commands:
- `npm run demo:restaurant`
- `npm run demo:rizzcharts`
- `npm run demo:contact`
- `npm run demo:orchestrator`

## Manual Setup

If you prefer to run the steps individually:

1. **Install dependencies:** `npm install` (The included `.npmrc` handles peer dependency issues).
2. **Build renderers:** `npm run build:renderer` (This is also handled automatically by `npm start`).
3. **Run agent:** Navigate to the agent directory in `samples/agent/adk/` and run `uv run .`.
4. **Run frontend:** `npm start -- <project-name>` (e.g., `npm start -- rizzcharts`).
5. **Open:** http://localhost:4200/


## Streaming

By default, the Angular client uses the non-streaming API to communicate with the agent. To enable streaming, set the `ENABLE_STREAMING` environment variable to `true`:

```bash
export ENABLE_STREAMING=true
npm start -- contact
```

Important: The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent—including its AgentCard, messages, artifacts, and task statuses—should be handled as untrusted input. For example, a malicious agent could provide crafted data in its fields (e.g., name, skills.description) that, if used without sanitization to construct prompts for a Large Language Model (LLM), could expose your application to prompt injection attacks.

Similarly, any UI definition or data stream received must be treated as untrusted. Malicious agents could attempt to spoof legitimate interfaces to deceive users (phishing), inject malicious scripts via property values (XSS), or generate excessive layout complexity to degrade client performance (DoS). If your application supports optional embedded content (such as iframes or web views), additional care must be taken to prevent exposure to malicious external sites.

Developer Responsibility: Failure to properly validate data and strictly sandbox rendered content can introduce severe vulnerabilities. Developers are responsible for implementing appropriate security measures—such as input sanitization, Content Security Policies (CSP), strict isolation for optional embedded content, and secure credential handling—to protect their systems and users.
