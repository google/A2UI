# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import json
import logging
import pathlib
import re
from typing import Annotated, List, TypedDict

import jsonschema
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from a2ui.extension.a2ui_schema_utils import wrap_as_json_array


# --- Helper Functions ---

def load_a2ui_schema() -> dict:
    current_dir = pathlib.Path(__file__).resolve().parent
    spec_root = current_dir / "../../../../specification/v0_8/json"

    server_to_client_content = (spec_root / "server_to_client.json").read_text()
    server_to_client_json = json.loads(server_to_client_content)
    
    standard_catalog_content = (
        spec_root / "standard_catalog_definition.json"
    ).read_text()
    standard_catalog_json = json.loads(standard_catalog_content)
    
    server_to_client_json["properties"]["surfaceUpdate"]["properties"]["components"]["items"]["properties"]["component"]["properties"] = standard_catalog_json

    return wrap_as_json_array(server_to_client_json)

def load_examples() -> dict:
    current_dir = pathlib.Path(__file__).resolve().parent
    examples_content = (current_dir / "restaurant_ui_examples.json").read_text()
    return json.loads(examples_content)

def get_ui_prompt(base_url: str, examples: dict) -> str:
    # Convert the examples dict back to the string format expected by the prompt or construct it
    # The previous logic expected a single string with all examples.
    # Let's reconstruct it or change the prompt to accept the dict.
    # The original prompt_builder just formatted a string. 
    # Let's convert the json back to the format the LLM expects (e.g. ---BEGIN...---)
    
    examples_str = ""
    for name, content in examples.items():
        examples_str += f"---BEGIN {name}---\n{json.dumps(content)}\n---END {name}---\n\n"
        
    # Inject base_url into the examples string if it was a format string before?
    # actually the previous code did `format(base_url=base_url)`.
    # But now we are loading raw JSON. The JSON might contain {path: ...} which is fine.
    # If the JSON had placeholders like `[ImageUrl]`, those are for the LLM to fill.
    # If the examples had `{{ "path": "imageUrl" }}` that was python f-string escaping.
    # Now it is raw JSON, so we don't need double braces for JSON, but we might verify if placeholders existed.
    # The previous `prompt_builder` did `examples.format(base_url=base_url)`. 
    # Let's see if the JSON we saved has `{base_url}` placeholders.
    # Looking at the file content I wrote... I wrote straight JSON. 
    # Ensure no `{base_url}` placeholders were lost or if they are needed.
    # The original `a2ui_examples.py` did NOT seem to have `{base_url}` placeholders in the snippets I saw (lines 15-187).
    # It just had `{ "path": "imageUrl" }`.
    # So simple string concatenation is likely fine.

    schema = json.dumps(load_a2ui_schema(), indent=2)

    return f"""
    You are a helpful restaurant finding assistant. Your final output MUST be a a2ui UI JSON response.

    To generate the response, you MUST follow these rules:
    1.  Your response MUST be in two parts, separated by the delimiter: `---a2ui_JSON---`.
    2.  The first part is your conversational text response.
    3.  The second part is a single, raw JSON object which is a list of A2UI messages.
    4.  The JSON part MUST validate against the A2UI JSON SCHEMA provided below.
    5.  CRITICAL: You MUST output valid standard JSON. Do NOT use single quotes for keys. Do NOT use trailing commas. ALL property names MUST be enclosed in double quotes (e.g., "weight": 1, NOT weight: 1).

    --- UI TEMPLATE RULES ---
    -   If the query is for a list of restaurants, use the restaurant data you have already received from the `get_restaurants` tool to populate the `dataModelUpdate.contents` array (e.g., as a `valueMap` for the "items" key).
    -   If the number of restaurants is 5 or fewer, you MUST use the `SINGLE_COLUMN_LIST_EXAMPLE` template.
    -   If the number of restaurants is more than 5, you MUST use the `TWO_COLUMN_LIST_EXAMPLE` template.
    -   If the query is to book a restaurant (e.g., "USER_WANTS_TO_BOOK..."), you MUST use the `BOOKING_FORM_EXAMPLE` template.
    -   If the query is a booking submission (e.g., "User submitted a booking..."), you MUST use the `CONFIRMATION_EXAMPLE` template.

    {examples_str}

    ---BEGIN A2UI JSON SCHEMA---
    {schema}
    ---END A2UI JSON SCHEMA---
    """

