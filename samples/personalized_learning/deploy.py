#!/usr/bin/env python3
"""
Personalized Learning Agent - Deployment Script for Agent Engine

This script deploys the ADK agent to Vertex AI Agent Engine.

Required environment variables:
  GOOGLE_CLOUD_PROJECT - Your GCP project ID

Optional environment variables:
  GOOGLE_CLOUD_LOCATION - GCP region (default: us-central1)

Usage:
  python deploy.py --project YOUR_PROJECT_ID
  python deploy.py --project YOUR_PROJECT_ID --location us-central1
  python deploy.py --list  # List deployed agents
"""

import os
import sys
import argparse
import logging

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(
        description="Deploy the Personalized Learning Agent to Agent Engine"
    )
    parser.add_argument(
        "--project",
        type=str,
        default=os.getenv("GOOGLE_CLOUD_PROJECT"),
        help="GCP project ID",
    )
    parser.add_argument(
        "--location",
        type=str,
        default=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
        help="GCP location (default: us-central1)",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List deployed agents instead of deploying",
    )

    args = parser.parse_args()

    if not args.project:
        print("ERROR: --project flag or GOOGLE_CLOUD_PROJECT environment variable is required")
        sys.exit(1)

    # Set environment variables
    os.environ["GOOGLE_CLOUD_PROJECT"] = args.project
    os.environ["GOOGLE_CLOUD_LOCATION"] = args.location

    # Import Vertex AI modules
    import vertexai
    from vertexai import agent_engines

    # Initialize Vertex AI
    staging_bucket = f"gs://{args.project}_cloudbuild"
    vertexai.init(
        project=args.project,
        location=args.location,
        staging_bucket=staging_bucket,
    )

    if args.list:
        print(f"\nDeployed agents in {args.project} ({args.location}):")
        for engine in agent_engines.list():
            print(f"  - {engine.display_name}: {engine.resource_name}")
        return

    print(f"Deploying Personalized Learning Agent...")
    print(f"  Project: {args.project}")
    print(f"  Location: {args.location}")
    print()

    # =========================================================================
    # CREATE THE ADK AGENT
    # =========================================================================
    # According to Vertex AI docs, we create an Agent, wrap it in AdkApp,
    # and deploy the AdkApp directly. AdkApp is designed to be picklable.
    # =========================================================================

    import json
    import re
    import xml.etree.ElementTree as ET
    from typing import Any
    from google.adk.agents import Agent
    from google.adk.apps.app import App
    from google.adk.agents.context_cache_config import ContextCacheConfig
    from google.adk.tools import ToolContext
    from vertexai.agent_engines import AdkApp

    model_id = os.getenv("GENAI_MODEL", "gemini-2.0-flash")
    SURFACE_ID = "learningContent"

    # =========================================================================
    # OPENSTAX CONTENT - Chapter mappings and content fetching
    # =========================================================================

    # OpenStax Biology for AP Courses - Chapter mappings
    OPENSTAX_CHAPTERS = {
        # Chapter 6: Metabolism
        "6-1-energy-and-metabolism": "6.1 Energy and Metabolism",
        "6-2-potential-kinetic-free-and-activation-energy": "6.2 Potential, Kinetic, Free, and Activation Energy",
        "6-3-the-laws-of-thermodynamics": "6.3 The Laws of Thermodynamics",
        "6-4-atp-adenosine-triphosphate": "6.4 ATP: Adenosine Triphosphate",
        "6-5-enzymes": "6.5 Enzymes",
        # Chapter 7: Cellular Respiration
        "7-1-energy-in-living-systems": "7.1 Energy in Living Systems",
        "7-2-glycolysis": "7.2 Glycolysis",
        "7-3-oxidation-of-pyruvate-and-the-citric-acid-cycle": "7.3 Oxidation of Pyruvate and the Citric Acid Cycle",
        "7-4-oxidative-phosphorylation": "7.4 Oxidative Phosphorylation",
        # Chapter 10: Cell Reproduction
        "10-1-cell-division": "10.1 Cell Division",
        "10-2-the-cell-cycle": "10.2 The Cell Cycle",
        "10-3-control-of-the-cell-cycle": "10.3 Control of the Cell Cycle",
        "10-4-cancer-and-the-cell-cycle": "10.4 Cancer and the Cell Cycle",
        # Chapter 11: Meiosis and Sexual Reproduction
        "11-1-the-process-of-meiosis": "11.1 The Process of Meiosis",
        "11-2-sexual-reproduction": "11.2 Sexual Reproduction",
        # Chapter 13: Modern Understandings of Inheritance
        "13-1-chromosomal-theory-and-genetic-linkages": "13.1 Chromosomal Theory and Genetic Linkages",
        "13-2-chromosomal-basis-of-inherited-disorders": "13.2 Chromosomal Basis of Inherited Disorders",
    }

    CHAPTER_TO_MODULES = {
        # Chapter 6
        "6-4-atp-adenosine-triphosphate": ["m62767"],
        "6-1-energy-and-metabolism": ["m62763"],
        "6-2-potential-kinetic-free-and-activation-energy": ["m62764"],
        "6-3-the-laws-of-thermodynamics": ["m62765"],
        # Chapter 7
        "7-1-energy-in-living-systems": ["m62827"],
        "7-4-oxidative-phosphorylation": ["m62830"],
        # Chapter 10: Cell Reproduction
        "10-1-cell-division": ["m62803"],
        "10-2-the-cell-cycle": ["m62804"],
        "10-3-control-of-the-cell-cycle": ["m62805"],
        "10-4-cancer-and-the-cell-cycle": ["m62806"],
        # Chapter 11: Meiosis
        "11-1-the-process-of-meiosis": ["m62810"],
        "11-2-sexual-reproduction": ["m62811"],
        # Chapter 13: Inheritance
        "13-1-chromosomal-theory-and-genetic-linkages": ["m62821"],
        "13-2-chromosomal-basis-of-inherited-disorders": ["m62822"],
    }

    KEYWORD_HINTS = {
        # Energy & Metabolism
        "atp": ["6-4-atp-adenosine-triphosphate", "7-1-energy-in-living-systems"],
        "bond": ["6-4-atp-adenosine-triphosphate", "6-2-potential-kinetic-free-and-activation-energy"],
        "energy": ["6-1-energy-and-metabolism", "6-4-atp-adenosine-triphosphate"],
        "hydrolysis": ["6-4-atp-adenosine-triphosphate"],
        "phosphate": ["6-4-atp-adenosine-triphosphate", "7-4-oxidative-phosphorylation"],
        "thermodynamics": ["6-3-the-laws-of-thermodynamics"],
        "metabolism": ["6-1-energy-and-metabolism"],
        "glycolysis": ["7-2-glycolysis"],
        "respiration": ["7-4-oxidative-phosphorylation", "7-1-energy-in-living-systems"],
        "electron transport": ["7-4-oxidative-phosphorylation"],
        # Cell Division & Meiosis
        "meiosis": ["11-1-the-process-of-meiosis", "11-2-sexual-reproduction"],
        "mitosis": ["10-1-cell-division", "10-2-the-cell-cycle"],
        "cell division": ["10-1-cell-division", "10-2-the-cell-cycle"],
        "cell cycle": ["10-2-the-cell-cycle", "10-3-control-of-the-cell-cycle"],
        "cancer": ["10-4-cancer-and-the-cell-cycle"],
        "sexual reproduction": ["11-2-sexual-reproduction", "11-1-the-process-of-meiosis"],
        "gamete": ["11-1-the-process-of-meiosis", "11-2-sexual-reproduction"],
        "chromosome": ["13-1-chromosomal-theory-and-genetic-linkages", "11-1-the-process-of-meiosis"],
        "crossing over": ["11-1-the-process-of-meiosis"],
        "genetic variation": ["11-1-the-process-of-meiosis", "11-2-sexual-reproduction"],
        # Genetics & Inheritance
        "inheritance": ["13-1-chromosomal-theory-and-genetic-linkages", "13-2-chromosomal-basis-of-inherited-disorders"],
        "genetic disorder": ["13-2-chromosomal-basis-of-inherited-disorders"],
        "linkage": ["13-1-chromosomal-theory-and-genetic-linkages"],
    }

    def get_openstax_url(chapter_slug: str) -> str:
        """Get the OpenStax URL for a chapter."""
        return f"https://openstax.org/books/biology-ap-courses/pages/{chapter_slug}"

    def parse_cnxml_to_text(cnxml_content: str) -> str:
        """Parse CNXML content and extract plain text."""
        try:
            root = ET.fromstring(cnxml_content)
            ns = {"cnxml": "http://cnx.rice.edu/cnxml"}

            text_parts = []
            title_elem = root.find(".//cnxml:title", ns)
            if title_elem is not None and title_elem.text:
                text_parts.append(f"# {title_elem.text}\n")

            def extract_text(elem):
                texts = []
                if elem.text:
                    texts.append(elem.text)
                for child in elem:
                    texts.append(extract_text(child))
                    if child.tail:
                        texts.append(child.tail)
                return " ".join(texts)

            for elem in root.iter():
                tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
                if tag == "para":
                    para_text = extract_text(elem)
                    if para_text.strip():
                        text_parts.append(para_text.strip())

            full_text = "\n".join(text_parts)
            full_text = re.sub(r'\n{3,}', '\n\n', full_text)
            return full_text.strip()
        except Exception:
            return re.sub(r'<[^>]+>', ' ', cnxml_content).strip()

    def fetch_openstax_content(topic: str) -> dict:
        """Fetch OpenStax content for a topic using keyword matching."""
        import urllib.request
        import urllib.error

        topic_lower = topic.lower()
        matched_slugs = set()

        for keyword, slugs in KEYWORD_HINTS.items():
            if keyword in topic_lower:
                matched_slugs.update(slugs)

        # If no match found, return empty with note (don't default to ATP)
        if not matched_slugs:
            return {
                "content": "",
                "sources": [],
                "note": f"No specific OpenStax chapter found for '{topic}'. This topic may not be covered in the current chapter mappings."
            }

        chapter_slugs = list(matched_slugs)[:2]
        content_parts = []
        sources = []

        for slug in chapter_slugs:
            module_ids = CHAPTER_TO_MODULES.get(slug, [])
            title = OPENSTAX_CHAPTERS.get(slug, slug)
            url = get_openstax_url(slug)

            for module_id in module_ids:
                github_url = f"https://raw.githubusercontent.com/openstax/osbooks-biology-bundle/main/modules/{module_id}/index.cnxml"
                try:
                    with urllib.request.urlopen(github_url, timeout=10) as response:
                        cnxml = response.read().decode('utf-8')
                        text = parse_cnxml_to_text(cnxml)
                        if text:
                            content_parts.append(f"## {title}\n\n{text}")
                except Exception:
                    pass

            sources.append({"title": title, "url": url, "provider": "OpenStax Biology for AP Courses"})

        return {
            "content": "\n\n---\n\n".join(content_parts) if content_parts else "",
            "sources": sources,
        }

    # =========================================================================
    # TOOL FUNCTIONS
    # =========================================================================

    async def generate_flashcards(
        tool_context: ToolContext,
        topic: str = "ATP and bond energy",
    ) -> str:
        """
        Generate personalized flashcard content as A2UI JSON.

        Args:
            topic: The topic for flashcards (e.g., "ATP hydrolysis", "bond energy")

        Returns:
            A2UI JSON string for Flashcard components
        """
        from google import genai
        from google.genai import types

        client = genai.Client(
            vertexai=True,
            project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
            location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"),
        )

        # Fetch OpenStax content for context
        openstax_data = fetch_openstax_content(topic)
        textbook_context = openstax_data.get("content", "")
        sources = openstax_data.get("sources", [])

        # Ask LLM for simple flashcard content with schema, we'll wrap in A2UI structure
        prompt = f'''Create 4 MCAT study flashcards about "{topic}" for Maria (pre-med, loves gym analogies).
Address the misconception that "energy is stored in bonds" - actually, bond BREAKING requires energy.
Use gym/sports analogies in the answers.

Use this textbook content as your source:
{textbook_context[:3000] if textbook_context else "Use your knowledge of AP Biology."}'''

        flashcard_schema = {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "front": {"type": "string", "description": "The question on the front of the flashcard"},
                    "back": {"type": "string", "description": "The answer on the back, using gym analogies"},
                    "category": {"type": "string", "description": "Category like Biochemistry"},
                },
                "required": ["front", "back", "category"],
            },
        }

        response = client.models.generate_content(
            model=model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=flashcard_schema,
            ),
        )
        cards = json.loads(response.text.strip())

        # Build proper A2UI structure programmatically
        card_ids = [f"c{i+1}" for i in range(len(cards))]
        components = [
            {"id": "mainColumn", "component": {"Column": {"children": {"explicitList": ["header", "row"]}, "distribution": "start", "alignment": "stretch"}}},
            {"id": "header", "component": {"Text": {"text": {"literalString": f"Study Flashcards: {topic}"}, "usageHint": "h3"}}},
            {"id": "row", "component": {"Row": {"children": {"explicitList": card_ids}, "distribution": "start", "alignment": "stretch"}}},
        ]
        for i, card in enumerate(cards):
            components.append({
                "id": card_ids[i],
                "component": {
                    "Flashcard": {
                        "front": {"literalString": card.get("front", "")},
                        "back": {"literalString": card.get("back", "")},
                        "category": {"literalString": card.get("category", "Biochemistry")},
                    }
                }
            })

        a2ui = [
            {"beginRendering": {"surfaceId": SURFACE_ID, "root": "mainColumn"}},
            {"surfaceUpdate": {"surfaceId": SURFACE_ID, "components": components}},
        ]

        # Include source citation
        source_info = None
        if sources:
            source_info = {
                "title": sources[0].get("title", ""),
                "url": sources[0].get("url", ""),
                "provider": sources[0].get("provider", "OpenStax Biology for AP Courses"),
            }

        return json.dumps({"format": "flashcards", "a2ui": a2ui, "surfaceId": SURFACE_ID, "source": source_info})

    async def generate_quiz(
        tool_context: ToolContext,
        topic: str = "ATP and bond energy",
    ) -> str:
        """
        Generate personalized quiz questions as A2UI JSON.

        Args:
            topic: The topic for quiz questions

        Returns:
            A2UI JSON string for QuizCard components
        """
        from google import genai
        from google.genai import types

        client = genai.Client(
            vertexai=True,
            project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
            location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"),
        )

        # Fetch OpenStax content for context
        openstax_data = fetch_openstax_content(topic)
        textbook_context = openstax_data.get("content", "")
        sources = openstax_data.get("sources", [])

        # Ask LLM for simple quiz content with schema, we'll wrap in A2UI structure
        prompt = f'''Create 2 MCAT quiz questions about "{topic}" for Maria (pre-med, loves gym analogies).
Each question should have 4 options (a, b, c, d) with exactly one correct answer.
Use gym/sports analogies in explanations.

Use this textbook content as your source:
{textbook_context[:3000] if textbook_context else "Use your knowledge of AP Biology."}'''

        quiz_schema = {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string", "description": "The MCAT-style question"},
                    "options": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "label": {"type": "string", "description": "The option text"},
                                "value": {"type": "string", "description": "Option identifier (a, b, c, or d)"},
                                "isCorrect": {"type": "boolean", "description": "True if this is the correct answer"},
                            },
                            "required": ["label", "value", "isCorrect"],
                        },
                    },
                    "explanation": {"type": "string", "description": "Detailed explanation with gym analogy"},
                    "category": {"type": "string", "description": "Category like Biochemistry"},
                },
                "required": ["question", "options", "explanation", "category"],
            },
        }

        response = client.models.generate_content(
            model=model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=quiz_schema,
            ),
        )
        quizzes = json.loads(response.text.strip())

        # Build proper A2UI structure programmatically
        quiz_ids = [f"q{i+1}" for i in range(len(quizzes))]
        components = [
            {"id": "mainColumn", "component": {"Column": {"children": {"explicitList": ["header", "row"]}, "distribution": "start", "alignment": "stretch"}}},
            {"id": "header", "component": {"Text": {"text": {"literalString": f"Quick Quiz: {topic}"}, "usageHint": "h3"}}},
            {"id": "row", "component": {"Row": {"children": {"explicitList": quiz_ids}, "distribution": "start", "alignment": "stretch"}}},
        ]
        for i, quiz in enumerate(quizzes):
            # Transform options to A2UI format
            options = []
            for opt in quiz.get("options", []):
                options.append({
                    "label": {"literalString": opt.get("label", "")},
                    "value": opt.get("value", ""),
                    "isCorrect": opt.get("isCorrect", False),
                })
            components.append({
                "id": quiz_ids[i],
                "component": {
                    "QuizCard": {
                        "question": {"literalString": quiz.get("question", "")},
                        "options": options,
                        "explanation": {"literalString": quiz.get("explanation", "")},
                        "category": {"literalString": quiz.get("category", "Biochemistry")},
                    }
                }
            })

        a2ui = [
            {"beginRendering": {"surfaceId": SURFACE_ID, "root": "mainColumn"}},
            {"surfaceUpdate": {"surfaceId": SURFACE_ID, "components": components}},
        ]

        # Include source citation
        source_info = None
        if sources:
            source_info = {
                "title": sources[0].get("title", ""),
                "url": sources[0].get("url", ""),
                "provider": sources[0].get("provider", "OpenStax Biology for AP Courses"),
            }

        return json.dumps({"format": "quiz", "a2ui": a2ui, "surfaceId": SURFACE_ID, "source": source_info})

    async def get_textbook_content(
        tool_context: ToolContext,
        topic: str,
    ) -> str:
        """
        Get textbook content from OpenStax Biology for AP Courses.

        Args:
            topic: The biology topic to look up (e.g., "ATP", "glycolysis", "thermodynamics")

        Returns:
            Textbook content with source citation
        """
        openstax_data = fetch_openstax_content(topic)
        content = openstax_data.get("content", "")
        sources = openstax_data.get("sources", [])

        if not content:
            return json.dumps({
                "content": f"No specific textbook content found for '{topic}'. Please use general biology knowledge.",
                "sources": []
            })

        # Format source citations
        source_citations = []
        for src in sources:
            source_citations.append({
                "title": src.get("title", ""),
                "url": src.get("url", ""),
                "provider": src.get("provider", "OpenStax Biology for AP Courses"),
            })

        return json.dumps({
            "content": content[:4000],  # Limit content length
            "sources": source_citations
        })

    # Create the agent WITH tools
    agent = Agent(
        name="personalized_learning_agent",
        model=model_id,
        instruction="""You are a personalized learning assistant for biology students. You have access to OpenStax Biology for AP Courses textbook content.

TOOLS AVAILABLE:
- generate_flashcards(topic) - Creates study flashcards as A2UI components
- generate_quiz(topic) - Creates quiz questions as A2UI components
- get_textbook_content(topic) - Gets textbook content from OpenStax for answering questions

WHEN TO USE TOOLS:
- User asks for "flashcards" → call generate_flashcards with the topic
- User asks for "quiz" or "test me" → call generate_quiz with the topic
- User asks ANY biology question → You MUST call get_textbook_content(topic) FIRST before answering

CRITICAL RULES FOR ANSWERING QUESTIONS:
1. ALWAYS call get_textbook_content(topic) before answering biology questions
2. The tool returns content AND source URLs - you MUST include these URLs in your response
3. Format citations as clickable markdown links: [Chapter Title](https://openstax.org/books/biology-ap-courses/pages/...)
4. NEVER make up chapter numbers or URLs - only use what the tool returns
5. If the tool returns no content for a topic, say "This topic isn't in my current OpenStax chapter mappings" and answer from general knowledge

LEARNER PROFILE (Maria):
- Pre-med student preparing for MCAT
- Loves sports/gym analogies
- Misconception: thinks "energy is stored in bonds"
- Reality: Bond BREAKING requires energy; energy released when MORE STABLE products form

Always use gym/sports analogies. Be encouraging and focus on correcting misconceptions.""",
        tools=[generate_flashcards, generate_quiz, get_textbook_content],
    )

    # =========================================================================
    # CONTEXT CACHING CONFIGURATION (EXPERIMENTAL)
    # =========================================================================
    # Context caching allows reuse of large instructions across requests,
    # improving speed and reducing token costs.
    # - min_tokens: Minimum context size to trigger caching (2048 recommended)
    # - ttl_seconds: How long to keep cache (600 = 10 minutes)
    # - cache_intervals: Max times cache is reused before refresh
    # =========================================================================
    cache_config = ContextCacheConfig(
        min_tokens=2048,
        ttl_seconds=600,
        cache_intervals=10,
    )

    # Wrap agent in App with caching, then in AdkApp for deployment
    adk_inner_app = App(
        name="personalized_learning_app",
        root_agent=agent,
        context_cache_config=cache_config,
    )
    app = AdkApp(app=adk_inner_app, enable_tracing=True)

    print("Starting deployment (this takes 2-5 minutes)...")

    # Deploy using agent_engines.create() - the recommended API
    remote_app = agent_engines.create(
        agent_engine=app,
        display_name="Personalized Learning Agent",
        requirements=[
            "google-cloud-aiplatform[agent_engines,adk]",
            "google-genai>=1.0.0",
        ],
    )

    print(f"\n{'='*60}")
    print("DEPLOYMENT SUCCESSFUL!")
    print(f"{'='*60}")
    print(f"Resource Name: {remote_app.resource_name}")
    resource_id = remote_app.resource_name.split("/")[-1]
    print(f"Resource ID: {resource_id}")
    print()
    print("Next steps:")
    print(f"  1. Copy the Resource ID above")
    print(f"  2. Paste it into the notebook's AGENT_RESOURCE_ID variable")
    print(f"  3. Run the remaining notebook cells to configure and start the demo")


if __name__ == "__main__":
    main()
