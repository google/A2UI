# 消息类型 (Message Types)

本参考文档提供了所有 A2UI 消息类型的详细文档。

## 消息格式 (Message Format)

所有 A2UI 消息都是作为 JSON Lines (JSONL) 发送的 JSON 对象。每一行包含恰好一条消息，每条消息包含以下四个键之一：

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

## beginRendering

通知客户端它有足够的信息来执行 Surface 的初始渲染。

### Schema

```typescript
{
  beginRendering: {
    surfaceId: string;      // 必需: 唯一的 Surface 标识符
    root: string;           // 必需: 要渲染的根组件的 ID
    catalogId?: string;     // 可选: 组件目录的 URL
    styles?: object;        // 可选: 样式信息
  }
}
```

### 属性 (Properties)

| 属性 | 类型 | 必需 | 描述 |
| :--- | :--- | :--- | :--- |
| `surfaceId` | string | ✅ | 此 Surface 的唯一标识符。 |
| `root` | string | ✅ | 应该是此 Surface 的 UI 树根的组件的 `id`。 |
| `catalogId` | string | ❌ | 组件目录的标识符。如果省略，默认使用 v0.8 标准目录。 |
| `styles` | object | ❌ | UI 的样式信息，由目录定义。 |

### 示例 (Examples)

**基本渲染信号:**

```json
{
  "beginRendering": {
    "surfaceId": "main",
    "root": "root-component"
  }
}
```

**使用自定义目录:**

```json
{
  "beginRendering": {
    "surfaceId": "custom-ui",
    "root": "root-custom",
    "catalogId": "https://my-company.com/a2ui/v0.8/my_custom_catalog.json"
  }
}
```

### 使用说明 (Usage Notes)

- 必须在客户端收到根组件及其初始子组件的组件定义后发送。
- 客户端应缓冲 `surfaceUpdate` 和 `dataModelUpdate` 消息，并且仅在收到相应的 `beginRendering` 消息后才渲染 Surface 的 UI。

---

## surfaceUpdate

在 Surface 内添加或更新组件。

### Schema

```typescript
{
  surfaceUpdate: {
    surfaceId: string;        // 必需: 目标 Surface
    components: Array<{       // 必需: 组件列表
      id: string;             // 必需: 组件 ID
      component: {            // 必需: 组件数据的包装器
        [ComponentType]: {    // 必需: 恰好一种组件类型
          ...properties       // 组件特定属性
        }
      }
    }>
  }
}
```

### 属性 (Properties)

| 属性 | 类型 | 必需 | 描述 |
| :--- | :--- | :--- | :--- |
| `surfaceId` | string | ✅ | 要更新的 Surface 的 ID |
| `components` | array | ✅ | 组件定义数组 |

### 组件对象 (Component Object)

`components` 数组中的每个对象必须具有：

- `id` (string, required): Surface 内的唯一标识符
- `component` (object, required): 一个包装器对象，包含恰好一个键，即组件类型（例如，`Text`, `Button`）。

### 示例 (Examples)

**单个组件:**

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "greeting",
        "component": {
          "Text": {
            "text": {"literalString": "Hello, World!"},
            "usageHint": "h1"
          }
        }
      }
    ]
  }
}
```

**多个组件 (邻接表):**

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "root",
        "component": {
          "Column": {
            "children": {"explicitList": ["header", "body"]}
          }
        }
      },
      {
        "id": "header",
        "component": {
          "Text": {
            "text": {"literalString": "Welcome"}
          }
        }
      },
      {
        "id": "body",
        "component": {
          "Card": {
            "child": "content"
          }
        }
      },
      {
        "id": "content",
        "component": {
          "Text": {
            "text": {"path": "/message"}
          }
        }
      }
    ]
  }
}
```

