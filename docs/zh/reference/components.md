# 组件库 (Component Gallery)

本页面展示了所有标准 A2UI 组件的示例和使用模式。有关完整的技术规范，请参阅 [标准目录定义](https://github.com/google/A2UI/blob/main/specification/v0_8/json/standard_catalog_definition.json)。

## 布局组件 (Layout Components)

### Row (行)

水平布局容器。子组件从左到右排列。

```json
{
  "id": "toolbar",
  "component": {
    "Row": {
      "children": {"explicitList": ["btn1", "btn2", "btn3"]},
      "alignment": "center"
    }
  }
}
```

**属性:**

- `children`: 静态数组 (`explicitList`) 或动态 `template`
- `distribution`: 子组件的水平分布 (`start`, `center`, `end`, `spaceBetween`, `spaceAround`, `spaceEvenly`)
- `alignment`: 垂直对齐 (`start`, `center`, `end`, `stretch`)

### Column (列)

垂直布局容器。子组件从上到下排列。

```json
{
  "id": "content",
  "component": {
    "Column": {
      "children": {"explicitList": ["header", "body", "footer"]}
    }
  }
}
```

**属性:**

- `children`: 静态数组 (`explicitList`) 或动态 `template`
- `distribution`: 子组件的垂直分布 (`start`, `center`, `end`, `spaceBetween`, `spaceAround`, `spaceEvenly`)
- `alignment`: 水平对齐 (`start`, `center`, `end`, `stretch`)

## 显示组件 (Display Components)

### Text (文本)

显示带有可选样式的文本内容。

```json
{
  "id": "title",
  "component": {
    "Text": {
      "text": {"literalString": "Welcome to A2UI"},
      "usageHint": "h1"
    }
  }
}
```

**`usageHint` 值:** `h1`, `h2`, `h3`, `h4`, `h5`, `caption`, `body`

### Image (图片)

显示来自 URL 的图片。

```json
{
  "id": "logo",
  "component": {
    "Image": {
      "url": {"literalString": "https://example.com/logo.png"}
    }
  }
}
```

### Icon (图标)

使用 Material Icons 或自定义图标集显示图标。

```json
{
  "id": "check-icon",
  "component": {
    "Icon": {
      "name": {"literalString": "check_circle"}
    }
  }
}
```

### Divider (分隔线)

视觉分隔线。

```json
{
  "id": "separator",
  "component": {
    "Divider": {
      "axis": "horizontal"
    }
  }
}
```

## 交互组件 (Interactive Components)

### Button (按钮)

支持操作的可点击按钮。

```json
{
  "id": "submit-btn-text",
  "component": {
    "Text": {
      "text": { "literalString": "Submit" }
    }
  }
}
{
  "id": "submit-btn",
  "component": {
    "Button": {
      "child": "submit-btn-text",
      "primary": true,
      "action": {"name": "submit_form"}
    }
  }
}
```

**属性:**
- `child`: 要在按钮中显示的组件的 ID（例如，Text 或 Icon）。
- `primary`: 指示这是否为主要操作的布尔值。
- `action`: 点击时执行的操作。

### TextField (文本字段)

文本输入字段。

```json
{
  "id": "email-input",
  "component": {
    "TextField": {
      "label": {"literalString": "Email Address"},
      "text": {"path": "/user/email"},
      "textFieldType": "shortText"
    }
  }
}
```

**`textFieldType` 值:** `date`, `longText`, `number`, `shortText`, `obscured`

### Checkbox (复选框)

布尔切换。

```json
{
  "id": "terms-checkbox",
  "component": {
    "Checkbox": {
      "label": {"literalString": "I agree to the terms"},
      "value": {"path": "/form/agreedToTerms"}
    }
  }
}
```

## 容器组件 (Container Components)

### Card (卡片)

带有高度/边框和内边距的容器。

```json
{
  "id": "info-card",
  "component": {
    "Card": {
      "child": "card-content"
    }
  }
}
```

### Modal (模态框)

覆盖层对话框。

```json
{
  "id": "confirmation-modal",
  "component": {
    "Modal": {
      "entryPointChild": "open-modal-btn",
      "contentChild": "modal-content"
    }
  }
}
```

### Tabs (选项卡)

选项卡式界面。

```json
{
  "id": "settings-tabs",
  "component": {
    "Tabs": {
      "tabItems": [
        {"title": {"literalString": "General"}, "child": "general-settings"},
        {"title": {"literalString": "Privacy"}, "child": "privacy-settings"},
        {"title": {"literalString": "Advanced"}, "child": "advanced-settings"}
      ]
    }
  }
}
```

### List (列表)

可滚动的项目列表。

```json
{
  "id": "message-list",
  "component": {
    "List": {
      "children": {
        "template": {
          "dataBinding": "/messages",
          "componentId": "message-item"
        }
      }
    }
  }
}
```

## 通用属性 (Common Properties)

大多数组件支持这些通用属性：

- `id` (必需): 组件实例的唯一标识符。
- `weight`: 当组件是 Row 或 Column 的直接子组件时的 flex-grow 值。此属性与 `id` 和 `component` 一起指定。

## 实时示例 (Live Examples)

要查看所有组件的运行情况，请运行组件库演示：

```bash
cd samples/client/angular
npm start -- gallery
```

这将启动一个实时画廊，包含所有组件、它们的变体和交互式示例。

## 延伸阅读 (Further Reading)

- **[标准目录定义](../../specification/v0_9/json/standard_catalog_definition.json)**: 完整的技术规范
- **[自定义组件指南](../guides/custom-components.md)**: 构建您自己的组件
- **[主题指南](../guides/theming.md)**: 设置组件样式以匹配您的品牌
