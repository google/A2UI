# 数据流

消息如何从智能体流向 UI。

## 架构

```
Agent (LLM) → A2UI Generator → Transport (SSE/WS/A2A)
                                      ↓
Client (Stream Reader) → Message Parser → Renderer → Native UI
```

![end-to-end-data-flow](../assets/end-to-end-data-flow.png)

## 消息格式

A2UI 定义了一系列描述 UI 的 JSON 消息。在流式传输时，这些消息通常格式化为 **JSON Lines (JSONL)**，其中每一行都是一个完整的 JSON 对象。

```jsonl
{"surfaceUpdate":{"surfaceId":"main","components":[...]}}
{"dataModelUpdate":{"surfaceId":"main","contents":[{"key":"user","valueMap":[{"key":"name","valueString":"Alice"}]}]}}
{"beginRendering":{"surfaceId":"main","root":"root-component"}}
```

**为什么这种格式？**

一系列独立的 JSON 对象对流式传输友好，易于 LLM 增量生成，并且对错误具有弹性。

## 生命周期示例：餐厅预订

**用户：** "预订明天晚上 7 点的两人桌"

**1. 智能体定义 UI 结构：**

```json
{"surfaceUpdate": {"surfaceId": "booking", "components": [
  {"id": "root", "component": {"Column": {"children": {"explicitList": ["header", "guests-field", "submit-btn"]}}}},
  {"id": "header", "component": {"Text": {"text": {"literalString": "Confirm Reservation"}, "usageHint": "h1"}}},
  {"id": "guests-field", "component": {"TextField": {"label": {"literalString": "Guests"}, "text": {"path": "/reservation/guests"}}}},
  {"id": "submit-btn", "component": {"Button": {"child": "submit-text", "action": {"name": "confirm", "context": [{"key": "details", "value": {"path": "/reservation"}}]}}}}
]}}
```

**2. 智能体填充数据：**

```json
{"dataModelUpdate": {"surfaceId": "booking", "path": "/reservation", "contents": [
  {"key": "datetime", "valueString": "2025-12-16T19:00:00Z"},
  {"key": "guests", "valueString": "2"}
]}}
```

**3. 智能体信号通知渲染：**

```json
{"beginRendering": {"surfaceId": "booking", "root": "root"}}
```

**4. 用户将人数编辑为 "3"** → 客户端自动更新 `/reservation/guests`（尚未向智能体发送消息）

**5. 用户点击 "Confirm"** → 客户端发送带有更新数据的操作：

```json
{"userAction": {"name": "confirm", "surfaceId": "booking", "context": {"details": {"datetime": "2025-12-16T19:00:00Z", "guests": "3"}}}}
```

**6. 智能体响应** → 更新 UI 或发送 `{"deleteSurface": {"surfaceId": "booking"}}` 以进行清理

## 传输选项

- **A2A 协议**: 多智能体系统，也可用于智能体到 UI 的通信
- **AG UI**: 双向，实时
- ... 其他

更多细节请参见 [传输](../transports.md)。

## 渐进式渲染

与其在向用户显示任何内容之前等待生成整个响应，不如将响应块在生成时流式传输到客户端并渐进式渲染。

用户可以看到 UI 实时构建，而不是盯着旋转的加载图标。

## 错误处理

- **格式错误的消息：** 跳过并继续，或向智能体发送错误以进行更正
- **网络中断：** 显示错误状态，重新连接，智能体重新发送或恢复

## 性能

- **批处理：** 缓冲更新 16ms，批量渲染
- **Diffing：** 比较旧/新组件，仅更新更改的属性
- **细粒度更新：** 更新 `/user/name` 而不是整个 `/` 模型
