#!/usr/bin/env python3
"""
Personalized Learning Agent - Self-Contained Agent for Agent Engine Deployment

This agent generates personalized A2UI learning materials (flashcards, audio, video)
using content from OpenStax and learner context data.

Required environment variables:
  GOOGLE_CLOUD_PROJECT - Your GCP project ID

Optional environment variables:
  GOOGLE_CLOUD_LOCATION - GCP region (default: us-central1)
  LITELLM_MODEL - Model to use (default: gemini-2.5-flash)
"""

import json
import logging
import os
import re
import urllib.request
import urllib.parse
from typing import Dict, List

from dotenv import load_dotenv
from google.adk.agents.llm_agent import LlmAgent
from google.adk.models.lite_llm import LiteLlm
from google.adk.tools.tool_context import ToolContext
from google.genai import types
from google import genai as genai_direct

load_dotenv()

logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

LITELLM_MODEL = os.getenv("LITELLM_MODEL", "gemini-2.5-flash")

# ============================================================================
# Context Data - Learner Profile and Curriculum
# ============================================================================

LEARNER_PROFILE = """
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

CURRICULUM_CONTEXT = """
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


# ============================================================================
# OpenStax Content Fetching with Intelligent Topic Matching
# ============================================================================

OPENSTAX_BIOLOGY_BASE = "https://openstax.org/books/biology-ap-courses/pages/"

