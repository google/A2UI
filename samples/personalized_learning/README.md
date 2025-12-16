# Personalized Learning Demo

A full-stack A2UI sample demonstrating personalized educational content generation.

**Contributed by Google Public Sector's Rapid Innovation Team.**

## Overview

This demo shows how A2UI enables AI agents to generate rich, interactive learning materials tailored to individual learners:

- **Flashcards** - Generated dynamically from OpenStax textbook content
- **Audio** - Personalized podcasts (via NotebookLM)
- **Video** - Educational explainers
- **Quizzes** - Interactive assessment with explanations

### The Personalization Pipeline

At Google Public Sector, we're developing approaches that combine LLMs, knowledge graphs, and learner performance data to produce personalized content across courses—and across a person's academic and professional life.

For this demo, that personalization is represented by context files in `learner_context/` describing a fictional learner (Maria) and her learning needs.

## Quick Start

**Open [Quickstart.ipynb](Quickstart.ipynb)** and follow the steps. The notebook handles:

1. GCP authentication and API setup
2. Agent deployment to Vertex AI Agent Engine
3. Environment configuration
4. Frontend installation
5. (Optional) Audio/video generation with NotebookLM

Or manually:

```bash
# 1. Configure environment
cp .env.template .env
# Edit .env with your GCP project details

# 2. Build the A2UI renderer
cd ../../renderers/lit && npm install && npm run build && cd -

# 3. Install and run
npm install
npm run dev
```

Then open http://localhost:5174

## Demo Prompts

| Try This | What Happens |
|----------|--------------|
| "Help me understand ATP" | Flashcards from OpenStax |
| "Quiz me on bond energy" | Interactive quiz cards |
| "Play the podcast" | Audio player |
| "Show me a video" | Video player |

## Content Attribution

Educational content sourced from [OpenStax Biology for AP® Courses](https://openstax.org/details/books/biology-ap-courses), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Security Notice

> **Warning:** When building production applications, treat any agent outside your control as potentially untrusted. This demo connects to Agent Engine within your own GCP project. Always review agent code before deploying.

## License

Apache 2.0 - See the repository root for details.
