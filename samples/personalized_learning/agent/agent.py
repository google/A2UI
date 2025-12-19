"""
Personalized Learning Agent (ADK)

ADK agent that generates A2UI JSON for personalized learning materials
based on learner context data.

This agent is designed to be run with `adk web` locally or deployed
to Agent Engine.
"""

import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Optional, Tuple

# Load environment variables from .env file for local development
# In Agent Engine, these will be set by the deployment environment
try:
    from dotenv import load_dotenv
    # Try multiple possible .env locations
    env_paths = [
        Path(__file__).parent.parent / ".env",  # samples/personalized_learning/.env
        Path(__file__).parent / ".env",          # agent/.env
        Path.cwd() / ".env",                     # current working directory
    ]
    for env_path in env_paths:
        if env_path.exists():
            load_dotenv(env_path)
            break
except ImportError:
    # python-dotenv not available (e.g., in Agent Engine)
    pass

# Set up Vertex AI environment - only if not already set
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "TRUE")

from google.adk.agents import Agent
from google.adk.tools import ToolContext

# ============================================================================
# MODULE-LEVEL CONFIGURATION
# These variables are captured by cloudpickle during deployment.
# They are set at import time from environment variables, ensuring they
# persist in the deployed agent even though os.environ is not pickled.
# ============================================================================
_CONFIG_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
_CONFIG_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

# Use relative imports - required for proper wheel packaging and Agent Engine deployment
# These may fail in Agent Engine where files aren't available
try:
    from .context_loader import get_combined_context, load_context_file
    from .a2ui_templates import get_system_prompt, SURFACE_ID as _IMPORTED_SURFACE_ID
    from .openstax_content import fetch_content_for_topic, fetch_chapter_content
    from .openstax_chapters import OPENSTAX_CHAPTERS, KEYWORD_HINTS, get_openstax_url_for_chapter
    _HAS_EXTERNAL_MODULES = True
    _HAS_OPENSTAX = True
except Exception as e:
    _HAS_EXTERNAL_MODULES = False
    _HAS_OPENSTAX = False
    _IMPORT_ERROR = str(e)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Log warnings for degraded functionality
if not _HAS_EXTERNAL_MODULES:
    logger.warning(
        "External modules (context_loader, a2ui_templates) not available. "
        "Using embedded fallback content. Import error: %s",
        _IMPORT_ERROR if '_IMPORT_ERROR' in globals() else "unknown"
    )

if not _HAS_OPENSTAX:
    logger.warning(
        "OpenStax content modules not available. Flashcards and quizzes will use "
        "embedded content only, without textbook source material. "
        "This may result in less accurate educational content."
    )

# Model configuration - use Gemini 2.5 Flash (available in us-central1)
MODEL_ID = os.getenv("GENAI_MODEL", "gemini-2.5-flash")

# Supported content formats
SUPPORTED_FORMATS = ["flashcards", "audio", "podcast", "video", "quiz"]

# Surface ID for A2UI rendering (use imported value if available, else fallback)
SURFACE_ID = _IMPORTED_SURFACE_ID if _HAS_EXTERNAL_MODULES else "learningContent"

# ============================================================================
# GCS CONTEXT LOADING (for Agent Engine - loads dynamic context from GCS)
# ============================================================================

# GCS configuration - set via environment variables
GCS_CONTEXT_BUCKET = os.getenv("GCS_CONTEXT_BUCKET", "a2ui-demo-context")
GCS_CONTEXT_PREFIX = os.getenv("GCS_CONTEXT_PREFIX", "learner_context/")

# Context files to load
CONTEXT_FILES = [
    "01_maria_learner_profile.txt",
    "02_chemistry_bond_energy.txt",
    "03_chemistry_thermodynamics.txt",
    "04_biology_atp_cellular_respiration.txt",
    "05_misconception_resolution.txt",
    "06_mcat_practice_concepts.txt",
]


def _load_from_gcs(filename: str) -> Optional[str]:
    """Load a context file from GCS bucket."""
    try:
        from google.cloud import storage

        client = storage.Client()
        bucket = client.bucket(GCS_CONTEXT_BUCKET)
        blob = bucket.blob(f"{GCS_CONTEXT_PREFIX}{filename}")

        if blob.exists():
            content = blob.download_as_text()
            logger.info(f"Loaded {filename} from GCS bucket {GCS_CONTEXT_BUCKET}")
            return content
        else:
            logger.warning(f"File {filename} not found in GCS bucket {GCS_CONTEXT_BUCKET}")
            return None

    except Exception as e:
        logger.warning(f"Failed to load from GCS: {e}")
        return None


