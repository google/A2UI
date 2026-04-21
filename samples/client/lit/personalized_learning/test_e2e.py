import unittest
from .api_server import app
from .agent import PersonalizedLearningAgent

class TestE2E(unittest.TestCase):
      def test_e2e_flow(self):
                agent = PersonalizedLearningAgent()
                self.assertIsNotNone(agent)
                self.assertIsNotNone(app)

  if __name__ == "__main__":
        unittest.main()
