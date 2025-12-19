"""
OpenStax Content Fetcher

Fetches and parses OpenStax Biology content from:
1. GCS bucket (preferred - pre-downloaded content)
2. GitHub raw files (fallback - fetches on demand)

The content is in CNXML format and needs to be parsed to extract plain text.
"""

import asyncio
import json
import logging
import os
import re
import xml.etree.ElementTree as ET
from typing import Optional

logger = logging.getLogger(__name__)

# GCS configuration
GCS_OPENSTAX_BUCKET = os.getenv("GCS_OPENSTAX_BUCKET", "")
GCS_OPENSTAX_PREFIX = os.getenv("GCS_OPENSTAX_PREFIX", "openstax_modules/")

# GitHub configuration
GITHUB_RAW_BASE = "https://raw.githubusercontent.com/openstax/osbooks-biology-bundle/main/modules"

# CNXML namespace
CNXML_NS = {"cnxml": "http://cnx.rice.edu/cnxml"}


def parse_cnxml_to_text(cnxml_content: str) -> str:
    """
    Parse CNXML content and extract plain text.

    CNXML is an XML format used by OpenStax. We extract:
    - Title
    - Paragraphs
    - List items
    - Notes and examples

    We skip:
    - Media/figures (just extract alt text if available)
    - Equations (complex MathML)
    - Metadata
    """
    try:
        # Parse the XML
        root = ET.fromstring(cnxml_content)

        # Extract title
        title_elem = root.find(".//cnxml:title", CNXML_NS)
        title = title_elem.text if title_elem is not None and title_elem.text else ""

        # Collect all text content
        text_parts = []
        if title:
            text_parts.append(f"# {title}\n")

        # Find all paragraph-like elements
        for elem in root.iter():
            # Skip namespace prefix for comparison
            tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag

            if tag == "para":
                para_text = _extract_text_from_element(elem)
                if para_text.strip():
                    text_parts.append(para_text.strip())

            elif tag == "section":
                # Get section title
                section_title = elem.find("cnxml:title", CNXML_NS)
                if section_title is not None and section_title.text:
                    text_parts.append(f"\n## {section_title.text}\n")

            elif tag == "note":
                note_type = elem.get("type", "note")
                note_text = _extract_text_from_element(elem)
                if note_text.strip():
                    text_parts.append(f"\n[{note_type.upper()}]: {note_text.strip()}\n")

            elif tag == "example":
                example_text = _extract_text_from_element(elem)
                if example_text.strip():
                    text_parts.append(f"\n[EXAMPLE]: {example_text.strip()}\n")

            elif tag == "item":
                item_text = _extract_text_from_element(elem)
                if item_text.strip():
                    text_parts.append(f"  • {item_text.strip()}")

            elif tag == "term":
                # Bold terms for emphasis
                if elem.text:
                    # Terms are handled inline, skip here
                    pass

            elif tag == "definition":
                def_text = _extract_text_from_element(elem)
                if def_text.strip():
                    text_parts.append(f"  Definition: {def_text.strip()}")

        # Join and clean up
        full_text = "\n".join(text_parts)

        # Clean up excessive whitespace
        full_text = re.sub(r'\n{3,}', '\n\n', full_text)
        full_text = re.sub(r' {2,}', ' ', full_text)

        return full_text.strip()

    except ET.ParseError as e:
        logger.error(f"Failed to parse CNXML: {e}")
        # Return raw content as fallback (stripped of XML tags)
        return re.sub(r'<[^>]+>', ' ', cnxml_content).strip()


def _extract_text_from_element(elem) -> str:
    """Extract all text from an element and its children."""
    texts = []

    # Get element's direct text
    if elem.text:
        texts.append(elem.text)

    # Get text from children
    for child in elem:
        child_text = _extract_text_from_element(child)
        if child_text:
            texts.append(child_text)
        # Get tail text (text after the child element)
        if child.tail:
            texts.append(child.tail)

    return " ".join(texts)


def fetch_module_from_gcs(module_id: str) -> Optional[str]:
    """
    Fetch a module's CNXML content from GCS.

    Returns None if not found or GCS is not configured.
    """
    if not GCS_OPENSTAX_BUCKET:
        return None

    try:
        from google.cloud import storage

        client = storage.Client()
        bucket = client.bucket(GCS_OPENSTAX_BUCKET)
        blob = bucket.blob(f"{GCS_OPENSTAX_PREFIX}{module_id}/index.cnxml")

        if blob.exists():
            content = blob.download_as_text()
            logger.info(f"Loaded module {module_id} from GCS")
            return content
        else:
            logger.debug(f"Module {module_id} not found in GCS")
            return None

    except Exception as e:
        logger.warning(f"Failed to fetch from GCS: {e}")
        return None


def fetch_module_from_github(module_id: str) -> Optional[str]:
    """
    Fetch a module's CNXML content directly from GitHub.

    This is the fallback when GCS is not available.
    """
    import urllib.request
    import urllib.error

    url = f"{GITHUB_RAW_BASE}/{module_id}/index.cnxml"

    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            content = response.read().decode('utf-8')
            logger.info(f"Fetched module {module_id} from GitHub")
            return content
    except urllib.error.HTTPError as e:
        logger.warning(f"HTTP error fetching {module_id}: {e.code}")
        return None
    except urllib.error.URLError as e:
        logger.warning(f"URL error fetching {module_id}: {e.reason}")
        return None
    except Exception as e:
        logger.warning(f"Error fetching {module_id}: {e}")
        return None


