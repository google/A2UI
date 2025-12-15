# Theming & Styling

Customize the look and feel of A2UI components to match your brand. This guide covers theming, styling, and visual customization.

## The A2UI Styling Philosophy

A2UI follows a **client-controlled styling** approach:

- **Agents describe *what* to show** (components and structure)
- **Clients decide *how* it looks** (colors, fonts, spacing)

This ensures:

- ✅ **Brand consistency**: All UIs match your app's design system
- ✅ **Security**: Agents can't inject arbitrary CSS
- ✅ **Accessibility**: You control contrast, focus states, etc.
- ✅ **Platform-native feel**: Web apps look like web, mobile looks like mobile

## Styling Layers

A2UI styling works in layers:

```
┌────────────────────────────────────────────┐
│  1. Component usage hints (Semantic)            │  ← Agent specifies
│     "This is a headline"                   │
└──────────────────┬─────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────┐
│  2. Theme (Design System)                  │  ← You configure
│     Colors, fonts, spacing                 │
└──────────────────┬─────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────┐
│  3. Component Overrides (CSS)              │  ← You customize
│     Specific tweaks and adjustments        │
└──────────────────┬─────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────┐
│  4. Rendered Output                        │
│     Native platform widgets                │
└────────────────────────────────────────────┘
```

## Layer 1: Semantic Styles

Agents specify semantic hints, not visual properties:

```json
{
  "id": "title",
  "component": {
    "Text": {
      "text": {"literalString": "Welcome"},
      "usageHint": "h1"
    }
  }
}
```

**Available `usageHint` values (for `Text` component):**

- `h1`, `h2`, `h3`, `h4`, `h5`: For headings of different levels.
- `body`: For standard body text.
- `caption`: For smaller, caption-style text.

The client renderer maps these hints to actual visual styles from your theme.

## Layer 2: Theme Configuration

Configure your design system globally:

### Web Components (Lit)

```typescript
import { A2UIRenderer } from '@a2ui/renderer-lit';

const renderer = new A2UIRenderer({
  container: document.getElementById('app'),
  theme: {
    // Color palette
    colors: {
      primary: '#1976D2',
      secondary: '#DC004E',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#2196F3',

      // Surfaces
      background: '#FFFFFF',
      surface: '#F5F5F5',
      surfaceVariant: '#E0E0E0',

      // Text
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onBackground: '#000000',
      onSurface: '#000000',
    },

    // Typography
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: 14,

      headline: {
        fontFamily: '"Roboto", sans-serif',
        fontSize: 24,
        fontWeight: 500,
        lineHeight: 1.2,
      },
      subheading: {
        fontSize: 18,
        fontWeight: 400,
        lineHeight: 1.4,
      },
      body: {
        fontSize: 14,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      caption: {
        fontSize: 12,
        fontWeight: 400,
        lineHeight: 1.3,
      },
    },

    // Spacing (in pixels)
    spacing: {
      unit: 8,  // Base unit (all spacing is multiples of this)
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },

    // Border radius
    shape: {
      borderRadius: 4,
      borderRadiusLarge: 8,
    },

    // Elevation (shadows)
    elevation: {
      low: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      medium: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
      high: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    },
  }
});
```

### Angular

```typescript
// app.module.ts
import { A2UIModule } from '@a2ui/renderer-angular';

@NgModule({
  imports: [
    A2UIModule.forRoot({
      theme: {
        colors: {
          primary: '#1976D2',
          secondary: '#DC004E',
          // ... rest of theme
        },
        typography: {
          fontFamily: '"Roboto", sans-serif',
          // ...
        }
      }
    })
  ]
})
export class AppModule {}
```

Or use Angular Material theming:

```scss
// styles.scss
@use '@angular/material' as mat;
@use '@a2ui/renderer-angular/theming' as a2ui;

$my-theme: mat.define-light-theme((
  color: (
    primary: mat.define-palette(mat.$indigo-palette),
    accent: mat.define-palette(mat.$pink-palette),
  )
));

@include mat.all-component-themes($my-theme);
@include a2ui.a2ui-theme($my-theme);
```

### Flutter

```dart
import 'package:flutter/material.dart';
import 'package:flutter_genui/flutter_genui.dart';

MaterialApp(
  theme: ThemeData(
    primarySwatch: Colors.blue,
    fontFamily: 'Roboto',
    textTheme: TextTheme(
      displayLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
      bodyLarge: TextStyle(fontSize: 14),
    ),
  ),
  home: GenUIScreen(...),
)
```

