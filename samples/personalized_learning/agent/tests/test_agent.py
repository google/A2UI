"""
Unit and Integration Tests for Personalized Learning Agent

Tests the context loader, A2UI templates, and agent functionality.
"""

import json
import os
import sys
import asyncio
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from context_loader import (
    load_context_file,
    load_all_context,
    get_learner_profile,
    get_misconception_context,
    get_combined_context,
)
from a2ui_templates import (
    get_system_prompt,
    FLASHCARD_EXAMPLE,
    AUDIO_EXAMPLE,
    VIDEO_EXAMPLE,
    SURFACE_ID,
)

# =============================================================================
# Test Results Tracking
# =============================================================================

passed = 0
failed = 0


def test(name):
    """Decorator for test functions."""
    def decorator(fn):
        global passed, failed
        try:
            result = fn()
            if asyncio.iscoroutine(result):
                asyncio.run(result)
            print(f"✓ {name}")
            passed += 1
        except AssertionError as e:
            print(f"✗ {name}")
            print(f"  Error: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ {name}")
            print(f"  Exception: {type(e).__name__}: {e}")
            failed += 1
        return fn
    return decorator


# =============================================================================
# Context Loader Tests
# =============================================================================

print("=" * 60)
print("Personalized Learning Agent - Python Tests")
print("=" * 60)
print("\n--- Context Loader Tests ---\n")


@test("load_context_file loads maria profile")
def test_load_maria_profile():
    content = load_context_file("01_maria_learner_profile.txt")
    assert content is not None, "Content should not be None"
    assert "Maria" in content, "Content should contain 'Maria'"
    assert "MCAT" in content, "Content should contain 'MCAT'"


@test("load_context_file loads misconception resolution")
def test_load_misconception():
    content = load_context_file("05_misconception_resolution.txt")
    assert content is not None, "Content should not be None"
    assert "ATP" in content, "Content should contain 'ATP'"
    assert "bond" in content.lower(), "Content should mention bonds"


@test("load_context_file returns None for missing file")
def test_load_missing_file():
    content = load_context_file("nonexistent_file.txt")
    assert content is None, "Should return None for missing file"


@test("load_all_context loads multiple files")
def test_load_all_context():
    context = load_all_context()
    assert isinstance(context, dict), "Should return a dict"
    assert len(context) >= 1, "Should load at least one file"
    # Check that keys are filenames
    for key in context.keys():
        assert key.endswith(".txt"), f"Key {key} should be a .txt filename"


@test("get_learner_profile returns Maria's profile")
def test_get_learner_profile():
    profile = get_learner_profile()
    assert profile is not None, "Profile should not be None"
    assert "Maria" in profile, "Profile should contain Maria"
    assert "Cymbal" in profile, "Profile should mention Cymbal University"


@test("get_misconception_context returns resolution content")
def test_get_misconception_context():
    content = get_misconception_context()
    assert content is not None, "Content should not be None"
    assert "misconception" in content.lower(), "Should discuss misconception"


@test("get_combined_context combines all files")
def test_get_combined_context():
    combined = get_combined_context()
    assert isinstance(combined, str), "Should return a string"
    assert len(combined) > 1000, "Combined context should be substantial"
    # Should contain section markers
    assert "===" in combined, "Should contain section markers"


# =============================================================================
# A2UI Templates Tests
# =============================================================================

print("\n--- A2UI Templates Tests ---\n")


@test("SURFACE_ID is set correctly")
def test_surface_id():
    assert SURFACE_ID == "learningContent", f"SURFACE_ID should be 'learningContent', got {SURFACE_ID}"


@test("FLASHCARD_EXAMPLE contains valid A2UI structure")
def test_flashcard_example():
    assert "beginRendering" in FLASHCARD_EXAMPLE
    assert "surfaceUpdate" in FLASHCARD_EXAMPLE
    assert "Flashcard" in FLASHCARD_EXAMPLE
    assert SURFACE_ID in FLASHCARD_EXAMPLE


@test("AUDIO_EXAMPLE contains valid A2UI structure")
def test_audio_example():
    assert "beginRendering" in AUDIO_EXAMPLE
    assert "surfaceUpdate" in AUDIO_EXAMPLE
    assert "Audio" in AUDIO_EXAMPLE
    assert "/assets/podcast.m4a" in AUDIO_EXAMPLE


@test("VIDEO_EXAMPLE contains valid A2UI structure")
def test_video_example():
    assert "beginRendering" in VIDEO_EXAMPLE
    assert "surfaceUpdate" in VIDEO_EXAMPLE
    assert "Video" in VIDEO_EXAMPLE
    assert "/assets/demo.mp4" in VIDEO_EXAMPLE


@test("get_system_prompt generates flashcards prompt")
def test_system_prompt_flashcards():
    context = "Test context for Maria"
    prompt = get_system_prompt("flashcards", context)
    assert "flashcards" in prompt.lower()
    assert context in prompt
    assert SURFACE_ID in prompt
    assert "Flashcard" in prompt


@test("get_system_prompt generates audio prompt")
def test_system_prompt_audio():
    context = "Test context"
    prompt = get_system_prompt("audio", context)
    assert "audio" in prompt.lower() or "Audio" in prompt
    assert context in prompt


@test("get_system_prompt includes learner context")
def test_system_prompt_includes_context():
    context = "Maria is a pre-med student with ATP misconception"
    prompt = get_system_prompt("flashcards", context)
    assert "Maria" in prompt
    assert "ATP" in prompt


# =============================================================================
# Agent Tests
# =============================================================================

print("\n--- Agent Tests ---\n")

# Import agent after context tests to ensure dependencies work
try:
    from agent import LearningMaterialAgent, get_agent
    AGENT_AVAILABLE = True