def _load_all_context_from_gcs() -> dict[str, str]:
    """Load all context files from GCS."""
    context = {}
    for filename in CONTEXT_FILES:
        content = _load_from_gcs(filename)
        if content:
            context[filename] = content
    logger.info(f"Loaded {len(context)} context files from GCS")
    return context


def _get_combined_context_from_gcs() -> str:
    """Get all context combined from GCS."""
    all_context = _load_all_context_from_gcs()

    if all_context:
        combined = []
        for filename, content in sorted(all_context.items()):
            combined.append(f"=== {filename} ===\n{content}\n")
        return "\n".join(combined)

    # Return empty string if GCS load failed - will trigger fallback
    return ""


# ============================================================================
# EMBEDDED CONTEXT DATA (fallback when GCS is unavailable)
# ============================================================================

EMBEDDED_LEARNER_PROFILE = """
## Learner Profile: Maria Santos

**Background:**
- Pre-med sophomore majoring in Biochemistry
- Preparing for MCAT in 8 months
- Works part-time as a pharmacy technician (20 hrs/week)

**Learning Style:**
- Visual-kinesthetic learner
- Prefers analogies connecting to real-world applications
- Responds well to gym/fitness metaphors (exercises regularly)
- Benefits from spaced repetition for memorization

**Current Progress:**
- Completed: Cell structure, basic chemistry
- In progress: Cellular energetics (ATP, metabolism)
- Struggling with: Thermodynamics concepts, especially Gibbs free energy

**Known Misconceptions:**
- Believes "energy is stored in bonds" (common misconception)
- Needs clarification that bond BREAKING releases energy in ATP hydrolysis
"""

EMBEDDED_CURRICULUM_CONTEXT = """
## Current Topic: ATP and Cellular Energy

**Learning Objectives:**
1. Explain why ATP is considered the "energy currency" of cells
2. Describe the structure of ATP and how it stores potential energy
3. Understand that energy is released during hydrolysis due to product stability, not bond breaking
4. Connect ATP usage to cellular processes like muscle contraction

**Key Concepts:**
- Adenosine triphosphate structure (adenine + ribose + 3 phosphate groups)
- Phosphoanhydride bonds and electrostatic repulsion
- Hydrolysis reaction: ATP + H2O → ADP + Pi + Energy
- Gibbs free energy change (ΔG = -30.5 kJ/mol)
- Coupled reactions in cellular metabolism

**Common Misconceptions to Address:**
- "Energy stored in bonds" - Actually, breaking bonds REQUIRES energy;
  the energy released comes from forming more stable products (ADP + Pi)
- ATP is not a long-term energy storage molecule (that's glycogen/fat)
"""

EMBEDDED_MISCONCEPTION_CONTEXT = """
## Misconception Resolution: "Energy Stored in Bonds"

**The Misconception:**
Many students believe ATP releases energy because "energy is stored in the phosphate bonds."

**The Reality:**
- Breaking ANY chemical bond REQUIRES energy input (endothermic)
- Energy is released when NEW, more stable bonds FORM (exothermic)
- ATP hydrolysis releases energy because the products (ADP + Pi) are MORE STABLE than ATP

**Why ATP is "High Energy":**
- The three phosphate groups are negatively charged and repel each other
- This electrostatic repulsion creates molecular strain (like a compressed spring)
- When the terminal phosphate is removed, the products achieve better stability
- The energy comes from relieving this strain, not from "stored bond energy"

**Gym Analogy for Maria:**
Think of ATP like holding a heavy plank position:
- Holding the plank (ATP) requires constant energy expenditure to maintain
- Dropping to rest (ADP + Pi) releases that tension
- The "energy" wasn't stored in your muscles - it was the relief of an unstable state
"""


def _get_combined_context_fallback() -> str:
    """Get combined context using embedded data when files aren't available."""
    return f"""
{EMBEDDED_LEARNER_PROFILE}

{EMBEDDED_CURRICULUM_CONTEXT}

{EMBEDDED_MISCONCEPTION_CONTEXT}
"""


