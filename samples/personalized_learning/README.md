# Personalized Learning Demo

A full-stack sample demonstrating A2UI's capabilities for building AI-powered educational applications with remote agents, dynamic content generation, and custom UI components.

**Contributed by Google Public Sector's Rapid Innovation Team.**

![Personalized Learning Demo](assets/hero.png)

---

## Overview

This demo showcases how A2UI enables agents to generate rich, interactive user interfaces dynamically. It demonstrates:

| Concept | Implementation |
|---------|----------------|
| **Remote Agent Deployment** | ADK agent deployed to Vertex AI Agent Engine, running independently from the UI |
| **A2A Protocol** | Agent-to-Agent protocol for frontend-to-agent communication |
| **Custom UI Components** | Flashcard and QuizCard components extending the A2UI component library |
| **Dynamic Content Generation** | Personalized A2UI JSON generated on-the-fly based on user requests |
| **Dynamic Context from GCS** | Learner profiles loaded from Cloud Storage at runtime |
| **Intelligent Content Matching** | LLM-powered topic-to-textbook matching across 167 OpenStax chapters |

### What Makes This Demo Unique

Unlike traditional chat applications where the UI is fixed and only text flows between client and server, this demo shows how **agents can generate entire UI experiences**. When a student asks for flashcards on photosynthesis, the agent:

1. Matches the topic to relevant OpenStax textbook content
2. Generates personalized study materials using an LLM
3. Returns A2UI JSON describing an interactive flashcard interface
4. The frontend renders the flashcards as flippable, interactive cards

The same request from different students (with different learner profiles) produces different content tailored to their learning style and misconceptions.

---

## Architecture

![Architecture Diagram](assets/architecture.jpg)

### Component Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Browser)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Vite + TypeScript                                                   │   │
│  │  ├── A2UI Lit Renderer (@a2ui/web-lib)                              │   │
│  │  ├── Custom Components (Flashcard, QuizCard)                         │   │
│  │  ├── Chat Orchestrator (intent routing, response handling)          │   │
│  │  └── A2A Client (Agent Engine communication)                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API SERVER (Node.js)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  api-server.ts                                                       │   │
│  │  ├── /api/chat-with-intent  → Gemini (intent + response + keywords) │   │
│  │  ├── /a2ui-agent/a2a/query  → Agent Engine proxy                    │   │
│  │  └── Intent detection, keyword extraction, response generation       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VERTEX AI AGENT ENGINE (Remote Agent)                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  deploy.py → ADK Agent                                               │   │
│  │  ├── generate_flashcards(topic) → A2UI JSON                         │   │
│  │  ├── generate_quiz(topic) → A2UI JSON                               │   │
│  │  ├── get_textbook_content(topic) → OpenStax content                 │   │
│  │  ├── get_audio_content() → AudioPlayer A2UI                         │   │
│  │  └── get_video_content() → Video A2UI                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL RESOURCES                                 │
│  ├── OpenStax GitHub (raw.githubusercontent.com) → CNXML textbook content  │
│  ├── GCS Bucket ({project}-learner-context) → Learner profiles             │
│  └── GCS Bucket ({project}-openstax) → Optional content cache              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| [deploy.py](deploy.py) | Agent definition with tools, keyword mappings, and deployment logic |
| [api-server.ts](api-server.ts) | Node.js server handling intent detection and Agent Engine proxy |
| [src/chat-orchestrator.ts](src/chat-orchestrator.ts) | Frontend orchestration: routes intents to appropriate handlers |
| [src/a2a-client.ts](src/a2a-client.ts) | A2A protocol client with fallback content |
| [src/a2ui-renderer.ts](src/a2ui-renderer.ts) | Renders A2UI JSON using the Lit renderer |
| [src/flashcard.ts](src/flashcard.ts) | Custom Flashcard component (Lit web component) |
| [src/quiz-card.ts](src/quiz-card.ts) | Custom QuizCard component (Lit web component) |

---

## Data Flow

### Complete Request Lifecycle

Here's what happens when a user asks "Quiz me on photosynthesis":

#### 1. User Message → API Server

The frontend sends the message to `/api/chat-with-intent`:

