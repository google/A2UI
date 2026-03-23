from __future__ import annotations

import uvicorn

from app import app
from settings import settings


def main() -> None:
  uvicorn.run(app, host=settings.host, port=settings.port)


if __name__ == "__main__":
  main()