Flutter GenUI automatically uses your app's `ThemeData`.

## Layer 3: Component Overrides

Override styles for specific components using CSS:

### Web (CSS Variables)

A2UI components expose CSS custom properties:

```css
/* Override all buttons */
a2ui-button {
  --button-padding: 12px 24px;
  --button-border-radius: 8px;
  --button-font-weight: 600;
}

/* Override primary buttons specifically */
a2ui-button[variant="primary"] {
  --button-background: linear-gradient(45deg, #2196F3, #21CBF3);
  --button-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
}

/* Override text components */
a2ui-text[style="headline"] {
  --text-font-family: 'Montserrat', sans-serif;
  --text-letter-spacing: -0.5px;
}

/* Override cards */
a2ui-card {
  --card-border: 1px solid #e0e0e0;
  --card-border-radius: 12px;
  --card-padding: 20px;
}
```

### Available CSS Variables

Each component exposes variables for common properties:

#### Button

```css
a2ui-button {
  --button-background: ...;
  --button-color: ...;
  --button-border: ...;
  --button-border-radius: ...;
  --button-padding: ...;
  --button-font-size: ...;
  --button-font-weight: ...;
  --button-shadow: ...;
  --button-hover-background: ...;
  --button-active-background: ...;
  --button-disabled-opacity: ...;
}
```

#### Card

```css
a2ui-card {
  --card-background: ...;
  --card-border: ...;
  --card-border-radius: ...;
  --card-padding: ...;
  --card-shadow: ...;
  --card-gap: ...;  /* spacing between children */
}
```

#### TextField

```css
a2ui-text-field {
  --input-background: ...;
  --input-border: ...;
  --input-border-radius: ...;
  --input-padding: ...;
  --input-font-size: ...;
  --input-color: ...;
  --input-placeholder-color: ...;
  --input-focus-border: ...;
  --input-error-border: ...;
}
```

## Dark Mode

Support light and dark themes:

### Auto-Switching Theme

```typescript
const renderer = new A2UIRenderer({
  container: document.getElementById('app'),
  theme: 'auto',  // 'light', 'dark', or 'auto'
});
```

With `'auto'`, the theme follows the system preference (`prefers-color-scheme`).

### Custom Dark Theme

```typescript
const renderer = new A2UIRenderer({
  container: document.getElementById('app'),
  darkTheme: {
    colors: {
      primary: '#90CAF9',
      secondary: '#F48FB1',
      background: '#121212',
      surface: '#1E1E1E',
      onBackground: '#FFFFFF',
      onSurface: '#FFFFFF',
    }
  }
});
```

### CSS for Dark Mode

```css
/* Light mode (default) */
:root {
  --color-background: #FFFFFF;
  --color-text: #000000;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #121212;
    --color-text: #FFFFFF;
  }
}

/* Manual dark mode class */
.dark-mode {
  --color-background: #121212;
  --color-text: #FFFFFF;
}
```

## Responsive Design

A2UI components are responsive by default, but you can customize breakpoints:

### CSS Media Queries

```css
/* Mobile */
@media (max-width: 600px) {
  a2ui-card {
    --card-padding: 12px;
  }

  a2ui-button {
    --button-padding: 10px 16px;
    --button-font-size: 14px;
  }
}

/* Tablet */
@media (min-width: 601px) and (max-width: 1024px) {
  a2ui-card {
    --card-padding: 16px;
  }
}

/* Desktop */
@media (min-width: 1025px) {
  a2ui-card {
    --card-padding: 24px;
  }
}
```

### Responsive Properties

Use container queries for component-level responsiveness:

```css
a2ui-row {
  container-type: inline-size;
}

@container (max-width: 400px) {
  a2ui-row {
    flex-direction: column;
  }
}
```

## Custom Fonts

### Web Fonts

```html
<!-- In your HTML -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
```

```typescript
const renderer = new A2UIRenderer({
  theme: {
    typography: {
      fontFamily: '"Inter", sans-serif',
    }
  }
});
```

### Self-Hosted Fonts

```css
@font-face {
  font-family: 'MyCustomFont';
  src: url('/fonts/my-font.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
}

:root {
  --font-family: 'MyCustomFont', sans-serif;
}
```

