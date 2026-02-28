# A2UI Generator

This is a UI to generate and visualize A2UI responses.

## Prerequisites

1. [nodejs](https://nodejs.org/en)

## Running

This sample depends on the Lit renderer. Before running this sample, you need to build the renderer.

1. **Build the renderer:**
   ```bash
   cd ../../../renderers/web_core
   npm install
   npm run build
   cd ../lit
   npm install
   npm run build
   ```

2. **Run this sample:**
   ```bash
   cd - # back to the sample directory
   npm install
   ```

3. **Run the servers:**
   - Run the [Restaurant Finder Agent](../../../agent/adk/restaurant_finder/) (Default): `npm run demo:restaurant`
   - Run the dev server: `npm run dev`

### Running the Contact Sample

The shell app supports multiple configured applications. To run the Contact sample:

1. **Start the Contact Agent:**
   ```bash
   npm run demo:contact
   ```

2. **Open the Contact App:**
   - Open `http://localhost:5173/?app=contacts`

> **Note:** The `?app=` query parameter only supports apps that are actively configured in `app.ts` (e.g., `restaurant`, `contacts`). You cannot run arbitrary agents by passing their URL as a query string without first adding them to the shell configuration.

After starting the dev server, you can open http://localhost:5173/ to view the sample.

Important: The sample code provided is for demonstration purposes and illustrates the mechanics of A2UI and the Agent-to-Agent (A2A) protocol. When building production applications, it is critical to treat any agent operating outside of your direct control as a potentially untrusted entity.

All operational data received from an external agent—including its AgentCard, messages, artifacts, and task statuses—should be handled as untrusted input. For example, a malicious agent could provide crafted data in its fields (e.g., name, skills.description) that, if used without sanitization to construct prompts for a Large Language Model (LLM), could expose your application to prompt injection attacks.

Similarly, any UI definition or data stream received must be treated as untrusted. Malicious agents could attempt to spoof legitimate interfaces to deceive users (phishing), inject malicious scripts via property values (XSS), or generate excessive layout complexity to degrade client performance (DoS). If your application supports optional embedded content (such as iframes or web views), additional care must be taken to prevent exposure to malicious external sites.

Developer Responsibility: Failure to properly validate data and strictly sandbox rendered content can introduce severe vulnerabilities. Developers are responsible for implementing appropriate security measures—such as input sanitization, Content Security Policies (CSP), strict isolation for optional embedded content, and secure credential handling—to protect their systems and users.