def get_text_prompt() -> str:
    return """
    You are a helpful restaurant finding assistant. Your final output MUST be a text response.

    To generate the response, you MUST follow these rules:
    1.  **For finding restaurants:**
        a. You MUST call the `get_restaurants` tool. Extract the cuisine, location, and a specific number (`count`) of restaurants from the user's query.
        b. After receiving the data, format the restaurant list as a clear, human-readable text response. You MUST preserve any markdown formatting (like for links) that you receive from the tool.

    2.  **For booking a table (when you receive a query like 'USER_WANTS_TO_BOOK...'):**
        a. Respond by asking the user for the necessary details to make a booking (party size, date, time, dietary requirements).

    3.  **For confirming a booking (when you receive a query like 'User submitted a booking...'):**
        a. Respond with a simple text confirmation of the booking details.
    """
from tools import get_restaurants

logger = logging.getLogger(__name__)

# --- Setup Tools ---

@tool
def search_restaurants(
    cuisine: str = None, 
    location: str = None, 
    count: int = 5,
    config: RunnableConfig = None
):
    """
    Find restaurants based on cuisine and location.
    Args:
        cuisine: Type of food (e.g. Italian, Chinese).
        location: City or area.
        count: Number of results.
        config: RunnableConfig containing base_url in configurable dict.
    """
    # Extract base_url from RunnableConfig
    base_url = config["configurable"].get("base_url", "http://localhost:10002")
    
    return get_restaurants(
        cuisine=cuisine or "", 
        location=location or "", 
        base_url=base_url, 
        count=count
    )


AGENT_INSTRUCTION = """
    You are a helpful restaurant finding assistant. Your goal is to help users find and book restaurants using a rich UI.

    To achieve this, you MUST follow this logic:

    1.  **For finding restaurants:**
        a. You MUST call the `search_restaurants` tool. Extract the cuisine, location, and a specific number (`count`) of restaurants from the user's query (e.g., for "top 5 chinese places", count is 5).
        b. After receiving the data, you MUST follow the instructions precisely to generate the final a2ui UI JSON, using the appropriate UI example from the `prompt_builder.py` based on the number of restaurants.

    2.  **For booking a table (when you receive a query like 'USER_WANTS_TO_BOOK...'):**
        a. You MUST use the appropriate UI example from `prompt_builder.py` to generate the UI, populating the `dataModelUpdate.contents` with the details from the user's query.

    3.  **For confirming a booking (when you receive a query like 'User submitted a booking...'):**
        a. You MUST use the appropriate UI example from `prompt_builder.py` to generate the confirmation UI, populating the `dataModelUpdate.contents` with the final booking details.
"""

# --- State Definition ---
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    attempts: int
    base_url: str
    use_ui: bool
    error_message: str

# --- Graph Nodes ---

def call_model(state: AgentState):
    messages = state["messages"]
    use_ui = state.get("use_ui", False)
    base_url = state.get("base_url", "http://localhost:10002")
    
    # Build system prompt
    
    system_prompt = AGENT_INSTRUCTION
    if use_ui:
        examples = load_examples()
        system_prompt += get_ui_prompt(base_url, examples)
    else:
        system_prompt += get_text_prompt()
        
    if state.get("error_message"):
        system_prompt += f"\n\nERROR IN PREVIOUS ATTEMPT: {state['error_message']}\nPlease correct the JSON."

    # Only add system message if it's not already in the conversation
    # (LangGraph's checkpointer maintains conversation history)
    if not messages or not isinstance(messages[0], SystemMessage):
        messages_for_model = [SystemMessage(content=system_prompt)] + messages
    else:
        # System message already exists, just use messages as-is
        messages_for_model = messages
    
    model = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp")
    model_with_tools = model.bind_tools([search_restaurants])
    
    # Invoke with the messages
    response = model_with_tools.invoke(messages_for_model)
    return {"messages": [response], "attempts": state.get("attempts", 0) + 1}

