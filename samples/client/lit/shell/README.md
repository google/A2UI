# A2UI Generator

This is a UI to generate and visualize A2UI responses.

## Prerequisites

* [nodejs](https://nodejs.org/en)
* [uv](https://docs.astral.sh/uv/getting-started/installation/)

## Running

### Configure Gemini API Key

This step is **required** for the backend to work.

- Navigate to the respective agent directory (e.g., `samples/agent/adk/restaurant_finder`
  or `samples/agent/adk/contact_lookup`).
- Copy `.env.example` to `.env` and set your `GEMINI_API_KEY`.

(More details can be found in the READMEs of the [agent samples](/samples/agent/adk).)

### Run the Demo and Servers

From the `samples/client/lit` directory:

- Run the **Restaurant Finder** demo (starts both the agent and the shell):
  ```bash
  npm run demo:restaurant09
  ```
- Or run the **Contact Lookup** demo:
  ```bash
  npm run demo:contact09
  ```

### Open the Application

From a web browser:

- Open `http://localhost:5173/` for the default application (Restaurant Finder).
- Open `http://localhost:5173/?app=contacts` for the Contact Lookup application.

> **Note:** The `?app=` query parameter only supports apps that are actively configured in `app.ts` (e.g., `restaurant`, `contacts`). You cannot run arbitrary agents by passing their URL as a query string without first adding them to the shell configuration.

## Security Notice

Important: The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent—including its AgentCard, messages, artifacts, and task statuses—should be handled as untrusted input. For example, a malicious agent could provide crafted data in its fields (e.g., name, skills.description) that, if used without sanitization to construct prompts for a Large Language Model (LLM), could expose your application to prompt injection attacks.

Similarly, any UI definition or data stream received must be treated as untrusted. Malicious agents could attempt to spoof legitimate interfaces to deceive users (phishing), inject malicious scripts via property values (XSS), or generate excessive layout complexity to degrade client performance (DoS). If your application supports optional embedded content (such as iframes or web views), additional care must be taken to prevent exposure to malicious external sites.

Developer Responsibility: Failure to properly validate data and strictly sandbox rendered content can introduce severe vulnerabilities. Developers are responsible for implementing appropriate security measures—such as input sanitization, Content Security Policies (CSP), strict isolation for optional embedded content, and secure credential handling—to protect their systems and users.