def fetch_module_content(module_id: str, parse: bool = True) -> Optional[str]:
    """
    Fetch a module's content, trying GCS first then GitHub.

    Args:
        module_id: The module ID (e.g., "m62767")
        parse: If True, parse CNXML to plain text. If False, return raw CNXML.

    Returns:
        Module content as text, or None if not found.
    """
    # Try GCS first
    content = fetch_module_from_gcs(module_id)

    # Fall back to GitHub
    if content is None:
        content = fetch_module_from_github(module_id)

    if content is None:
        return None

    # Parse if requested
    if parse:
        return parse_cnxml_to_text(content)

    return content


def fetch_chapter_content(chapter_slug: str) -> Optional[dict]:
    """
    Fetch all content for a chapter by fetching its modules.

    Args:
        chapter_slug: The chapter slug (e.g., "6-4-atp-adenosine-triphosphate")

    Returns:
        Dict with chapter info and combined content, or None if not found.
    """
    # Import here to avoid circular imports - use relative import for wheel packaging
    from .openstax_chapters import (
        OPENSTAX_CHAPTERS,
        CHAPTER_TO_MODULES,
        get_openstax_url_for_chapter,
    )

    if chapter_slug not in CHAPTER_TO_MODULES:
        logger.warning(f"Unknown chapter: {chapter_slug}")
        return None

    module_ids = CHAPTER_TO_MODULES[chapter_slug]
    title = OPENSTAX_CHAPTERS.get(chapter_slug, chapter_slug)

    # Fetch content from all modules
    content_parts = []
    for module_id in module_ids:
        module_content = fetch_module_content(module_id)
        if module_content:
            content_parts.append(module_content)

    if not content_parts:
        logger.warning(f"No content fetched for chapter: {chapter_slug}")
        return None

    return {
        "chapter_slug": chapter_slug,
        "title": title,
        "url": get_openstax_url_for_chapter(chapter_slug),
        "module_ids": module_ids,
        "content": "\n\n---\n\n".join(content_parts),
    }


def fetch_multiple_chapters(chapter_slugs: list[str]) -> list[dict]:
    """
    Fetch content for multiple chapters (synchronous version).

    Args:
        chapter_slugs: List of chapter slugs to fetch.

    Returns:
        List of chapter content dicts.
    """
    results = []
    for slug in chapter_slugs:
        chapter = fetch_chapter_content(slug)
        if chapter:
            results.append(chapter)
    return results


async def fetch_multiple_chapters_async(chapter_slugs: list[str]) -> list[dict]:
    """
    Fetch content for multiple chapters asynchronously.

    Uses asyncio.to_thread to run blocking I/O in a thread pool,
    preventing event loop blocking in async contexts.

    Args:
        chapter_slugs: List of chapter slugs to fetch.

    Returns:
        List of chapter content dicts.
    """
    # Run the blocking fetch in a thread pool to avoid blocking the event loop
    return await asyncio.to_thread(fetch_multiple_chapters, chapter_slugs)


async def fetch_content_for_topic(topic: str, max_chapters: int = 3) -> dict:
    """
    Use LLM to match a topic to relevant chapters, then fetch their content.

    This is the main entry point for getting OpenStax content based on a user query.

    Args:
        topic: The user's topic/question
        max_chapters: Maximum number of chapters to fetch

    Returns:
        Dict with matched chapters and their content.
    """
    from .openstax_chapters import OPENSTAX_CHAPTERS, KEYWORD_HINTS

    # First, try keyword matching for quick results
    topic_lower = topic.lower()
    matched_slugs = set()

    for keyword, slugs in KEYWORD_HINTS.items():
        if keyword in topic_lower:
            matched_slugs.update(slugs)

    # If we have matches, use them
    if matched_slugs:
        chapter_slugs = list(matched_slugs)[:max_chapters]
    else:
        # Fall back to LLM matching
        chapter_slugs = await _llm_match_topic_to_chapters(topic, max_chapters)

    # Fetch the content using async version to avoid blocking the event loop
    chapters = await fetch_multiple_chapters_async(chapter_slugs)

    return {
        "topic": topic,
        "matched_chapters": [
            {"slug": c["chapter_slug"], "title": c["title"], "url": c["url"]}
            for c in chapters
        ],
        "combined_content": "\n\n===\n\n".join([
            f"## {c['title']}\nSource: {c['url']}\n\n{c['content']}"
            for c in chapters
        ]),
        "sources": [
            {"provider": "OpenStax Biology for AP Courses", "title": c["title"], "url": c["url"]}
            for c in chapters
        ],
    }


async def _llm_match_topic_to_chapters(topic: str, max_chapters: int = 3) -> list[str]:
    """
    Use Gemini to match a topic to the most relevant chapter slugs.

    Returns list of chapter slugs.
    """
    from .openstax_chapters import get_chapter_list_for_llm

    try:
        from google import genai
        from google.genai import types

        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        model = os.getenv("GENAI_MODEL", "gemini-2.5-flash")

        client = genai.Client(
            vertexai=True,
            project=project,
            location=location,
        )

        chapter_list = get_chapter_list_for_llm()

        prompt = f"""Given this user topic/question about biology:

"{topic}"

Select the {max_chapters} most relevant chapters from this OpenStax Biology textbook that would help answer the question or teach about this topic.

Available chapters:
{chapter_list}

Return ONLY a JSON array of chapter slugs (the part before the colon), nothing else.
Example: ["6-4-atp-adenosine-triphosphate", "7-1-energy-in-living-systems"]
"""

        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        # Parse the response
        slugs = json.loads(response.text.strip())

        if isinstance(slugs, list):
            return slugs[:max_chapters]

    except Exception as e:
        logger.error(f"LLM chapter matching failed: {e}")

    # Fallback to a default chapter
    return ["1-1-the-science-of-biology"]
