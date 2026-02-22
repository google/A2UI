# CLAUDE.md - A2UI React Native Renderer

## Project Overview

A React Native renderer for Google's A2UI (Agent-to-User Interface) declarative UI specification. This is the first React Native implementation of A2UI.

## Build Commands

```bash
npm run build          # Build TypeScript to lib/
npm run test           # Run Jest tests
npm run test:watch     # Watch mode
npm run lint           # Run ESLint
npm run typecheck      # Type check without emitting
```

## Architecture

### Core Directories

```
src/
├── index.ts                    # Main exports
├── parser/
│   └── jsonl-parser.ts        # JSONL stream parser
├── dispatcher/
│   └── message-dispatcher.ts  # Route A2UI messages
├── state/
│   ├── surface-registry.ts    # Manage rendering surfaces
│   ├── component-buffer.ts    # Store component definitions
│   └── data-model-store.ts    # Handle data bindings
├── components/
│   ├── Text.tsx              # A2UI Text → RN Text
│   ├── Button.tsx            # A2UI Button → RN Pressable
│   ├── Image.tsx             # A2UI Image → RN Image
│   ├── Row.tsx               # A2UI Row → RN View (row)
│   ├── Column.tsx            # A2UI Column → RN View
│   ├── Card.tsx              # A2UI Card → styled View
│   ├── List.tsx              # A2UI List → RN FlatList
│   ├── TextField.tsx         # A2UI TextField → RN TextInput
│   ├── Modal.tsx             # A2UI Modal → RN Modal
│   ├── Tabs.tsx              # A2UI Tabs → Custom TabView
│   ├── Checkbox.tsx          # A2UI Checkbox → TouchableOpacity
│   ├── Slider.tsx            # A2UI Slider → PanResponder
│   ├── DateTimeInput.tsx     # A2UI DateTimeInput → TextInput
│   ├── MultipleChoice.tsx    # A2UI MultipleChoice → Modal Picker
│   ├── Icon.tsx              # A2UI Icon → Text (emoji fallback)
│   ├── Divider.tsx           # A2UI Divider → View
│   ├── Video.tsx             # A2UI Video → Placeholder (expo-av)
│   └── AudioPlayer.tsx       # A2UI AudioPlayer → Placeholder
├── renderer/
│   └── A2UIRenderer.tsx      # Main renderer component
├── hooks/
│   └── useA2UIStream.ts      # Streaming hook
├── theme/
│   ├── index.ts              # Theme exports
│   └── ThemeContext.tsx      # Theme provider & hooks
└── types/
    └── a2ui-types.ts         # A2UI specification types
```

### A2UI Protocol

**Message Types (Server → Client):**
- `beginRendering` - Initialize a new surface
- `surfaceUpdate` - Add/update component definitions
- `dataModelUpdate` - Update data model values
- `deleteSurface` - Remove a surface

**Action Types (Client → Server):**
- User interactions (clicks, input changes)
- Capability reporting (supported components)
- Error reporting

### Component Mapping

| A2UI | React Native | Status |
|------|--------------|--------|
| Text | `<Text>` | Complete |
| Button | `<Pressable>` | Complete |
| Image | `<Image>` | Complete |
| Row | `<View flexDirection='row'>` | Complete |
| Column | `<View>` | Complete |
| Card | `<View>` styled | Complete |
| List | `<FlatList>` | Complete |
| TextField | `<TextInput>` | Complete |
| Modal | `<Modal>` | Complete |
| Tabs | Custom TabView | Complete |
| Checkbox | `<TouchableOpacity>` | Complete |
| Slider | Custom PanResponder | Complete |
| DateTimeInput | `<TextInput>` | Complete |
| MultipleChoice | Modal Picker | Complete |
| Icon | Text (emoji) | Complete |
| Divider | `<View>` | Complete |
| Video | Placeholder | Complete |
| AudioPlayer | Placeholder | Complete |

### Theming

The renderer includes a complete theming system:

```tsx
import { A2UIThemeProvider, useA2UITheme, createTheme, lightTheme, darkTheme } from 'a2ui-react-native';

// Use built-in themes
<A2UIThemeProvider theme="dark">
  <A2UIRenderer spec={spec} />
</A2UIThemeProvider>

// Create custom theme
const customTheme = createTheme({
  colors: { primary: '#FF6B6B' }
});
```

## Code Style

- TypeScript strict mode
- React functional components with hooks
- ESLint for linting
- Jest for testing

## Key Concepts

### JSONL Streaming
A2UI uses JSON Lines format for streaming. Each line is a complete JSON message:
```
{"type":"beginRendering","surfaceId":"main","rootId":"root"}
{"type":"surfaceUpdate","components":[{"id":"root","type":"Text","content":"Hello"}]}
```

### Data Binding
Components can reference data model values via BoundValue:
```typescript
interface BoundValue {
  type: 'literal' | 'path';
  value: string | number | boolean;  // For literal
  path?: string[];                    // For path reference
}
```

### Surface Model
Each rendering context is a "surface" with:
- Unique surface ID
- Component buffer (component definitions by ID)
- Data model store (bound values)
- Root component ID

### Streaming Hook
```tsx
import { useA2UIStream } from 'a2ui-react-native';

const { spec, isLoading, error } = useA2UIStream({
  url: 'wss://agent.example.com/stream',
  onAction: (action) => console.log(action),
});
```

## Example Apps

- `example/App.tsx` - Basic static rendering
- `example/StreamingApp.tsx` - WebSocket streaming
- `example/CompleteDemo.tsx` - All components showcase

## Testing

```bash
npm test               # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage
```

## References

- [A2UI Specification](https://a2ui.org/)
- [A2UI Renderer Guide](https://a2ui.org/guides/renderer-development/)
- [Google A2UI GitHub](https://github.com/google/A2UI)