def _get_system_prompt_fallback(format_type: str, context: str) -> str:
    """Generate system prompt for A2UI generation (fallback for Agent Engine)."""
    if format_type.lower() == "flashcards":
        return f"""You are creating MCAT study flashcards for Maria, a pre-med student.

## Maria's Profile
{context}

## Your Task
Create 4-5 high-quality flashcards about ATP and bond energy that:
1. Directly address her misconception that "energy is stored in bonds"
2. Use sports/gym analogies she loves (compressed springs, holding planks, etc.)
3. Are MCAT exam-focused with precise scientific language
4. Have COMPLETE, THOUGHTFUL answers - not placeholders

## A2UI JSON Format
Output a JSON array starting with beginRendering, then surfaceUpdate with components.
Use Flashcard components with front, back, and category fields.
Use surfaceId: "{SURFACE_ID}"

Generate the flashcards JSON (output ONLY valid JSON, no markdown):"""

    if format_type.lower() == "quiz":
        return f"""You are creating MCAT practice quiz questions for Maria, a pre-med student.

## Maria's Profile
{context}

## Your Task
Create 2-3 interactive quiz questions about ATP and bond energy that:
1. Test her understanding of WHY ATP hydrolysis releases energy
2. Include plausible wrong answers reflecting common misconceptions
3. Provide detailed explanations using sports/gym analogies
4. Are MCAT exam-style with precise scientific language

## A2UI JSON Format
Output a JSON array with QuizCard components. Each QuizCard has:
- question: The question text
- options: Array of 4 choices with label, value (a/b/c/d), isCorrect
- explanation: Detailed explanation shown after answering
- category: Topic category
Use surfaceId: "{SURFACE_ID}"

Generate the quiz JSON (output ONLY valid JSON, no markdown):"""

    return f"""Generate A2UI JSON for {format_type} content.

## Context
{context}

Use surfaceId: "{SURFACE_ID}"
Output ONLY valid JSON, no markdown."""


# ============================================================================
# CACHING FOR PERFORMANCE
# ============================================================================

# Context cache with TTL
_CONTEXT_CACHE: dict[str, Tuple[str, float]] = {}
_CONTEXT_CACHE_TTL = 300  # 5 minutes


def _get_cached_context() -> str:
    """
    Get combined context with TTL-based caching.

    This avoids 6 GCS reads per request by caching the combined context
    for 5 minutes. The cache is invalidated after TTL expires.
    """
    cache_key = "combined_context"
    now = time.time()

    if cache_key in _CONTEXT_CACHE:
        content, cached_at = _CONTEXT_CACHE[cache_key]
        if now - cached_at < _CONTEXT_CACHE_TTL:
            logger.info("Using cached learner context (cache hit)")
            return content

    # Cache miss - load fresh
    content = _safe_get_combined_context()
    _CONTEXT_CACHE[cache_key] = (content, now)
    logger.info("Loaded and cached learner context (cache miss)")
    return content


def clear_context_cache() -> None:
    """Clear the context cache. Useful for testing."""
    global _CONTEXT_CACHE
    _CONTEXT_CACHE = {}
    logger.info("Context cache cleared")


# Wrapper functions with priority: local files -> GCS -> embedded fallback
def _safe_get_combined_context() -> str:
    """
    Get combined context with fallback chain:
    1. Local files (via external modules) - for local development
    2. GCS bucket - for Agent Engine with dynamic context
    3. Embedded data - final fallback
    """
    # Try local files first (for local development with adk web)
    if _HAS_EXTERNAL_MODULES:
        try:
            context = get_combined_context()
            if context:
                logger.info("Loaded context from local files")
                return context
        except Exception as e:
            logger.warning(f"Failed to load context from local files: {e}")

    # Try GCS (for Agent Engine deployment)
    gcs_context = _get_combined_context_from_gcs()
    if gcs_context:
        logger.info("Loaded context from GCS")
        return gcs_context

    # Fall back to embedded data
    logger.info("Using embedded fallback context")
    return _get_combined_context_fallback()