except ImportError as e:
    print(f"  (Skipping agent tests: {e})")
    AGENT_AVAILABLE = False


if AGENT_AVAILABLE:
    # Create a test agent without initializing the Gemini client
    # This allows testing static methods without credentials
    _test_agent = LearningMaterialAgent(init_client=False)

    @test("LearningMaterialAgent has correct supported formats")
    def test_agent_formats():
        assert "flashcards" in LearningMaterialAgent.SUPPORTED_FORMATS
        assert "audio" in LearningMaterialAgent.SUPPORTED_FORMATS
        assert "podcast" in LearningMaterialAgent.SUPPORTED_FORMATS
        assert "video" in LearningMaterialAgent.SUPPORTED_FORMATS
        assert "quiz" in LearningMaterialAgent.SUPPORTED_FORMATS


    @test("agent._get_audio_reference returns valid A2UI")
    def test_audio_reference():
        result = _test_agent._get_audio_reference()
        assert result["format"] == "audio"
        assert result["surfaceId"] == SURFACE_ID
        assert isinstance(result["a2ui"], list)
        assert len(result["a2ui"]) == 2
        assert "beginRendering" in result["a2ui"][0]
        assert "surfaceUpdate" in result["a2ui"][1]


    @test("agent._get_video_reference returns valid A2UI")
    def test_video_reference():
        result = _test_agent._get_video_reference()
        assert result["format"] == "video"
        assert result["surfaceId"] == SURFACE_ID
        assert isinstance(result["a2ui"], list)
        assert len(result["a2ui"]) == 2


    @test("audio A2UI has all required components")
    def test_audio_components():
        result = _test_agent._get_audio_reference()
        components = result["a2ui"][1]["surfaceUpdate"]["components"]
        component_ids = {c["id"] for c in components}

        # Check all required components exist
        required = {"audioCard", "audioContent", "audioHeader", "audioIcon",
                   "audioTitle", "audioPlayer", "audioDescription"}
        missing = required - component_ids
        assert not missing, f"Missing components: {missing}"


    @test("video A2UI has all required components")
    def test_video_components():
        result = _test_agent._get_video_reference()
        components = result["a2ui"][1]["surfaceUpdate"]["components"]
        component_ids = {c["id"] for c in components}

        required = {"videoCard", "videoContent", "videoTitle", "videoPlayer", "videoDescription"}
        missing = required - component_ids
        assert not missing, f"Missing components: {missing}"


# =============================================================================
# A2UI JSON Validation Tests
# =============================================================================

print("\n--- A2UI JSON Validation Tests ---\n")


def validate_a2ui_message(message):
    """Validate a single A2UI message structure."""
    valid_keys = {"beginRendering", "surfaceUpdate", "dataModelUpdate", "deleteSurface"}
    message_keys = set(message.keys())
    action_keys = message_keys & valid_keys

    if len(action_keys) != 1:
        return False, f"Expected exactly one action key, got {len(action_keys)}"

    action = list(action_keys)[0]

    if action == "beginRendering":
        br = message["beginRendering"]
        if "surfaceId" not in br or "root" not in br:
            return False, "beginRendering missing surfaceId or root"

    elif action == "surfaceUpdate":
        su = message["surfaceUpdate"]
        if "surfaceId" not in su:
            return False, "surfaceUpdate missing surfaceId"
        if "components" not in su or not isinstance(su["components"], list):
            return False, "surfaceUpdate missing components array"
        for comp in su["components"]:
            if "id" not in comp or "component" not in comp:
                return False, f"Component missing id or component: {comp}"

    return True, "OK"


def validate_a2ui_payload(messages):
    """Validate a complete A2UI payload."""
    if not isinstance(messages, list):
        return False, "Payload must be a list"
    if len(messages) == 0:
        return False, "Payload cannot be empty"
    if "beginRendering" not in messages[0]:
        return False, "First message must be beginRendering"

    for i, msg in enumerate(messages):
        valid, error = validate_a2ui_message(msg)
        if not valid:
            return False, f"Message {i}: {error}"

    # Validate component references
    all_ids = set()
    references = []

    for msg in messages:
        if "surfaceUpdate" in msg:
            for comp in msg["surfaceUpdate"]["components"]:
                all_ids.add(comp["id"])
                comp_def = comp["component"]
                comp_type = list(comp_def.keys())[0]
                props = comp_def[comp_type]

                if isinstance(props, dict):
                    if "child" in props and isinstance(props["child"], str):
                        references.append((comp["id"], props["child"]))
                    if "children" in props and isinstance(props["children"], dict):
                        if "explicitList" in props["children"]:
                            for child_id in props["children"]["explicitList"]:
                                references.append((comp["id"], child_id))

    for parent_id, child_id in references:
        if child_id not in all_ids:
            return False, f"Component {parent_id} references non-existent child: {child_id}"

    return True, "OK"


if AGENT_AVAILABLE:
    @test("audio reference passes A2UI validation")
    def test_validate_audio():
        result = _test_agent._get_audio_reference()
        valid, error = validate_a2ui_payload(result["a2ui"])
        assert valid, f"Audio A2UI validation failed: {error}"


    @test("video reference passes A2UI validation")
    def test_validate_video():
        result = _test_agent._get_video_reference()
        valid, error = validate_a2ui_payload(result["a2ui"])
        assert valid, f"Video A2UI validation failed: {error}"


# =============================================================================
# Summary
# =============================================================================

print("\n" + "=" * 60)
print(f"Python Tests Complete: {passed} passed, {failed} failed")
print("=" * 60)

if failed > 0:
    sys.exit(1)
