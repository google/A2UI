# Chat UI Builder Demo

这个 demo 会把自然语言需求转换成增量 A2UI 数据帧。
它通过 LiteLLM 调用本地 OpenAI-compatible 模型，让模型输出 **Intent Plan JSON**，
后端再经过 Design Lint、Layout Policy Engine、Layout IR 与 A2UI Compiler，把语义规划编译成严格的 A2UI v0.8 数据帧并流式返回给前端。

## 为什么需要这个 demo

和固定领域模板示例不同，这个 demo 不把模型锁死在单一业务域里。
模型会先输出页面意图规划，后端再负责布局骨架、容器补全、分栏规则与 A2UI frame 生成。

## 本地模型配置

服务默认指向一个本地 OpenAI-compatible 端点：

```bash
export OPENAI_API_BASE="http://10.50.95.196:8000/v1"
export OPENAI_API_KEY="sk-1234"
export LITELLM_MODEL="openai/qwen3.5"
```

可选日志参数：

```bash
export LOG_LEVEL="INFO"
export MAX_LOG_CHARS="1200"
```

后端会记录：
- LLM 调用端点、模型名、温度
- 发送给 LLM 的消息
- LLM 的流式 chunk / Intent Plan JSON
- Intent Plan、Layout IR 与编译后的 A2UI 骨架帧摘要
- 编译后的 A2UI 数据帧

## 启动后端

```bash
cd samples/agent/adk/chat_ui_builder
uv run .
```

默认启动在 `http://localhost:8010`。

## API

### `POST /api/chat/stream`

请求体：

```json
{ "message": "请生成一个客户看板，包含客户等级、最近订单和跟进按钮。" }
```

返回：
- `application/x-ndjson`
- 每一行都是一个合法的 A2UI envelope（`beginRendering`、`surfaceUpdate`、`dataModelUpdate` 或 `deleteSurface`）

## 中间层说明

当前版本的新主路径不再要求模型直接输出底层 `add_section / add_text / add_button` 组合，
而是先输出：

- `Intent Plan`：页面级意图（page kind / emphasis / density / sections / actions）

后端会依次经过：

- `Design Lint`：补摘要、合并过多 section、限制主动作数量
- `Layout Policy Engine`：根据页面类型与强调点选择骨架策略
- `Layout IR`：表达页面骨架与区域关系，而不是直接输出 A2UI
- `IntentFrameCompiler`：把 Layout IR 编译成 `beginRendering` / `surfaceUpdate` / `dataModelUpdate`

旧的 skeleton / delta 协议仍保留为兼容 fallback，但不再是主流程。

## 前端 demo

对应的 React 前端位于：

```bash
samples/client/react/chat_ui_builder
```