# Complete OpenStax Biology AP Courses chapter index (167 chapters)
# Format: slug -> title
OPENSTAX_CHAPTERS = {
    "1-1-the-science-of-biology": "The Science of Biology",
    "2-1-atoms-isotopes-ions-and-molecules-the-building-blocks": "Atoms, Isotopes, Ions, and Molecules",
    "2-2-water": "Water", "2-3-carbon": "Carbon",
    "3-2-carbohydrates": "Carbohydrates", "3-3-lipids": "Lipids", "3-4-proteins": "Proteins", "3-5-nucleic-acids": "Nucleic Acids",
    "4-2-prokaryotic-cells": "Prokaryotic Cells", "4-3-eukaryotic-cells": "Eukaryotic Cells",
    "4-4-the-endomembrane-system-and-proteins": "The Endomembrane System", "4-5-cytoskeleton": "Cytoskeleton",
    "5-1-components-and-structure": "Cell Membrane Components and Structure",
    "5-2-passive-transport": "Passive Transport", "5-3-active-transport": "Active Transport",
    "6-1-energy-and-metabolism": "Energy and Metabolism",
    "6-2-potential-kinetic-free-and-activation-energy": "Potential, Kinetic, Free, and Activation Energy",
    "6-3-the-laws-of-thermodynamics": "The Laws of Thermodynamics",
    "6-4-atp-adenosine-triphosphate": "ATP: Adenosine Triphosphate", "6-5-enzymes": "Enzymes",
    "7-1-energy-in-living-systems": "Energy in Living Systems", "7-2-glycolysis": "Glycolysis",
    "7-3-oxidation-of-pyruvate-and-the-citric-acid-cycle": "Oxidation of Pyruvate and the Citric Acid Cycle",
    "7-4-oxidative-phosphorylation": "Oxidative Phosphorylation",
    "7-5-metabolism-without-oxygen": "Metabolism Without Oxygen",
    "7-7-regulation-of-cellular-respiration": "Regulation of Cellular Respiration",
    "8-1-overview-of-photosynthesis": "Overview of Photosynthesis",
    "8-2-the-light-dependent-reaction-of-photosynthesis": "The Light-Dependent Reactions",
    "8-3-using-light-to-make-organic-molecules": "Using Light to Make Organic Molecules",
    "9-1-signaling-molecules-and-cellular-receptors": "Signaling Molecules and Cellular Receptors",
    "10-1-cell-division": "Cell Division", "10-2-the-cell-cycle": "The Cell Cycle",
    "10-3-control-of-the-cell-cycle": "Control of the Cell Cycle",
    "10-4-cancer-and-the-cell-cycle": "Cancer and the Cell Cycle",
    "11-1-the-process-of-meiosis": "The Process of Meiosis", "11-2-sexual-reproduction": "Sexual Reproduction",
    "12-1-mendels-experiments-and-the-laws-of-probability": "Mendel's Experiments",
    "12-2-characteristics-and-traits": "Characteristics and Traits", "12-3-laws-of-inheritance": "Laws of Inheritance",
    "13-1-chromosomal-theory-and-genetic-linkages": "Chromosomal Theory and Genetic Linkages",
    "13-2-chromosomal-basis-of-inherited-disorders": "Chromosomal Basis of Inherited Disorders",
    "14-2-dna-structure-and-sequencing": "DNA Structure and Sequencing",
    "14-3-basics-of-dna-replication": "Basics of DNA Replication", "14-6-dna-repair": "DNA Repair",
    "15-1-the-genetic-code": "The Genetic Code",
    "15-2-prokaryotic-transcription": "Prokaryotic Transcription", "15-3-eukaryotic-transcription": "Eukaryotic Transcription",
    "15-4-rna-processing-in-eukaryotes": "RNA Processing in Eukaryotes",
    "15-5-ribosomes-and-protein-synthesis": "Ribosomes and Protein Synthesis",
    "16-1-regulation-of-gene-expression": "Regulation of Gene Expression",
    "16-7-cancer-and-gene-regulation": "Cancer and Gene Regulation",
    "17-1-biotechnology": "Biotechnology", "17-2-mapping-genomes": "Mapping Genomes",
    "17-3-whole-genome-sequencing": "Whole-Genome Sequencing",
    "18-1-understanding-evolution": "Understanding Evolution", "18-2-formation-of-new-species": "Formation of New Species",
    "19-1-population-evolution": "Population Evolution", "19-2-population-genetics": "Population Genetics",
    "19-3-adaptive-evolution": "Adaptive Evolution",
    "20-2-determining-evolutionary-relationships": "Determining Evolutionary Relationships",
    "21-1-viral-evolution-morphology-and-classification": "Viral Evolution and Classification",
    "21-2-virus-infection-and-hosts": "Virus Infection and Hosts",
    "22-1-prokaryotic-diversity": "Prokaryotic Diversity", "22-4-bacterial-diseases-in-humans": "Bacterial Diseases",
    "23-1-the-plant-body": "The Plant Body", "23-2-stems": "Stems", "23-3-roots": "Roots", "23-4-leaves": "Leaves",
    "23-5-transport-of-water-and-solutes-in-plants": "Transport of Water and Solutes in Plants",
    "24-1-animal-form-and-function": "Animal Form and Function", "24-3-homeostasis": "Homeostasis",
    "25-1-digestive-systems": "Digestive Systems", "25-3-digestive-system-processes": "Digestive System Processes",
    "26-1-neurons-and-glial-cells": "Neurons and Glial Cells", "26-2-how-neurons-communicate": "How Neurons Communicate",
    "26-3-the-central-nervous-system": "The Central Nervous System",
    "26-4-the-peripheral-nervous-system": "The Peripheral Nervous System",
    "27-1-sensory-processes": "Sensory Processes", "27-5-vision": "Vision",
    "27-4-hearing-and-vestibular-sensation": "Hearing and Vestibular Sensation",
    "28-1-types-of-hormones": "Types of Hormones", "28-2-how-hormones-work": "How Hormones Work",
    "28-5-endocrine-glands": "Endocrine Glands",
    "29-1-types-of-skeletal-systems": "Types of Skeletal Systems", "29-2-bone": "Bone",
    "29-4-muscle-contraction-and-locomotion": "Muscle Contraction and Locomotion",
    "30-1-systems-of-gas-exchange": "Systems of Gas Exchange", "30-3-breathing": "Breathing",
    "31-1-overview-of-the-circulatory-system": "Overview of the Circulatory System",
    "31-2-components-of-the-blood": "Components of the Blood",
    "31-3-mammalian-heart-and-blood-vessels": "Mammalian Heart and Blood Vessels",
    "32-1-osmoregulation-and-osmotic-balance": "Osmoregulation and Osmotic Balance",
    "32-2-the-kidneys-and-osmoregulatory-organs": "The Kidneys and Osmoregulatory Organs",
    "32-3-excretion-systems": "Excretion Systems",
    "33-1-innate-immune-response": "Innate Immune Response", "33-2-adaptive-immune-response": "Adaptive Immune Response",
    "33-3-antibodies": "Antibodies",
    "34-1-reproduction-methods": "Reproduction Methods",
    "34-3-human-reproductive-anatomy-and-gametogenesis": "Human Reproductive Anatomy",
    "34-5-fertilization-and-early-embryonic-development": "Fertilization and Early Embryonic Development",
    "34-7-human-pregnancy-and-birth": "Human Pregnancy and Birth",
    "35-1-the-scope-of-ecology": "The Scope of Ecology",
    "35-3-terrestrial-biomes": "Terrestrial Biomes", "35-4-aquatic-biomes": "Aquatic Biomes",
    "35-5-climate-and-the-effects-of-global-climate-change": "Climate and Global Climate Change",
    "36-1-population-demography": "Population Demography",
    "36-2-life-histories-and-natural-selection": "Life Histories and Natural Selection",
    "36-3-environmental-limits-to-population-growth": "Environmental Limits to Population Growth",
    "36-6-community-ecology": "Community Ecology",
    "37-1-ecology-for-ecosystems": "Ecology for Ecosystems",
    "37-2-energy-flow-through-ecosystems": "Energy Flow Through Ecosystems",
    "37-3-biogeochemical-cycles": "Biogeochemical Cycles",
    "38-1-the-biodiversity-crisis": "The Biodiversity Crisis", "38-4-preserving-biodiversity": "Preserving Biodiversity",
}