def _safe_load_context_file(filename: str) -> Optional[str]:
    """
    Load context file with fallback chain:
    1. Local files (via external modules)
    2. GCS bucket
    3. Embedded data
    """
    # Try local files first
    if _HAS_EXTERNAL_MODULES:
        try:
            content = load_context_file(filename)
            if content:
                return content
        except Exception as e:
            logger.debug(f"Failed to load context file {filename} from local: {e}")

    # Try GCS
    gcs_content = _load_from_gcs(filename)
    if gcs_content:
        return gcs_content

    # Fall back to embedded data based on filename
    if "learner_profile" in filename:
        return EMBEDDED_LEARNER_PROFILE
    if "misconception" in filename:
        return EMBEDDED_MISCONCEPTION_CONTEXT
    return None


def _safe_get_system_prompt(format_type: str, context: str) -> str:
    """Get system prompt, using fallback if external modules unavailable."""
    if _HAS_EXTERNAL_MODULES:
        try:
            return get_system_prompt(format_type, context)
        except Exception as e:
            logger.warning(f"Failed to get system prompt: {e}, using fallback")
    return _get_system_prompt_fallback(format_type, context)


# ============================================================================
# TOOL FUNCTIONS
# ============================================================================


async def generate_flashcards(
    tool_context: ToolContext,
    topic: Optional[str] = None,
) -> dict[str, Any]:
    """
    Generate personalized flashcard content as A2UI JSON.

    Creates study flashcards tailored to the learner's profile, addressing
    their misconceptions and using their preferred learning analogies.
    Content is sourced from OpenStax Biology for AP Courses textbook.

    Args:
        topic: Optional topic focus (e.g., "bond energy", "ATP hydrolysis").
               If not provided, generates general flashcards based on learner profile.

    Returns:
        A2UI JSON for flashcard components that can be rendered in the chat
    """
    logger.info("=" * 60)
    logger.info("GENERATE_FLASHCARDS CALLED")
    logger.info(f"Topic received: {topic or '(none)'}")
    logger.info("=" * 60)

    # Get learner context (profile, preferences, misconceptions) - uses cache
    learner_context = _get_cached_context()

    # Fetch OpenStax content for the topic
    openstax_content = ""
    sources = []
    if topic and _HAS_OPENSTAX:
        logger.info(f"Fetching OpenStax content for topic: {topic}")
        try:
            content_result = await fetch_content_for_topic(topic, max_chapters=2)
            openstax_content = content_result.get("combined_content", "")
            sources = content_result.get("sources", [])
            matched_chapters = content_result.get("matched_chapters", [])
            logger.info(f"OpenStax fetch result:")
            logger.info(f"  - Matched chapters: {matched_chapters}")
            logger.info(f"  - Sources: {sources}")
            logger.info(f"  - Content length: {len(openstax_content)} chars")
            if not openstax_content:
                logger.warning("NO CONTENT RETURNED from OpenStax fetch!")
        except Exception as e:
            logger.error(f"FAILED to fetch OpenStax content: {e}")
            import traceback
            logger.error(traceback.format_exc())

    # Combine learner context with OpenStax source material
    if openstax_content:
        context = f"""## Learner Profile & Preferences
{learner_context}

## Source Material (OpenStax Biology for AP Courses)
Use the following textbook content as the authoritative source for creating flashcards:

{openstax_content}

## User's Topic Request
{topic or 'general biology concepts'}
"""
    else:
        context = learner_context
        if topic:
            context = f"{context}\n\nUser requested focus: {topic}"

    result = await _generate_a2ui_content("flashcards", context, tool_context)

    # Add source attribution
    if sources:
        result["sources"] = sources

    return result


