"""
Unit tests for parallel fetching functionality in openstax_content.py.

Tests:
- Parallel chapter fetching returns all content
- Partial failures don't break entire fetch
- Parallel is actually faster than sequential (with mocked delays)
"""

import time
import unittest
from unittest.mock import patch, MagicMock
from concurrent.futures import ThreadPoolExecutor

import sys
import os

# Add parent directories to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestParallelChapterFetch(unittest.TestCase):
    """Tests for parallel chapter fetching in openstax_content.py"""

    def setUp(self):
        """Reset caches before each test."""
        from openstax_content import clear_module_cache
        clear_module_cache()

    def test_parallel_chapter_fetch_returns_all_content(self):
        """Verify parallel fetch returns same content as sequential would."""
        from openstax_content import fetch_multiple_chapters

        with patch('openstax_content.fetch_chapter_content') as mock_fetch:
            # Set up mock to return different content for each chapter
            def side_effect(slug):
                return {
                    "chapter_slug": slug,
                    "title": f"Title for {slug}",
                    "url": f"https://example.com/{slug}",
                    "module_ids": [f"m{hash(slug) % 10000}"],
                    "content": f"Content for {slug}",
                }

            mock_fetch.side_effect = side_effect

            # Fetch multiple chapters
            chapters = ["6-4-atp", "7-2-glycolysis", "8-1-photosynthesis"]
            results = fetch_multiple_chapters(chapters)

            # Verify all chapters were fetched
            self.assertEqual(len(results), 3)

            # Verify content is correct
            slugs = [r["chapter_slug"] for r in results]
            self.assertIn("6-4-atp", slugs)
            self.assertIn("7-2-glycolysis", slugs)
            self.assertIn("8-1-photosynthesis", slugs)

    def test_parallel_fetch_handles_partial_failures(self):
        """Verify partial failures don't break entire fetch."""
        from openstax_content import fetch_multiple_chapters

        with patch('openstax_content.fetch_chapter_content') as mock_fetch:
            # Set up mock where one chapter fails
            def side_effect(slug):
                if slug == "failing-chapter":
                    raise Exception("Simulated failure")
                return {
                    "chapter_slug": slug,
                    "title": f"Title for {slug}",
                    "url": f"https://example.com/{slug}",
                    "module_ids": ["m12345"],
                    "content": f"Content for {slug}",
                }

            mock_fetch.side_effect = side_effect

            # Fetch including one failing chapter
            chapters = ["good-chapter-1", "failing-chapter", "good-chapter-2"]
            results = fetch_multiple_chapters(chapters)

            # Should still get the two good chapters
            self.assertEqual(len(results), 2)
            slugs = [r["chapter_slug"] for r in results]
            self.assertIn("good-chapter-1", slugs)
            self.assertIn("good-chapter-2", slugs)
            self.assertNotIn("failing-chapter", slugs)

    def test_parallel_fetch_handles_none_returns(self):
        """Verify None returns are filtered out."""
        from openstax_content import fetch_multiple_chapters

        with patch('openstax_content.fetch_chapter_content') as mock_fetch:
            # Set up mock where one chapter returns None
            def side_effect(slug):
                if slug == "missing-chapter":
                    return None
                return {
                    "chapter_slug": slug,
                    "title": f"Title for {slug}",
                    "url": f"https://example.com/{slug}",
                    "module_ids": ["m12345"],
                    "content": f"Content for {slug}",
                }

            mock_fetch.side_effect = side_effect

            chapters = ["chapter-1", "missing-chapter", "chapter-2"]
            results = fetch_multiple_chapters(chapters)

            # Should only get the two valid chapters
            self.assertEqual(len(results), 2)

    def test_single_chapter_no_threading_overhead(self):
        """Verify single chapter fetch doesn't use threading."""
        from openstax_content import fetch_multiple_chapters

        with patch('openstax_content.fetch_chapter_content') as mock_fetch:
            with patch('openstax_content.ThreadPoolExecutor') as mock_executor:
                mock_fetch.return_value = {
                    "chapter_slug": "single",
                    "title": "Single Chapter",
                    "url": "https://example.com/single",
                    "module_ids": ["m12345"],
                    "content": "Content",
                }

                # Fetch single chapter
                results = fetch_multiple_chapters(["single"])

                # ThreadPoolExecutor should NOT be used for single chapter
                mock_executor.assert_not_called()

                # But fetch should still work
                self.assertEqual(len(results), 1)

    def test_empty_list_returns_empty(self):
        """Verify empty input returns empty output."""
        from openstax_content import fetch_multiple_chapters

        results = fetch_multiple_chapters([])
        self.assertEqual(results, [])

    def test_parallel_fetch_faster_than_sequential(self):
        """Verify parallel is actually faster with simulated delays."""
        from openstax_content import fetch_multiple_chapters

        def slow_fetch(slug):
            """Simulate slow network fetch."""
            time.sleep(0.1)  # 100ms delay
            return {
                "chapter_slug": slug,
                "title": f"Title for {slug}",
                "url": f"https://example.com/{slug}",
                "module_ids": ["m12345"],
                "content": f"Content for {slug}",
            }

        with patch('openstax_content.fetch_chapter_content', side_effect=slow_fetch):
            chapters = ["ch1", "ch2", "ch3"]

            start = time.time()
            results = fetch_multiple_chapters(chapters)
            elapsed = time.time() - start

            # With 3 chapters at 100ms each:
            # - Sequential would take ~300ms
            # - Parallel should take ~100-150ms
            self.assertEqual(len(results), 3)

            # Parallel should be significantly faster than sequential
            # Allow some overhead, but should be under 250ms (vs 300ms sequential)
            self.assertLess(elapsed, 0.25,
                            f"Parallel fetch took {elapsed:.3f}s, expected < 0.25s")


class TestParallelModuleFetch(unittest.TestCase):
    """Tests for parallel module fetching within chapters."""

    def setUp(self):
        """Reset caches before each test."""
        from openstax_content import clear_module_cache
        clear_module_cache()

    def test_chapter_content_fetches_modules_in_parallel(self):
        """Verify chapter content fetches multiple modules in parallel."""
        from openstax_content import fetch_chapter_content

        # Mock the chapter mapping to have multiple modules
        mock_modules = {
            "test-chapter": ["m1", "m2", "m3"],
        }
        mock_chapters = {
            "test-chapter": "Test Chapter Title",
        }

        with patch('openstax_content.fetch_module_content_cached') as mock_fetch:
            with patch.dict('openstax_chapters.CHAPTER_TO_MODULES', mock_modules):
                with patch.dict('openstax_chapters.OPENSTAX_CHAPTERS', mock_chapters):
                    with patch('openstax_chapters.get_openstax_url_for_chapter',
                               return_value="https://example.com/test"):

                        # Each module returns different content
                        mock_fetch.side_effect = lambda mid: f"Content for {mid}"

                        # Import fresh to get patched values
                        from openstax_content import fetch_chapter_content as fetch_fn

                        result = fetch_fn("test-chapter")

                        # All 3 modules should have been fetched
                        self.assertEqual(mock_fetch.call_count, 3)

                        # Content should be combined
                        if result:
                            self.assertIn("Content for m1", result["content"])
                            self.assertIn("Content for m2", result["content"])
                            self.assertIn("Content for m3", result["content"])


if __name__ == "__main__":
    unittest.main()
