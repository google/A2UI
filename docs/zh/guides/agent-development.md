# 智能体开发指南

构建生成 A2UI 界面的 AI 智能体。本指南涵盖从 LLM 生成和流式传输 UI 消息。

## 快速概览

构建 A2UI 智能体：

1. **理解用户意图** → 决定显示什么 UI
2. **生成 A2UI JSON** → 使用 LLM 结构化输出或提示
3. **验证与流式传输** → 检查 schema，发送到客户端
4. **处理操作** → 响应用户交互

## 从一个简单的智能体开始

我们将使用 ADK 构建一个简单的智能体。我们将从文本开始，最终将其升级到 A2UI。

请参阅 [ADK 快速入门](https://google.github.io/adk-docs/get-started/python/) 中的分步说明。

```bash
pip install google-adk
adk create my_agent
```

然后编辑 `my_agent/agent.py` 文件，创建一个非常简单的餐厅推荐智能体。

```python
import json
from google.adk.agents.llm_agent import Agent
from google.adk.tools.tool_context import ToolContext

def get_restaurants(tool_context: ToolContext) -> str:
    """Call this tool to get a list of restaurants."""
    return json.dumps([
        {
            "name": "Xi'an Famous Foods",
            "detail": "Spicy and savory hand-pulled noodles.",
            "imageUrl": "http://localhost:10002/static/shrimpchowmein.jpeg",
            "rating": "★★★★☆",
            "infoLink": "[More Info](https://www.xianfoods.com/)",
            "address": "81 St Marks Pl, New York, NY 10003"
        },
        {
            "name": "Han Dynasty",
            "detail": "Authentic Szechuan cuisine.",
            "imageUrl": "http://localhost:10002/static/mapotofu.jpeg",
            "rating": "★★★★☆",
            "infoLink": "[More Info](https://www.handynasty.net/)",
            "address": "90 3rd Ave, New York, NY 10003"
        },
        {
            "name": "RedFarm",
            "detail": "Modern Chinese with a farm-to-table approach.",
            "imageUrl": "http://localhost:10002/static/beefbroccoli.jpeg",
            "rating": "★★★★☆",
            "infoLink": "[More Info](https://www.redfarmnyc.com/)",
            "address": "529 Hudson St, New York, NY 10014"
        },
    ])

AGENT_INSTRUCTION="""
You are a helpful restaurant finding assistant. Your goal is to help users find and book restaurants using a rich UI.

To achieve this, you MUST follow this logic:

1.  **For finding restaurants:**
    a. You MUST call the `get_restaurants` tool. Extract the cuisine, location, and a specific number (`count`) of restaurants from the user's query (e.g., for "top 5 chinese places", count is 5).
    b. After receiving the data, you MUST follow the instructions precisely to generate the final a2ui UI JSON, using the appropriate UI example from the `prompt_builder.py` based on the number of restaurants."""

root_agent = Agent(
    model='gemini-2.5-flash',
    name="restaurant_agent",
    description="An agent that finds restaurants and helps book tables.",
    instruction=AGENT_INSTRUCTION,
    tools=[get_restaurants],
)
```

不要忘记设置 `GOOGLE_API_KEY` 环境变量来运行此示例。

```bash
echo 'GOOGLE_API_KEY="YOUR_API_KEY"' > .env
```

您可以使用 ADK Web 界面测试此智能体：

```bash
adk web
```

从列表中选择 `my_agent`，并询问有关纽约餐厅的问题。您应该会看到纯文本的餐厅列表。

## 生成 A2UI 消息

让 LLM 生成 A2UI 消息需要一些提示工程。

!!! warning "注意"
    这是我们仍在设计的领域。这方面的开发者工效学尚未最终确定。

目前，让我们从 contact lookup 示例复制 `a2ui_schema.py`。这是获取智能体的 A2UI schema 和示例的最简单方法（可能会更改）。

```bash
cp samples/agent/adk/contact_lookup/a2ui_schema.py my_agent/
```

首先，让我们将新的导入添加到 `agent.py` 文件中：

```python
# The schema for any A2UI message.  This never changes.
from .a2ui_schema import A2UI_SCHEMA
```

现在我们将修改智能体指令以生成 A2UI 消息而不是纯文本。我们将为未来的 UI 示例保留一个占位符。

```python

# Eventually you can copy & paste some UI examples here, for few-shot in context learning
RESTAURANT_UI_EXAMPLES = """
"""

# Construct the full prompt with UI instructions, examples, and schema
A2UI_AND_AGENT_INSTRUCTION = AGENT_INSTRUCTION + f"""

Your final output MUST be a a2ui UI JSON response.

To generate the response, you MUST follow these rules:
1.  Your response MUST be in two parts, separated by the delimiter: `---a2ui_JSON---`.
2.  The first part is your conversational text response.
3.  The second part is a single, raw JSON object which is a list of A2UI messages.
4.  The JSON part MUST validate against the A2UI JSON SCHEMA provided below.

--- UI TEMPLATE RULES ---
-   If the query is for a list of restaurants, use the restaurant data you have already received from the `get_restaurants` tool to populate the `dataModelUpdate.contents` array (e.g., as a `valueMap` for the "items" key).
-   If the number of restaurants is 5 or fewer, you MUST use the `SINGLE_COLUMN_LIST_EXAMPLE` template.
-   If the number of restaurants is more than 5, you MUST use the `TWO_COLUMN_LIST_EXAMPLE` template.
-   If the query is to book a restaurant (e.g., "USER_WANTS_TO_BOOK..."), you MUST use the `BOOKING_FORM_EXAMPLE` template.
-   If the query is a booking submission (e.g., "User submitted a booking..."), you MUST use the `CONFIRMATION_EXAMPLE` template.

{RESTAURANT_UI_EXAMPLES}

---BEGIN A2UI JSON SCHEMA---
{A2UI_SCHEMA}
---END A2UI JSON SCHEMA---
"""

root_agent = Agent(
    model='gemini-2.5-flash',
    name="restaurant_agent",
    description="An agent that finds restaurants and helps book tables.",
    instruction=A2UI_AND_AGENT_INSTRUCTION,
    tools=[get_restaurants],
)
```

## 理解输出

您的智能体将不再严格输出文本。相反，它将输出文本和 A2UI 消息的 **JSON 列表**。

我们导入的 `A2UI_SCHEMA` 是一个标准的 JSON schema，定义了有效的操作，如：

* `render` (显示 UI)
* `update` (更新现有 UI 中的数据)

因为输出是结构化 JSON，所以您可以在将其发送到客户端之前解析并验证它。

```python
# 1. Parse the JSON
# Warning: Parsing the output as JSON is a fragile implementation useful for documentation.
# LLMs often put Markdown fences around JSON output, and can make other mistakes.
# Rely on frameworks to parse the JSON for you.
parsed_json_data = json.loads(json_string_cleaned)

# 2. Validate against A2UI_SCHEMA
# This ensures the LLM generated valid A2UI commands
jsonschema.validate(
    instance=parsed_json_data, schema=self.a2ui_schema_object
)
```

通过针对 `A2UI_SCHEMA` 验证输出，您可以确保您的客户端永远不会收到格式错误的 UI 指令。

TODO: 继续本指南，举例说明如何在没有 A2A 扩展的情况下解析、验证并将其发送到客户端渲染器。
