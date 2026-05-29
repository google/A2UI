# 我该如何使用 A2UI？

选择与您的角色和用例相匹配的集成路径。

## 三条路径

### 路径 1：构建宿主应用程序 (前端)

将 A2UI 渲染集成到您现有的应用程序中，或者构建一个新的智能体驱动的前端。

**选择渲染器：**

- **Web:** Lit, Angular
- **移动/桌面:** Flutter GenUI SDK
- **React:** 预计 2026 年第一季度

**快速设置：**

如果我们使用 Angular 应用程序，我们可以添加 Angular 渲染器：

```bash
npm install @a2ui/angular 
```

连接到智能体消息（SSE, WebSockets 或 A2A）并自定义样式以匹配您的品牌。

**下一步：** [客户端设置指南](../guides/client-setup.md) | [主题](../guides/theming.md)

---

### 路径 2：构建智能体 (后端)

创建一个为任何兼容客户端生成 A2UI 响应的智能体。

**选择您的框架：**

- **Python:** Google ADK, LangChain, 自定义
- **Node.js:** A2A SDK, Vercel AI SDK, 自定义

将 A2UI schema 包含在您的 LLM prompts 中，生成 JSONL 消息，并通过 SSE, WebSockets 或 A2A 流式传输到客户端。

**下一步：** [智能体开发指南](../guides/agent-development.md)

---

### 路径 3：使用现有框架

通过具有内置支持的框架使用 A2UI：

- **[AG UI / CopilotKit](https://ag-ui.com/)** - 带有 A2UI 渲染的全栈 React 框架
- **[Flutter GenUI SDK](https://docs.flutter.dev/ai/genui)** - 跨平台生成式 UI（内部使用 A2UI）

**下一步：** [智能体 UI 生态系统](agent-ui-ecosystem.md) | [A2UI 在哪里使用？](where-is-it-used.md)
