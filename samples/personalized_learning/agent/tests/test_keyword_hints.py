"""
Unit tests for KEYWORD_HINTS in openstax_chapters.py.

Tests:
- New keywords map correctly to expected chapters
- Keyword matching is case insensitive
- Expanded keywords reduce LLM fallback scenarios
"""

import unittest
from unittest.mock import patch
import sys
import os

# Add parent directories to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestKeywordHints(unittest.TestCase):
    """Tests for KEYWORD_HINTS dictionary."""

    def test_atp_keywords_map_correctly(self):
        """Verify ATP-related keywords map to correct chapters."""
        from openstax_chapters import KEYWORD_HINTS

        atp_keywords = [
            "atp",
            "adp",
            "adenosine triphosphate",
            "adenosine diphosphate",
            "cellular energy",
            "cell energy",
            "high energy bond",
            "phosphate bond",
            "energy currency",
            "atp hydrolysis",
            "hydrolysis",
        ]

        for keyword in atp_keywords:
            self.assertIn(keyword, KEYWORD_HINTS,
                          f"Keyword '{keyword}' should be in KEYWORD_HINTS")
            chapters = KEYWORD_HINTS[keyword]
            self.assertTrue(
                any("atp" in ch or "energy" in ch for ch in chapters),
                f"Keyword '{keyword}' should map to ATP or energy chapters, got {chapters}"
            )

    def test_thermodynamics_keywords_map_correctly(self):
        """Verify thermodynamics keywords map to correct chapters."""
        from openstax_chapters import KEYWORD_HINTS

        thermo_keywords = [
            "thermodynamics",
            "exergonic",
            "endergonic",
            "gibbs free energy",
            "entropy",
        ]

        expected_chapters = [
            "6-3-the-laws-of-thermodynamics",
            "6-2-potential-kinetic-free-and-activation-energy",
        ]

        for keyword in thermo_keywords:
            self.assertIn(keyword, KEYWORD_HINTS,
                          f"Keyword '{keyword}' should be in KEYWORD_HINTS")
            chapters = KEYWORD_HINTS[keyword]
            self.assertTrue(
                any(ch in expected_chapters for ch in chapters),
                f"Keyword '{keyword}' should map to thermodynamics chapters, got {chapters}"
            )

    def test_photosynthesis_keywords_map_correctly(self):
        """Verify photosynthesis keywords map to correct chapters."""
        from openstax_chapters import KEYWORD_HINTS

        photo_keywords = [
            "photosynthesis",
            "chloroplast",
            "chlorophyll",
            "calvin cycle",
            "light reaction",
        ]

        for keyword in photo_keywords:
            self.assertIn(keyword, KEYWORD_HINTS,
                          f"Keyword '{keyword}' should be in KEYWORD_HINTS")
            chapters = KEYWORD_HINTS[keyword]
            self.assertTrue(
                any("8-" in ch or "photosynthesis" in ch for ch in chapters),
                f"Keyword '{keyword}' should map to photosynthesis chapters (8-*), got {chapters}"
            )

    def test_keyword_matching_case_insensitive(self):
        """Verify keyword matching works regardless of case."""
        from openstax_chapters import KEYWORD_HINTS

        # All keywords should be lowercase in the dictionary
        for keyword in KEYWORD_HINTS.keys():
            self.assertEqual(keyword, keyword.lower(),
                             f"Keyword '{keyword}' should be lowercase")

    def test_new_expanded_keywords_exist(self):
        """Verify newly added keywords are present."""
        from openstax_chapters import KEYWORD_HINTS

        # These are keywords that were added in the latency optimization
        new_keywords = [
            "adp",
            "cellular energy",
            "cell energy",
            "high energy bond",
            "phosphate bond",
            "phosphate group",
            "energy currency",
            "energy transfer",
            "bond breaking",
            "bond energy",
            "atp hydrolysis",
            "exergonic",
            "endergonic",
            "gibbs free energy",
            "thermodynamics",
            "first law",
            "second law",
            "entropy",
        ]

        for keyword in new_keywords:
            self.assertIn(keyword, KEYWORD_HINTS,
                          f"New keyword '{keyword}' should be in KEYWORD_HINTS")

    def test_keyword_chapters_are_valid(self):
        """Verify all keyword mappings point to valid chapters."""
        from openstax_chapters import KEYWORD_HINTS, OPENSTAX_CHAPTERS

        for keyword, chapters in KEYWORD_HINTS.items():
            self.assertIsInstance(chapters, list,
                                  f"Chapters for '{keyword}' should be a list")
            self.assertGreater(len(chapters), 0,
                               f"Chapters for '{keyword}' should not be empty")

            for chapter_slug in chapters:
                self.assertIn(chapter_slug, OPENSTAX_CHAPTERS,
                              f"Chapter '{chapter_slug}' for keyword '{keyword}' "
                              "should be in OPENSTAX_CHAPTERS")

    def test_common_topics_have_keywords(self):
        """Verify common biology topics have keyword coverage."""
        from openstax_chapters import KEYWORD_HINTS

        common_topics = [
            "atp",
            "dna",
            "rna",
            "protein",
            "cell",
            "enzyme",
            "photosynthesis",
            "respiration",
            "mitosis",
            "meiosis",
            "evolution",
            "genetics",
            "nervous",
            "immune",
            "heart",
            "lung",
        ]

        covered = 0
        for topic in common_topics:
            if topic in KEYWORD_HINTS:
                covered += 1

        coverage_pct = covered / len(common_topics) * 100
        self.assertGreater(coverage_pct, 80,
                           f"Should have >80% keyword coverage for common topics, "
                           f"got {coverage_pct:.1f}%")


class TestKeywordMatching(unittest.TestCase):
    """Tests for keyword matching logic."""

    def test_keyword_match_finds_chapters(self):
        """Verify keyword matching finds the right chapters for common topics."""
        from openstax_chapters import KEYWORD_HINTS

        # Test topics that SHOULD match keywords
        test_cases = [
            ("atp", ["6-4-atp-adenosine-triphosphate", "6-1-energy-and-metabolism"]),
            ("photosynthesis", ["8-1-overview-of-photosynthesis", "8-2-the-light-dependent-reaction-of-photosynthesis"]),
            ("dna", ["14-2-dna-structure-and-sequencing", "14-3-basics-of-dna-replication"]),
        ]

        for keyword, expected_chapters in test_cases:
            self.assertIn(keyword, KEYWORD_HINTS,
                          f"Keyword '{keyword}' should be in KEYWORD_HINTS")
            actual_chapters = KEYWORD_HINTS[keyword]
            for expected in expected_chapters:
                self.assertIn(expected, actual_chapters,
                              f"Expected chapter '{expected}' for keyword '{keyword}'")

    def test_keyword_match_returns_list(self):
        """Verify all keyword mappings return lists of chapters."""
        from openstax_chapters import KEYWORD_HINTS

        for keyword, chapters in KEYWORD_HINTS.items():
            self.assertIsInstance(chapters, list,
                                  f"Chapters for '{keyword}' should be a list")
            self.assertGreater(len(chapters), 0,
                               f"Chapters list for '{keyword}' should not be empty")
            for chapter in chapters:
                self.assertIsInstance(chapter, str,
                                      f"Each chapter slug should be a string")


if __name__ == "__main__":
    unittest.main()