# Keyword hints for fast matching (avoids Gemini call for common topics)
KEYWORD_HINTS = {
    "atp": ["6-4-atp-adenosine-triphosphate"], "photosynthesis": ["8-1-overview-of-photosynthesis"],
    "krebs": ["7-3-oxidation-of-pyruvate-and-the-citric-acid-cycle"], "citric acid": ["7-3-oxidation-of-pyruvate-and-the-citric-acid-cycle"],
    "glycolysis": ["7-2-glycolysis"], "fermentation": ["7-5-metabolism-without-oxygen"],
    "mitosis": ["10-1-cell-division"], "meiosis": ["11-1-the-process-of-meiosis"],
    "cell cycle": ["10-2-the-cell-cycle"], "cancer": ["10-4-cancer-and-the-cell-cycle"],
    "dna": ["14-2-dna-structure-and-sequencing"], "rna": ["15-4-rna-processing-in-eukaryotes"],
    "transcription": ["15-2-prokaryotic-transcription"], "translation": ["15-5-ribosomes-and-protein-synthesis"],
    "protein synthesis": ["15-5-ribosomes-and-protein-synthesis"], "enzyme": ["6-5-enzymes"],
    "cell membrane": ["5-1-components-and-structure"], "membrane": ["5-1-components-and-structure"],
    "osmosis": ["5-2-passive-transport"], "diffusion": ["5-2-passive-transport"],
    "neuron": ["26-1-neurons-and-glial-cells"], "nervous system": ["26-1-neurons-and-glial-cells"],
    "brain": ["26-3-the-central-nervous-system"], "action potential": ["26-2-how-neurons-communicate"],
    "heart": ["31-1-overview-of-the-circulatory-system"], "blood": ["31-2-components-of-the-blood"],
    "circulatory": ["31-1-overview-of-the-circulatory-system"],
    "immune": ["33-1-innate-immune-response"], "antibod": ["33-3-antibodies"],
    "respiration": ["30-1-systems-of-gas-exchange"], "breathing": ["30-3-breathing"],
    "digestion": ["25-1-digestive-systems"], "hormone": ["28-1-types-of-hormones"],
    "muscle": ["29-4-muscle-contraction-and-locomotion"], "bone": ["29-2-bone"],
    "kidney": ["32-2-the-kidneys-and-osmoregulatory-organs"],
    "evolution": ["18-1-understanding-evolution"], "darwin": ["18-1-understanding-evolution"],
    "natural selection": ["19-3-adaptive-evolution"], "genetics": ["12-1-mendels-experiments-and-the-laws-of-probability"],
    "mendel": ["12-1-mendels-experiments-and-the-laws-of-probability"],
    "virus": ["21-1-viral-evolution-morphology-and-classification"], "bacteria": ["22-1-prokaryotic-diversity"],
    "plant": ["23-1-the-plant-body"], "ecology": ["35-1-the-scope-of-ecology"],
    "ecosystem": ["37-1-ecology-for-ecosystems"], "climate": ["35-5-climate-and-the-effects-of-global-climate-change"],
    "biodiversity": ["38-1-the-biodiversity-crisis"],
}

