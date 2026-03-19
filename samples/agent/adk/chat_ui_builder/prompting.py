from __future__ import annotations

import json

SUPPORTED_COMPONENTS = {
    "Text": {
        "purpose": "Display short or long text.",
        "notes": ["Use usageHint values like h1, h2, h3, body, caption."],
    },
    "Image": {
        "purpose": "Display an image from a URL.",
        "notes": ["Use for logos, avatars, or hero images."],
    },
    "Row": {
        "purpose": "Lay children out horizontally.",
        "notes": ["Good for label/value pairs or metric rows."],
    },
    "Column": {
        "purpose": "Lay children out vertically.",
        "notes": ["Default container for stacked content."],
    },
    "Card": {
        "purpose": "Group related content inside a card.",
        "notes": ["Useful for summaries and sections."],
    },
    "List": {
        "purpose": "Group repeated items.",
        "notes": ["For this demo, repeated items are rendered from explicit children."],
    },
    "Divider": {
        "purpose": "Visually separate blocks.",
        "notes": ["Use sparingly between sections."],
    },
    "Button": {
        "purpose": "Trigger an action.",
        "notes": ["Use for CTA like follow up, submit, book, approve."],
    },
    "TextField": {
        "purpose": "Collect short or long text input.",
        "notes": ["Use when the user needs to type data."],
    },
    "CheckBox": {
        "purpose": "Boolean on/off input.",
        "notes": ["Use for toggles and confirmations."],
    },
    "Slider": {
        "purpose": "Numeric range input.",
        "notes": ["Use for ratings, budgets, priorities, or thresholds."],
    },
    "MultipleChoice": {
        "purpose": "Choose one or more options.",
        "notes": ["Good for tags, filters, and categorical selection."],
    },
    "DateTimeInput": {
        "purpose": "Pick a date and/or time.",
        "notes": ["Use for scheduling and deadlines."],
    },
}

DELTA_PROTOCOL = {
    "events": {
        "init_surface": {
            "fields": {
                "surface_id": "string",
                "title": "string",
                "summary": "optional string",
                "theme": {
                    "primaryColor": "optional #RRGGBB string",
                    "font": "optional string",
                },
            }
        },
        "add_section": {
            "fields": {
                "id": "string",
                "parent_id": "string",
                "layout": "Card | Column | Row | List",
                "title": "optional string",
                "description": "optional string",
            }
        },
        "add_text": {
            "fields": {
                "id": "string",
                "parent_id": "string",
                "text": "string",
                "usage_hint": "h1 | h2 | h3 | body | caption",
            }
        },
        "add_key_value": {
            "fields": {
                "id": "string",
                "parent_id": "string",
                "label": "string",
                "value": "string",
            }
        },
        "add_image": {
            "fields": {
                "id": "string",
                "parent_id": "string",
                "url": "string",
                "usage_hint": "optional icon | avatar | smallFeature | mediumFeature | largeFeature | header",
            }
        },
        "add_button": {
            "fields": {
                "id": "string",
                "parent_id": "string",
                "label": "string",
                "action_name": "string",
                "primary": "optional boolean",
            }
        },
        "add_input": {
            "fields": {
                "id": "string",
                "parent_id": "string",
                "component": "TextField | CheckBox | Slider | MultipleChoice | DateTimeInput",
                "label": "string",
                "path": "absolute JSON pointer path like /form/name",
                "value": "optional string | boolean | number | array",
                "text_field_type": "optional shortText | longText | number | date | obscured",
                "min_value": "optional number",
                "max_value": "optional number",
                "options": "optional list of {label, value}",
                "enable_date": "optional boolean",
                "enable_time": "optional boolean",
            }
        },
        "add_divider": {
            "fields": {
                "id": "string",
                "parent_id": "string",
            }
        },
        "append_list_item": {
            "fields": {
                "id": "string",
                "parent_id": "string",
                "title": "string",
                "detail": "optional string",
            }
        },
        "finalize": {"fields": {}}
    }
}

SYSTEM_PROMPT = f"""You are an expert A2UI planner.

Your job is to read a user request and emit NDJSON deltas, one JSON object per line.
Each line MUST be valid JSON. Do not wrap the output in markdown fences. Do not output prose.

The backend compiles your deltas into strict A2UI protocol frames, so you must follow the delta schema exactly.

## A2UI components available in this demo
{json.dumps(SUPPORTED_COMPONENTS, indent=2, ensure_ascii=False)}

## Delta protocol
{json.dumps(DELTA_PROTOCOL, indent=2, ensure_ascii=False)}

## Rules
1. Start with exactly one init_surface event.
2. Then emit add_section / add_text / add_key_value / add_image / add_button / add_input / add_divider / append_list_item events as needed.
3. End with exactly one finalize event.
4. Use short, stable ids like header, metrics, profile_card, form_name, recent_orders.
5. Keep parent_id references valid. The top-level parent is always root.
6. Prefer Card + Column for summaries, Row for paired values, List or repeated items for collections, and input components for editable forms.
7. If the user gives concrete values in natural language, preserve them exactly.
8. If the user asks for actions, use add_button with a concise action_name.
9. Emit each event on its own line as compact JSON.
10. Never output comments, explanations, or blank narrative text.

## Example
{{"event":"init_surface","surface_id":"main","title":"Customer Summary","summary":"Key account snapshot"}}
{{"event":"add_section","id":"profile","parent_id":"root","layout":"Card","title":"Profile"}}
{{"event":"add_key_value","id":"customer_name","parent_id":"profile","label":"Name","value":"Alice"}}
{{"event":"add_key_value","id":"customer_tier","parent_id":"profile","label":"Tier","value":"VIP"}}
{{"event":"add_section","id":"actions","parent_id":"root","layout":"Row","title":"Next step"}}
{{"event":"add_button","id":"follow_up","parent_id":"actions","label":"Follow up","action_name":"follow_up","primary":true}}
{{"event":"finalize"}}
"""


def build_messages(user_message: str) -> list[dict[str, str]]:
  return [
      {"role": "system", "content": SYSTEM_PROMPT},
      {"role": "user", "content": user_message},
  ]
