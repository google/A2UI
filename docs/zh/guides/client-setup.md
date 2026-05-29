# 客户端设置指南

使用适合您平台的渲染器将 A2UI 集成到您的应用程序中。

## 渲染器

| 渲染器                 | 平台           | 状态            |
| ------------------------ | ------------------ | ----------------- |
| **Lit (Web Components)** | Web                | ✅ 稳定          |
| **Angular**              | Web                | ✅ 稳定          |
| **Flutter (GenUI SDK)**  | 移动/桌面/Web | ✅ 稳定          |
| **React**                | Web                | 🚧 预计 2026 年第一季度  |
| **SwiftUI**              | iOS/macOS          | 🚧 计划 2026 年第二季度 |
| **Jetpack Compose**      | Android            | 🚧 计划 2026 年第二季度 |

## Web Components (Lit)

!!! warning "注意"
    Lit 客户端库尚未发布到 NPM。请在未来几天回来查看。

```bash
npm install @a2ui/web-lib lit @lit-labs/signals
```

Lit 渲染器使用：

- **Message Processor**: 管理 A2UI 状态并处理传入消息
- **`<a2ui-surface>` component**: 在您的应用中渲染 Surfaces
- **Lit Signals**: 提供响应式状态管理以自动更新 UI

TODO: 添加经过验证的设置示例。

**查看工作示例：** [Lit shell sample](https://github.com/google/a2ui/tree/main/samples/client/lit/shell)

## Angular

!!! warning "注意"
    Angular 客户端库尚未发布到 NPM。请在未来几天回来查看。

```bash
npm install @a2ui/angular @a2ui/web-lib
```

Angular 渲染器提供：

- **`provideA2UI()` function**: 在您的应用配置中配置 A2UI
- **`Surface` component**: 渲染 A2UI Surfaces
- **`MessageProcessor` service**: 处理传入的 A2UI 消息

TODO: 添加经过验证的设置示例。

**查看工作示例：** [Angular restaurant sample](https://github.com/google/a2ui/tree/main/samples/client/angular/projects/restaurant)

## Flutter (GenUI SDK)

```bash
flutter pub add flutter_genui
```

Flutter 使用提供原生 A2UI 渲染的 GenUI SDK。

**文档：** [GenUI SDK](https://docs.flutter.dev/ai/genui) | [GitHub](https://github.com/flutter/genui) | [GenUI Flutter Package 中的 README](https://github.com/flutter/genui/blob/main/packages/genui/README.md#getting-started-with-genui)

## 连接到智能体

您的客户端应用程序需要：
1. 从智能体 **接收 A2UI 消息**（通过传输）
2. 使用 Message Processor **处理消息**
3. 将 **用户操作发送** 回智能体

常见的传输选项：
- **Server-Sent Events (SSE)**: 从服务器到客户端的单向流
- **WebSockets**: 双向实时通信
- **A2A 协议**: 支持 A2UI 的标准化智能体对智能体通信

TODO: 添加传输实现示例。

**参见：** [传输指南](../transports.md)

## 处理用户操作

当用户与 A2UI 组件交互（点击按钮、提交表单等）时，客户端：
1. 捕获组件的操作事件
2. 解析操作所需的所有数据上下文
3. 将操作发送给智能体
4. 处理智能体的响应消息

TODO: 添加操作处理示例。

## 错误处理

需要处理的常见错误：
- **无效的 Surface ID**: 在收到 `beginRendering` 之前引用了 Surface
- **无效的组件 ID**: 组件 ID 在 Surface 内必须唯一
- **无效的数据路径**: 检查数据模型结构和 JSON Pointer 语法
- **Schema 验证失败**: 验证消息格式是否符合 A2UI 规范

TODO: 添加错误处理示例。

## 下一步

- **[快速入门](../quickstart.md)**: 尝试演示应用程序
- **[主题与样式](theming.md)**: 自定义外观和感觉
- **[自定义组件](custom-components.md)**: 扩展组件目录
- **[智能体开发](agent-development.md)**: 构建生成 A2UI 的智能体
- **[参考文档](../reference/messages.md)**: 深入了解协议
