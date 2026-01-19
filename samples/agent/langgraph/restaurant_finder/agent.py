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
import os
from typing import Annotated, Any, Dict, List, TypedDict

import jsonschema
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode

from prompt_builder import (
    A2UI_SCHEMA,
    RESTAURANT_UI_EXAMPLES,
    get_text_prompt,
    get_ui_prompt,
)
from tools import get_restaurants

logger = logging.getLogger(__name__)

# --- Setup Tools ---
class MockToolContext:
    def __init__(self, base_url):
        self.state = {"base_url": base_url}

@tool
def search_restaurants(cuisine: str = None, location: str = None, count: int = 5):
    """
    Find restaurants based on cuisine and location.
    Args:
        cuisine: Type of food (e.g. Italian, Chinese).
        location: City or area.
        count: Number of results.
    """
    # Create a simple mock context that mimics what the tool expects
    # In a real app we might want to pass the real context if we had one
    # For now, we hardcode localhost or inject from somewhere if needed, 
    # but the tool just uses it for replacing URL in data.
    # We can try to get base_url from environment or defaults.
    base_url = "http://localhost:10002" 
    # Ideally should come from config, but inside a tool we don't have easy access to state unless we bind it.
    # We can rely on default logic inside tool or pass valid one.
    
    ctx = MockToolContext(base_url)
    return get_restaurants(cuisine=cuisine or "", location=location or "", tool_context=ctx, count=count)


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
    from langchain_core.messages import SystemMessage
    
    system_prompt = AGENT_INSTRUCTION
    if use_ui:
        system_prompt += get_ui_prompt(base_url, RESTAURANT_UI_EXAMPLES)
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
        import re
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
        single_message_schema = json.loads(A2UI_SCHEMA)
        schema_validator = {"type": "array", "items": single_message_schema}
        
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
        
        config = {"configurable": {"thread_id": session_id}}
        
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