## Animations & Transitions

Add smooth transitions:

```css
a2ui-button {
  --button-transition: all 0.2s ease-in-out;
}

a2ui-button:hover {
  transform: translateY(-2px);
  --button-shadow: 0 6px 16px rgba(0,0,0,0.15);
}

a2ui-card {
  --card-transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

a2ui-card:hover {
  transform: scale(1.02);
}
```

## Best Practices

### 1. Use Semantic Styles

```json
// ✅ Good: Semantic
{
  "id": "title",
  "component": {
    "Text": {
      "text": {"literalString": "Welcome"},
      "usageHint": "h1"
    }
  }
}

// ❌ Bad: Don't specify visual properties from agent
{
  "id": "title",
  "component": {
    "Text": {
      "text": {"literalString": "Welcome"},
      "fontSize": 24,
      "color": "#FF0000"
    }
  }
}
```

Agents should never specify visual properties like colors or font sizes.

### 2. Use Design Tokens

```css
:root {
  /* Design tokens */
  --color-primary: #1976D2;
  --color-primary-dark: #1565C0;
  --color-primary-light: #BBDEFB;

  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
}

/* Use tokens in component styles */
a2ui-button {
  --button-background: var(--color-primary);
  --button-padding: var(--spacing-md);
  --button-border-radius: var(--radius-md);
}
```

### 3. Maintain Accessibility

Always ensure sufficient contrast:

```css
/* ✅ Good: 4.5:1 contrast ratio */
a2ui-button[variant="primary"] {
  --button-background: #1976D2;
  --button-color: #FFFFFF;
}

/* ❌ Bad: Poor contrast */
a2ui-button {
  --button-background: #FFEB3B;  /* Yellow */
  --button-color: #FFFFFF;        /* White - hard to read! */
}
```

Test with tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).

### 4. Test Dark Mode

```css
/* Ensure colors work in both modes */
@media (prefers-color-scheme: dark) {
  a2ui-card {
    /* Lighter borders in dark mode */
    --card-border: 1px solid #424242;
  }

  a2ui-text {
    /* Softer white in dark mode (easier on eyes) */
    --text-color: #E0E0E0;
  }
}
```

## Example: Complete Custom Theme

```typescript
import { A2UIRenderer } from '@a2ui/renderer-lit';

const renderer = new A2UIRenderer({
  container: document.getElementById('app'),

  // Light theme
  theme: {
    colors: {
      primary: '#6200EA',
      secondary: '#03DAC6',
      success: '#00C853',
      error: '#B00020',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      onPrimary: '#FFFFFF',
      onBackground: '#000000',
    },

    typography: {
      fontFamily: '"Inter", -apple-system, sans-serif',
      headline: {
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: '-0.5px',
      },
      body: {
        fontSize: 16,
        lineHeight: 1.6,
      },
    },

    spacing: {
      unit: 8,
    },

    shape: {
      borderRadius: 8,
    },
  },

  // Dark theme
  darkTheme: {
    colors: {
      primary: '#BB86FC',
      secondary: '#03DAC6',
      background: '#121212',
      surface: '#1E1E1E',
      onPrimary: '#000000',
      onBackground: '#E0E0E0',
    },
  },
});
```

```css
/* Additional CSS overrides */
a2ui-button[variant="primary"] {
  --button-padding: 14px 28px;
  --button-border-radius: 24px;
  --button-font-weight: 600;
  --button-text-transform: uppercase;
  --button-letter-spacing: 0.5px;
  --button-shadow: 0 2px 8px rgba(98, 0, 234, 0.3);
  --button-transition: all 0.2s ease;
}

a2ui-button[variant="primary"]:hover {
  --button-shadow: 0 4px 16px rgba(98, 0, 234, 0.4);
  transform: translateY(-2px);
}

a2ui-card {
  --card-border-radius: 16px;
  --card-padding: 24px;
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  --card-transition: transform 0.2s ease, box-shadow 0.2s ease;
}

a2ui-card:hover {
  --card-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}
```

## Next Steps

- **[Custom Components](custom-components.md)**: Build your own styled components
- **[Component Gallery](../reference/components.md)**: See all component styling options
- **[Client Setup](client-setup.md)**: Set up the renderer in your app
