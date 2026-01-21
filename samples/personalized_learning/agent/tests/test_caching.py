"""
Unit tests for caching functionality in the personalized learning agent.

Tests:
- Learner context caching (TTL-based)
- OpenStax module content caching (TTL-based)
"""

import time
import unittest
from unittest.mock import patch, MagicMock

# Import the modules we're testing
import sys
import os

# Add parent directories to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

# Direct imports of the module files
import importlib.util

# Load agent.py as a module
agent_path = os.path.join(parent_dir, 'agent.py')
spec = importlib.util.spec_from_file_location("agent_module", agent_path)
agent_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent_module)

# Import openstax_content
import openstax_content


class TestContextCaching(unittest.TestCase):
    """Tests for learner context caching in agent.py"""

    def setUp(self):
        """Reset the cache before each test."""
        agent_module.clear_context_cache()

    def test_context_cache_returns_cached_value(self):
        """Verify second call returns cached content without reloading."""
        # First call should load context
        with patch.object(agent_module, '_safe_get_combined_context') as mock_get:
            mock_get.return_value = "Test context content"

            result1 = agent_module._get_cached_context()
            self.assertEqual(result1, "Test context content")
            self.assertEqual(mock_get.call_count, 1)

            # Second call should use cache (mock not called again)
            result2 = agent_module._get_cached_context()
            self.assertEqual(result2, "Test context content")
            self.assertEqual(mock_get.call_count, 1)  # Still 1, not 2

    def test_context_cache_expires_after_ttl(self):
        """Verify cache expires and refetches after TTL."""
        ttl = agent_module._CONTEXT_CACHE_TTL

        with patch.object(agent_module, '_safe_get_combined_context') as mock_get:
            with patch.object(agent_module.time, 'time') as mock_time:
                # First call at time 0
                mock_time.return_value = 0
                mock_get.return_value = "Original content"

                result1 = agent_module._get_cached_context()
                self.assertEqual(result1, "Original content")
                self.assertEqual(mock_get.call_count, 1)

                # Second call still within TTL
                mock_time.return_value = ttl - 1
                result2 = agent_module._get_cached_context()
                self.assertEqual(mock_get.call_count, 1)  # Cache hit

                # Third call after TTL expires
                mock_time.return_value = ttl + 1
                mock_get.return_value = "Updated content"

                result3 = agent_module._get_cached_context()
                self.assertEqual(result3, "Updated content")
                self.assertEqual(mock_get.call_count, 2)  # Cache miss, refetched

    def test_clear_context_cache(self):
        """Verify clear_context_cache empties the cache."""
        with patch.object(agent_module, '_safe_get_combined_context') as mock_get:
            mock_get.return_value = "Test content"

            # Load into cache
            agent_module._get_cached_context()
            self.assertEqual(mock_get.call_count, 1)

            # Clear cache
            agent_module.clear_context_cache()

            # Next call should reload
            agent_module._get_cached_context()
            self.assertEqual(mock_get.call_count, 2)


class TestModuleCaching(unittest.TestCase):
    """Tests for OpenStax module content caching in openstax_content.py"""

    def setUp(self):
        """Reset the module cache before each test."""
        openstax_content.clear_module_cache()

    def test_module_cache_hit(self):
        """Verify cached module content is returned."""
        with patch.object(openstax_content, 'fetch_module_content') as mock_fetch:
            mock_fetch.return_value = "Module content for m12345"

            # First call
            result1 = openstax_content.fetch_module_content_cached("m12345")
            self.assertEqual(result1, "Module content for m12345")
            self.assertEqual(mock_fetch.call_count, 1)

            # Second call should use cache
            result2 = openstax_content.fetch_module_content_cached("m12345")
            self.assertEqual(result2, "Module content for m12345")
            self.assertEqual(mock_fetch.call_count, 1)  # Still 1

    def test_module_cache_miss_fetches_fresh(self):
        """Verify cache miss triggers fresh fetch."""
        with patch.object(openstax_content, 'fetch_module_content') as mock_fetch:
            mock_fetch.return_value = "Content A"

            # Fetch module A
            result_a = openstax_content.fetch_module_content_cached("moduleA")
            self.assertEqual(result_a, "Content A")

            # Fetch different module B (cache miss)
            mock_fetch.return_value = "Content B"
            result_b = openstax_content.fetch_module_content_cached("moduleB")
            self.assertEqual(result_b, "Content B")

            # Both fetches should have occurred
            self.assertEqual(mock_fetch.call_count, 2)

    def test_module_cache_ttl_expiry(self):
        """Verify module cache expires correctly."""
        ttl = openstax_content._MODULE_CACHE_TTL

        with patch.object(openstax_content, 'fetch_module_content') as mock_fetch:
            with patch.object(openstax_content.time, 'time') as mock_time:
                mock_time.return_value = 0
                mock_fetch.return_value = "Old content"

                # First fetch
                result1 = openstax_content.fetch_module_content_cached("m99999")
                self.assertEqual(result1, "Old content")
                self.assertEqual(mock_fetch.call_count, 1)

                # Within TTL - should use cache
                mock_time.return_value = ttl - 1
                result2 = openstax_content.fetch_module_content_cached("m99999")
                self.assertEqual(mock_fetch.call_count, 1)

                # After TTL expires
                mock_time.return_value = ttl + 1
                mock_fetch.return_value = "New content"

                result3 = openstax_content.fetch_module_content_cached("m99999")
                self.assertEqual(result3, "New content")
                self.assertEqual(mock_fetch.call_count, 2)

    def test_module_cache_handles_parse_flag(self):
        """Verify parse flag creates separate cache entries."""
        with patch.object(openstax_content, 'fetch_module_content') as mock_fetch:
            # Fetch with parse=True
            mock_fetch.return_value = "Parsed content"
            result1 = openstax_content.fetch_module_content_cached("m11111", parse=True)
            self.assertEqual(result1, "Parsed content")

            # Fetch same module with parse=False (should be cache miss)
            mock_fetch.return_value = "Raw content"
            result2 = openstax_content.fetch_module_content_cached("m11111", parse=False)
            self.assertEqual(result2, "Raw content")

            # Both should have been fetched (different cache keys)
            self.assertEqual(mock_fetch.call_count, 2)

    def test_module_cache_handles_none_content(self):
        """Verify None content is not cached."""
        with patch.object(openstax_content, 'fetch_module_content') as mock_fetch:
            mock_fetch.return_value = None

            # First call returns None
            result1 = openstax_content.fetch_module_content_cached("missing_module")
            self.assertIsNone(result1)

            # Second call should try again (not cached)
            result2 = openstax_content.fetch_module_content_cached("missing_module")
            self.assertIsNone(result2)

            # Both calls should have tried to fetch
            self.assertEqual(mock_fetch.call_count, 2)


if __name__ == "__main__":
    unittest.main()
