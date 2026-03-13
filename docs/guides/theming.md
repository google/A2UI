# How to Create a New Theme and Specify it in a Custom Catalog in A2UI

This guide explains how theming works in A2UI and how you can define your own
theme for a custom catalog.

> [!NOTE]
> While this guide focuses primarily on Web-based renderers (Angular, Lit) and
> mapping concepts to CSS, the core architectural philosophies apply equally to
> mobile or native platforms. For example, in A2UI's Flutter renderer, the same
> catalog semantics and design tokens are mapped directly into native Flutter
`ThemeData` objects and widget-specific theme overrides instead of CSS classes.

## The A2UI Styling Philosophy

A2UI follows a **client-controlled styling** approach, meaning:

- **Agents describe _what_ to show** (components and structure).
- **Clients decide _how_ it looks** (colors, fonts, spacing).

This separation of concerns ensures:

- **Brand consistency**: All UIs perfectly match your application's design
  system.
- **Security**: Agents cannot inject arbitrary or malicious CSS.
- **Accessibility**: The client retains total control over contrast, focus
  states, and accessibility attributes.
- **Platform-native feel**: Web apps look like web, mobile apps look like
  mobile.

## The Three Layers of Styling

A2UI balances agent flexibility and brand consistency by structuring its styling
across three independent layers. Understanding these layers clarifies the
boundary between agent intent and client execution:

1. **The Catalog `theme`:** The catalog defines the structure of what an agent
   can request. By adhering to the catalog schema, agents specify semantic
   intents (e.g., `"intent": "primary"` or `"density": "compact"`) for
   components, but do not supply explicit visual rules like CSS.
2. **The `BeginRenderingMessage.styles`:** This allows the agent to send dynamic
   surface-level styling when initializing a UI. The styles provided here act as
   CSS Variables (Custom Properties) on the entire surface's root DOM element,
   cascading inwards to allow inner components to inherit or react to dynamic
   global changes.
3. **The Client Theme object:** The foundational, static layer built into the
   native application (e.g. Angular, Lit, Flutter). The client theme maps the
   semantic hints requested by the agent (from layer 1) and the dynamic CSS
   variables (from layer 2) into actual CSS classes native to your design
   system. This layer guarantees that agent UI remains visually consistent and
   secure.

## 1. Theming in the Catalog Definition

A Catalog in A2UI is defined using a JSON Schema (based on
`a2ui_client_capabilities.json`). The catalog definition dictates what
components and APIs an agent can use.

**Why would an agent need to send theme properties?** While the client
ultimately controls visual execution, there are scenarios where the agent needs
to express a specific visual identity. For example, an external or third-party
agent (like a flight booking service) might need to preserve its specific brand
coloring to give its components a distinct, recognizable visual appearance when
rendered inside a generalized host shell application.

### The Catalog `theme` Property

Every A2UI catalog schema must include a `theme` property. Its structure
typically looks like this:

```json
{
  "theme": {
    "type": "object",
    "description": "Theme hints to guide client-side visual rendering.",
    "properties": {
      "intent": {
        "type": "string",
        "enum": [
          "primary",
          "secondary",
          "neutral"
        ],
        "description": "The semantic intent of the surface, used to color buttons and highlights."
      },
      "density": {
        "type": "string",
        "enum": [
          "compact",
          "comfortable",
          "spacious"
        ],
        "description": "How tightly packed the UI elements should be."
      }
    },
    "additionalProperties": false
  }
}
```

This JSON schema property dictates the structure of the theming properties the
**agent** is allowed to send.

However, A2UI follows a **client-controlled styling approach**:

1. **The Agent** uses the properties allowed by the catalog's `theme` to send
   _semantic hints_ describing what to show (e.g., an intent like "primary" or a
   context like "header").
2. **The Client application** maps these semantic hints to actual visual styles
   natively (CSS classes, colors, spacing).

Therefore, while the agent can hint at styling via the schema's `theme` property,
strict visual execution is safely controlled by the client renderer (Angular,
Lit, Flutter).

### How `theme` Influences Client Styling

While the JSON schema allows the agent to send hints, how does this affect the
actual code rendering the UI?

The top-level `theme` property defined by the catalog acts as an **input
argument** to the underlying component when it is rendered. When the agent sends
a valid `theme` object according to the catalog schema, these semantic hints are
passed down as **Component Overrides** via the `additionalStyles` record.

### Dynamic Styles via BeginRenderingMessage

