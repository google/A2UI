import unittest
from .api_server import app

class TestClient(unittest.TestCase):
      def test_app_initialization(self):
                self.assertIsNotNone(app)

  if __name__ == "__main__":
        unittest.main()
