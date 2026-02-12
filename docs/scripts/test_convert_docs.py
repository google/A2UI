import pytest
from convert_docs import to_mkdocs, to_github

# --- 1. A2UI Specific Header Cases ---
ADMONITION_CASES = [
    ('!!! info "Coming soon..."', "Coming soon..."),
    ('!!! warning "Status: Early Stage Public Preview"', "Status: Early Stage Public Preview"),
    ('!!! success "Stable Release"', "Stable Release"),
    ('!!! note "Version Compatibility"', "Version Compatibility"),
    ('!!! warning "Attention"', "Attention"),
    ('!!! tip "It\'s Just JSON"', "It's Just JSON"),
]

@pytest.mark.parametrize("header, expected_title", ADMONITION_CASES)
def test_standard_a2ui_round_trip(header, expected_title):
    """Verifies that all standard A2UI headers survive a round-trip conversion."""
    body = "    Line 1\n    Line 2"
    original = f"{header}\n{body}\n"
    
    # MkDocs -> GitHub
    github = to_github(original)
    assert f"**{expected_title}**" in github
    
    # GitHub -> MkDocs
    back = to_mkdocs(github)
    assert back.strip() == original.strip()


# --- 2. Empty Title Edge Case ---
def test_empty_title_case():
    """
    Verifies !!! tip "" converts to '> 💡' exactly.
    - No trailing spaces
    - No bold markers (****)
    """
    original = '!!! tip ""\n    Content.\n'
    github = to_github(original)
    
    lines = github.splitlines()
    assert lines[0] == "> 💡"  # Strictly no space or bold markers
    assert lines[1] == ">"     # Spacer line
    
    back = to_mkdocs(github)
    assert back == original


# --- 3. Spacing & Internal Paragraph Preservation ---
def test_paragraph_spacing_and_trailing_lines():
    """
    Ensures:
    1. GitHub spacer (header vs content) is removed in MkDocs.
    2. Internal blank lines (paragraph breaks) are preserved.
    3. Trailing blockquote markers ('>') are cleaned up.
    """
    source_github = (
        "> ✅ **Stable Release**\n"
        ">\n"             # Spacer line
        "> Line 1\n"
        ">\n"             # Internal break
        "> Line 2\n"
        ">\n"             # Trailing line 1
        ">\n"             # Trailing line 2
    )
    
    result = to_mkdocs(source_github)
    
    expected = (
        '!!! success "Stable Release"\n'
        '    Line 1\n'
        '\n'
        '    Line 2\n'
    )
    assert result == expected


# --- 4. Unmapped/Unknown Type Fallback ---
def test_unknown_type_fallback():
    """
    Verifies that an unknown admonition type defaults to the 'note' emoji (📝).
    """
    original = '!!! mystery "Secret"\n    Content.\n'
    github = to_github(original)
    
    assert "> 📝 **Secret**" in github
    
    # Note: Round trip will convert it back to '!!! note' 
    # because the source type 'mystery' wasn't in the map.
    back = to_mkdocs(github)
    assert '!!! note "Secret"' in back


# --- 5. Multiple Blocks & Isolation ---
def test_multiple_blocks_in_one_file():
    """Ensures multiple blocks are processed without bleeding into each other."""
    original = (
        '!!! success "Block 1"\n'
        '    Content 1\n'
        '\n'
        '!!! info "Block 2"\n'
        '    Content 2\n'
    )
    github = to_github(original)
    assert "> ✅ **Block 1**" in github
    assert "> ℹ️ **Block 2**" in github
    
    back = to_mkdocs(github)
    assert back == original


# --- 6. False Positive Prevention ---
def test_regular_blockquote_ignored():
    """Ensures regular quotes are not touched."""
    source = "> This is just a quote, not an admonition."
    assert to_mkdocs(source) == source
    assert to_github(source) == source


# --- 7. GitHub Official Alert Syntax Support ---
def test_github_alert_to_mkdocs():
    """Verifies official [!TYPE] syntax conversion."""
    source = "> [!WARNING]\n> **Security Notice**\n> Do not share keys."
    expected = '!!! warning "Security Notice"\n    Do not share keys.\n'
    
    assert to_mkdocs(source) == expected