def get_chapter_list_for_llm() -> str:
    """Return formatted list of all chapters for LLM context."""
    return "\n".join([f"- {slug}: {title}" for slug, title in OPENSTAX_CHAPTERS.items()])


def match_topic_to_chapter(topic: str) -> str:
    """
    Use Gemini to intelligently match a user's topic query to the best OpenStax chapter.
    Returns the chapter slug or empty string if no match.
    """
    topic_lower = topic.lower().strip()

    # First, try quick keyword matching for common topics
    for keyword, slugs in KEYWORD_HINTS.items():
        if keyword in topic_lower:
            logger.info(f"Quick match: '{topic}' -> {slugs[0]} (keyword: {keyword})")
            return slugs[0]

    # Check for direct slug match or title match
    for slug, title in OPENSTAX_CHAPTERS.items():
        if topic_lower in slug.replace("-", " ") or topic_lower in title.lower():
            logger.info(f"Direct match: '{topic}' -> {slug}")
            return slug

    # Use Gemini for intelligent matching
    logger.info(f"Using Gemini to match topic: '{topic}'")

    chapter_list = get_chapter_list_for_llm()

    prompt = f"""You are a biology textbook expert. Match the user's topic to the BEST OpenStax Biology chapter.

User's topic: "{topic}"

Available chapters (slug: title):
{chapter_list}

Instructions:
1. Find the chapter that BEST covers this topic
2. Consider synonyms and related concepts (e.g., "nerves" -> neurons, "breathing" -> respiration)
3. Return ONLY the chapter slug (e.g., "26-1-neurons-and-glial-cells")
4. If no chapter is relevant, return "NONE"

Best matching chapter slug:"""

    try:
        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        client = genai_direct.Client(vertexai=True, project=project, location=location)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        result = response.text.strip()

        # Clean up response
        result = result.replace('"', '').replace("'", "").strip()

        # Validate it's a real chapter
        if result in OPENSTAX_CHAPTERS:
            logger.info(f"Gemini matched: '{topic}' -> {result}")
            return result
        elif result != "NONE":
            # Try partial match in case Gemini returned a close variant
            for slug in OPENSTAX_CHAPTERS:
                if result in slug or slug in result:
                    logger.info(f"Gemini partial match: '{topic}' -> {slug}")
                    return slug

        logger.info(f"No Gemini match found for: '{topic}'")
        return ""

    except Exception as e:
        logger.error(f"Gemini matching failed: {e}")
        return ""


def fetch_openstax_content(topic: str) -> Dict[str, str]:
    """Fetch content from OpenStax Biology textbook for a given topic.

    Returns:
        Dict with 'content', 'url', and 'title' keys (empty strings if no match)
    """
    # Use intelligent matching to find the best chapter
    chapter_slug = match_topic_to_chapter(topic)

    if not chapter_slug:
        logger.info(f"No chapter match for topic '{topic}'")
        return {"content": "", "url": "", "title": ""}

    url = OPENSTAX_BIOLOGY_BASE + chapter_slug
    title = OPENSTAX_CHAPTERS.get(chapter_slug, "OpenStax Biology")
    logger.info(f"Fetching OpenStax content from: {url}")

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            html = response.read().decode("utf-8")

        # Extract text content (simple extraction - remove HTML tags)
        # Remove script and style elements
        html = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL)
        html = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.DOTALL)
        # Remove HTML tags
        text = re.sub(r"<[^>]+>", " ", html)
        # Clean up whitespace
        text = re.sub(r"\s+", " ", text).strip()
        # Limit to first ~8000 chars for context window
        return {"content": text[:8000], "url": url, "title": title}
    except Exception as e:
        logger.error(f"Failed to fetch OpenStax content: {e}")
        return {"content": "", "url": url, "title": title}


