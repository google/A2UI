# Personalized Learning Demo

A full-stack sample demonstrating A2UI's capabilities for AI-powered educational applications.

**Contributed by Google Public Sector's Rapid Innovation Team.**

[![Watch the demo](https://img.youtube.com/vi/fgkiwyHj9g8/maxresdefault.jpg)](https://www.youtube.com/watch?v=fgkiwyHj9g8)

_This video demonstrates two use cases: personalized learning, which is the focus of this sample, plus a workforce development application built on the same A2UI framework—included to show how these patterns adapt to other domains._

---

## What This Is

This demo shows how agents can generate entire UI experiences—not just text responses. When a student asks for flashcards on photosynthesis, the agent matches the topic to OpenStax textbook content, generates personalized study materials, and returns A2UI JSON that the frontend renders as interactive, flippable cards.

The same request from different students (with different learner profiles) produces different content tailored to their learning style.

Key concepts demonstrated:

- **Custom A2UI Components** — Flashcard and QuizCard extend the standard component library
- **Remote Agent** — ADK agent deployed to Vertex AI Agent Engine, decoupled from the UI
- **A2A Protocol** — Frontend-to-agent communication via Agent-to-Agent protocol
- **Dynamic Context** — Learner profiles loaded from GCS at runtime (no redeployment needed)
- **Content Retrieval** — LLM-powered topic matching across 167 OpenStax Biology chapters
- **Server-side Auth** — API endpoints verify Firebase ID tokens and enforce domain/email allowlists

---

## Quick Start

Complete Steps 1–6 in [Quickstart.ipynb](Quickstart.ipynb) first to set up GCP, deploy the agent, and configure environment variables. Then:

```bash
cd samples/personalized_learning
npm install
npm run dev
```

Open http://localhost:5174 and try prompts like:
- "Help me understand ATP"
- "Quiz me on meiosis"
- "Flashcards for photosynthesis"

The demo works without a deployed agent too—it falls back to sample content in [src/a2a-client.ts](src/a2a-client.ts).

---

## Architecture

```
Browser → API Server → Agent Engine → OpenStax → A2UI Response
           (intent)     (content)      (fetch)    (render)
```

**Frontend (Browser):** Vite + TypeScript app using the A2UI Lit renderer with custom Flashcard and QuizCard components. The chat orchestrator detects user intent and routes requests appropriately.

**API Server (Node.js):** Handles intent detection via Gemini and proxies requests to Agent Engine. Verifies Firebase ID tokens on all API endpoints. Lives in [api-server.ts](api-server.ts).

**Agent Engine (Vertex AI):** ADK agent with tools for generating flashcards, quizzes, and fetching textbook content. Deployed via [deploy.py](deploy.py).

**Content:** All educational material comes from [OpenStax Biology for AP Courses](https://openstax.org/details/books/biology-ap-courses), fetched from GitHub at runtime.

---

## Key Files

| File | Purpose |
|------|---------|
| [Quickstart.ipynb](Quickstart.ipynb) | Step-by-step setup notebook |
| [deploy.py](deploy.py) | Agent deployment with embedded agent code |
| [api-server.ts](api-server.ts) | Intent detection and Agent Engine proxy |
| [src/chat-orchestrator.ts](src/chat-orchestrator.ts) | Frontend routing logic |
| [src/flashcard.ts](src/flashcard.ts) | Custom Flashcard component |
| [src/quiz-card.ts](src/quiz-card.ts) | Custom QuizCard component |
| [learner_context/](learner_context/) | Sample learner profiles |

---

## Custom Components

This demo extends A2UI with two Lit web components that agents can generate at runtime.

**Flashcard** — A flippable card with front (question) and back (answer). Click to flip.

```json
{"Flashcard": {"front": {"literalString": "What is ATP?"}, "back": {"literalString": "Adenosine triphosphate..."}}}
```

**QuizCard** — Multiple-choice question with immediate feedback and explanation.

```json
{"QuizCard": {"question": {"literalString": "Where do light reactions occur?"}, "options": [...], "explanation": {...}}}
```

Both components are registered in [src/main.ts](src/main.ts) and rendered by the standard A2UI Lit renderer.

---

## Personalization

Learner profiles live in GCS at `gs://{PROJECT_ID}-learner-context/learner_context/`. The demo includes a sample student "Maria" — a pre-med student preparing for the MCAT who responds well to sports analogies and has a common misconception about ATP bond energy.

To personalize for a different student, edit the files in [learner_context/](learner_context/) and upload to GCS. The agent picks up changes on the next request—no redeployment required.

---

## Production Deployment

For a shareable URL via Cloud Run + Firebase Hosting:

```bash
python deploy_hosting.py --project YOUR_PROJECT_ID
```

See Step 7 in [Quickstart.ipynb](Quickstart.ipynb) for Firebase setup details.

---

## Access Control

Both client and server enforce access restrictions via environment variables in `.env`:

```bash
VITE_ALLOWED_DOMAIN=google.com                          # Restrict to a domain
VITE_ALLOWED_EMAILS=alice@example.com,bob@partner.org   # Or whitelist specific emails
```

See the Access Control section in [Quickstart.ipynb](Quickstart.ipynb) for details.

---

## Known Limitations

- **Latency**: LLM fallback for topic matching adds 2–5 seconds when keywords don't match
- **Single topics only**: Multi-topic requests may return wrong content
- **Audio/video**: Pre-generated files only, not dynamic
- **Sidebar**: Placeholder UI; only the chat is functional

---

## Content Attribution

Educational content from [OpenStax](https://openstax.org/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

## Related

- [A2UI Specification](../../docs/)
- [A2UI Lit Renderer](../../renderers/lit/)
- [Main A2UI README](../../README.md)
