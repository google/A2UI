# 数据绑定

数据绑定使用 JSON Pointer 路径 ([RFC 6901](https://tools.ietf.org/html/rfc6901)) 将 UI 组件连接到应用程序状态。这使得 A2UI 能够有效地为大型数据数组定义布局，或显示更新的内容而无需从头重新生成。

## 结构 vs. 状态

A2UI 分离了：

1. **UI 结构** (组件): 界面看起来是什么样的
2. **应用程序状态** (数据模型): 它显示什么数据

这使得：响应式更新、数据驱动的 UI、可重用模板和双向绑定成为可能。

## 数据模型

每个 Surface 都有一个保存状态的 JSON 对象：

```json
{
  "user": {"name": "Alice", "email": "alice@example.com"},
  "cart": {
    "items": [{"name": "Widget", "price": 9.99, "quantity": 2}],
    "total": 19.98
  }
}
```

## JSON Pointer 路径

**语法：**

- `/user/name` - 对象属性
- `/cart/items/0` - 数组索引（从零开始）
- `/cart/items/0/price` - 嵌套路径

**示例：**

```json
{"user": {"name": "Alice"}, "items": ["Apple", "Banana"]}
```

- `/user/name` → `"Alice"`
- `/items/0` → `"Apple"`

## 字面量 vs. 路径值

**字面量 (固定):**
```json
{"id": "title", "component": {"Text": {"text": {"literalString": "Welcome"}}}}
```

**数据绑定 (响应式):**
```json
{"id": "username", "component": {"Text": {"text": {"path": "/user/name"}}}}
```

当 `/user/name` 从 "Alice" 更改为 "Bob" 时，文本 **自动更新** 为 "Bob"。

## 响应式更新

绑定到数据路径的组件会在数据更改时自动更新：

```json
{"id": "status", "component": {"Text": {"text": {"path": "/order/status"}}}}
```

- **初始数据：** `/order/status` = "Processing..." → 显示 "Processing..."
- **更新：** 发送 `dataModelUpdate` 内容为 `status: "Shipped"` → 显示 "Shipped"

无需更新组件——只需更新数据。

## 动态列表

使用模板渲染数组：

```json
{
  "id": "product-list",
  "component": {
    "Column": {
      "children": {"template": {"dataBinding": "/products", "componentId": "product-card"}}
    }
  }
}
```

**数据：**
```json
{"products": [{"name": "Widget", "price": 9.99}, {"name": "Gadget", "price": 19.99}]}
```

**结果：** 渲染两张卡片，每个产品一张。

### 作用域路径

在模板内部，路径的作用域限于数组项：

```json
{"id": "product-name", "component": {"Text": {"text": {"path": "/name"}}}}
```

- 对于 `/products/0`, `/name` 解析为 `/products/0/name` → "Widget"
- 对于 `/products/1`, `/name` 解析为 `/products/1/name` → "Gadget"

添加/移除项目会自动更新渲染的组件。

## 输入绑定

交互式组件双向更新数据模型：

| 组件 | 示例 | 用户操作 | 数据更新 |
|-----------|---------|-------------|-------------|
| **TextField** | `{"text": {"path": "/form/name"}}` | 输入 "Alice" | `/form/name` = "Alice" |
| **CheckBox** | `{"value": {"path": "/form/agreed"}}` | 勾选复选框 | `/form/agreed` = true |
| **MultipleChoice** | `{"selections": {"path": "/form/country"}}` | 选择 "Canada" | `/form/country` = ["ca"] |

## 最佳实践

**1. 使用细粒度更新** - 仅更新更改的路径：
```json
{"dataModelUpdate": {"path": "/user", "contents": [{"key": "name", "valueString": "Alice"}]}}
```

**2. 按领域组织** - 对相关数据进行分组：
```json
{"user": {...}, "cart": {...}, "ui": {...}}
```

**3. 预计算显示值** - 智能体在发送之前格式化数据（货币、日期）：
```json
{"price": "$19.99"}  // 而不是: {"price": 19.99}
```