def generate_flashcards_from_content(topic: str, content: str, count: int = 5) -> List[Dict[str, str]]:
    """Use Gemini to generate flashcards from textbook content."""
    if not content:
        return []

    prompt = f"""Based on this educational content about {topic}, create {count} study flashcards.
Each flashcard should have a question (front) and answer (back).
Focus on key concepts, definitions, and important relationships.
Make the answers concise but complete.

Content:
{content}

Return ONLY a JSON array with this exact format (no markdown, no explanation):
[
  {{"front": "Question 1?", "back": "Answer 1"}},
  {{"front": "Question 2?", "back": "Answer 2"}}
]"""

    try:
        # Use google-genai SDK (newer API)
        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        client = genai_direct.Client(vertexai=True, project=project, location=location)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        text = response.text.strip()

        # Clean up markdown if present
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

        cards = json.loads(text)
        return cards[:count] if isinstance(cards, list) else []
    except Exception as e:
        logger.error(f"Failed to generate flashcards with Gemini: {e}")
        return []


# ============================================================================
# Tool Functions
# ============================================================================

def generate_flashcards(topic: str = "ATP", count: int = 5, tool_context: ToolContext = None) -> str:
    """
    Generate A2UI flashcards for the specified topic.
    For ATP, uses pre-built content. For other topics, fetches from OpenStax and generates dynamically.

    Args:
        topic: The topic to generate flashcards for (default: ATP)
        count: Number of flashcards to generate (default: 5)
        tool_context: ADK tool context (optional)

    Returns:
        JSON string with A2UI content and source attribution
    """
    topic_lower = topic.lower()

    # Track source info for attribution
    source_url = ""
    source_title = ""

    # Check if this is an ATP-related topic (use pre-built content)
    if "atp" in topic_lower or "bond energy" in topic_lower or "energy currency" in topic_lower:
        source_url = "https://openstax.org/books/biology-ap-courses/pages/6-4-atp-adenosine-triphosphate"
        source_title = "ATP: Adenosine Triphosphate"
        flashcards_data = [
            {
                "front": "What is ATP and why is it called the 'energy currency' of cells?",
                "back": "ATP (Adenosine Triphosphate) is a molecule that stores and transfers energy in cells. It's called 'energy currency' because cells 'spend' ATP to power cellular work, just like you spend money for goods and services."
            },
            {
                "front": "Why is 'energy stored in bonds' a misconception about ATP?",
                "back": "Breaking bonds actually REQUIRES energy, not releases it. ATP releases energy because the products (ADP + Pi) are more stable than ATP. Think of it like a compressed spring - ATP is 'tense' due to repelling phosphate groups."
            },
            {
                "front": "What happens during ATP hydrolysis?",
                "back": "ATP + H₂O → ADP + Pi + Energy (ΔG = -30.5 kJ/mol). Water breaks the terminal phosphate bond. Energy is released because ADP + Pi have less electrostatic repulsion and are more stable."
            },
            {
                "front": "How is ATP like a rechargeable battery?",
                "back": "Like a battery, ATP can be 'recharged': ADP + Pi + Energy → ATP. This happens during cellular respiration. The cell constantly cycles between ATP (charged) and ADP (discharged)."
            },
            {
                "front": "Why do the phosphate groups in ATP repel each other?",
                "back": "Each phosphate group has negative charges. Like charges repel, creating 'electrostatic stress' in ATP. When the terminal phosphate is removed, this stress is relieved, making ADP more stable."
            },
        ]
    else:
        # For other topics, try to fetch from OpenStax and generate dynamically
        logger.info(f"Generating flashcards for non-ATP topic: {topic}")
        openstax_result = fetch_openstax_content(topic)

        if openstax_result["content"]:
            logger.info(f"Fetched {len(openstax_result['content'])} chars from OpenStax")
            source_url = openstax_result["url"]
            source_title = openstax_result["title"]
            flashcards_data = generate_flashcards_from_content(topic, openstax_result["content"], count)
        else:
            # Fallback: generate flashcards using Gemini without OpenStax content
            logger.info(f"No OpenStax content found, generating from general knowledge")
            flashcards_data = generate_flashcards_from_content(
                topic,
                f"Generate educational flashcards about {topic} for an AP Biology / MCAT student.",
                count
            )

        if not flashcards_data:
            # Ultimate fallback
            flashcards_data = [
                {"front": f"What is {topic}?", "back": f"This topic requires further study. Check your textbook for details on {topic}."}
            ]

    # Build A2UI components
    actual_count = min(count, len(flashcards_data))
    components = [
        {"id": "flashcardsRow", "component": {"Row": {
            "children": {"explicitList": [f"flashcard{i}" for i in range(actual_count)]},
            "distribution": "center",
            "alignment": "start",
            "wrap": True
        }}}
    ]

    for i, card in enumerate(flashcards_data[:actual_count]):
        components.append({
            "id": f"flashcard{i}",
            "component": {"Flashcard": {
                "front": {"literalString": card.get("front", "Question")},
                "back": {"literalString": card.get("back", "Answer")}
            }}
        })

    a2ui = [
        {"beginRendering": {"surfaceId": "learningContent", "root": "flashcardsRow"}},
        {"surfaceUpdate": {"surfaceId": "learningContent", "components": components}}
    ]

    # Return with source metadata for attribution
    result = {
        "a2ui": a2ui,
        "source": {
            "url": source_url,
            "title": source_title,
            "provider": "OpenStax Biology for AP Courses"
        } if source_url else None
    }

    return json.dumps(result)


