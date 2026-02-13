# 路线图

本路线图概述了 A2UI 项目的现状和未来计划。该项目正处于积极开发中，优先级可能会根据社区反馈和新兴用例而变化。

## 当前状态

### 协议

| 版本 | 状态 | 说明 |
|---------|--------|-------|
| **v0.8** | ✅ 稳定 | 首次公开发布 |
| **v0.9** | 🚧 进行中 | 规范草案改进 |

主要特性：

- ✅ 流式 JSONL 消息格式
- ✅ 四种核心消息类型 (`surfaceUpdate`, `dataModelUpdate`, `beginRendering`, `deleteSurface`)
- ✅ 邻接表组件模型
- ✅ 基于 JSON Pointer 的数据绑定
- ✅ 结构与状态分离

### 渲染器

| 客户端库 | 状态 | 平台 | 说明 |
|-----------------|--------|----------|-------|
| **Web Components (Lit)** | ✅ 稳定 | Web | 框架无关，随处可用 |
| **Angular** | ✅ 稳定 | Web | 完整的 Angular 集成 |
| **Flutter (GenUI SDK)** | ✅ 稳定 | 多平台 | 适用于移动端、Web、桌面端 |
| **React** | 🚧 进行中 | Web | 预计 2026 年第一季度 |
| **SwiftUI** | 📋 计划中 | iOS/macOS | 预计 2026 年第二季度 |
| **Jetpack Compose** | 📋 计划中 | Android | 预计 2026 年第二季度 |
| **Vue** | 💡 提议中 | Web | 社区兴趣 |
| [**Svelte/Kit**](https://svelte.dev/docs/kit/introduction) | 💡 提议中 | Web | [社区兴趣](https://news.ycombinator.com/item?id=46287728) |
| **ShadCN (React)** | 💡 提议中 | Web | 社区兴趣 |

### 传输

| 传输 | 状态 | 说明 |
|-------------|--------|-------|
| **A2A 协议** | ✅ 完成 | 原生 A2A 传输 |
| **AG UI** | ✅ 完成 | 零日兼容性 |
| **REST API** | 📋 计划中 | 双向通信 |
| **WebSockets** | 💡 提议中 | 双向通信 |
| **SSE (Server-Sent Events)** | 💡 提议中 | Web 流式传输 |
| **MCP (Model Context Protocol)** | 💡 提议中 | 社区兴趣 |

### 智能体 UI 工具包

| 智能体 UI 工具包 | 状态 | 说明 |
|-------------|--------|-------|
| **CopilotKit** | ✅ 完成 | 由于 AG UI 而具备零日兼容性 |
| **Open AI ChatKit** | 💡 提议中 | 社区兴趣 |
| **Vecel AI SDK UI** | 💡 提议中 | 社区兴趣 |

### 智能体框架

| 集成 | 状态 | 说明 |
|-------------|--------|-------|
| **任何支持 A2A 的智能体** | ✅ 完成 | 由于 A2A 协议而具备零日兼容性 |
| **ADK** | 📋 计划中 | 仍在设计开发者工效学，参见 [示例](https://github.com/google/A2UI/tree/main/samples/agent/adk) |
| **Genkit** | 💡 提议中 | 社区兴趣 |
| **LangGraph** | 💡 提议中 | 社区兴趣 |
| **CrewAI** | 💡 提议中 | 社区兴趣 |
| **AG2** | 💡 提议中 | 社区兴趣 |
| **Claude Agent SDK** | 💡 提议中 | 社区兴趣 |
| **OpenAI Agent SDK** | 💡 提议中 | 社区兴趣 |
| **Microsoft Agent Framework** | 💡 提议中 | 社区兴趣 |
| **AWS Strands Agent SDK** | 💡 提议中 | 社区兴趣 |

## 近期里程碑

### 2025 年第二季度

多个 Google 团队的众多研究项目，包括集成到内部产品和智能体中。

### 2025 年第四季度

- v0.8.0 规范发布
- A2A 扩展（感谢 Google A2A 团队！在 [a2asummit.ai](https://a2asummit.ai) 上预告）
- Flutter 渲染器（感谢 Flutter 团队！）
- Angular 渲染器（感谢 Angular 团队！）
- Web Components (Lit) 渲染器（感谢 Opal 团队及朋友们！）
- AG UI / CopilotKit 集成（感谢 CopilotKit 团队！）
- Github 公开发布 (Apache 2.0)

## 即将到来的里程碑

### 2026 年第一季度

#### A2UI v0.9

- 规范 0.9 候选发布版
- 改进渲染器的多主题支持（完成）
- 改进智能体的服务器端主题支持（最小化）
- 改进开发者工效学

#### React 渲染器

基于 Hooks API 和完整 TypeScript 支持的原生 React 渲染器。

- 常用组件的 React 支持
- 自定义组件的 React 支持
- 用于消息处理的 `useA2UI` hook
- React 主题支持

### 2026 年第二季度

#### 原生移动端渲染器

iOS 和 Android 平台的原生渲染器。

**SwiftUI 渲染器 (iOS/macOS):**

- 原生 SwiftUI 组件
- iOS 设计语言支持
- macOS 兼容性

**Jetpack Compose 渲染器 (Android):**

- 原生 Compose UI 组件
- Material Design 3 支持
- Android 平台集成

#### 性能优化

- 渲染器性能基准测试
- 大型组件树的懒加载
- 列表的虚拟滚动
- 组件记忆化策略

### 2026 年第四季度

#### 协议 v1.0

最终确定协议 v1.0，包括：

- 稳定性保证
- v0.9 的迁移路径
- 全面的测试套件
- 渲染器认证计划

## 长期愿景

### 多智能体协作

增强对多个智能体贡献同一 UI 的支持：

- 推荐的智能体组合模式
- 冲突解决策略
- 共享 Surface 管理

### 无障碍功能

一流的无障碍支持：

- ARIA 属性生成
- 屏幕阅读器优化
- 键盘导航标准
- 对比度和颜色指南

### 高级 UI 模式

支持更复杂的 UI 交互：

- 拖放
- 手势和动画
- 3D 渲染
- AR/VR 界面（探索性）

### 生态系统增长

- 更多框架集成
- 第三方组件库
- 智能体市场集成
- 企业功能和支持

## 社区请求

社区请求的功能（排名不分先后）：

- **更多渲染器集成**：从您的客户端库映射到 A2UI
- **更多智能体框架**：从您的智能体框架映射到 A2UI
- **更多传输**：从您的传输映射到 A2UI
- **社区组件库**：与社区共享自定义组件
- **社区示例**：与社区共享自定义示例
- **社区评估**：生成式 UI 评估场景和标记数据集
- **开发者工效学**：如果您能构建更好的 A2UI 体验，请与社区分享

## 如何影响路线图

我们需要社区对优先级的输入：

1. **投票 Issues**：给您关心的 GitHub issues 点赞 👍
2. **提议功能**：在 GitHub 上发起讨论（请先搜索现有讨论）
3. **提交 PR**：构建您需要的功能（请先搜索现有 PR）
4. **加入讨论**：分享您的用例和需求（请先搜索现有讨论）

## 发布周期

- **主版本 (Major)** (1.0, 2.0)：每年或当需要重大破坏性更改时
- **次版本 (Minor)** (1.1, 1.2)：每季度，包含新功能
- **补丁版本 (Patch)** (1.1.1, 1.1.2)：按需进行 bug 修复

## 版本控制策略

A2UI 遵循 [语义化版本控制 (Semantic Versioning)](https://semver.org/)：

- **MAJOR**：不兼容的协议更改
- **MINOR**：向后兼容的功能添加
- **PATCH**：向后兼容的错误修复

## 参与其中

想为路线图做出贡献？

- 在 [GitHub Discussions](https://github.com/google/A2UI/discussions) 中 **提议功能**
- **构建原型** 并与社区分享
- 在 GitHub Issues 上 **加入对话**

## 保持更新

- 关注 [GitHub 仓库](https://github.com/google/A2UI) 以获取更新
- 星标仓库以示支持
- 关注发布以获取新版本通知

---

**最后更新：** 2025 年 12 月

对路线图有疑问？[在 GitHub 上发起讨论](https://github.com/google/A2UI/discussions)。