async def generate_quiz(
    tool_context: ToolContext,
    topic: Optional[str] = None,
) -> dict[str, Any]:
    """
    Generate personalized quiz questions as A2UI JSON.

    Creates interactive multiple-choice quiz cards with immediate feedback,
    targeting the learner's specific misconceptions.
    Content is sourced from OpenStax Biology for AP Courses textbook.

    Args:
        topic: Optional topic focus (e.g., "thermodynamics", "cellular respiration").
               If not provided, generates quiz based on learner's weak areas.

    Returns:
        A2UI JSON for interactive QuizCard components
    """
    logger.info(f"Generating quiz for topic: {topic or 'general'}")

    # Get learner context (profile, preferences, misconceptions) - uses cache
    learner_context = _get_cached_context()

    # Fetch OpenStax content for the topic
    openstax_content = ""
    sources = []
    if topic and _HAS_OPENSTAX:
        try:
            content_result = await fetch_content_for_topic(topic, max_chapters=2)
            openstax_content = content_result.get("combined_content", "")
            sources = content_result.get("sources", [])
            logger.info(f"Fetched OpenStax content from {len(sources)} chapters")
        except Exception as e:
            logger.warning(f"Failed to fetch OpenStax content: {e}")

    # Combine learner context with OpenStax source material
    if openstax_content:
        context = f"""## Learner Profile & Preferences
{learner_context}

## Source Material (OpenStax Biology for AP Courses)
Use the following textbook content as the authoritative source for creating quiz questions.
Ensure all correct answers are factually accurate according to this source:

{openstax_content}

## User's Topic Request
{topic or 'general biology concepts'}
"""
    else:
        context = learner_context
        if topic:
            context = f"{context}\n\nUser requested focus: {topic}"

    result = await _generate_a2ui_content("quiz", context, tool_context)

    # Add source attribution
    if sources:
        result["sources"] = sources

    return result


async def get_audio_content(
    tool_context: ToolContext,
) -> dict[str, Any]:
    """
    Get pre-generated podcast/audio content as A2UI JSON.

    Returns A2UI JSON for an audio player with a personalized podcast
    that explains ATP and bond energy concepts using the learner's
    preferred analogies.

    Returns:
        A2UI JSON for AudioPlayer component with podcast content
    """
    logger.info("Getting audio content")

    a2ui = [
        {"beginRendering": {"surfaceId": SURFACE_ID, "root": "audioCard"}},
        {
            "surfaceUpdate": {
                "surfaceId": SURFACE_ID,
                "components": [
                    {
                        "id": "audioCard",
                        "component": {"Card": {"child": "audioContent"}},
                    },
                    {
                        "id": "audioContent",
                        "component": {
                            "Column": {
                                "children": {
                                    "explicitList": [
                                        "audioHeader",
                                        "audioPlayer",
                                        "audioDescription",
                                    ]
                                },
                                "distribution": "start",
                                "alignment": "stretch",
                            }
                        },
                    },
                    {
                        "id": "audioHeader",
                        "component": {
                            "Row": {
                                "children": {
                                    "explicitList": ["audioIcon", "audioTitle"]
                                },
                                "distribution": "start",
                                "alignment": "center",
                            }
                        },
                    },
                    {
                        "id": "audioIcon",
                        "component": {
                            "Icon": {"name": {"literalString": "podcasts"}}
                        },
                    },
                    {
                        "id": "audioTitle",
                        "component": {
                            "Text": {
                                "text": {
                                    "literalString": "ATP & Chemical Stability: Correcting the Misconception"
                                },
                                "usageHint": "h3",
                            }
                        },
                    },
                    {
                        "id": "audioPlayer",
                        "component": {
                            "AudioPlayer": {
                                "url": {"literalString": "/assets/podcast.m4a"},
                                "audioTitle": {
                                    "literalString": "Understanding ATP Energy Release"
                                },
                                "audioDescription": {
                                    "literalString": "A personalized podcast about ATP and chemical stability"
                                },
                            }
                        },
                    },
                    {
                        "id": "audioDescription",
                        "component": {
                            "Text": {
                                "text": {
                                    "literalString": "This personalized podcast explains why 'energy stored in bonds' is a common misconception. Using your preferred gym analogies, it walks through how ATP hydrolysis actually releases energy through stability differences, not bond breaking. Perfect for your MCAT prep!"
                                },
                                "usageHint": "body",
                            }
                        },
                    },
                ],
            }
        },
    ]

    return {
        "format": "audio",
        "a2ui": a2ui,
        "surfaceId": SURFACE_ID,
    }