```typescript
// src/chat-orchestrator.ts:197-221
const response = await fetch("/api/chat-with-intent", {
  method: "POST",
  body: JSON.stringify({
    systemPrompt: this.systemPrompt,
    messages: this.conversationHistory.slice(-10),
    userMessage: message,
    recentContext: recentContext,
  }),
});
```

#### 2. Intent Detection + Keyword Extraction (Single LLM Call)

The API server uses Gemini to detect intent AND extract keywords in one call:

```typescript
// api-server.ts:631-673
const combinedSystemPrompt = `${systemPrompt}

## INTENT CLASSIFICATION
- flashcards: user wants study cards
- quiz: user wants to be tested
- podcast: user wants audio content
...

## KEYWORDS (for flashcards, podcast, video, quiz only)
When the intent is content-generating, include a "keywords" field with:
1. The CORRECTED topic (fix any spelling mistakes)
2. Related biology terms for content retrieval
3. Specific subtopics within that subject area
`;
```

**Response:**
```json
{
  "intent": "quiz",
  "text": "Let's test your knowledge on photosynthesis!",
  "keywords": "photosynthesis, chloroplast, chlorophyll, light reaction, calvin cycle, ATP"
}
```

#### 3. Frontend Routes to Agent Engine

Based on the detected intent, the orchestrator calls the A2A client:

```typescript
// src/chat-orchestrator.ts:158-161
const a2uiResult = await this.a2aClient.generateContent(
  intent,  // "quiz"
  topicContext  // keywords from Gemini
);
```

#### 4. Agent Engine Query

The API server proxies the request to Agent Engine using `:streamQuery`:

```typescript
// api-server.ts:238-278
const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectNumber}/locations/${location}/reasoningEngines/${resourceId}:streamQuery`;

const requestPayload = {
  class_method: "stream_query",
  input: {
    user_id: "demo-user",
    message: "Generate quiz for: photosynthesis, chloroplast, chlorophyll...",
  },
};
```

#### 5. Agent Tool Execution

The ADK agent receives the request and executes the appropriate tool:

```python
# deploy.py:933-1014 (generate_quiz function)
async def generate_quiz(tool_context: ToolContext, topic: str) -> str:
    # Fetch OpenStax content for context
    openstax_data = fetch_openstax_content(topic)
    textbook_context = openstax_data.get("content", "")
    sources = openstax_data.get("sources", [])

    # Generate quiz using Gemini with structured output
    response = client.models.generate_content(
        model=model_id,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=quiz_schema,
        ),
    )
```

#### 6. Content Matching (Keyword → Chapter → Module → GitHub)

The agent uses a tiered matching system to find relevant content:

```python
# deploy.py:750-757 - Word boundary matching for keywords
for keyword, slugs in KEYWORD_HINTS.items():
    pattern = r'\b' + re.escape(keyword) + r'\b'
    if re.search(pattern, topic_lower):
        matched_slugs.update(slugs)
```

If no keyword match:
```python
# deploy.py:759-763 - LLM fallback
if not matched_slugs:
    llm_slugs = llm_match_topic_to_chapters(topic)
    matched_slugs.update(llm_slugs)
```

Then fetch content:
```python
# deploy.py:787-796 - GitHub fetch
github_url = f"https://raw.githubusercontent.com/openstax/osbooks-biology-bundle/main/modules/{module_id}/index.cnxml"
with urllib.request.urlopen(github_url, timeout=10) as response:
    cnxml = response.read().decode('utf-8')
    text = parse_cnxml_to_text(cnxml)
```

#### 7. LLM Content Generation with Structured Output

The agent uses Gemini's structured output to generate quiz content:

```python
# deploy.py:981-1004
quiz_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "options": {
                "type": "array",
                "items": {
                    "properties": {
                        "label": {"type": "string"},
                        "value": {"type": "string"},
                        "isCorrect": {"type": "boolean"},
                    },
                },
            },
            "explanation": {"type": "string"},
            "category": {"type": "string"},
        },
    },
}
```

#### 8. A2UI JSON Response

The agent builds and returns A2UI JSON:

```json
{
  "format": "quiz",
  "surfaceId": "learningContent",
  "a2ui": [
    {"beginRendering": {"surfaceId": "learningContent", "root": "mainColumn"}},
    {
      "surfaceUpdate": {
        "surfaceId": "learningContent",
        "components": [
          {"id": "mainColumn", "component": {"Column": {...}}},
          {"id": "header", "component": {"Text": {"text": {"literalString": "Quick Quiz: Photosynthesis"}}}},
          {"id": "q1", "component": {"QuizCard": {
            "question": {"literalString": "Where do the light reactions occur?"},
            "options": [...],
            "explanation": {...}
          }}}
        ]
      }
    }
  ],
  "source": {
    "title": "Overview of Photosynthesis",
    "url": "https://openstax.org/books/biology-ap-courses/pages/8-1-overview-of-photosynthesis",
    "provider": "OpenStax Biology for AP Courses"
  }
}
```

#### 9. Frontend Rendering

The A2UI renderer processes the JSON and renders components:

```typescript
// src/a2ui-renderer.ts:64-78
const processor = v0_8.Data.createSignalA2uiMessageProcessor();
processor.processMessages(a2uiMessages);

