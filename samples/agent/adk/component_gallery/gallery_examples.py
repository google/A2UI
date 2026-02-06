
"""Defines the Component Gallery 'Kitchen Sink' example."""
import json

def get_gallery_json() -> str:
    """Returns the JSON structure for the Component Gallery surfaces."""
    
    messages = []
    
    # Common Data Model
    # We use a single global data model for simplicity across all demo surfaces.
    # Common Data Model Content
    # We define the content here and inject it into EACH surface so they all share the same initial state.
    gallery_data_content = {
        "key": "galleryData",
        "valueMap": [
            { "key": "textField", "valueString": "Hello World" },
            { "key": "checkbox", "valueBoolean": False },
            { "key": "checkboxChecked", "valueBoolean": True },
            { "key": "slider", "valueNumber": 30 },
            { "key": "date", "valueString": "2025-10-26" },
            { "key": "favorites", "valueMap": [
                 { "key": "0", "valueString": "A" }
            ]},
            { "key": "favoritesChips", "valueMap": [] },
            { "key": "favoritesFilter", "valueMap": [] }
        ]
    }

    # Helper to create a surface for a single component
    def add_demo_surface(surface_id, component_def):
        root_id = f"{surface_id}-root"
        
        components = []
        components.append({
            "id": root_id,
            "component": component_def
        })
        
        messages.append({ "beginRendering": { "surfaceId": surface_id, "root": root_id } })
        messages.append({ "surfaceUpdate": { "surfaceId": surface_id, "components": components } })
        
        # Inject data model for this surface
        messages.append({ 
            "dataModelUpdate": { 
                "surfaceId": surface_id,
                "contents": [gallery_data_content] 
            } 
        })

    # 1. TextField
    add_demo_surface("demo-text", {
        "TextField": {
            "label": { "literalString": "Enter some text" },
            "text": { "path": "galleryData/textField" }
        }
    })

    # 2. CheckBox
    add_demo_surface("demo-checkbox", {
        "CheckBox": {
            "label": { "literalString": "Toggle me" },
            "value": { "path": "galleryData/checkbox" }
        }
    })

    # 3. Slider
    add_demo_surface("demo-slider", {
        "Slider": {
            "value": { "path": "galleryData/slider" },
            "minValue": 0,
            "maxValue": 100
        }
    })

    # 4. DateTimeInput
    add_demo_surface("demo-date", {
        "DateTimeInput": {
            "value": { "path": "galleryData/date" },
            "enableDate": True
        }
    })

    # 5. MultipleChoice (Default)
    add_demo_surface("demo-multichoice", {
        "MultipleChoice": {
            "selections": { "path": "galleryData/favorites" },
            "options": [
                { "label": { "literalString": "Apple" }, "value": "A" },
                { "label": { "literalString": "Banana" }, "value": "B" },
                { "label": { "literalString": "Cherry" }, "value": "C" }
            ]
        }
    })

    # 5b. MultipleChoice (Chips)
    add_demo_surface("demo-multichoice-chips", {
        "MultipleChoice": {
            "selections": { "path": "galleryData/favoritesChips" },
            "description": "Select tags (Chips)",
            "variant": "chips",
            "options": [
                { "label": { "literalString": "Work" }, "value": "work" },
                { "label": { "literalString": "Home" }, "value": "home" },
                { "label": { "literalString": "Urgent" }, "value": "urgent" },
                { "label": { "literalString": "Later" }, "value": "later" }
            ]
        }
    })

    # 5c. MultipleChoice (Filterable)
    add_demo_surface("demo-multichoice-filter", {
        "MultipleChoice": {
            "selections": { "path": "galleryData/favoritesFilter" },
            "description": "Select countries (Filterable)",
            "filterable": True,
            "options": [
                { "label": { "literalString": "United States" }, "value": "US" },
                { "label": { "literalString": "Canada" }, "value": "CA" },
                { "label": { "literalString": "United Kingdom" }, "value": "UK" },
                { "label": { "literalString": "Australia" }, "value": "AU" },
                { "label": { "literalString": "Germany" }, "value": "DE" },
                { "label": { "literalString": "France" }, "value": "FR" },
                { "label": { "literalString": "Japan" }, "value": "JP" }
            ]
        }
    })

    # 6. Image
    add_demo_surface("demo-image", {
        "Image": {
            "url": { "literalString": "http://localhost:10005/assets/a2ui.png" },
            "usageHint": "mediumFeature"
        }
    })

    # 7. Button
    # Button needs a child Text component.
    button_surface_id = "demo-button"
    btn_root_id = "demo-button-root"
    btn_text_id = "demo-button-text"
    
    messages.append({ "beginRendering": { "surfaceId": button_surface_id, "root": btn_root_id } })
    messages.append({ 
        "surfaceUpdate": { 
            "surfaceId": button_surface_id, 
            "components": [
                {
                    "id": btn_text_id,
                    "component": { "Text": { "text": { "literalString": "Trigger Action" } } }
                },
                {
                    "id": btn_root_id,
                    "component": {
                        "Button": {
                            "child": btn_text_id,
                            "primary": True,
                            "action": {
                                "name": "custom_action",
                                "context": [
                                    { "key": "info", "value": { "literalString": "Custom Button Clicked" } }
                                ]
                            }
                        }
                    }
                }
            ] 
        } 
    })

    # 8. Tabs
    tabs_surface_id = "demo-tabs"
    tabs_root_id = "demo-tabs-root"
    tab1_id = "tab-1-content"
    tab2_id = "tab-2-content"

    messages.append({ "beginRendering": { "surfaceId": tabs_surface_id, "root": tabs_root_id } })
    messages.append({
        "surfaceUpdate": {
            "surfaceId": tabs_surface_id,
            "components": [
                {
                    "id": tab1_id,
                    "component": { "Text": { "text": { "literalString": "First Tab Content" } } }
                },
                {
                    "id": tab2_id,
                    "component": { "Text": { "text": { "literalString": "Second Tab Content" } } }
                },
                {
                    "id": tabs_root_id,
                    "component": {
                        "Tabs": {
                            "tabItems": [
                                { "title": { "literalString": "View One" }, "child": tab1_id },
                                { "title": { "literalString": "View Two" }, "child": tab2_id }
                            ]
                        }
                    }
                }
            ]
        }
    })

    # 9. Icon
    icon_surface_id = "demo-icon"
    messages.append({ "beginRendering": { "surfaceId": icon_surface_id, "root": "icon-root" } })
    messages.append({
        "surfaceUpdate": {
            "surfaceId": icon_surface_id,
            "components": [
                {
                    "id": "icon-root",
                    "component": {
                        "Row": {
                            "children": { "explicitList": ["icon-1", "icon-2", "icon-3"] },
                            "distribution": "spaceEvenly",
                            "alignment": "center"
                        }
                    }
                },
                { "id": "icon-1", "component": { "Icon": { "name": { "literalString": "star" } } } },
                { "id": "icon-2", "component": { "Icon": { "name": { "literalString": "home" } } } },
                { "id": "icon-3", "component": { "Icon": { "name": { "literalString": "settings" } } } }
            ]
        }
    })

    # 10. Divider
    div_surface_id = "demo-divider"
    messages.append({ "beginRendering": { "surfaceId": div_surface_id, "root": "div-root" } })
    messages.append({
        "surfaceUpdate": {
            "surfaceId": div_surface_id,
            "components": [
                {
                    "id": "div-root",
                    "component": {
                        "Column": {
                            "children": { "explicitList": ["div-text-1", "div-horiz", "div-text-2"] },
                            "distribution": "start",
                            "alignment": "stretch"
                        }
                    }
                },
                { "id": "div-text-1", "component": { "Text": { "text": { "literalString": "Above Divider" } } } },
                { "id": "div-horiz", "component": { "Divider": { "axis": "horizontal" } } },
                { "id": "div-text-2", "component": { "Text": { "text": { "literalString": "Below Divider" } } } }
            ]
        }
    })

    # 11. Card
    card_surface_id = "demo-card"
    messages.append({ "beginRendering": { "surfaceId": card_surface_id, "root": "card-root" } })
    messages.append({
        "surfaceUpdate": {
            "surfaceId": card_surface_id,
            "components": [
                {
                    "id": "card-root",
                    "component": {
                        "Card": {
                            "child": "card-text"
                        }
                    }
                },
                { "id": "card-text", "component": { "Text": { "text": { "literalString": "I am inside a Card" } } } }
            ]
        }
    })

    # 12. Video
    add_demo_surface("demo-video", {
        "Video": {
            # Still external as user only provided audio and image
            "url": { "literalString": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" }
        }
    })

    # 13. Modal
    # Modal needs an entry point (Button) and content.
    modal_surface_id = "demo-modal"
    messages.append({ "beginRendering": { "surfaceId": modal_surface_id, "root": "modal-root" } })
    messages.append({
        "surfaceUpdate": {
            "surfaceId": modal_surface_id,
            "components": [
                {
                    "id": "modal-root",
                    "component": {
                        "Modal": {
                            "entryPointChild": "modal-btn",
                            "contentChild": "modal-content"
                        }
                    }
                },
                {
                    "id": "modal-btn",
                    "component": {
                        "Button": {
                            "child": "modal-btn-text",
                            "primary": False,
                            "action": { "name": "noop" }
                        }
                    }
                },
                { "id": "modal-btn-text", "component": { "Text": { "text": { "literalString": "Open Modal" } } } },
                {
                    "id": "modal-content",
                    "component": { "Text": { "text": { "literalString": "This is the modal content!" } } }
                }
            ]
        }
    })

    # 14. List
    list_surface_id = "demo-list"
    messages.append({ "beginRendering": { "surfaceId": list_surface_id, "root": "list-root" } })
    messages.append({
        "surfaceUpdate": {
            "surfaceId": list_surface_id,
            "components": [
                {
                    "id": "list-root",
                    "component": {
                        "List": {
                            "children": { "explicitList": ["list-item-1", "list-item-2", "list-item-3"] },
                            "direction": "vertical",
                            "alignment": "stretch"
                        }
                    }
                },
                { "id": "list-item-1", "component": { "Text": { "text": { "literalString": "Item 1" } } } },
                { "id": "list-item-2", "component": { "Text": { "text": { "literalString": "Item 2" } } } },
                { "id": "list-item-3", "component": { "Text": { "text": { "literalString": "Item 3" } } } }
            ]
        }
    })

    # 15. AudioPlayer
    add_demo_surface("demo-audio", {
        "AudioPlayer": {
            "url": { "literalString": "http://localhost:10005/assets/audio.mp3" },
            "description": { "literalString": "Local Audio Sample" }
        }
    })

    # Response Surface
    messages.append({ "beginRendering": { "surfaceId": "response-surface", "root": "response-text" } })
    messages.append({
            "surfaceUpdate": {
            "surfaceId": "response-surface",
            "components": [
                {
                        "id": "response-text",
                        "component": {
                            "Text": { "text": { "literalString": "Interact with the gallery to see responses. This view is updated by the agent by relaying the raw action commands it received from the client" } }
                        }
                }
            ]
        }
    })
    
    return json.dumps(messages, indent=2)
