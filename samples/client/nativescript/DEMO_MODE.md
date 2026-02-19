# A2UI NativeScript Demo Mode

This document explains how the demo mode works in the NativeScript A2UI sample client and the keywords you can use to trigger different UI surfaces.

## Overview

Demo Mode allows you to test and explore A2UI's rich UI rendering capabilities without needing a live backend server. When the app cannot connect to an A2A server (or when you manually switch to demo mode), it will respond to your messages with pre-built A2UI surfaces that showcase all available components.

## Enabling/Disabling Demo Mode

### Automatic Mode
- The app **starts in Demo Mode by default**
- If the A2A server is available, you can toggle between Demo and Live modes

### Manual Toggle
1. Tap the **⋯** menu button in the header
2. Select one of:
   - **"🔴 Switch to Live Mode"** - Connect to the A2A server (if available)
   - **"🟢 Switch to Demo Mode"** - Use local demo surfaces
   - **"Show All Demo Surfaces"** - Quickly trigger the showcase

### Status Indicator
The header shows the current mode:
- 🟠 **"Demo Mode"** - Using local demo surfaces, server unavailable
- 🟠 **"Demo Mode (Server Available)"** - Using demos, but server is reachable
- 🟢 **"Connected to Server"** - Using live A2A backend

---

## Keyword Triggers

### ⚠️ Important: Keywords Work Within Sentences

Keywords can appear **anywhere in your message** - you don't need to type just the keyword alone. The matching is case-insensitive and uses substring matching.

**Examples that will trigger the restaurant surface:**
- ✅ `restaurants`
- ✅ `Show me some restaurants`
- ✅ `I want to find a good restaurant nearby`
- ✅ `What's for dinner?`
- ✅ `Where should we eat?`

---

## Available Demo Surfaces

### 🍕 Restaurant Finder
**Triggers:** `restaurant`, `food`, `eat`, `dinner`, `lunch`

Displays a list of restaurant cards with:
- Title, rating, cuisine type, price range
- Description text
- Tag pills (Vegetarian, Full Bar, Location)
- Action buttons (Details, Reserve, Directions)

**Example messages:**
- "Show me restaurants"
- "What's good for dinner?"
- "I'm hungry, where can I eat?"

---

### 📇 Contact Card
**Triggers:** `contact`, `person`, `profile`, `john`, `sarah`

Displays a contact profile with:
- Avatar and name
- Job title and company
- Email, phone, LinkedIn
- Dividers between sections
- Action buttons (Call, Email, Message)

**Example messages:**
- "Show me Sarah's contact"
- "Look up this person"
- "Display a profile card"

---

### 📊 Analytics Dashboard
**Triggers:** `analytics`, `chart`, `stats`, `dashboard`, `metrics`

Displays an analytics dashboard with:
- Stat cards (Total Users, Active Today, Revenue, Uptime)
- Percentage changes with arrows
- Weekly activity bar chart

**Example messages:**
- "Show the dashboard"
- "What are the stats?"
- "Display analytics metrics"

---

### 📝 Sign Up Form
**Triggers:** `form`, `input`, `signup`, `sign up`, `register`

Displays a form with:
- Text fields (Name, Email, Password)
- Checkbox preferences
- Divider separating sections
- Submit and Cancel buttons

**Example messages:**
- "Show me a form"
- "I want to sign up"
- "Display input fields"

---

### 📋 Task List
**Triggers:** `list`, `task`, `todo`, `items`, `scroll`

Displays a scrollable task list with:
- Completed and pending tasks
- Check marks and metadata
- Action buttons on pending items
- Add New Task button

**Example messages:**
- "Show my tasks"
- "Display a todo list"
- "What items do I have?"

---

### 🖼️ Image Gallery
**Triggers:** `image`, `photo`, `gallery`, `picture`

Displays an image gallery with:
- Featured large image with cover fit
- Thumbnail grid row
- Image captions
- Upload and Share buttons

**Example messages:**
- "Show me a gallery"
- "Display some photos"
- "Show images"

---

### 🔘 Button Variants
**Triggers:** `button`, `action`, `click`

