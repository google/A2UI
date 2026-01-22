#!/usr/bin/env python3
"""
Unit tests for LLM-based topic matching.

These tests verify that the Gemini-based topic matching correctly identifies
relevant OpenStax chapters for various biology topics.
"""

import json
import os
import sys

# Ensure we can import from the current directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from google import genai
from google.genai import types


# Import the full chapter list from the agent module
from agent.openstax_chapters import OPENSTAX_CHAPTERS


def get_chapter_list_for_llm() -> str:
    """Return a formatted list of all chapters for LLM context."""
    lines = []
    for slug, title in OPENSTAX_CHAPTERS.items():
        lines.append(f"- {slug}: {title}")
    return "\n".join(lines)


def llm_match_topic_to_chapters(topic: str, max_chapters: int = 2) -> list:
    """
    Use Gemini to match a topic to the most relevant chapter slugs.

    This must work reliably for all biology topics in the textbook.
    Uses the same prompt as deploy.py.
    """
    project = os.environ.get("GOOGLE_CLOUD_PROJECT")
    if not project:
        raise ValueError("GOOGLE_CLOUD_PROJECT environment variable required")

    client = genai.Client(
        vertexai=True,
        project=project,
        location="us-central1",
    )

    chapter_list = get_chapter_list_for_llm()
    model_id = os.getenv("GENAI_MODEL", "gemini-2.5-flash")

    # Same prompt as deploy.py
    prompt = f"""You are a biology textbook expert. Match the user's topic to the MOST relevant chapters.

User's topic: "{topic}"

Available chapters from OpenStax Biology for AP Courses:
{chapter_list}

INSTRUCTIONS:
1. Return EXACTLY {max_chapters} chapter slugs that BEST match the topic
2. Order by relevance - put the MOST relevant chapter FIRST
3. For biology topics (even misspelled like "meitosis"), ALWAYS find matching chapters
4. Return empty [] ONLY for non-biology topics (physics, history, literature, etc.)
5. Match the topic DIRECTLY - "reproductive system" should match reproduction chapters (34-*), not meiosis

EXAMPLES:
- "reproductive system" → ["34-3-human-reproductive-anatomy-and-gametogenesis", "34-1-reproduction-methods"]
- "endocrine system" → ["28-5-endocrine-glands", "28-1-types-of-hormones"]
- "meiosis" → ["11-1-the-process-of-meiosis", "11-2-sexual-reproduction"]
- "ATP" → ["6-4-atp-adenosine-triphosphate", "6-1-energy-and-metabolism"]
- "quantum physics" → []

Return ONLY a JSON array with exactly {max_chapters} slugs (or [] for non-biology):"""

    response = client.models.generate_content(
        model=model_id,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )

    result = response.text.strip()
    print(f"  LLM response for '{topic}': {result}")

    slugs = json.loads(result)
    if isinstance(slugs, list):
        # Validate that returned slugs actually exist
        valid_slugs = [s for s in slugs if s in OPENSTAX_CHAPTERS]
        if len(valid_slugs) < len(slugs):
            print(f"  Warning: Some slugs not in chapter list: {set(slugs) - set(valid_slugs)}")
        return valid_slugs[:max_chapters]

    return []


def test_topic_matching():
    """Test that LLM matching works for various biology topics."""

    test_cases = [
        # (topic, expected_chapter_substring, should_match)
        ("reproductive system", "34-", True),
        ("endocrine system", "28-", True),
        ("meiosis", "11-1", True),
        ("meitosis", "11-1", True),  # Misspelled
        ("ATP", "6-4", True),
        ("cell energy", "6-", True),  # Alternate term - energy chapters
        ("photosynthesis", "8-", True),
        ("how plants make food", "8-", True),  # Natural language
        ("digestive system", "25-", True),
        ("nervous system", "26-", True),
        ("quantum physics", None, False),  # Non-biology
        ("Shakespeare", None, False),  # Non-biology
    ]

    passed = 0
    failed = 0

    print("\n" + "=" * 60)
    print("Testing LLM Topic Matching")
    print("=" * 60 + "\n")

    for topic, expected_substr, should_match in test_cases:
        print(f"Testing: '{topic}'")

        try:
            result = llm_match_topic_to_chapters(topic)

            if should_match:
                if not result:
                    print(f"  ❌ FAILED: Expected match but got empty result")
                    failed += 1
                elif expected_substr and not any(expected_substr in slug for slug in result):
                    print(f"  ❌ FAILED: Expected '{expected_substr}' in {result}")
                    failed += 1
                else:
                    print(f"  ✓ PASSED: Got {result}")
                    passed += 1
            else:
                if result:
                    print(f"  ❌ FAILED: Expected no match but got {result}")
                    failed += 1
                else:
                    print(f"  ✓ PASSED: Correctly returned empty")
                    passed += 1

        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            failed += 1

        print()

    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)

    return failed == 0


if __name__ == "__main__":
    success = test_topic_matching()
    sys.exit(0 if success else 1)
