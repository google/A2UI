# 智能体 (服务端)

智能体是服务端程序，负责响应用户请求生成 A2UI 消息。

实际的组件渲染由 [渲染器](renderers.md) 完成，
在消息传输到客户端之后 [传输](transports.md)。
智能体仅负责生成 A2UI 消息。

## 智能体如何工作

```
用户输入 → 智能体逻辑 → LLM → A2UI JSON → 发送到客户端
```

1. **接收** 用户消息
2. **处理** 使用 LLM (Gemini, GPT, Claude 等)
3. **生成** A2UI JSON 消息作为结构化输出
4. **发送** 到客户端通过传输

来自客户端的用户交互可以被视为新的用户输入。

## 示例智能体

A2UI 仓库包含您可以以此学习的示例智能体：

- [餐厅查找器](https://github.com/google/A2UI/tree/main/samples/agent/adk/restaurant_finder)
    - 带有表单的餐桌预订
    - 使用 ADK 编写
- [联系人查找](https://github.com/google/A2UI/tree/main/samples/agent/adk/contact_lookup)
    - 带有结果列表的搜索
    - 使用 ADK 编写
- [Rizzcharts](https://github.com/google/A2UI/tree/main/samples/agent/adk/rizzcharts)
    - A2UI 自定义组件演示
    - 使用 ADK 编写
- [Orchestrator](https://github.com/google/A2UI/tree/main/samples/agent/adk/orchestrator)
    - 从远程子智能体传递 A2UI 消息
    - 使用 ADK 编写

## 您将使用 A2A 的不同类型的智能体

### 1. 面向用户的智能体 (独立)

面向用户的智能体是用户直接交互的智能体。

### 2. 作为远程智能体宿主的面向用户的智能体

这是一种模式，其中面向用户的智能体充当一个或多个远程智能体的宿主。面向用户的智能体将调用远程智能体，远程智能体将生成 A2UI 消息。这是 [A2A](https://a2a-protocol.org) 中的常见模式，客户端智能体调用服务器智能体。

- 面向用户的智能体可以“透传” A2UI 消息而不进行更改
- 面向用户的智能体可以在将 A2UI 消息发送到客户端之前对其进行更改

### 3. 远程智能体

远程智能体不直接是面向用户 UI 的一部分。相反，它被注册为远程智能体，可以由面向用户的智能体调用。这是 [A2A](https://a2a-protocol.org) 中的常见模式，客户端智能体调用服务器智能体。
