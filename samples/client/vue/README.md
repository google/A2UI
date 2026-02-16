# Vue A2UI

These are sample implementations of A2UI in Vue 3.

## Prerequisites

1. [nodejs](https://nodejs.org/en)
2. [pnpm](https://pnpm.io/installation) (recommended package manager)

## Running

Here is the quickstart for the restaurant app:

```bash
# Set up your Gemini API key
cp ../../agent/adk/restaurant_finder/.env.example ../../agent/adk/restaurant_finder/.env
# Edit the .env file with your actual API key (do not commit .env)

# Start the restaurant app frontend
pnpm install 
pnpm demo:restaurant 
```

Here are the instructions if you want to do each step manually. 

1. Build the shared dependencies by running `pnpm install && pnpm run build` in the `renderers/web_core` and `renderers/vue` directories
2. Install the dependencies: `pnpm install`
3. Run the relevant A2A server:
  * [For the restaurant app](../../agent/adk/restaurant_finder/)
4. Run the relevant app (frontend only):
  * `pnpm run start:restaurant`
  * `pnpm run start:gallery` (Client-only, no server required)
5. Open the URL shown in the terminal (typically http://localhost:4000/)

Important: The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent—including its AgentCard, messages, artifacts, and task statuses—should be handled as untrusted input. For example, a malicious agent could provide crafted data in its fields (e.g., name, skills.description) that, if used without sanitization to construct prompts for a Large Language Model (LLM), could expose your application to prompt injection attacks.

Similarly, any UI definition or data stream received must be treated as untrusted. Malicious agents could attempt to spoof legitimate interfaces to deceive users (phishing), inject malicious scripts via property values (XSS), or generate excessive layout complexity to degrade client performance (DoS). If your application supports optional embedded content (such as iframes or web views), additional care must be taken to prevent exposure to malicious external sites.

Developer Responsibility: Failure to properly validate data and strictly sandbox rendered content can introduce severe vulnerabilities. Developers are responsible for implementing appropriate security measures—such as input sanitization, Content Security Policies (CSP), strict isolation for optional embedded content, and secure credential handling—to protect their systems and users.