const surfaces = processor.getSurfaces();
for (const [surfaceId, surface] of surfaces.entries()) {
  this.renderSurface(container, surfaceId, surface, processor);
}
```

---

## Content Retrieval System

The agent uses a sophisticated system to map user topics to relevant textbook content.

### Tier 1: Keyword Matching (Fast Path)

The `KEYWORD_HINTS` dictionary maps ~100 biology keywords to chapter slugs:

```python
# deploy.py:476-627
KEYWORD_HINTS = {
    # Energy & Metabolism
    "atp": ["6-4-atp-adenosine-triphosphate", "6-1-energy-and-metabolism"],
    "photosynthesis": ["8-1-overview-of-photosynthesis", "8-2-the-light-dependent-reaction-of-photosynthesis"],
    "meiosis": ["11-1-the-process-of-meiosis"],

    # Nervous System
    "neuron": ["26-1-neurons-and-glial-cells", "26-2-how-neurons-communicate"],
    "vision": ["27-5-vision"],

    # ... ~100 more keywords
}
```

**Word Boundary Matching**: The system uses regex word boundaries to prevent false positives:

```python
# deploy.py:752-756
pattern = r'\b' + re.escape(keyword) + r'\b'
if re.search(pattern, topic_lower):
    matched_slugs.update(slugs)
```

This ensures "vision" matches "teach me about vision" but NOT "explain cell division" (which contains "vision" as a substring).

### Tier 2: LLM Fallback (When Keywords Miss)

For unrecognized topics, the agent uses Gemini to match:

```python
# deploy.py:677-740
def llm_match_topic_to_chapters(topic: str, max_chapters: int = 2) -> list:
    prompt = f"""Match the user's topic to the MOST relevant chapters.

User's topic: "{topic}"

Available chapters from OpenStax Biology for AP Courses:
{chapter_list}

INSTRUCTIONS:
1. Return EXACTLY {max_chapters} chapter slugs
2. Order by relevance - MOST relevant first
3. For biology topics (even misspelled like "meitosis"), ALWAYS find matches
4. Return empty [] ONLY for non-biology topics
"""
```

This handles:
- **Misspellings**: "meitosis" → meiosis chapters
- **Alternate terms**: "cell energy" → ATP chapters
- **Complex queries**: "how do plants make food" → photosynthesis chapters

### Chapter → Module → Content Mapping

Each chapter slug maps to one or more module IDs:

```python
# deploy.py:305-473
CHAPTER_TO_MODULES = {
    "8-1-overview-of-photosynthesis": ["m62794"],
    "11-1-the-process-of-meiosis": ["m62810"],
    # ... 167 chapters
}
```

Module IDs correspond to CNXML files in the OpenStax GitHub repository:

```
https://raw.githubusercontent.com/openstax/osbooks-biology-bundle/main/modules/m62794/index.cnxml
```

### Content Source

All educational content comes from [OpenStax Biology for AP Courses](https://openstax.org/details/books/biology-ap-courses), a free, peer-reviewed college textbook licensed under CC BY 4.0.

---

## Dynamic Personalization

### Learner Context System

Learner profiles are stored in GCS and loaded at runtime:

```
gs://{PROJECT_ID}-learner-context/learner_context/
├── 01_maria_learner_profile.txt
├── 02_chemistry_bond_energy.txt
├── 03_chemistry_thermodynamics.txt
├── 04_biology_atp_cellular_respiration.txt
├── 05_misconception_resolution.txt
└── 06_mcat_practice_concepts.txt
```

### The Demo Learner: Maria

The demo includes a pre-configured learner profile ([learner_context/01_maria_learner_profile.txt](learner_context/01_maria_learner_profile.txt)):

- **Demographics**: Pre-med student at Cymbal University, preparing for MCAT
- **Learning Style**: Visual-kinesthetic, responds to sports/gym analogies
- **Strengths**: AP Biology (92% proficiency)
- **Gaps**: Chemistry bond energy (65% proficiency)
- **Key Misconception**: Believes "energy is stored in ATP bonds" (incorrect)

### Switching Students

To personalize for a different student:

```bash
# Edit the learner profile
nano learner_context/01_maria_learner_profile.txt