**更新现有组件:**

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "greeting",
        "component": {
          "Text": {
            "text": {"literalString": "Hello, Alice!"},
            "usageHint": "h1"
          }
        }
      }
    ]
  }
}
```

具有 `id: "greeting"` 的组件被更新（不是重复）。

### 使用说明 (Usage Notes)

- 必须在 `beginRendering` 消息中指定一个组件作为 `root`，作为树的根。
- 组件形成邻接表（带有 ID 引用的平面结构）。
- 发送具有现有 ID 的组件会更新该组件。
- 子组件通过 ID 引用。
- 组件可以增量添加（流式传输）。

### 错误 (Errors)

| 错误 | 原因 | 解决方案 |
| :--- | :--- | :--- |
| Surface not found | `surfaceId` 不存在 | 确保对给定的 Surface 一致地使用唯一的 `surfaceId`。Surface 在第一次更新时隐式创建。 |
| Invalid component type | 未知的组件类型 | 检查组件类型是否存在于协商的目录中。 |
| Invalid property | 该类型不存在此属性 | 针对目录 schema 进行验证。 |
| Circular reference | 组件引用自己作为子组件 | 修复组件层级结构。 |

---

## dataModelUpdate

更新组件绑定的数据模型。

### Schema

```typescript
{
  dataModelUpdate: {
    surfaceId: string;      // 必需: 目标 Surface
    path?: string;          // 可选: 模型中位置的路径
    contents: Array<{       // 必需: 数据条目
      key: string;
      valueString?: string;
      valueNumber?: number;
      valueBoolean?: boolean;
      valueMap?: Array<{...}>;
    }>
  }
}
```

### 属性 (Properties)

| 属性 | 类型 | 必需 | 描述 |
| :--- | :--- | :--- | :--- |
| `surfaceId` | string | ✅ | 要更新的 Surface 的 ID。 |
| `path` | string | ❌ | 数据模型内位置的路径（例如 'user'）。如果省略，则更新适用于根。 |
| `contents` | array | ✅ | 作为邻接表的数据条目数组。每个条目都有一个 `key` 和一个类型化的 `value*` 属性。 |

### `contents` 邻接表

`contents` 数组是键值对列表。数组中的每个对象必须有一个 `key` 和恰好一个 `value*` 属性（`valueString`, `valueNumber`, `valueBoolean`, 或 `valueMap`）。这种结构对 LLM 友好，避免了从通用 `value` 字段推断类型的问题。

### 示例 (Examples)

**初始化整个模型:**

如果省略 `path`，`contents` 将替换 Surface 的整个数据模型。

```json
{
  "dataModelUpdate": {
    "surfaceId": "main",
    "contents": [
      {
        "key": "user",
        "valueMap": [
          { "key": "name", "valueString": "Alice" },
          { "key": "email", "valueString": "alice@example.com" }
        ]
      },
      { "key": "items", "valueMap": [] }
    ]
  }
}
```

**更新嵌套属性:**

如果提供了 `path`，`contents` 将更新该位置的数据。

```json
{
  "dataModelUpdate": {
    "surfaceId": "main",
    "path": "user",
    "contents": [
      { "key": "email", "valueString": "alice@newdomain.com" }
    ]
  }
}
```

这将在不影响 `/user/name` 的情况下更改 `/user/email`。

### 使用说明 (Usage Notes)

- 数据模型是每个 Surface 独立的。
- 当组件绑定的数据发生更改时，组件会自动重新渲染。
- 优先选择特定路径的细粒度更新，而不是替换整个模型。
- 数据模型是一个普通的 JSON 对象。
- 任何数据转换（例如，格式化日期）必须由服务器在发送 `dataModelUpdate` 消息之前完成。

---

## deleteSurface

移除 Surface 及其所有组件和数据。

### Schema

```typescript
{
  deleteSurface: {
    surfaceId: string;        // 必需: 要删除的 Surface
  }
}
```

### 属性 (Properties)

| 属性 | 类型 | 必需 | 描述 |
| :--- | :--- | :--- | :--- |
| `surfaceId` | string | ✅ | 要删除的 Surface 的 ID |

### 示例 (Examples)

**删除一个 Surface:**

```json
{
  "deleteSurface": {
    "surfaceId": "modal"
  }
}
```

**删除多个 Surface:**

```json
{
  "deleteSurface": {
    "surfaceId": "sidebar"
  }
}
{
  "deleteSurface": {
    "surfaceId": "content"
  }
}
```

### 使用说明 (Usage Notes)

- 移除与 Surface 关联的所有组件
- 清除 Surface 的数据模型
- 客户端应从 UI 中移除该 Surface
- 删除不存在的 Surface 是安全的（无操作）
- 用于关闭模态框、对话框或离开页面时

### 错误 (Errors)

| 错误 | 原因 | 解决方案 |
| :--- | :--- | :--- |
| (无 - 删除是幂等的) | | |

---

## 消息顺序 (Message Ordering)

### 要求 (Requirements)

1. `beginRendering` 必须在该 Surface 的初始 `surfaceUpdate` 消息之后。
2. `surfaceUpdate` 可以在 `dataModelUpdate` 之前或之后。
3. 不同 Surface 的消息是独立的。
4. 多个消息可以增量更新同一个 Surface。

### 推荐顺序 (Recommended Order)

```jsonl
{"surfaceUpdate": {"surfaceId": "main", "components": [...]}}
{"dataModelUpdate": {"surfaceId": "main", "contents": {...}}}
{"beginRendering": {"surfaceId": "main", "root": "root-id"}}
```

### 渐进式构建 (Progressive Building)

```jsonl
{"surfaceUpdate": {"surfaceId": "main", "components": [...]}}  // Header
{"surfaceUpdate": {"surfaceId": "main", "components": [...]}}  // Body
{"beginRendering": {"surfaceId": "main", "root": "root-id"}} // Initial render
{"surfaceUpdate": {"surfaceId": "main", "components": [...]}}  // Footer (after initial render)
{"dataModelUpdate": {"surfaceId": "main", "contents": {...}}}   // Populate data
```

## 验证 (Validation)

所有消息应针对以下内容进行验证：

- **[server_to_client.json](https://github.com/google/A2UI/blob/main/specification/v0_8/json/server_to_client.json)**: 消息信封 Schema
- **[standard_catalog_definition.json](https://github.com/google/A2UI/blob/main/specification/v0_8/json/standard_catalog_definition.json)**: 组件 Schemas

## 延伸阅读 (Further Reading)

- **[组件库](components.md)**: 所有可用的组件类型
- **[数据绑定指南](../concepts/data-binding.md)**: 数据绑定如何工作
- **[智能体开发指南](../guides/agent-development.md)**: 生成有效消息