async def get_video_content(
    tool_context: ToolContext,
) -> dict[str, Any]:
    """
    Get pre-generated video content as A2UI JSON.

    Returns A2UI JSON for a video player with an animated explainer
    about ATP energy and stability using visual analogies.

    Returns:
        A2UI JSON for Video component with educational content
    """
    logger.info("Getting video content")

    a2ui = [
        {"beginRendering": {"surfaceId": SURFACE_ID, "root": "videoCard"}},
        {
            "surfaceUpdate": {
                "surfaceId": SURFACE_ID,
                "components": [
                    {
                        "id": "videoCard",
                        "component": {"Card": {"child": "videoContent"}},
                    },
                    {
                        "id": "videoContent",
                        "component": {
                            "Column": {
                                "children": {
                                    "explicitList": [
                                        "videoTitle",
                                        "videoPlayer",
                                        "videoDescription",
                                    ]
                                },
                                "distribution": "start",
                                "alignment": "stretch",
                            }
                        },
                    },
                    {
                        "id": "videoTitle",
                        "component": {
                            "Text": {
                                "text": {
                                    "literalString": "Visual Guide: ATP Energy & Stability"
                                },
                                "usageHint": "h3",
                            }
                        },
                    },
                    {
                        "id": "videoPlayer",
                        "component": {
                            "Video": {
                                "url": {"literalString": "/assets/demo.mp4"},
                            }
                        },
                    },
                    {
                        "id": "videoDescription",
                        "component": {
                            "Text": {
                                "text": {
                                    "literalString": "This animated explainer uses the compressed spring analogy to show why ATP releases energy. See how electrostatic repulsion in ATP makes it 'want' to become the more stable ADP + Pi."
                                },
                                "usageHint": "body",
                            }
                        },
                    },
                ],
            }
        },
    ]

    return {
        "format": "video",
        "a2ui": a2ui,
        "surfaceId": SURFACE_ID,
    }


async def get_learner_profile(
    tool_context: ToolContext,
) -> dict[str, Any]:
    """
    Get the current learner's profile and context.

    Returns the learner's profile including their learning preferences,
    current misconceptions, and study goals. Use this to understand
    who you're helping before generating content.

    Returns:
        Learner profile with preferences, misconceptions, and goals
    """
    logger.info("Getting learner profile")

    profile = _safe_load_context_file("01_maria_learner_profile.txt")
    misconceptions = _safe_load_context_file("05_misconception_resolution.txt")

    return {
        "profile": profile or "No profile loaded",
        "misconceptions": misconceptions or "No misconception data loaded",
        "supported_formats": SUPPORTED_FORMATS,
    }


async def get_textbook_content(
    tool_context: ToolContext,
    topic: str,
) -> dict[str, Any]:
    """
    Fetch relevant OpenStax textbook content for a biology topic.

    Use this tool when the user asks a general biology question that needs
    accurate, sourced information. This fetches actual textbook content
    from OpenStax Biology for AP Courses.

    Args:
        topic: The biology topic to look up (e.g., "photosynthesis",
               "endocrine system", "DNA replication")

    Returns:
        Textbook content with source citations
    """
    logger.info(f"Fetching textbook content for: {topic}")

    if not _HAS_OPENSTAX:
        return {
            "error": "OpenStax content module not available",
            "topic": topic,
        }

    try:
        content_result = await fetch_content_for_topic(topic, max_chapters=3)

        return {
            "topic": topic,
            "matched_chapters": content_result.get("matched_chapters", []),
            "content": content_result.get("combined_content", ""),
            "sources": content_result.get("sources", []),
        }

    except Exception as e:
        logger.error(f"Failed to fetch textbook content: {e}")
        return {
            "error": str(e),
            "topic": topic,
        }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


