import unittest
from .agent import PersonalizedLearningAgent

class TestPersonalizedLearningAgent(unittest.TestCase):
      def test_initialization(self):
                agent = PersonalizedLearningAgent()
                self.assertIsNotNone(agent)

  if __name__ == "__main__":
        unittest.main()
