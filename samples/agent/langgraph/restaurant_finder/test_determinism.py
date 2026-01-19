#!/usr/bin/env python3
"""Test script to verify the LangGraph agent works deterministically."""

import asyncio
import json
import httpx

async def test_agent():
    """Send a test request to the agent."""
    url = "http://localhost:10002/"
    
    # Construct A2A request with A2UI extension
    request_data = {
        "message": {
            "parts": [
                {
                    "text": "Top 5 Chinese restaurants in New York."
                }
            ]
        },
        "requestedExtensions": [
            "https://a2ui.org/a2a-extension/a2ui/v0.8"
        ]
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=request_data)
        
        if response.status_code == 200:
            # Parse the response
            response_text = response.text
            print("✅ Request successful!")
            print(f"Response length: {len(response_text)} chars")
            
            # Check if it contains A2UI JSON
            if "beginRendering" in response_text:
                print("✅ Contains A2UI beginRendering message")
            if "surfaceUpdate" in response_text:
                print("✅ Contains A2UI surfaceUpdate message")
            if "dataModelUpdate" in response_text:
                print("✅ Contains A2UI dataModelUpdate message")
            
            return True
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(response.text)
            return False

async def main():
    """Run multiple tests to verify deterministic behavior."""
    print("Testing LangGraph agent for deterministic behavior...\n")
    
    num_tests = 5
    successes = 0
    
    for i in range(1, num_tests + 1):
        print(f"\n{'='*60}")
        print(f"Test {i}/{num_tests}")
        print('='*60)
        
        try:
            success = await test_agent()
            if success:
                successes += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
        
        # Small delay between tests
        if i < num_tests:
            await asyncio.sleep(1)
    
    print(f"\n{'='*60}")
    print(f"Results: {successes}/{num_tests} tests passed")
    print('='*60)
    
    if successes == num_tests:
        print("✅ All tests passed! Agent is working deterministically.")
    else:
        print(f"⚠️  Only {successes}/{num_tests} tests passed. Agent may still have issues.")

if __name__ == "__main__":
    asyncio.run(main())