def get_audio_content(tool_context: ToolContext = None) -> str:
    """
    Get the personalized podcast/audio content.

    Args:
        tool_context: ADK tool context (optional)

    Returns:
        A2UI JSON string for rendering the audio player
    """
    a2ui = [
        {"beginRendering": {"surfaceId": "learningContent", "root": "audioCard"}},
        {"surfaceUpdate": {"surfaceId": "learningContent", "components": [
            {"id": "audioCard", "component": {"Card": {"child": "audioContent"}}},
            {"id": "audioContent", "component": {"Column": {
                "children": {"explicitList": ["audioHeader", "audioPlayer", "audioDescription"]},
                "distribution": "start",
                "alignment": "stretch"
            }}},
            {"id": "audioHeader", "component": {"Row": {
                "children": {"explicitList": ["audioIcon", "audioTitle"]},
                "distribution": "start",
                "alignment": "center"
            }}},
            {"id": "audioIcon", "component": {"Icon": {"name": {"literalString": "podcasts"}}}},
            {"id": "audioTitle", "component": {"Text": {
                "text": {"literalString": "ATP & Chemical Stability: Correcting the Misconception"},
                "usageHint": "h3"
            }}},
            {"id": "audioPlayer", "component": {"AudioPlayer": {
                "url": {"literalString": "/assets/podcast.m4a"},
                "audioTitle": {"literalString": "Understanding ATP Energy Release"},
                "audioDescription": {"literalString": "A personalized podcast about ATP and chemical stability"}
            }}},
            {"id": "audioDescription", "component": {"Text": {
                "text": {"literalString": "This personalized podcast explains why 'energy stored in bonds' is a common misconception. Using gym analogies, it walks through how ATP hydrolysis actually releases energy through stability differences."},
                "usageHint": "body"
            }}}
        ]}}
    ]
    return json.dumps(a2ui)


def get_video_content(tool_context: ToolContext = None) -> str:
    """
    Get the educational video content.

    Args:
        tool_context: ADK tool context (optional)

    Returns:
        A2UI JSON string for rendering the video player
    """
    a2ui = [
        {"beginRendering": {"surfaceId": "learningContent", "root": "videoCard"}},
        {"surfaceUpdate": {"surfaceId": "learningContent", "components": [
            {"id": "videoCard", "component": {"Card": {"child": "videoContent"}}},
            {"id": "videoContent", "component": {"Column": {
                "children": {"explicitList": ["videoTitle", "videoPlayer", "videoDescription"]},
                "distribution": "start",
                "alignment": "stretch"
            }}},
            {"id": "videoTitle", "component": {"Text": {
                "text": {"literalString": "Visual Guide: ATP Energy & Stability"},
                "usageHint": "h3"
            }}},
            {"id": "videoPlayer", "component": {"Video": {
                "url": {"literalString": "/assets/demo.mp4"}
            }}},
            {"id": "videoDescription", "component": {"Text": {
                "text": {"literalString": "This animated explainer uses the compressed spring analogy to show why ATP releases energy. See how electrostatic repulsion in ATP makes it 'want' to become the more stable ADP + Pi."},
                "usageHint": "body"
            }}}
        ]}}
    ]
    return json.dumps(a2ui)


