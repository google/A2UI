# A2UI React Custom Component Guide

This guide details how to create, register, and use custom components in the A2UI React renderer.

## Create the Component

Create a new React component file in `src/custom-components/`.

Example: `MyComponent.tsx`

```tsx
import React from 'react';
import { CatalogComponentProps } from '@a2ui/react';

interface MyComponentProperties {
  myProp?: string;
}

export function MyComponent({ surfaceId, component }: CatalogComponentProps) {
  const properties = component.properties as unknown as MyComponentProperties;
  const { myProp = 'Default' } = properties;

  return (
    <div data-id={component.id} style={{ padding: 16, border: '1px solid #ccc' }}>
      <h2>My Custom Component</h2>
      <p>Prop value: {myProp}</p>
    </div>
  );
}
```

## Register the Component

Update `src/custom-components/index.ts` to register your new component:

```typescript
import { registerComponent } from '@a2ui/react';
import { MyComponent } from './MyComponent';

export function registerCustomComponents() {
  registerComponent('MyComponent', MyComponent);
}
```

## Use in Your App

In your main app file, import and call the registration function before rendering:

```tsx
import { registerCustomComponents } from './custom-components';

// Call this once at startup
registerCustomComponents();

function App() {
  return (
    <A2UIProvider processor={processor}>
      <Surface surfaceId="main" />
    </A2UIProvider>
  );
}
```

## Using Hooks

Custom components have access to all A2UI hooks:

```tsx
import { useAction, useStringBinding, useSetData } from '@a2ui/react';

export function MyComponent({ surfaceId, component }: CatalogComponentProps) {
  // Resolve a string value from data binding
  const title = useStringBinding(properties.title, component, surfaceId);
  
  // Create an action handler
  const handleAction = useAction(properties.action, component, surfaceId);
  
  // Set data in the data model
  const setData = useSetData(component, surfaceId);

  return (
    <button onClick={handleAction}>
      {title}
    </button>
  );
}
```

## Overriding Standard Components

You can replace standard A2UI components with your own implementations:

```typescript
import { registerComponent } from '@a2ui/react';
import { MyPremiumTextField } from './MyPremiumTextField';

// Override the standard TextField with your custom implementation
registerComponent('TextField', MyPremiumTextField);
```

When the server sends a `TextField` component, your custom `MyPremiumTextField` will be rendered instead.

## Server Message Example

The server can send messages with your custom component type:

```json
{
  "surfaceUpdate": {
    "surfaceId": "main",
    "components": [
      {
        "id": "comp-1",
        "component": {
          "type": "MyComponent",
          "properties": {
            "myProp": "Hello World"
          }
        }
      }
    ]
  }
}
```

## Tips

- Always include `data-id={component.id}` on the root element for debugging
- Use Semi Design components for consistent styling
- Access the theme with `useTheme()` hook if needed
- Use `flex: component.weight ?? 'initial'` for proper layout weight support

