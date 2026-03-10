import asyncio
import json
import urllib.request
import subprocess
import time
import websockets

async def get_console_errors(ws_url):
    async with websockets.connect(ws_url) as ws:
        await ws.send(json.dumps({"id": 1, "method": "Runtime.enable"}))
        await ws.send(json.dumps({"id": 2, "method": "Log.enable"}))
        await ws.send(json.dumps({"id": 3, "method": "Page.enable"}))
        await ws.send(json.dumps({"id": 4, "method": "Page.navigate", "params": {"url": "http://localhost:5176"}}))
        
        start_time = time.time()
        while time.time() - start_time < 3:
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                data = json.loads(msg)
                if data.get("method") == "Runtime.exceptionThrown":
                    print("EXCEPTION:", json.dumps(data["params"]["exceptionDetails"], indent=2))
                elif data.get("method") == "Runtime.consoleAPICalled" and data["params"]["type"] == "error":
                    print("CONSOLE ERROR:", json.dumps(data["params"]["args"], indent=2))
            except asyncio.TimeoutError:
                continue

async def main():
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    process = subprocess.Popen([
        chrome_path,
        "--remote-debugging-port=9222",
        "--headless",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    time.sleep(1)
    
    try:
        response = urllib.request.urlopen("http://localhost:9222/json")
        targets = json.loads(response.read())
        target = next((t for t in targets if t["type"] == "page"), None)
        if target:
            await get_console_errors(target['webSocketDebuggerUrl'])
    except Exception as e:
        print(f"Error: {e}")
    finally:
        process.terminate()

if __name__ == "__main__":
    asyncio.run(main())