def validate_response(state: AgentState):
    """Validates the last message for A2UI schema compliance if use_ui is True."""
    if not state.get("use_ui", False):
        return {"error_message": ""}

    last_message = state["messages"][-1]
    
    if not isinstance(last_message, AIMessage) or last_message.tool_calls:
        # If it's a tool call, we don't validate UI schema yet, just proceed
        return {"error_message": ""}

    content = last_message.content
    try:
        if "---a2ui_JSON---" not in content:
             # Only strictly enforce if it looks like it SHOULD be a UI response?
             # For now, let's enforce it if verify logic requires it. 
             # But maybe the agent just wants to say "Hi". 
             # The ADK agent enforces it for *final* responses essentially or checks for validity.
             # Actually ADK logic: if it's a final response, it checks.
             # Here, if no tool calls, it is likely a final response.
             return {"error_message": "Missing '---a2ui_JSON---' delimiter."}

        _, json_string = content.split("---a2ui_JSON---", 1)
        json_string_cleaned = json_string.strip().lstrip("```json").rstrip("```").strip()
        
        if not json_string_cleaned:
             return {"error_message": "Empty JSON part."}

        # Attempt to repair common JSON errors (like unquoted keys)
        # Fix unquoted keys: e.g. { weight: 1 } -> { "weight": 1 }
        # This regex matches word characters followed by a colon, ensuring they aren't already quoted
        # Note: This is a simple heuristic and might need refinement for complex cases
        fixed_json = re.sub(r'(?<!")\b([a-zA-Z_]\w*)\b(?=\s*:)', r'"\1"', json_string_cleaned)
        
        try:
            parsed_json = json.loads(fixed_json)
        except json.JSONDecodeError:
            # If fix failed, try original (or maybe the error was something else)
            parsed_json = json.loads(json_string_cleaned)
        
        # Load schema
        schema_validator = load_a2ui_schema()
        
        jsonschema.validate(instance=parsed_json, schema=schema_validator)
        
        return {"error_message": ""} # Valid
        
    except Exception as e:
        return {"error_message": str(e)}

# --- Conditional Edges ---

def should_continue(state: AgentState):
    last_message = state["messages"][-1]
    
    # If tool calls, go to tools
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        return "tools"
    
    # If validation failed and we have retries left
    if state.get("error_message") and state["attempts"] < 3:
        return "call_model"

    # Safety: If content is empty (and no tool calls), retry
    if isinstance(last_message, AIMessage) and not str(last_message.content).strip() and state["attempts"] < 3:
        return "call_model"
        
    return END

from langgraph.checkpoint.memory import MemorySaver

# ... (imports)

# --- Build Graph ---

def build_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("call_model", call_model)
    workflow.add_node("validate_response", validate_response)
    workflow.add_node("tools", ToolNode([search_restaurants]))
    
    workflow.add_edge(START, "call_model")
    workflow.add_edge("tools", "call_model") # Return to model after tools
    
    workflow.add_edge("call_model", "validate_response")
    
    workflow.add_conditional_edges(
        "validate_response",
        should_continue,
        ["tools", "call_model", END]
    )
    
    
    # No checkpointer needed - each client request is independent
    return workflow.compile()

# Start the graph
graph = build_graph()

class RestaurantAgent:
    def __init__(self, base_url, use_ui=True):
        self.base_url = base_url
        self.use_ui = use_ui
        self.graph = graph

    async def stream(self, query: str, session_id: str):
        """Streams output in a format compatible with the ADK runner expectatons somewhat."""
        
        # call_model will handle adding the system message if needed
        inputs = {
            "messages": [HumanMessage(content=query)],
            "base_url": self.base_url,
            "use_ui": self.use_ui,
            "attempts": 0,
            "error_message": ""
        }
        
        config = {
            "configurable": {
                "thread_id": session_id,
                "base_url": self.base_url
            }
        }
        
        # We need to yield similar events to ADK: 
        # {"is_task_complete": False, "updates": ...} or {"is_task_complete": True, "content": ...}
        
        final_content = ""
        
        async for event in self.graph.astream(inputs, config=config):
            # Inspect event to see what's happening
            # event is usually a dict keying the node name to the state update
            
            for node_name, state_update in event.items():
                if node_name == "call_model":
                    # We can yield "processing" updates
                    yield {
                        "is_task_complete": False,
                        "updates": "Thinking..."
                    }
                elif node_name == "tools":
                     yield {
                        "is_task_complete": False,
                        "updates": "Finding restaurants..."
                    }
            
            # Track the last AI message
            if "call_model" in event:
                state_update = event["call_model"]
                if "messages" in state_update and state_update["messages"]:
                    last_msg = state_update["messages"][-1]
                    if isinstance(last_msg, AIMessage):
                        final_content = last_msg.content

        # Return the final content
        yield {
            "is_task_complete": True,
            "content": final_content
        }
