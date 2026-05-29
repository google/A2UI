# A2UI 在哪里使用？

A2UI 正在被 Google 和合作伙伴组织的团队采用，以构建下一代智能体驱动的应用程序。以下是 A2UI 产生影响的真实示例。

## 生产部署

### Google Opal: 适于所有人的 AI 小程序

[Opal](http://opal.google) 使数十万人能够使用自然语言构建、编辑和共享 AI 小程序——无需编码。

**Opal 如何使用 A2UI：**

Google 的 Opal 团队从一开始就是 **A2UI 的核心贡献者**。他们使用 A2UI 来驱动动态的、生成式的 UI 系统，从而使 Opal 的 AI 小程序成为可能。

- **快速原型设计**：快速构建和测试新的 UI 模式
- **用户生成的应用**：任何人都可以创建具有自定义 UI 的应用
- **动态界面**：UI 自动适应每个用例

> "A2UI 是我们工作的基础。它给了我们灵活性，让我们能够以新颖的方式让 AI 驱动用户体验，而不受固定前端的限制。其声明式的性质和对安全性的关注使我们能够快速安全地进行实验。"
>
> **— Dimitri Glazkov**, Principal Engineer, Opal Team

**了解更多：** [opal.google](http://opal.google)

---

### Gemini Enterprise: 商业自定义智能体

Gemini Enterprise 使企业能够构建强大的、自定义的 AI 智能体，以适应其特定的工作流程和数据。

**Gemini Enterprise 如何使用 A2UI：**

A2UI 正在被集成以允许企业智能体在业务应用程序中渲染 **丰富的、交互式的 UI**——超越简单的文本响应，引导员工完成复杂的工作流程。

- **数据录入表单**：用于结构化数据收集的 AI 生成的表单
- **审批仪表板**：用于审查和审批流程的动态 UI
- **工作流自动化**：针对复杂任务的分步界面
- **自定义企业 UI**：针对特定行业需求的定制界面

> "我们的客户需要他们的智能体不仅仅是回答问题；他们需要智能体引导员工完成复杂的工作流程。A2UI 将允许在 Gemini Enterprise 上构建的开发人员让他们的智能体生成任何任务所需的动态、自定义 UI，从数据录入表单到审批仪表板，从而显著加速工作流自动化。"
>
> **— Fred Jabbour**, Product Manager, Gemini Enterprise

**了解更多：** [Gemini Enterprise](https://cloud.google.com/gemini)

---

### Flutter GenUI SDK: 移动端的生成式 UI

[Flutter GenUI SDK](https://docs.flutter.dev/ai/genui) 为跨移动、桌面和 Web 的 Flutter 应用程序带来了动态的、AI 生成的 UI。

**GenUI 如何使用 A2UI：**

GenUI SDK 使用 **A2UI 作为服务端智能体和 Flutter 应用程序之间通信的底层协议**。当您使用 GenUI 时，您在底层使用的就是 A2UI。

- **跨平台支持**：同一个智能体适用于 iOS, Android, web, desktop
- **原生性能**：Flutter widgets 在每个平台上原生渲染
- **品牌一致性**：UI 匹配您的应用设计系统
- **服务端驱动 UI**：智能体控制显示内容，无需应用更新

> "我们的开发人员选择 Flutter 是因为它允许他们快速创建富有表现力、品牌丰富、自定义的设计系统，在每个平台上都感觉很棒。A2UI 非常适合 Flutter 的 GenUI SDK，因为它确保每个平台上的每个用户都能获得高质量的原生体验。"
>
> **— Vijay Menon**, Engineering Director, Dart & Flutter

**试用：**
- [GenUI 文档](https://docs.flutter.dev/ai/genui)
- [入门视频](https://www.youtube.com/watch?v=nWr6eZKM6no)
- [Verdure 示例](https://github.com/flutter/genui/tree/main/examples/verdure) (client-server A2UI sample)

---

## 合作伙伴集成

### AG UI / CopilotKit: 全栈智能体框架

[AG UI](https://ag-ui.com/) 和 [CopilotKit](https://www.copilotkit.ai/) 提供了一个构建智能体式应用程序的综合框架，具有 **零日 A2UI 兼容性**。

**它们如何协同工作：**

AG UI 擅长在自定义前端与其专用智能体之间创建高带宽连接。通过添加 A2UI 支持，开发人员可以两全其美：

- **状态同步**：AG UI 处理应用状态和聊天记录
- **A2UI 渲染**：渲染来自第三方智能体的动态 UI
- **多智能体支持**：协调来自多个智能体的 UI
- **React 集成**：与 React 应用程序无缝集成

> "AG UI 擅长在自定义构建的前端与其专用智能体之间创建高带宽连接。通过添加对 A2UI 的支持，我们为开发人员提供了两全其美的方案。他们现在可以构建富文本、状态同步的应用程序，还可以通过 A2UI 渲染来自第三方智能体的动态 UI。这对于多智能体世界来说是完美的匹配。"
>
> **— Atai Barkai**, Founder of CopilotKit and AG UI

**了解更多：**
- [AG UI](https://ag-ui.com/)
- [CopilotKit](https://www.copilotkit.ai/)

---

### Google 的 AI 驱动产品

随着 Google 在全公司范围内采用 AI，A2UI 提供了一种 **AI 智能体交换用户界面的标准化方式**，而不仅仅是文本。

**内部智能体采用：**

- **多智能体工作流**：多个智能体贡献同一个 surface
- **远程智能体支持**：在不同服务上运行的智能体可以提供 UI
- **标准化**：跨团队的通用协议减少了集成开销
- **外部暴露**：内部智能体可以轻松地暴露给外部（例如，Gemini Enterprise）

> "就像 A2A 让任何智能体都可以与另一个智能体对话一样，无论平台如何，A2UI 标准化了用户界面层，并通过编排器支持远程智能体用例。这对内部团队来说非常强大，使他们能够快速开发智能体，其中丰富的用户界面是常态，而不是例外。随着 Google 进一步推进生成式 UI，A2UI 为在任何客户端上渲染的服务端驱动 UI 提供了一个完美的平台。"
>
> **— James Wren**, Senior Staff Engineer, AI Powered Google

---

## 社区项目

A2UI 社区正在构建令人兴奋的项目：

### 开源示例

- **餐厅查找器** ([samples/agent/adk/restaurant_finder](https://github.com/google/A2UI/tree/main/samples/agent/adk/restaurant_finder))
  - 带有动态表单的餐桌预订
  - 由 Gemini 驱动的智能体
  - 提供完整源代码

- **联系人查找** ([samples/agent/adk/contact_lookup](https://github.com/google/A2UI/tree/main/samples/agent/adk/contact_lookup))
  - 带有结果列表的搜索界面
  - A2A 智能体示例
  - 演示数据绑定

- **组件库** ([samples/client/angular - gallery mode](https://github.com/google/A2UI/tree/main/samples/client/angular))
  - 所有组件的交互式展示
  - 带有代码的实时示例
  - 非常适合学习

### 社区贡献

您是否用 A2UI 构建了一些东西？[与社区分享！](../community.md)

---

## 下一步

- [快速入门指南](../quickstart.md) - 尝试演示
- [智能体开发](../guides/agent-development.md) - 构建智能体
- [客户端设置](../guides/client-setup.md) - 集成渲染器
- [社区](../community.md) - 加入社区

---

**在生产中使用 A2UI？** 在 [GitHub Discussions](https://github.com/google/A2UI/discussions) 上分享您的故事。