In addition to static client-side theming, the server (agent) can send dynamic
styles when it initializes a UI surface. This is done via the
`BeginRenderingMessage`:

```json
{
  "beginRendering": {
    "surfaceId": "my-surface",
    "root": "main-container",
    "styles": {
      "--background-color": "#ffffff",
      "--text-color": "#333333"
    }
  }
}
```

When the
A2UI [MessageProcessor](https://github.com/google/A2UI/tree/main/renderers/web_core/src/v0_8/data/model-processor.ts)
processes this message, it stores the `styles` record directly on the `Surface`
object (`surface.styles`).

The `<a2ui-surface>` container component (e.g., in
the [Angular renderer](https://github.com/google/A2UI/tree/main/renderers/angular/src/lib/catalog/surface.ts))
reads `surface.styles` and applies each key-value pair as a native inline CSS
property on its root DOM element.

By applying these as CSS Custom Properties (CSS variables) to the root surface
element, they automatically cascade down to all child A2UI components in that
surface! The components can then consume these variables directly, or the client
application can map them via the `additionalStyles` record.

## 2. What Can Be Specified in a Client Theme?

On the web clients (Angular, Lit), an A2UI `Theme` is defined as a TypeScript
object that maps A2UI components and HTML elements to CSS classes or inline
styles. On mobile native clients like Flutter, these semantic hints are mapped
directly to global or widget-specific `ThemeData` configurations instead of CSS.

The `Types.Theme` object consists of structurally predefined properties:

1. **`components`:** Maps A2UI components (e.g., `Button`, `Card`, `TextField`)
   to a set of CSS class names. For complex components, it maps specific
   internal parts:
    - `Button`: `{ 'my-button-class': true }`
    - `CheckBox`: `{ container: {...}, element: {...}, label: {...} }`
    - `Text`: allows providing specific classes based on the `usageHint` (e.g.,
      `h1`, `h2`, `body`, `caption`).
2. **`elements`:** Maps raw injected HTML tags (like `a`, `button`, `h1`, `p`,
   `video`) to CSS class names.
3. **`markdown`:** Maps markdown-generated tags to lists of CSS classes (e.g.,
   `p`, `h1`, `ul`, `li`).
4. **`additionalStyles`** _(Optional)_: This property acts as a bridge for the
   catalog `theme` object. Depending on how the specific component renderer is
   configured, the semantic properties defined in the catalog's JSON schema (
   such as `intent: "primary"`) can be mapped here into actual CSS variables or
   literal inline CSS properties (like `--button-bg: blue`).

## 3. How the Theme is Applied During Rendering

When A2UI components are rendered, the renderer engine checks the injected
`Theme` object for the current component and appends the specified classes or
styles.

For example, when rendering a `<Button>`:

- The renderer looks up `theme.components.Button` and applies those classes to
  the button's wrapper element.
- It also looks up `theme.additionalStyles.Button` safely and applies those
  inline CSS styles to the element.

You can see a real example of this logic in
the [Angular A2UI Text renderer](https://github.com/google/A2UI/tree/main/renderers/angular/src/lib/catalog/text.ts).
There, the `classes()` and `additionalStyles()` computed signals explicitly look
up `this.theme.components.Text` and `this.theme.additionalStyles.Text` to apply
to the rendered `<section>`.

## 4. Step-by-Step Instructions for Users

### Step 1: Create Your Theme Object

Create a TypeScript file that defines your custom theme matching the
`Types.Theme` interface. Map your application's design tokens (CSS classes) to
the A2UI components.

```typescript
import {Types} from "@a2ui/web_core"; // Or the specific renderer path

export const myCustomTheme: Types.Theme = {
  components: {
    Button: {
      "my-company-button": true,
      "primary-action": true,
    },
    Card: {
      "card-container": true,
      "shadow-md": true,
      "rounded-lg": true,
    },
    // Define other components...
  },
  elements: {
    a: {"link-primary": true},
    // Define other standard HTML elements...
  },
  markdown: {
    p: ["markdown-text"], // Array of strings for markdown
    // Define other markdown mappings...
  },
  additionalStyles: {
    Button: {
      borderRadius: "var(--mat-sys-corner-full)",
      background: "var(--mat-sys-primary)",
      color: "var(--mat-sys-on-primary)",
      cursor: "pointer",
    },
    Card: {
      background: "var(--mat-sys-surface-container-highest)",
      borderRadius: "var(--mat-sys-corner-medium)",
      overflow: "hidden",
    },
    // Map component values to literal inline CSS styles/variables...
  },
};
```

> [!TIP]
> **Best Practice: The Base Layer vs. Override Layer Pattern**
> Writing a full `Types.Theme` object from scratch can be repetitive. To
> maintain consistency across apps, best practice is to structure your styling
> across two layers:
>
> 1. **Base Layer (`default-theme.ts`)**: Defines structure and functional
     layout styles shared by all components (e.g., standard padding on Cards,
     flex directions on Rows).
> 2. **Configuration Layer (App Overrides)**: Instead of starting from an empty
     object, deep-clone the base theme, and overwrite only the properties
     relevant to the specific app or brand (e.g., colors or typography).
>
> ```typescript
> import { cloneDefaultTheme } from "../theme/default-theme.js";
>
> // Inherit the structural mapping:
> const myAppTheme = cloneDefaultTheme();
>
> // Override specific traits for this agent/app:
> myAppTheme.components.Card = {
>   ...myAppTheme.components.Card,
>   "my-blue-brand-bg": true,
> };
> ```

### Step 2: Define the Component Styles in CSS

Ensure that the client application has the CSS defined for the classes mentioned
in your theme object.

> [!TIP]
> **Keep Styling Externalized**
> The best practice in A2UI is to put as much styling configuration into the
> `Theme` object (either via CSS classes mapped in `components` or inline styles
> mapped in `additionalStyles`) as possible. You should avoid hardcoding CSS
> classes or specific native styles directly into the internal A2UI component
> implementations unless those visual rules are absolutely necessary for the
> component's fundamental structural functionality.
>
> Keeping styles centralized in the `Theme` object makes it significantly easier
> to swap or apply a completely different theme later. Any styling choices
> hardcoded inside the component itself will be extremely difficult, if not
> impossible, to override with a different Theme.

For example, if you initially define your button styles in the component CSS like this:

```css
/* In your application's global CSS or component CSS */
.my-company-button {
  background-color: #1a73e8;
  color: white;
  border-radius: 4px;
  padding: 8px 16px;
}
```

You can migrate these directly into the `additionalStyles` property of your Theme object to keep them centralized:

```typescript
export const myCustomTheme: Types.Theme = {
  // ...
  additionalStyles: {
    Button: {
      'backgroundColor': '#1a73e8',
      'color': 'white',
      'borderRadius': '4px',
      'padding': '8px 16px',
    }
  }
};
```

### Step 3: Provide the Theme to the Renderer

Provide the theme to the specific A2UI Renderer you are using in your
application.

**For Angular:**
Pass the theme object in the [`provideA2UI`](https://github.com/google/A2UI/tree/main/renderers/angular/src/lib/config.ts)
function along with your custom catalog.

```typescript
import {provideA2UI} from "@a2ui/angular";
import {myCustomCatalog} from "./my-catalog";
import {myCustomTheme} from "./my-theme";

export const appConfig: ApplicationConfig = {
  providers: [
    provideA2UI({
      catalog: myCustomCatalog,
      theme: myCustomTheme,
    }),
  ],
};
```

**For Lit:**
Provide the theme object using Lit's `@provide` context decorator at the top
level of your A2UI application or surface.

```typescript
import {Context} from "@a2ui/lit/ui";
import {provide} from "@lit/context";
import {myCustomTheme} from "./my-theme";

export class MyA2UIApp extends LitElement {
  @provide({context: Context.themeContext})
  theme = myCustomTheme;

  // Render surface...
}
```

**For Flutter:**
In a Flutter application, the global theme configuration (colors, typography,
spacing, border radiuses) and widget-specific component overrides are mapped
natively via Flutter's `ThemeData`. You provide this configuration directly to
your host Flutter application, rather than providing a literal TypeScript `Theme`
dictionary to a web context.

## 5. Reference: Default Styling Levers

The core A2UI library provides a default set of styling "levers" (utility CSS
classes) that you can use when defining your `Types.Theme` object. These are
defined in the [`web_core` renderer package](https://github.com/google/A2UI/tree/main/renderers/web_core/src/v0_8/styles/index.ts).

If your application includes the default A2UI CSS, you can map components to
these pre-existing utility classes.

### Layout (`layout-`)

**Source:** [`styles/layout.ts`](https://github.com/google/A2UI/tree/main/renderers/web_core/src/v0_8/styles/layout.ts)

| Category        | Prefix        | Scale/Values                                | Examples                                                    |
|:----------------|:--------------|:--------------------------------------------|:------------------------------------------------------------|
| **Padding**     | `layout-p-`   | 0-24 (1 = 4px)                              | `layout-p-4` (16px), `layout-pt-2` (Top 8px), `layout-px-4` |
| **Margin**      | `layout-m-`   | 0-24 (1 = 4px)                              | `layout-m-0`, `layout-mb-4` (Bottom 16px), `layout-mx-auto` |
| **Gap**         | `layout-g-`   | 0-24 (1 = 4px)                              | `layout-g-2` (8px), `layout-g-4` (16px)                     |
| **Width**       | `layout-w-`   | 10-100 (Percentage)                         | `layout-w-100` (100%), `layout-w-50` (50%)                  |
| **Width (Px)**  | `layout-wp-`  | 0-15 (1 = 4px)                              | `layout-wp-10` (40px)                                       |
| **Height**      | `layout-h-`   | 10-100 (Percentage)                         | `layout-h-100` (100%)                                       |
| **Height (Px)** | `layout-hp-`  | 0-15 (1 = 4px)                              | `layout-hp-10` (40px)                                       |
| **Display**     | `layout-dsp-` | `none`, `block`, `grid`, `flex`, `iflex`    | `layout-dsp-flexhor` (Row), `layout-dsp-flexvert` (Col)     |
| **Alignment**   | `layout-al-`  | `fs` (Start), `fe` (End), `c` (Center)      | `layout-al-c` (Align Items Center)                          |
| **Justify**     | `layout-sp-`  | `c` (Center), `bt` (Between), `ev` (Evenly) | `layout-sp-bt` (Justify Content Space Between)              |
| **Flex**        | `layout-flx-` | `0` (None), `1` (Grow)                      | `layout-flx-1` (Flex Grow 1)                                |
| **Position**    | `layout-pos-` | `a` (Absolute), `rel` (Relative)            | `layout-pos-rel`                                            |

### Colors (`color-`)

**Source:** [`styles/colors.ts`](https://github.com/google/A2UI/tree/main/renderers/web_core/src/v0_8/styles/colors.ts)

| Category         | Prefix       | Scale/Values        | Examples                                                              |
|:-----------------|:-------------|:--------------------|:----------------------------------------------------------------------|
| **Text Color**   | `color-c-`   | Palette Key + Shade | `color-c-p50` (Primary), `color-c-n10` (Black), `color-c-e40` (Error) |
| **Background**   | `color-bgc-` | Palette Key + Shade | `color-bgc-p100` (White/Lightest), `color-bgc-s30` (Secondary Dark)   |
| **Border Color** | `color-bc-`  | Palette Key + Shade | `color-bc-p60` (Primary Border)                                       |

_Palette Keys:_ `p` (Primary/Brand), `s` (Secondary), `t` (Tertiary), `n` (
Neutral/Grays), `nv` (Neutral Variant), `e` (Error)
_Shades:_ 0, 5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100

### Typography (`typography-`)

**Source:** [`styles/type.ts`](https://github.com/google/A2UI/tree/main/renderers/web_core/src/v0_8/styles/type.ts)

| Category            | Prefix           | Scale/Values                              | Examples                                                                             |
|:--------------------|:-----------------|:------------------------------------------|:-------------------------------------------------------------------------------------|
| **Font Family**     | `typography-f-`  | `sf` (Sans/Flex), `s` (Serif), `c` (Code) | `typography-f-sf` (System UI / Outfit)                                               |
| **Weight**          | `typography-w-`  | 100-900                                   | `typography-w-400` (Regular), `typography-w-500` (Medium), `typography-w-700` (Bold) |
| **Size (Body)**     | `typography-sz-` | `bs`, `bm`, `bl`                          | `typography-sz-bm` (Body Medium - 14px)                                              |
| **Size (Title)**    | `typography-sz-` | `ts`, `tm`, `tl`                          | `typography-sz-tl` (Title Large - 22px)                                              |
| **Size (Headline)** | `typography-sz-` | `hs`, `hm`, `hl`                          | `typography-sz-hl` (Headline Large - 32px)                                           |
| **Size (Display)**  | `typography-sz-` | `ds`, `dm`, `dl`                          | `typography-sz-dl` (Display Large - 57px)                                            |
| **Align**           | `typography-ta-` | `s` (Start), `c` (Center)                 | `typography-ta-c`                                                                    |

### Borders (`border-`)

**Source:** [`styles/border.ts`](https://github.com/google/A2UI/tree/main/renderers/web_core/src/v0_8/styles/border.ts)

| Category   | Prefix       | Scale/Values   | Examples                                              |
|:-----------|:-------------|:---------------|:------------------------------------------------------|
| **Radius** | `border-br-` | 0-24 (1 = 4px) | `border-br-4` (16px), `border-br-50pc` (50% / Circle) |
| **Width**  | `border-bw-` | 0-24 (Pixels)  | `border-bw-1` (1px), `border-bw-2` (2px)              |
| **Style**  | `border-bs-` | `s` (Solid)    | `border-bs-s`                                         |

### Behavior & Opacity

**Source:** [`styles/behavior.ts`](https://github.com/google/A2UI/tree/main/renderers/web_core/src/v0_8/styles/behavior.ts), 
[`styles/opacity.ts`](https://github.com/google/A2UI/tree/main/renderers/web_core/src/v0_8/styles/opacity.ts)

| Category          | Prefix         | Scale/Values                           | Examples                                |
|:------------------|:---------------|:---------------------------------------|:----------------------------------------|
| **Hover Opacity** | `behavior-ho-` | 0-100 (Step 5)                         | `behavior-ho-80` (Opacity 0.8 on hover) |
| **Opacity**       | `opacity-el-`  | 0-100 (Step 5)                         | `opacity-el-50` (Opacity 0.5)           |
| **Overflow**      | `behavior-o-`  | `s` (Scroll), `a` (Auto), `h` (Hidden) | `behavior-o-h`                          |
| **Scrollbar**     | `behavior-sw-` | `n` (None)                             | `behavior-sw-n`                         |

## 6. Common Styling Features

Beyond basic component styling, your A2UI client setup should support these
common features:

### Dark Mode

A2UI renderers naturally support automatic dark mode styling. When configuring
your application's CSS and `Types.Theme`, ensure you:

- Utilize CSS media queries (`@media (prefers-color-scheme: dark)`) or CSS
  custom properties that dynamically swap values based on a theme class applied
  to the document body.
- Offer manual light/dark theme toggling if applicable to your application
  shell.

### Responsive Design

A2UI components are built to be responsive by default, reflowing naturally.
However, you can further customize this in your theme:

- Map structural components (like `Grid` or `Row`) to responsive container
  utility classes.
- Use CSS Media Queries or Container Queries inside the classes defined in your
  `Types.Theme` object to adjust padding, font sizes, and layout direction
  depending on screen real estate.

### Custom Fonts

A2UI easily integrates with custom typography. You simply load your desired web
fonts (e.g., via Google Fonts) in your host application and reference those font
families in your `Types.Theme` mapping.

## 7. General Theming Best Practices

When designing your catalogs and client themes, keep these principles in mind:

### 1. Agents: Use Semantic Hints, Not Visual Properties

When defining what the agent can send in the catalog's `theme` property (or
standard component properties), rely on semantic hints (like `usageHint` or
`intent`), not strict visual values.

```json
// ✅ Good: Semantic hint. The client decides what "h1" looks like.
{
  "component": {
    "Text": {
      "text": {
        "literalString": "Welcome"
      },
      "usageHint": "h1"
    }
  }
}

// ❌ Bad: Visual properties. Breaks responsiveness and brand consistency.
{
  "component": {
    "Text": {
      "text": {
        "literalString": "Welcome"
      },
      "fontSize": 24,
      "color": "#FF0000"
    }
  }
}
```

### 2. Clients: Maintain Accessibility

Because the client controls the CSS, the responsibility for accessibility falls
entirely on the client theme:

- Ensure sufficient color contrast in your `Types.Theme` class mappings (WCAG
  AA: 4.5:1 for normal text).
- Test with screen readers and ensure keyboard navigation focus states are
  styled appropriately.

### 3. Use Design Tokens

Avoid hardcoding color hexes or arbitrary pixel values in your `Types.Theme`
classes. Instead, define reusable design tokens (such as CSS variables for
semantic colors, spacing scales, and typography) and reference them. This
ensures consistency and makes wholesale theme changes dramatically easier.

### 4. Test Across Platforms

Your A2UI application might be rendered in different contexts.

- Test your theming on all intended target platforms (web, mobile, desktop).
- Verify both your light and dark mode configurations.
- Ensure the brand experience feels consistent across different device
  orientations and screen sizes.

---

By separating the semantic structure (the Catalog) from the visual
presentation (the Theme), A2UI ensures that the UI retains brand consistency
while rendering safely within your application.
