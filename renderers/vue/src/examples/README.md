# A2UI Vue Components Examples

这个目录包含了 A2UI Vue 核心组件的交互式示例。

## 快速开始

在 `renderers/vue` 目录下运行：

```bash
# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

这将启动 Vite 开发服务器，自动在浏览器中打开示例页面（默认地址：http://localhost:5173）。

## 构建示例

如果需要构建examples用于部署：

```bash
npm run build:examples
```

构建后的文件将输出到 `dist-examples` 目录。

## 预览构建后的示例

```bash
npm run preview:examples
```

## 可用的组件示例

示例页面包含以下 A2UI 组件的交互式演示：

- **Text** - 文本显示组件，支持不同样式和Markdown
- **Button** - 可点击的按钮组件
- **Card** - 卡片容器组件
- **Row** - 水平布局容器
- **Column** - 垂直布局容器
- **List** - 列表组件
- **Divider** - 分割线

## 项目结构

```
src/examples/
├── index.html          # HTML入口文件
├── main.ts            # TypeScript入口
├── App.vue            # 主应用组件（包含导航）
├── style.css          # 全局样式
└── components/        # 各组件示例
    ├── TextExample.vue
    ├── ButtonExample.vue
    ├── CardExample.vue
    └── ...
```

## 开发说明

- 每个组件示例都是独立的 Vue 组件
- 可以通过顶部导航切换查看不同组件的示例
- 选择 "All Examples" 可以查看所有组件的示例
- 所有交互式组件（如输入框、滑块等）都是实时响应的

## 构建库文件

如果需要构建 A2UI Vue 库本身（而不是示例）：

```bash
npm run build
```

这将在 `dist` 目录中生成库文件。
