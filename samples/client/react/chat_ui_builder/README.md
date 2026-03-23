# React Chat UI Builder Client

这个前端示例会连接 Chat UI Builder 后端，并以增量方式渲染后端流式返回的 A2UI 数据帧。

## 前端如何接收 A2UI 数据帧

- 使用 `fetch()` 调用 `POST /api/chat/stream`。
- 通过 `response.body.getReader()` 持续读取 `application/x-ndjson`。
- 每读取到一行 JSON，就调用 `@a2ui/react` 的 `processMessages()`。
- 通过 `A2UIProvider` + `A2UIRenderer` 将这些帧渲染成真实 UI。

## 运行

```bash
cd samples/client/react/chat_ui_builder
npm install
npm run dev
```

默认连接 `http://localhost:8010`，也可以在页面中直接修改后端地址。
