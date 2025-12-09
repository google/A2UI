# A2UI Theming & Configuration Guide

This guide explains how the Universal App Shell handles theming and how to add new sample applications seamlessly.

## Architecture Overview

The styling system is built on three distinct layers:

### 1. **Base Layer (`theme.ts`)**
*   **Role**: Structural & Functional Styles.
*   **What it does**: Maps A2UI components (like `Text`, `Card`, `Row`) to functional CSS utility classes (e.g., `layout-w-100`, `typography-f-sf`).
*   **When to touch**: Rarely. Only if you need to change the fundamental layout behavior of a component.

### 2. **Theme Layer (`styles.css`)**
*   **Role**: Visual Design System.
*   **What it does**: Defines the "look and feel" using standard CSS. It handles:
    *   Glassmorphism effects (`backdrop-filter`)
    *   Shadows and elevations
    *   Typography scales and weights (using **Outfit** font)
    *   Animations (hover states, transitions)
*   **Key Mechanism**: It consumes **CSS Variables** (e.g., `var(--primary-color)`, `var(--bg-gradient)`) instead of hardcoding colors.
*   **When to touch**: When you want to change the global design language (e.g., making buttons rounder, changing shadow depths).

### 3. **Configuration Layer (`configs/*.ts`)**
*   **Role**: App Identity & Brand Overrides.
*   **What it does**: Defines the specific identity for an app (Restaurant, Contacts, etc.) and **injects** the CSS variable values that `styles.css` consumes.
*   **Key Mechanism**: The `AppConfig` interface allows you to override any CSS variable defined in the theme.
*   **When to touch**: Every time you add a new app or want to change an app's color scheme.

---

## How to Add a New Sample App

Follow these steps to add a new application (e.g., "Flight Booker") with its own unique theme.

### Step 1: Create the Config
Create a new file `configs/flights.ts`:

```typescript
import { AppConfig } from './types.js';

export const config: AppConfig = {
  key: 'flights',
  title: 'Flight Booker',
  heroImage: '/hero-flights.png',
  heroImageDark: '/hero-flights-dark.png', // Optional
  placeholder: 'Where do you want to go?',
  loadingText: ['Checking availability...', 'Finding best rates...'],
  serverUrl: 'http://localhost:10004', // Your agent's URL
  theme: {
    // Sky Blue Theme Overrides
    '--primary-color': 'light-dark(#0ea5e9, #38bdf8)',
    '--primary-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
    '--button-text': '#ffffff',
    // Custom background gradient
    '--bg-gradient': `
      radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.2) 0px, transparent 50%),
      linear-gradient(180deg, light-dark(#f0f9ff, #0c4a6e) 0%, light-dark(#e0f2fe, #075985) 100%)
    `,
  }
};
```

### Step 2: Register the Config
Update `app.ts` to include your new config:

```typescript
import { config as flightsConfig } from "./configs/flights.js";

const configs: Record<string, AppConfig> = {
  restaurant: restaurantConfig,
  contacts: contactsConfig,
  flights: flightsConfig, // Add this line
};
```

### Step 3: Run It
Access your new app by adding the `app` query parameter:
`http://localhost:5173/?app=flights`

The App Shell will automatically:
1.  Load your `flights` config.
2.  Inject your CSS variables into the document root.
3.  `styles.css` will pick up these new colors and apply them to the UI.
4.  Connect to your specified `serverUrl`.