Displays all button styles:
- Primary buttons (Submit, Continue, Save)
- Secondary buttons (Cancel, Back, Skip)
- Buttons with emoji icons

**Example messages:**
- "Show me buttons"
- "What actions can I take?"
- "Display clickable elements"

---

### 📱 Native Platform Menus
**Triggers:** `menu`, `popup`, `dropdown`

Displays native platform menus:
- Uses iOS UIAlertController with action sheet style
- Uses Android PopupMenu for native dropdown
- Demonstrates menu items with icons
- Shows destructive item styling
- Action items send events to agent

**Example messages:**
- "Show me a menu"
- "Display a dropdown"
- "Popup menu demo"

---

### 🎨 Full Component Showcase
**Triggers:** `all`, `showcase`, `components`, `demo`, `everything`

Displays a comprehensive demo of all A2UI components:
- Text styles (title, subtitle, body, caption, code)
- Layout components (Row, Column, Divider)
- Interactive components (Buttons, TextField)
- Card with action buttons
- Spacer component demo

**Example messages:**
- "Show me everything"
- "Display all components"
- "Showcase demo"

---

### 👋 Welcome Screen
**Triggers:** `hello`, `hi`, `hey`, `welcome`, `start`

Displays the welcome card with:
- Introduction to A2UI
- List of available commands
- "Try Showcase" button

**Example messages:**
- "Hello!"
- "Hey there"
- "Welcome"

---

### ❓ Help
**Triggers:** `help`, `what can`, `commands`, `options`

Returns a text message listing all available commands (no surface).

**Example messages:**
- "Help"
- "What can you do?"
- "Show me the commands"

---

## Keyword Reference Table

| Surface | Keywords | Example Message |
|---------|----------|-----------------|
| Restaurant | `restaurant`, `food`, `eat`, `dinner`, `lunch` | "Find restaurants nearby" |
| Contact | `contact`, `person`, `profile`, `john`, `sarah` | "Show Sarah's profile" |
| Dashboard | `analytics`, `chart`, `stats`, `dashboard`, `metrics` | "Open the dashboard" |
| Form | `form`, `input`, `signup`, `sign up`, `register` | "I want to register" |
| List | `list`, `task`, `todo`, `items`, `scroll` | "Show my todo list" |
| Gallery | `image`, `photo`, `gallery`, `picture` | "Display photos" |
| Buttons | `button`, `action`, `click` | "Show button variants" |
| Menu | `menu`, `popup`, `dropdown` | "Show a dropdown menu" |
| Showcase | `all`, `showcase`, `components`, `demo`, `everything` | "Show all components" |
| Welcome | `hello`, `hi`, `hey`, `welcome`, `start` | "Hi there!" |
| Help | `help`, `what can`, `commands`, `options` | "Help me" |

---

## Default Response

If your message doesn't match any keywords, you'll see:
- A default text response suggesting commands to try
- The Welcome surface with a list of available demos

---

## Technical Details

The demo mode is implemented in:
- **`demo-surfaces.ts`** - Contains all A2UI surface definitions and the `getDemoResponse()` router
- **`chat.service.ts`** - Handles mode switching and routes messages to demo or live mode

The keyword matching uses JavaScript's `String.includes()` method with lowercase conversion, making it:
- **Case-insensitive**: "RESTAURANTS" works the same as "restaurants"
- **Substring-based**: Keywords anywhere in the message will trigger
- **First-match wins**: Keywords are checked in order; the first match determines the response

---

## Adding New Demo Surfaces

To add a new demo surface:

1. Define the surface constant in `demo-surfaces.ts`:
```typescript
export const DEMO_MY_SURFACE: Types.A2uiMessage = {
  surfaceId: 'demo-my-surface',
  root: {
    type: 'Column',
    id: 'my-root',
    children: [
      // Add your components here
    ],
  } as Types.Node,
};
```

2. Add keyword matching in `getDemoResponse()`:
```typescript
if (q.includes('mykeyword') || q.includes('otherkeyword')) {
  return {
    text: 'Here is my custom surface:',
    surface: DEMO_MY_SURFACE,
  };
}
```

3. Optionally add to `getAllDemoSurfaces()` for testing.