def get_learner_context(tool_context: ToolContext = None) -> str:
    """
    Get information about the current learner's profile.

    Args:
        tool_context: ADK tool context (optional)

    Returns:
        JSON string with learner profile information
    """
    return json.dumps({
        "name": "Maria Santos",
        "level": "Pre-med sophomore",
        "current_topic": "ATP and Cellular Energy",
        "learning_style": "Visual-kinesthetic, prefers gym/fitness analogies",
        "known_misconceptions": ["Energy stored in bonds"],
        "progress": {
            "completed": ["Cell structure", "Basic chemistry"],
            "in_progress": ["Cellular energetics"],
            "struggling_with": ["Thermodynamics", "Gibbs free energy"]
        }
    }, indent=2)


# ============================================================================
# Agent Instruction
# ============================================================================

AGENT_INSTRUCTION = f"""You are a personalized learning material generator that creates A2UI JSON content for educational materials.

## Learner Context
{LEARNER_PROFILE}

## Curriculum Context
{CURRICULUM_CONTEXT}

## Your Task
When asked to generate learning materials, use the appropriate tool and return the A2UI JSON directly.
Your response MUST be ONLY the A2UI JSON returned by the tools - no explanatory text, no markdown formatting.

## Available Content Types
1. **Flashcards** - Call `generate_flashcards` tool for spaced repetition cards
2. **Audio/Podcast** - Call `get_audio_content` tool for the personalized podcast
3. **Video** - Call `get_video_content` tool for the educational video

## Response Format
CRITICAL: Your response should be ONLY the raw A2UI JSON array returned by the tools.
Do NOT wrap it in markdown code blocks.
Do NOT add any explanatory text before or after.
The JSON will be rendered as interactive UI components.

## Example
User: "Generate flashcards"
You: [call generate_flashcards tool and return its output directly]

## Personalization Notes
- Use Maria's preferred gym/fitness analogies when possible
- Address her misconception about "energy stored in bonds"
- Keep content MCAT-focused
- Make flashcard answers concise but complete
"""


# ============================================================================
# Agent Builder Function
# ============================================================================

def build_root_agent() -> LlmAgent:
    """
    Build the root LLM agent for Agent Engine deployment.

    Returns:
        LlmAgent configured for personalized learning material generation.
    """
    return LlmAgent(
        model=LiteLlm(model=LITELLM_MODEL),
        name="personalized_learning_agent",
        description="An agent that generates personalized A2UI learning materials including flashcards, audio, and video content.",
        instruction=AGENT_INSTRUCTION,
        tools=[generate_flashcards, get_audio_content, get_video_content, get_learner_context],
    )


# Export the root agent for Agent Engine deployment
root_agent = build_root_agent()


# ============================================================================
# CLI for deployment
# ============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Deploy the Personalized Learning Agent to Agent Engine")
    parser.add_argument("--project", type=str, default=os.getenv("GOOGLE_CLOUD_PROJECT"))
    parser.add_argument("--location", type=str, default="us-central1")
    parser.add_argument("--list", action="store_true", help="List deployed agents")

    args = parser.parse_args()

    if not args.project:
        print("ERROR: --project flag or GOOGLE_CLOUD_PROJECT environment variable is required")
        exit(1)

    import vertexai
    from vertexai import agent_engines

    staging_bucket = f"gs://{args.project}_cloudbuild"
    vertexai.init(project=args.project, location=args.location, staging_bucket=staging_bucket)

    if args.list:
        print(f"\nDeployed agents in {args.project} ({args.location}):")
        for engine in agent_engines.list():
            print(f"  - {engine.display_name}: {engine.resource_name}")
    else:
        print(f"Deploying Personalized Learning Agent...")
        print(f"  Project: {args.project}")
        print(f"  Location: {args.location}")

        # Wrap in AdkApp for proper method exposure
        deployed_agent_app = agent_engines.AdkApp(
            agent=root_agent,
            enable_tracing=True,
        )

        # Deploy using agent_engines.create()
        deployed = agent_engines.create(
            deployed_agent_app,
            display_name="Personalized Learning Agent",
            requirements=[
                "google-adk>=1.15.1",
                "google-genai",
                "cloudpickle==3.1.1",
                "python-dotenv",
                "litellm",
            ],
        )

        print(f"\nDEPLOYMENT SUCCESSFUL!")
        print(f"Resource Name: {deployed.resource_name}")
        resource_id = deployed.resource_name.split("/")[-1]
        print(f"Resource ID: {resource_id}")
