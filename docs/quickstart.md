# Quickstart: Run A2UI in 5 Minutes

Get hands-on with A2UI by running the restaurant finder demo. This guide will have you experiencing agent-generated UI in less than 5 minutes.

## What You'll Build

By the end of this quickstart, you'll have:

- ✅ A running web app with A2UI Lit renderer
- ✅ A Gemini-powered agent that generates dynamic UIs
- ✅ An interactive restaurant finder with form generation, time selection, and confirmation flows
- ✅ Understanding of how A2UI messages flow from agent to UI

## Prerequisites

Before you begin, make sure you have:

- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **A Gemini API key** - [Get one free from Google AI Studio](https://aistudio.google.com/apikey)

> ⚠️ **Security Notice**
>
> This demo runs an A2A agent that uses Gemini to generate A2UI responses. The agent has access to your API key and will make requests to Google's Gemini API. Always review agent code before running it in production environments.

## Step 1: Clone the Repository

```bash
git clone https://github.com/google/a2ui.git
cd a2ui
```

## Step 2: Set Your API Key

Export your Gemini API key as an environment variable:

```bash
export GEMINI_API_KEY="your_gemini_api_key_here"
```

## Step 3: Navigate to the Lit Client

```bash
cd samples/client/lit
```

## Step 4: Install and Run

Run the one-command demo launcher:

```bash
npm install
npm run demo:all
```

This command will:

1. Install all dependencies
2. Build the A2UI renderer
3. Start the A2A restaurant finder agent (Python backend)
4. Launch the development server
5. Open your browser to `http://localhost:5173`

> ✅ **Demo Running**
>
> If everything worked, you should see the web app in your browser. The agent is now ready to generate UI!

## Step 5: Try It Out

In the web app, try these prompts:

1. **"Book a table for 2"** - Watch the agent generate a reservation form
2. **"Find Italian restaurants near me"** - See dynamic search results
3. **"What are your hours?"** - Experience different UI layouts for different intents

### What's Happening Behind the Scenes

```
┌─────────────┐         ┌──────────────┐         ┌────────────────┐
│   You Type  │────────>│ A2A Agent    │────────>│  Gemini API    │
│  a Message  │         │  (Python)    │         │  (LLM)         │
└─────────────┘         └──────────────┘         └────────────────┘
                               │                         │
                               │ Generates A2UI JSON     │
                               │<────────────────────────┘
                               │
                               │ Streams JSONL messages
                               v
                        ┌──────────────┐
                        │   Web App    │
                        │ (A2UI Lit    │
                        │  Renderer)   │
                        └──────────────┘
                               │
                               │ Renders native components
                               v
                        ┌──────────────┐
                        │   Your UI    │
                        └──────────────┘
```

1. **You send a message** via the web UI
2. **The A2A agent** receives it and sends the conversation to Gemini
3. **Gemini generates** A2UI JSON messages describing the UI
4. **The A2A agent streams** these messages back to the web app
5. **The A2UI renderer** converts them into native web components
6. **You see the UI** rendered in your browser

## Anatomy of an A2UI Message

Let's peek at what the agent is sending. Here's a simplified example of the JSON messages:

### Defining the UI

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "header",
        "component": {
          "Text": {
            "text": {"literalString": "Book Your Table"},
            "usageHint": "h1"
          }
        }
      },
      {
        "id": "date-picker",
        "component": {
          "DateTimeInput": {
            "label": {"literalString": "Select Date"},
            "value": {"path": "/reservation/date"},
            "enableDate": true
          }
        }
      },
      {
        "id": "submit-btn",
        "component": {
          "Button": {
            "child": "submit-text",
            "action": {"name": "confirm_booking"}
          }
        }
      },
      {
        "id": "submit-text",
        "component": {
          "Text": {"text": {"literalString": "Confirm Reservation"}}
        }
      }
    ]
  }
}
```

This defines the UI components for the surface: a text header, a date picker, and a button.

### Populating Data

```json
{
  "dataModelUpdate": {
    "surfaceId": "main",
    "contents": [
      {
        "key": "reservation",
        "valueMap": [
          {"key": "date", "valueString": "2025-12-15"},
          {"key": "time", "valueString": "19:00"},
          {"key": "guests", "valueInt": 2}
        ]
      }
    ]
  }
}
```

This populates the data model that components can bind to.

### Signaling Render

```json
{"beginRendering": {"surfaceId": "main", "root": "header"}}
```

This tells the client it has enough information to render the UI.

> 💡 **It's Just JSON**
>
> Notice how readable and structured this is? LLMs can generate this easily, and it's safe to transmit and render—no code execution required.

## Exploring Other Demos

The repository includes several other demos:

### Component Gallery (No Agent Required)

See all available A2UI components:

```bash
npm start -- gallery
```

This runs a client-only demo showcasing every standard component (Card, Button, TextField, Timeline, etc.) with live examples and code samples.

### Contact Lookup Demo

Try a different agent use case:

```bash
npm run demo:contact
```

This demonstrates a contact lookup agent that generates search forms and result lists.

## What's Next?

Now that you've seen A2UI in action, you're ready to:

- **[Learn Core Concepts](concepts/overview.md)**: Understand surfaces, components, and data binding
- **[Set Up Your Own Client](guides/client-setup.md)**: Integrate A2UI into your own app
- **[Build an Agent](guides/agent-development.md)**: Create agents that generate A2UI responses
- **[Explore the Protocol](reference/messages.md)**: Dive into the technical specification

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, the dev server will automatically try the next available port. Check the terminal output for the actual URL.

### API Key Issues

If you see errors about missing API keys:

1. Verify the key is exported: `echo $GEMINI_API_KEY`
2. Make sure it's a valid Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
3. Try re-exporting: `export GEMINI_API_KEY="your_key"`

### Python Dependencies

The demo uses Python for the A2A agent. If you encounter Python errors:

```bash
# Make sure Python 3.10+ is installed
python3 --version

# The demo should auto-install dependencies via the npm script
# If not, manually install them:
cd ../../agent/adk/restaurant_finder
pip install .
```

### Still Having Issues?

- Check the [GitHub Issues](https://github.com/google/a2ui/issues)
- Review the [samples/client/lit/README.md](https://github.com/google/a2ui/tree/main/samples/client/lit)
- Join the community discussions

## Understanding the Demo Code

Want to see how it works? Check out:

- **Agent Code**: `samples/agent/adk/restaurant_finder/` - The Python A2A agent
- **Client Code**: `samples/client/lit/` - The Lit web client with A2UI renderer
- **A2UI Renderer**: `web-lib/` - The web renderer implementation

Each directory has its own README with detailed documentation.

---

**Congratulations!** You've successfully run your first A2UI application. You've seen how an AI agent can generate rich, interactive UIs that render natively in a web application—all through safe, declarative JSON messages.
