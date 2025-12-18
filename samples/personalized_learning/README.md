# Personalized Learning Demo

A full-stack A2UI sample demonstrating personalized educational content generation with remote AI agents.

**Contributed by Google Public Sector's Rapid Innovation Team.**

![Architecture Diagram](assets/architecture.jpg)

## What This Demo Shows

- **Remote Agent Deployment** - Deploy an AI agent to Vertex AI Agent Engine
- **A2A Protocol** - Agent-to-Agent communication between frontend and cloud agent
- **Custom UI Components** - Extend A2UI with Flashcard and QuizCard components
- **Dynamic Learner Context** - Load student profiles from Cloud Storage at runtime
- **Intelligent Content Matching** - LLM-powered mapping of topics to OpenStax textbook chapters

## Dynamic Personalization

The agent loads learner context from **Google Cloud Storage at runtime**, enabling personalization without redeployment:

```
gs://{PROJECT_ID}-learner-context/learner_context/
├── 01_maria_learner_profile.txt    # Student background & preferences
├── 02_chemistry_bond_energy.txt    # Subject-specific content
├── 03_chemistry_thermodynamics.txt
├── 04_biology_atp_cellular_respiration.txt
├── 05_misconception_resolution.txt # Known misconceptions to address
└── 06_mcat_practice_concepts.txt   # Exam prep focus areas
```

### Switching Students

To personalize for a different student, simply update the files in GCS:

```bash
# Edit the learner profile
nano learner_context/01_maria_learner_profile.txt

# Upload to GCS - agent picks up changes immediately
gsutil cp learner_context/*.txt gs://{PROJECT_ID}-learner-context/learner_context/
```

No redeployment needed. The agent reads context on each request, so changes take effect instantly.

### Example: Creating a New Student Profile

1. Copy Maria's profile as a template:
   ```bash
   cp learner_context/01_maria_learner_profile.txt learner_context/01_alex_learner_profile.txt
   ```

2. Edit the new profile with different:
   - Learning style preferences (visual, auditory, kinesthetic)
   - Subject strengths and weaknesses
   - Known misconceptions to address
   - Preferred analogies (sports, cooking, music, etc.)

3. Upload to GCS:
   ```bash
   gsutil cp learner_context/*.txt gs://{PROJECT_ID}-learner-context/learner_context/
   ```

4. The next chat message will use Alex's profile instead of Maria's.

## OpenStax Content Source

The agent generates flashcards and quizzes using **real textbook content** from [OpenStax Biology for AP Courses](https://openstax.org/details/books/biology-ap-courses), a free peer-reviewed textbook licensed under CC BY 4.0.

### How Content Is Fetched

1. **User requests a topic** (e.g., "Help me understand ATP")
2. **Keyword matching** maps the topic to relevant chapters (fast path)
3. **LLM fallback** for topics without keyword matches
4. **Content is fetched** from GCS (pre-downloaded) or GitHub (on-demand)
5. **A2UI components** are generated based on the textbook content

### Pre-downloading Content (Recommended)

For faster responses, pre-download OpenStax modules to GCS:

```bash
cd agent
python download_openstax.py --bucket YOUR_PROJECT_ID-openstax
```

This clones the [OpenStax GitHub repository](https://github.com/openstax/osbooks-biology-bundle) and uploads ~200 modules to your GCS bucket. The process takes ~2 minutes.

### Fallback Behavior

| GCS Content | GitHub | Behavior |
|-------------|--------|----------|
| ✅ Available | - | Fast responses from cached content |
| ❌ Missing | ✅ Available | Slower but works (fetches on-demand) |
| ❌ Missing | ❌ Down | Uses embedded fallback content only |

## Getting Started

**Open [Quickstart.ipynb](Quickstart.ipynb)** - the notebook walks you through setup, deployment, and running the demo.

## Architecture

The demo uses Google's Agent Development Kit (ADK) framework:

- **Frontend**: Vite + A2UI renderer with custom Flashcard/QuizCard components
- **Agent**: ADK agent deployed to Vertex AI Agent Engine
- **Context**: Learner profiles stored in Cloud Storage
- **Model**: Gemini 3 Flash for content generation
- **Caching**: ADK context caching enabled for conversation history; at scale, consider Gemini's explicit context cache for large textbook corpora (32k+ tokens)

## Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| Flashcards are generic/don't match the topic | OpenStax content not loading | Check GCS bucket exists and has content, or verify GitHub is accessible |
| "GOOGLE_CLOUD_PROJECT not configured" error | Environment variables not set | Ensure `.env` file exists with correct PROJECT_ID |
| Agent deployment fails | APIs not enabled | Run `gcloud services enable aiplatform.googleapis.com` |
| OpenStax fetch is slow | GCS bucket empty | Run `python download_openstax.py --bucket YOUR_BUCKET` |
| "Module not found" errors | Wrong Python environment | Activate the `.venv` virtual environment |

## License

Apache 2.0 - See the repository root for details.
