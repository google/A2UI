"""Main entry point for the Component Gallery agent."""
import logging
import os
import sys

import click
import uvicorn
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2ui.extension.a2ui_extension import get_a2ui_agent_extension
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from dotenv import load_dotenv

from agent_executor import ComponentGalleryExecutor

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True,
)

logger = logging.getLogger(__name__)

@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=10005)
def main(host, port):
    try:
        capabilities = AgentCapabilities(
            streaming=True,
            extensions=[get_a2ui_agent_extension()],
        )
        
        # Skill definition
        skill = AgentSkill(
            id="component_gallery",
            name="Component Gallery",
            description="Demonstrates A2UI components.",
            tags=["gallery", "demo"],
            examples=["Show me the gallery"],
        )

        base_url = f"http://{host}:{port}"
        
        agent_card = AgentCard(
            name="Component Gallery Agent",
            description="A2UI Component Gallery",
            url=base_url,
            version="0.0.1",
            default_input_modes=["text"],
            default_output_modes=["text"],
            capabilities=capabilities,
            skills=[skill],
        )

        agent_executor = ComponentGalleryExecutor(base_url=base_url)
        
        request_handler = DefaultRequestHandler(
            agent_executor=agent_executor,
            task_store=InMemoryTaskStore(),
        )
        
        server = A2AStarletteApplication(
            agent_card=agent_card, http_handler=request_handler
        )

        app = server.build()

        app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:5173"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Mount assets directory
        assets_dir = os.path.join(os.path.dirname(__file__), "assets")
        if os.path.exists(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        else:
            logger.warning(f"Assets directory not found at {assets_dir}")
        
        print(f"Starting Component Gallery Agent on port {port}...")
        uvicorn.run(app, host=host, port=port)
        
    except Exception as e:
        logger.error(f"An error occurred during server startup: {e}")
        exit(1)

if __name__ == "__main__":
    main()
