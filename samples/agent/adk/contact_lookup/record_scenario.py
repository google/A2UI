import asyncio
import json
import logging
from agent import ContactAgent
from a2ui.core.schema.constants import VERSION_0_8

logging.basicConfig(level=logging.INFO)

async def main():
    agent = ContactAgent(base_url="http://localhost:10006")
    query = "Find Alex in Marketing"
    session_id = "test_session_2"
    
    print(f"Running agent with query: {query}")
    
    messages = []
    
    async for event in agent.stream(query, session_id, ui_version=VERSION_0_8):
        parts = event.get("parts", [])
        for p in parts:
            if p.root.metadata and p.root.metadata.get("mimeType") == "application/json+a2ui":
                # Some payloads are already a list, some are dicts
                if isinstance(p.root.data, list):
                    messages.extend(p.root.data)
                else:
                    messages.append(p.root.data)
                    
    if messages:
        out_path = "../../../../tools/composer/src/data/dojo/contact-lookup.json"
        with open(out_path, "w") as f:
            json.dump(messages, f, indent=2)
        print(f"Recorded {len(messages)} A2UI message parts to {out_path}")
    else:
        print("No A2UI messages produced.")

if __name__ == "__main__":
    asyncio.run(main())
