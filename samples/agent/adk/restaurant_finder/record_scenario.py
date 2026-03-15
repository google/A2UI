import asyncio
import json
import logging
from agent import RestaurantAgent

logging.basicConfig(level=logging.INFO)

async def main():
    agent = RestaurantAgent(base_url="http://localhost:10007", use_ui=True)
    query = "Find me Szechuan restaurants in New York"
    session_id = "test_session_3"
    
    print(f"Running agent with query: {query}")
    
    messages = []
    
    async for event in agent.stream(query, session_id):
        if event.get("is_task_complete"):
            parts = event.get("parts", [])
            for p in parts:
                if p.root.metadata and p.root.metadata.get("mimeType") == "application/json+a2ui":
                    # Some payloads are already a list, some are dicts
                    if isinstance(p.root.data, list):
                        messages.extend(p.root.data)
                    else:
                        messages.append(p.root.data)
                    
    if messages:
        out_path = "/home/node/.openclaw/projects/A2UI/tools/composer/src/data/dojo/restaurant-finder.json"
        with open(out_path, "w") as f:
            json.dump(messages, f, indent=2)
        print(f"Recorded {len(messages)} A2UI message parts to {out_path}")
    else:
        print("No A2UI messages produced.")

if __name__ == "__main__":
    asyncio.run(main())
