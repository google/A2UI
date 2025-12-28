import uvicorn
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

# Define the A2UI response logic
async def a2ui_endpoint(request):
    # This is the raw JSON structure the Android client expects
    # It mimics what a full A2A agent would return in the 'data' part of a message
    return JSONResponse([
        {
            "surfaceId": "main",
            "components": [
                {
                    "id": "root",
                    "component": {
                        "Column": {
                            "children": {
                                "explicitList": ["header", "image", "desc_card", "input_row", "button"]
                            },
                             "crossAxisAlignment": "center"
                        }
                    }
                },
                {
                    "id": "header",
                    "component": {
                        "Text": {
                            "text": {"literalString": "Hello from Simple Server!"},
                            "usageHint": "headlineMedium"
                        }
                    }
                },
                 {
                    "id": "image",
                    "component": {
                        "Image": {
                            "url": {"literalString": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Android_robot.svg/1745px-Android_robot.svg.png"},
                             "height": {"literalString": "120"}
                        }
                    }
                },
                {
                    "id": "desc_card",
                    "component": {
                        "Container": {
                             "children": {
                                "explicitList": ["desc_text"]
                            },
                             "padding": {
                                 "top": 16, "bottom": 16, "left": 16, "right": 16
                             }
                        }
                    }
                },
                 {
                    "id": "desc_text",
                    "component": {
                        "Text": {
                            "text": {"literalString": "This UI is streamed dynamically from a Python server running on your machine. No app rebuilds required!"}
                        }
                    }
                },
                  {
                    "id": "input_row",
                    "component": {
                        "Row": {
                            "children": {
                                "explicitList": ["input_field"]
                            }
                        }
                    }
                },
                {
                    "id": "input_field",
                    "component": {
                        "TextField": {
                            "label": {"literalString": "Enter your name"},
                             "value": {"literalString": ""}
                        }
                    }
                },
                 {
                    "id": "button",
                    "component": {
                        "Button": {
                            "label": {"literalString": "Send to Server"},
                            "action": {
                                "actionId": "submit",
                                 "parameters": {}
                            }
                        }
                    }
                }
            ]
        },
        {
            "surfaceId": "main",
            "root": "root"
        }
    ])

# CORS allows the Android emulator (which is 'technically' external) to hit localhost easily if needed,
# though usually 10.0.2.2 is used. Good practice anyway.
middleware = [
    Middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])
]

routes = [
    Route('/a2ui', a2ui_endpoint),
]

app = Starlette(debug=True, routes=routes, middleware=middleware)

if __name__ == "__main__":
    print("Starting Simple A2UI Server...")
    print("Endpoint: http://0.0.0.0:8000/a2ui")
    print("For Android Emulator, use: http://10.0.2.2:8000/a2ui")
    uvicorn.run(app, host="0.0.0.0", port=8000)
