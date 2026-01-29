# @a2ui/vue

A Vue 3 renderer for A2UI (Agent-to-UI) protocol.

## Usage

```vue
<script setup lang="ts">
import { A2UISurface, useMessageProcessor, provideA2UI, DEFAULT_CATALOG, defaultTheme } from '@a2ui/vue';
import '@a2ui/vue/dist/vue.css';
// Provide A2UI configuration
provideA2UI({
  catalog: DEFAULT_CATALOG,
  theme: defaultTheme,
});

const processor = useMessageProcessor();

// Process messages from your agent
processor.processMessages(messages);

// Get surfaces to render
const surfaces = processor.getSurfaces();
</script>

<template>
  <A2UISurface
    v-for="[surfaceId, surface] in surfaces"
    :key="surfaceId"
    :surface-id="surfaceId"
    :surface="surface"
  />
</template>
```

## Components

The library provides the following components:

- `A2UISurface` - The main surface component
- `A2UIRenderer` - Dynamic component renderer
- Layout: `A2UIRow`, `A2UIColumn`, `A2UICard`, `A2UIList`
- Content: `A2UIText`, `A2UIImage`, `A2UIIcon`, `A2UIVideo`, `A2UIAudio`
- Input: `A2UIButton`, `A2UITextField`, `A2UICheckbox`, `A2UISlider`, `A2UIMultipleChoice`, `A2UIDateTimeInput`
- Navigation: `A2UITabs`, `A2UIModal`
- Utility: `A2UIDivider`

## Development & Examples

To view interactive examples of all components:

```bash
# Install dependencies
npm install

# Start development server with examples
npm run dev

```

The examples will be available at http://localhost:5173

### Building

```bash
# Build the library
npm run build
```
