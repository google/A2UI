"""
Personalized Learning Agent

A2A agent that generates A2UI JSON for personalized learning materials
based on learner context data.

This agent is designed to be deployed to Agent Engine and called remotely
from the chat application.
"""

import json
import logging
import os
from typing import AsyncIterator, Any

from google import genai
from google.genai import types

from context_loader import get_combined_context, load_context_file
from a2ui_templates import get_system_prompt, SURFACE_ID

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model configuration - use just the model name, SDK adds the path prefix
# gemini-3-pro-preview requires special access, fallback to gemini-2.5-flash
MODEL_ID = os.getenv("GENAI_MODEL", "gemini-2.5-flash")


class LearningMaterialAgent:
    """
    Agent that generates A2UI learning materials.

    Reads learner context and generates A2UI JSON for flashcards,
    quizzes, and media references.
    """

    SUPPORTED_FORMATS = ["flashcards", "audio", "podcast", "video", "quiz"]

    def __init__(self, init_client: bool = True):
        """
        Initialize the agent.

        Args:
            init_client: If True, initialize the Gemini client immediately.
                        If False, delay initialization until first use (for testing).
        """
        self._client = None
        self._init_client = init_client
        self._context_cache: dict[str, str] = {}

    @property
    def client(self):
        """Lazily initialize the Gemini client using VertexAI."""
        if self._client is None:
            # Use VertexAI with Application Default Credentials
            project = os.getenv("GOOGLE_CLOUD_PROJECT")
            location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
            self._client = genai.Client(
                vertexai=True,
                project=project,
                location=location,
            )
        return self._client

    def _get_context(self) -> str:
        """Load and cache the context data."""
        if not self._context_cache:
            self._context_cache["combined"] = get_combined_context()
        return self._context_cache.get("combined", "")

    async def generate_content(
        self,
        format_type: str,
        additional_context: str = "",
    ) -> dict[str, Any]:
        """
        Generate A2UI content for the specified format.

        Args:
            format_type: Type of content (flashcards, audio, video, quiz)
            additional_context: Additional context from the user's request

        Returns:
            Dict containing A2UI JSON and metadata
        """
        logger.info(f"Generating {format_type} content")

        if format_type.lower() not in self.SUPPORTED_FORMATS:
            return {
                "error": f"Unsupported format: {format_type}",
                "supported_formats": self.SUPPORTED_FORMATS,
            }

        # Handle pre-generated media references
        if format_type.lower() in ["audio", "podcast"]:
            return self._get_audio_reference()
        elif format_type.lower() == "video":
            return self._get_video_reference()

        # Generate dynamic content with Gemini
        context = self._get_context()
        if additional_context:
            context = f"{context}\n\nUser Request: {additional_context}"

        system_prompt = get_system_prompt(format_type, context)

        try:
            response = self.client.models.generate_content(
                model=MODEL_ID,
                contents=f"Generate {format_type} for this learner.",
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    # Note: thinking_level requires a newer SDK or different API
                    # Using thinkingBudget instead for now
                    thinking_config=types.ThinkingConfig(thinkingBudget=1024),
                    response_mime_type="application/json",
                ),
            )

            # Parse and validate the response
            response_text = response.text.strip()

            # Try to parse as JSON
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
                logger.error(f"Response was: {response_text[:500]}")
                return {
                    "error": "Failed to generate valid A2UI JSON",
                    "raw_response": response_text[:1000],
                }

        except Exception as e:
            logger.error(f"Error generating content: {e}")
            return {"error": str(e)}

    def _get_audio_reference(self) -> dict[str, Any]:
        """Return A2UI JSON for the pre-generated podcast."""
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

    def _get_video_reference(self) -> dict[str, Any]:
        """Return A2UI JSON for the pre-generated video."""
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

    async def stream(
        self, request: str, session_id: str = "default"
    ) -> AsyncIterator[dict[str, Any]]:
        """
        Stream response for A2A compatibility.

        Args:
            request: The request string (e.g., "flashcards:bond energy")
            session_id: Session ID for context

        Yields:
            Progress updates and final A2UI response
        """
        # Parse the request
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


# Singleton instance
_agent_instance = None


def get_agent() -> LearningMaterialAgent:
    """Get or create the agent singleton."""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = LearningMaterialAgent()
    return _agent_instance


# Direct query function for testing
async def generate_learning_material(
    format_type: str, additional_context: str = ""
) -> dict[str, Any]:
    """
    Convenience function to generate learning materials.

    Args:
        format_type: Type of content (flashcards, audio, video, quiz)
        additional_context: Additional context from user

    Returns:
        A2UI response dict
    """
    agent = get_agent()
    return await agent.generate_content(format_type, additional_context)


if __name__ == "__main__":
    import asyncio

    async def test():
        print("Testing LearningMaterialAgent...")
        print("=" * 50)

        agent = LearningMaterialAgent()

        # Test flashcard generation
        print("\n1. Testing flashcard generation:")
        result = await agent.generate_content("flashcards", "focus on bond energy")
        print(json.dumps(result, indent=2)[:1000])

        # Test audio reference
        print("\n2. Testing audio reference:")
        result = await agent.generate_content("audio")
        print(json.dumps(result, indent=2)[:500])

        # Test video reference
        print("\n3. Testing video reference:")
        result = await agent.generate_content("video")
        print(json.dumps(result, indent=2)[:500])

    asyncio.run(test())
