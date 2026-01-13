import httpx
import json
import uuid

URL = "http://localhost:10003/"

def test_method(method_name):
    print(f"\n--- Testing method: '{method_name}' ---")
    
    # Construct a valid A2A message payload
    message_id = str(uuid.uuid4())
    params = {
        "message": {
            "messageId": message_id,
            "role": "user",
            "parts": [{"text": "Hello"}],
            "kind": "message"
        }
    }
    
    payload = {
        "jsonrpc": "2.0",
        "method": method_name,
        "params": params,
        "id": "1"
    }
    
    headers = {
        "Content-Type": "application/json",
         "X-A2A-Extensions": "https://a2ui.org/a2a-extension/a2ui/v0.8"
    }
    
    try:
        response = httpx.post(URL, json=payload, headers=headers)
        # print(f"Status: {response.status_code}")
        # print(f"Response: {response.text}")
        
        if "Method not found" not in response.text:
             print(f"✅ SUCCESS? '{method_name}' looked promising!")
             return True
        else:
             print(f"❌ Failed: Method not found")
             return False

    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    candidates = [
        # Based on DefaultRequestHandler.on_message_send
        "on_message_send",
        "message_send",
        "message.send",
        "a2a.message_send",
        "a2a.on_message_send",
        
        # Variations
        "post_message",
        "a2a.post_message",
        "POST",           # Failed
        
        # Maybe namespaced?
        "a2a/message_send",
        "v1/message_send",
    ]
    
    found = False
    for c in candidates:
        if test_method(c):
            found = True
            break
            
    if not found:
        print("\nAll candidates failed.")
        # Try listing? NO standard listing in JSON-RPC usually.
