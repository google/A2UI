# 什么是 A2UI？

**A2UI (Agent to UI) 是一个用于智能体驱动界面的声明式 UI 协议。** AI 智能体生成丰富、交互式的 UI，这些 UI 可以在跨平台（Web、移动、桌面）上原生渲染，而无需执行任意代码。

## 问题

**这纯文本智能体交互效率低下：**

```
User: "预订明天晚上 7 点的两人桌"
Agent: "好的，哪一天？"
User: "明天"
Agent: "几点？"
...
```

**更好：** 智能体生成一个带有日期选择器、时间选择器和提交按钮的表单。用户与 UI 交互，而不是文本。

## 挑战

在多智能体系统中，智能体通常在远程运行（不同的服务器、组织）。它们不能直接操作您的 UI——它们必须发送消息。

**传统方法：** 在 iframe 中发送 HTML/JavaScript

- 沉重，视觉上脱节
- 安全复杂性
- 不匹配应用样式

**需求：** 传输像数据一样安全，像代码一样具有表现力的 UI。

## 解决方案

A2UI：描述 UI 的 JSON 消息：

- LLM 作为结构化输出生成
- 通过任何传输（A2A, AG UI, SSE, WebSockets）传输
- 客户端使用其自己的原生组件进行渲染

**结果：** 客户端控制安全性和样式，智能体生成的 UI 感觉是原生的。

### 示例

```json
{"surfaceUpdate": {"surfaceId": "booking", "components": [
  {"id": "title", "component": {"Text": {"text": {"literalString": "Book Your Table"}, "usageHint": "h1"}}},
  {"id": "datetime", "component": {"DateTimeInput": {"value": {"path": "/booking/date"}, "enableDate": true}}},
  {"id": "submit-text", "component": {"Text": {"text": {"literalString": "Confirm"}}}},
  {"id": "submit-btn", "component": {"Button": {"child": "submit-text", "action": {"name": "confirm_booking"}}}}
]}}
```

```json
{"dataModelUpdate": {"surfaceId": "booking", "contents": [
  {"key": "booking", "valueMap": [{"key": "date", "valueString": "2025-12-16T19:00:00Z"}]}
]}}
```

```json
{"beginRendering": {"surfaceId": "booking", "root": "title"}}
```

客户端将这些消息渲染为原生组件（Angular, Flutter, React 等）。

## 核心价值

**1. 安全性：** 声明式数据，而非代码。智能体从客户端受信任的目录中请求组件。没有代码执行风险。

**2. 原生感觉：** 没有 iframe。客户端使用其自己的 UI 框架进行渲染。继承应用样式、无障碍性、性能。

**3. 可移植性：** 一个智能体响应随处可用。相同的 JSON 在 Web (Lit/Angular/React)、移动 (Flutter/SwiftUI/Jetpack Compose)、桌面上渲染。

## 设计原则

**1. LLM 友好：** 带有 ID 引用的扁平组件列表。易于增量生成、纠正错误、流式传输。

**2. 框架无关：** 智能体发送抽象组件树。客户端映射到原生 widgets（Web/移动/桌面）。

**3. 关注点分离：** 三层——UI 结构、应用程序状态、客户端渲染。启用数据绑定、响应式更新、清洁架构。

## A2UI 不是什么

- 不是一个框架（它是一个协议）
- 不是 HTML 的替代品（用于智能体生成的 UI，而不是静态网站）
- 不是一个强大的样式系统（客户端控制样式，服务端样式支持有限）
- 不限于 Web（适用于移动和桌面）

## 关键概念

- **Surface**：组件的画布（对话框、侧边栏、主视图）
- **Component**：UI 元素（按钮、文本框、卡片等）
- **Data Model**：应用程序状态，组件绑定到它
- **Catalog**：可用的组件类型
- **Message**：JSON 对象 (`surfaceUpdate`, `dataModelUpdate`, `beginRendering` 等)

要比较类似项目，请参见 [智能体 UI 生态系统](agent-ui-ecosystem.md)。