async def _generate_a2ui_content(
    format_type: str,
    context: str,
    tool_context: ToolContext,
) -> dict[str, Any]:
    """
    Generate A2UI content using the Gemini model.

    This is an internal helper that calls the LLM to generate A2UI JSON.
    """
    from google import genai
    from google.genai import types

    # Initialize client with VertexAI - use us-central1 for consistency with Agent Engine
    # Use module-level config variables (captured by cloudpickle) with
    # environment variable fallback for local development
    project = _CONFIG_PROJECT or os.getenv("GOOGLE_CLOUD_PROJECT")
    location = _CONFIG_LOCATION or os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

    if not project:
        logger.error("GOOGLE_CLOUD_PROJECT not configured")
        return {"error": "GOOGLE_CLOUD_PROJECT not configured. Set it in environment or deploy.py."}

    client = genai.Client(
        vertexai=True,
        project=project,
        location=location,
    )

    system_prompt = _safe_get_system_prompt(format_type, context)

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=f"Generate {format_type} for this learner.",
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
            ),
        )

        response_text = response.text.strip()

        try:
            a2ui_json = json.loads(response_text)
            logger.info(f"Successfully generated {format_type} A2UI JSON")
            return {
                "format": format_type,
                "a2ui": a2ui_json,
                "surfaceId": SURFACE_ID,
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse A2UI JSON: {e}")
            return {
                "error": "Failed to generate valid A2UI JSON",
                "raw_response": response_text[:1000],
            }

    except Exception as e:
        logger.error(f"Error generating content: {e}")
        return {"error": str(e)}


# ============================================================================
# AGENT DEFINITION
# ============================================================================

SYSTEM_PROMPT = """# Personalized Learning Agent

You are a personalized learning assistant that helps students study biology more effectively.
You generate interactive learning materials tailored to each learner's profile,
addressing their specific misconceptions and using their preferred learning styles.

**All content is sourced from OpenStax Biology for AP Courses**, a free peer-reviewed
college textbook. Your tools fetch actual textbook content to ensure accuracy.

## Your Capabilities

You can generate several types of learning content:

1. **Flashcards** - Interactive study cards based on textbook content
2. **Quiz Questions** - Multiple choice questions with detailed explanations
3. **Audio Content** - Personalized podcast explaining concepts
4. **Video Content** - Animated visual explanations
5. **Textbook Content** - Look up specific topics from OpenStax

## Current Learner

You're helping Maria, a pre-med student preparing for the MCAT. She:
- Loves sports/gym analogies for learning
- Has a misconception about "energy stored in bonds"
- Needs to understand ATP hydrolysis correctly
- Prefers visual and kinesthetic learning

## How to Respond

When a user asks for learning materials:

1. First call get_learner_profile() if you need more context about the learner
2. Use the appropriate generation tool based on what they request:
   - "flashcards" or "study cards" -> generate_flashcards(topic="...")
   - "quiz" or "test me" or "practice questions" -> generate_quiz(topic="...")
   - "podcast" or "audio" or "listen" -> get_audio_content()
   - "video" or "watch" or "visual" -> get_video_content()

3. For general biology questions (not requesting study materials):
   - Use get_textbook_content(topic="...") to fetch relevant textbook content
   - Answer the question using the fetched content
   - Always cite the source chapter

4. The tools return A2UI JSON which will be rendered as interactive components
5. After calling a tool, briefly explain what you've generated

## Content Sources

All flashcards, quizzes, and answers are generated from actual OpenStax textbook content.
When you answer questions or generate materials, you should mention the source, e.g.:
"Based on OpenStax Biology Chapter 6.4: ATP - Adenosine Triphosphate..."

## Important Notes

- Always use the learner's preferred analogies (sports/gym for Maria)
- Focus on correcting misconceptions, not just presenting facts
- Be encouraging and supportive
- The A2UI components are rendered automatically - just call the tools
- Include the topic parameter when generating flashcards or quizzes

## A2UI Format

The tools return A2UI JSON that follows this structure:
- beginRendering: Starts a new UI surface
- surfaceUpdate: Contains component definitions
- Components include: Card, Column, Row, Text, Flashcard, QuizCard, AudioPlayer, Video

You don't need to understand the A2UI format in detail - just use the tools
and explain the content to the learner.
"""

# ============================================================================
# AGENT FACTORY FOR AGENT ENGINE DEPLOYMENT
# ============================================================================
# Agent Engine requires a class that creates the agent on the SERVER,
# not a pre-instantiated agent object. This avoids serialization issues
# with live objects (connections, locks, etc).


def create_agent() -> Agent:
    """Factory function to create the ADK agent.

    This is called on the server side after deployment, avoiding
    serialization of live objects.
    """
    return Agent(
        name="personalized_learning_agent",
        model=MODEL_ID,
        instruction=SYSTEM_PROMPT,
        tools=[
            generate_flashcards,
            generate_quiz,
            get_audio_content,
            get_video_content,
            get_learner_profile,
            get_textbook_content,
        ],
    )


# For local development with `adk web`, we still need a module-level agent
# This is only instantiated when running locally, not during deployment
root_agent = create_agent()


# ============================================================================
# SERVER-SIDE AGENT WRAPPER FOR AGENT ENGINE DEPLOYMENT
# ============================================================================
# This wrapper class enables lazy initialization - the agent is created
# on the server side after deployment, avoiding serialization of live objects.


class ServerSideAgent:
    """
    Wrapper class for Agent Engine deployment using ReasoningEngine pattern.

    This class is COMPLETELY SELF-CONTAINED - it does not import from the
    'agent' package to avoid module resolution issues during unpickling.
    All agent creation logic is inlined here.

    Usage:
        reasoning_engines.ReasoningEngine.create(
            ServerSideAgent,  # Pass the CLASS, not an instance
            requirements=[...],
        )
    """

    def __init__(self):
        """Initialize the agent on the server side."""
        # ALL imports happen inside __init__ to avoid capture during pickling
        import os
        from google.adk.agents import Agent
        from vertexai.agent_engines import AdkApp

        # Model configuration
        model_id = os.getenv("GENAI_MODEL", "gemini-2.5-flash")

        # Create a simple agent with basic instruction
        # Tools would need to be defined inline here too to avoid imports
        self.agent = Agent(
            name="personalized_learning_agent",
            model=model_id,
            instruction="""You are a personalized learning assistant that helps students study biology.

You can help students understand concepts like ATP, cellular respiration, and bond energy.
Use sports and gym analogies when explaining concepts.

When asked for flashcards or quizzes, explain that this feature requires the full agent deployment.
For now, you can have a helpful conversation about biology topics.""",
            tools=[],  # No tools for now - keep it simple
        )

        # Wrap in AdkApp for session management and tracing
        self.app = AdkApp(agent=self.agent, enable_tracing=True)

    def query(self, *, user_id: str, message: str, **kwargs):
        """
        Handle a query from the user.

        This method signature matches what ReasoningEngine expects.
        """
        return self.app.query(user_id=user_id, message=message, **kwargs)

    async def aquery(self, *, user_id: str, message: str, **kwargs):
        """
        Handle an async query from the user.
        """
        return await self.app.aquery(user_id=user_id, message=message, **kwargs)

    def stream_query(self, *, user_id: str, message: str, **kwargs):
        """
        Handle a streaming query from the user.
        """
        return self.app.stream_query(user_id=user_id, message=message, **kwargs)


# ============================================================================
# LEGACY COMPATIBILITY (for server.py)
# ============================================================================

class LearningMaterialAgent:
    """
    Legacy wrapper for backwards compatibility with server.py.

    This class wraps the ADK agent's tools to maintain the same interface
    that server.py expects.
    """

    SUPPORTED_FORMATS = SUPPORTED_FORMATS

    def __init__(self, init_client: bool = True):
        self._init_client = init_client

    async def generate_content(
        self,
        format_type: str,
        additional_context: str = "",
    ) -> dict[str, Any]:
        """Generate content using the appropriate tool."""
        # Create a minimal tool context (duck-typed to match ToolContext interface)
        class MinimalToolContext:
            def __init__(self):
                self.state = {}

        ctx = MinimalToolContext()

        format_lower = format_type.lower()

        if format_lower == "flashcards":
            return await generate_flashcards(ctx, additional_context or None)
        elif format_lower == "quiz":
            return await generate_quiz(ctx, additional_context or None)
        elif format_lower in ["audio", "podcast"]:
            return await get_audio_content(ctx)
        elif format_lower == "video":
            return await get_video_content(ctx)
        else:
            return {
                "error": f"Unsupported format: {format_type}",
                "supported_formats": SUPPORTED_FORMATS,
            }

    async def stream(self, request: str, session_id: str = "default"):
        """Stream response for A2A compatibility."""
        parts = request.split(":", 1)
        format_type = parts[0].strip().lower()
        additional_context = parts[1].strip() if len(parts) > 1 else ""

        yield {
            "is_task_complete": False,
            "updates": f"Generating {format_type}...",
        }

        result = await self.generate_content(format_type, additional_context)

        yield {
            "is_task_complete": True,
            "content": result,
        }


# Singleton for backwards compatibility
_agent_instance = None


def get_agent() -> LearningMaterialAgent:
    """Get or create the legacy agent wrapper singleton."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = LearningMaterialAgent()
    return _agent_instance