# Upload to GCS (agent picks up changes on next request)
gsutil cp learner_context/*.txt gs://{PROJECT_ID}-learner-context/learner_context/
```

No redeployment required—the agent loads context dynamically.

---

## Custom UI Components

This demo extends A2UI with two custom Lit components.

### Flashcard Component

A flippable card showing question (front) and answer (back):

```typescript
// src/flashcard.ts:34-269
@customElement("a2ui-flashcard")
export class Flashcard extends LitElement {
  @property({ attribute: false }) front: StringValue | null = null;
  @property({ attribute: false }) back: StringValue | null = null;
  @property({ attribute: false }) category: StringValue | null = null;

  @state() private _flipped = false;

  private handleClick() {
    this._flipped = !this._flipped;
  }
}
```

**A2UI JSON format:**
```json
{
  "id": "card1",
  "component": {
    "Flashcard": {
      "front": {"literalString": "Why does ATP hydrolysis release energy?"},
      "back": {"literalString": "Because the products (ADP + Pi) are MORE STABLE..."},
      "category": {"literalString": "Biochemistry"}
    }
  }
}
```

### QuizCard Component

An interactive multiple-choice quiz with immediate feedback:

```typescript
// src/quiz-card.ts:36-348
@customElement("a2ui-quizcard")
export class QuizCard extends LitElement {
  @property({ attribute: false }) question: StringValue | null = null;
  @property({ attribute: false }) options: QuizOption[] = [];
  @property({ attribute: false }) explanation: StringValue | null = null;

  @state() private selectedValue: string | null = null;
  @state() private submitted = false;
}
```

**A2UI JSON format:**
```json
{
  "id": "quiz1",
  "component": {
    "QuizCard": {
      "question": {"literalString": "Where do the light reactions occur?"},
      "options": [
        {"label": {"literalString": "Thylakoid membrane"}, "value": "a", "isCorrect": true},
        {"label": {"literalString": "Stroma"}, "value": "b", "isCorrect": false}
      ],
      "explanation": {"literalString": "Light reactions occur in the thylakoid..."},
      "category": {"literalString": "Photosynthesis"}
    }
  }
}
```

---

## Local Development

### Quick Start

```bash
cd samples/personalized_learning

# Install dependencies
npm install

# Set environment variables
export GOOGLE_CLOUD_PROJECT=your-project-id
export GEMINI_API_KEY=your-api-key  # For local agent only

# Run the demo
npm run dev
```

Open http://localhost:5174

### Running with Local Agent (No Deployment)

For development without Agent Engine, the A2A client includes fallback content:

```typescript
// src/a2a-client.ts:178-556
private getFallbackContent(format: string): A2UIResponse {
  switch (format.toLowerCase()) {
    case "flashcards":
      return { /* pre-built flashcard A2UI */ };
    case "quiz":
      return { /* pre-built quiz A2UI */ };
    // ...
  }
}
```

### Running with Deployed Agent

1. Deploy the agent (see [Quickstart.ipynb](Quickstart.ipynb) Step 4)
2. Set environment variables:
   ```bash
   export GOOGLE_CLOUD_PROJECT=your-project-id
   export AGENT_ENGINE_PROJECT_NUMBER=123456789
   export AGENT_ENGINE_RESOURCE_ID=your-resource-id
   ```
3. Run: `npm run dev`

---

## Production Deployment

### Cloud Run + Firebase Hosting

The demo can be deployed to Cloud Run with Firebase Hosting for a shareable URL:

```bash
python deploy_hosting.py --project YOUR_PROJECT_ID
```

This deploys:
- **Frontend + API Server** → Cloud Run
- **Firebase Hosting** → CDN + custom domain

See [Quickstart.ipynb](Quickstart.ipynb) Step 7 for detailed instructions.

---

## Known Limitations & Future Improvements

### Latency

| Issue | Current State | Potential Improvement |
|-------|---------------|----------------------|
| LLM fallback adds 2-5 seconds | Tier 2 matching requires an LLM call when keywords miss | Expand `KEYWORD_HINTS` to cover more common terms, or use semantic search with embeddings |
| Cold start on Agent Engine | First request after idle period is slow | Keep agent warm with periodic health checks |

### Information Retrieval

| Issue | Current State | Potential Improvement |
|-------|---------------|----------------------|
| Keyword-based matching | Simple word boundary regex | Use vector embeddings for semantic similarity |
| Single-topic queries only | Multi-topic requests may return wrong content | Implement query decomposition |
| Limited to exact matches | Synonyms not handled | Add synonym expansion or use LLM for all matching |

### Content Coverage

| Issue | Current State | Potential Improvement |
|-------|---------------|----------------------|
| Biology only | Only OpenStax Biology for AP Courses | Extend to other OpenStax textbooks (chemistry, physics, etc.) |
| English only | No internationalization | Add multi-language support |

### UI Limitations

| Issue | Current State | Potential Improvement |
|-------|---------------|----------------------|
| Sidebar non-functional | Navigation and settings are placeholder | Implement course navigation, settings panel |
| No progress tracking | Sessions are ephemeral | Add persistent learner progress |

### Media Generation

| Issue | Current State | Potential Improvement |
|-------|---------------|----------------------|
| Pre-generated audio/video | Podcast and video are static files generated with NotebookLM | Integrate dynamic TTS or video generation APIs |

---

## Troubleshooting

### "No Content Available" for Valid Biology Topics

**Symptom**: Agent returns "I couldn't find any OpenStax Biology content related to [topic]"

**Cause**: Topic didn't match any keywords and LLM fallback found no relevant chapters

**Solutions**:
1. Try more specific biology terminology
2. Check if the topic is covered in AP Biology curriculum
3. Add the keyword to `KEYWORD_HINTS` in [deploy.py:476-627](deploy.py)

### Slow Responses (5+ seconds)

**Symptom**: Long delay before content appears

**Cause**: LLM fallback is being triggered (no keyword match)

**Solutions**:
1. Add common user terms to `KEYWORD_HINTS`
2. Pre-warm the agent with a health check
3. Use the optional GCS content cache to avoid GitHub fetches

### Stale Content After Agent Update

**Symptom**: Agent returns outdated content after redeployment

**Cause**: Agent Engine caches the previous deployment

**Solutions**:
1. Wait 1-2 minutes for cache to clear
2. Deploy with a new resource ID
3. Clear browser session storage

### Quiz Returns Flashcards

**Symptom**: Requested a quiz but got flashcards

**Cause**: Agent Engine returned flashcards; the API server's local quiz generation may have failed

**Solutions**:
1. Check API server logs for errors
2. Verify Gemini API access
3. The [api-server.ts:815-828](api-server.ts) has fallback logic that should generate quizzes locally

### Checking Agent Engine Logs

To debug content fetching issues:

```bash
gcloud logging read 'resource.type="aiplatform.googleapis.com/ReasoningEngine"' \
  --limit=50 --project=YOUR_PROJECT \
  --format="table(timestamp,textPayload)"
```

---

## Content Attribution

Educational content is sourced from [OpenStax](https://openstax.org/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Specifically: [Biology for AP Courses](https://openstax.org/details/books/biology-ap-courses) — OpenStax, Rice University

---

## Security Notice

> **Warning:** When building production applications, treat any agent outside your control as potentially untrusted. This demo connects to Agent Engine within your own GCP project. Always review agent code before deploying.

---

## Related Documentation

- [A2UI Specification](../../docs/) — Canonical A2UI format documentation
- [A2UI Lit Renderer](../../renderers/lit/) — The web component renderer used by this demo
- [Quickstart.ipynb](Quickstart.ipynb) — Step-by-step setup notebook
- [Main A2UI README](../../README.md) — Project overview and philosophy

---

## License

Apache 2.0 — See the repository root for details.
