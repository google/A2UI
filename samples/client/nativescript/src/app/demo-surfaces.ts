import { Types } from "../a2ui-lit-types";

/**
 * Comprehensive demo surfaces for showcasing ALL A2UI capabilities.
 * These are used when running in demo mode (no backend server connected).
 *
 * Trigger phrases:
 * - "hello", "welcome" → Welcome surface
 * - "restaurant", "food", "eat" → Restaurant cards with actions
 * - "contact", "person" → Contact card with Row/Column layout
 * - "analytics", "chart", "dashboard" → Stats dashboard
 * - "form", "input", "signup" → Form with TextField, CheckBox
 * - "list", "items", "scroll" → List component demo
 * - "image", "photo", "gallery" → Image gallery
 * - "tabs", "sections" → Tabs component
 * - "buttons", "actions" → All button variants
 * - "all", "showcase", "components" → Full component showcase
 */

// ============================================================
// WELCOME SURFACE
// ============================================================
export const DEMO_WELCOME_SURFACE: Types.A2uiMessage = {
  surfaceId: "demo-welcome",
  root: {
    type: "Column",
    id: "welcome-root",
    children: [
      {
        type: "Card",
        id: "welcome-card",
        title: "Welcome to A2UI Demo",
        subtitle: "Interactive Agent-to-User Interface",
        children: [
          {
            type: "Text",
            id: "welcome-text",
            text: "This demo showcases A2UI's capabilities on NativeScript. Try these commands to see different UI surfaces:",
            textStyle: "body",
          },
          {
            type: "Spacer",
            id: "spacer-1",
            height: 16,
          },
          {
            type: "Column",
            id: "command-list",
            children: [
              {
                type: "Text",
                id: "cmd-1",
                text: '• "restaurants" - Card list with actions',
                textStyle: "body",
              },
              {
                type: "Text",
                id: "cmd-2",
                text: '• "contact" - Contact card layout',
                textStyle: "body",
              },
              {
                type: "Text",
                id: "cmd-3",
                text: '• "dashboard" - Analytics cards',
                textStyle: "body",
              },
              {
                type: "Text",
                id: "cmd-4",
                text: '• "form" - Input fields & checkboxes',
                textStyle: "body",
              },
              {
                type: "Text",
                id: "cmd-5",
                text: '• "list" - Scrollable list demo',
                textStyle: "body",
              },
              {
                type: "Text",
                id: "cmd-6",
                text: '• "gallery" - Image showcase',
                textStyle: "body",
              },
              {
                type: "Text",
                id: "cmd-7",
                text: '• "buttons" - All button variants',
                textStyle: "body",
              },
              {
                type: "Text",
                id: "cmd-8",
                text: '• "menu" - Native platform menus',
                textStyle: "body",
              },
              {
                type: "Text",
                id: "cmd-9",
                text: '• "showcase" - Full component demo',
                textStyle: "body",
              },
            ],
          },
          {
            type: "Spacer",
            id: "spacer-2",
            height: 16,
          },
          {
            type: "Row",
            id: "action-row",
            children: [
              {
                type: "Button",
                id: "try-demo-btn",
                label: "Try Showcase",
                variant: "primary",
                action: { name: "showcase" },
              },
            ],
          },
        ],
      },
    ],
  } as Types.Node,
};

// ============================================================
// RESTAURANT FINDER SURFACE
// ============================================================
export const DEMO_RESTAURANT_SURFACE: Types.A2uiMessage = {
  surfaceId: "demo-restaurants",
  root: {
    type: "Column",
    id: "restaurant-root",
    children: [
      {
        type: "Text",
        id: "restaurant-title",
        text: "🍕 Top Restaurants Near You",
        textStyle: "title",
      },
      {
        type: "Spacer",
        id: "spacer-top",
        height: 12,
      },
      {
        type: "Card",
        id: "restaurant-1",
        title: "La Piazza Italiana",
        subtitle: "⭐ 4.8 • Italian • $$ • 0.3 mi",
        children: [
          {
            type: "Text",
            id: "restaurant-1-desc",
            text: "Authentic Italian cuisine with fresh pasta and wood-fired pizzas in a cozy atmosphere.",
            textStyle: "body",
          },
          {
            type: "Spacer",
            id: "spacer-r1",
            height: 8,
          },
          {
            type: "Row",
            id: "restaurant-1-tags",
            children: [
              {
                type: "Text",
                id: "tag-1a",
                text: "🌿 Vegetarian",
                textStyle: "caption",
              },
              {
                type: "Text",
                id: "tag-1b",
                text: "🍷 Full Bar",
                textStyle: "caption",
              },
              {
                type: "Text",
                id: "tag-1c",
                text: "📍 North Beach",
                textStyle: "caption",
              },
            ],
          },
        ],
        actions: [
          { name: "viewDetails", id: "view-1", label: "Details" },
          { name: "reserve", id: "reserve-1", label: "Reserve" },
          { name: "directions", id: "dir-1", label: "Directions" },
        ],
      },
      {
        type: "Card",
        id: "restaurant-2",
        title: "Sakura Garden",
        subtitle: "⭐ 4.6 • Japanese • $$$ • 0.5 mi",
        children: [
          {
            type: "Text",
            id: "restaurant-2-desc",
            text: "Premium sushi and traditional Japanese dishes. Omakase experience available nightly.",
            textStyle: "body",
          },
          {
            type: "Spacer",
            id: "spacer-r2",
            height: 8,
          },
          {
            type: "Row",
            id: "restaurant-2-tags",
            children: [
              {
                type: "Text",
                id: "tag-2a",
                text: "🍣 Omakase",
                textStyle: "caption",
              },
              {
                type: "Text",
                id: "tag-2b",
                text: "🍶 Sake Bar",
                textStyle: "caption",
              },
              {
                type: "Text",
                id: "tag-2c",
                text: "📍 Japantown",
                textStyle: "caption",
              },
            ],
          },
        ],
        actions: [
          { name: "viewDetails", id: "view-2", label: "Details" },
          { name: "reserve", id: "reserve-2", label: "Reserve" },
        ],
      },
      {
        type: "Card",
        id: "restaurant-3",
        title: "The Spice Route",
        subtitle: "⭐ 4.7 • Indian • $$ • 0.8 mi",
        children: [
          {
            type: "Text",
            id: "restaurant-3-desc",
            text: "Rich flavors from across India. Extensive vegetarian menu with vegan options available.",
            textStyle: "body",
          },
          {
            type: "Spacer",
            id: "spacer-r3",
            height: 8,
          },
          {
            type: "Row",
            id: "restaurant-3-tags",
            children: [
              {
                type: "Text",
                id: "tag-3a",
                text: "🌱 Vegan Options",
                textStyle: "caption",
              },
              {
                type: "Text",
                id: "tag-3b",
                text: "🌶️ Spicy",
                textStyle: "caption",
              },
              {
                type: "Text",
                id: "tag-3c",
                text: "📍 Mission",
                textStyle: "caption",
              },
            ],
          },
        ],
        actions: [
          { name: "viewDetails", id: "view-3", label: "Details" },
          { name: "reserve", id: "reserve-3", label: "Reserve" },
        ],
      },
    ],
  } as Types.Node,
};

// ============================================================
// CONTACT DETAILS SURFACE
// ============================================================
export const DEMO_CONTACT_SURFACE: Types.A2uiMessage = {
  surfaceId: "demo-contact",
  root: {
    type: "Column",
    id: "contact-root",
    children: [
      {
        type: "Card",
        id: "contact-card",
        children: [
          {
            type: "Row",
            id: "contact-header",
            children: [
              {
                type: "Column",
                id: "avatar-col",
                children: [
                  {
                    type: "Text",
                    id: "contact-avatar",
                    text: "👤",
                    textStyle: "title",
                  },
                ],
              },
              {
                type: "Spacer",
                id: "spacer-avatar",
                width: 12,
              },
              {
                type: "Column",
                id: "contact-info",
                children: [
                  {
                    type: "Text",
                    id: "contact-name",
                    text: "Sarah Johnson",
                    textStyle: "subtitle",
                  },
                  {
                    type: "Text",
                    id: "contact-role",
                    text: "Senior Product Manager at Google",
                    textStyle: "body",
                  },
                  {
                    type: 'Spacer',
                    id: 'spacer-name-role',
                    height: 4,
                  },
                  {
                    type: "Text",
                    id: "contact-location",
                    text: "📍 San Francisco, CA",
                    textStyle: "caption",
                  },
                ],
              },
            ],
          },
          {
            type: "Divider",
            id: "divider-1",
          },
          {
            type: "Spacer",
            id: "spacer-contact-1",
            height: 8,
          },
          {
            type: "Row",
            id: "contact-email-row",
            children: [
              {
                type: "Text",
                id: "email-icon",
                text: "📧",
              },
              {
                type: "Spacer",
                id: "spacer-email",
                width: 4,
              },
              {
                type: "Text",
                id: "email-value",
                text: "sarah.johnson@google.com",
                textStyle: "body",
              },
            ],
          },
          {
            type: "Spacer",
            id: "spacer-contact-2",
            height: 8,
          },
          {
            type: "Row",
            id: "contact-phone-row",
            children: [
              {
                type: "Text",
                id: "phone-icon",
                text: "📱",
              },
              {
                type: "Spacer",
                id: "spacer-phone",
                width: 4,
              },
              {
                type: "Text",
                id: "phone-value",
                text: "+1 (415) 555-0123",
                textStyle: "body",
              },
            ],
          },
          {
            type: "Spacer",
            id: "spacer-contact-3",
            height: 8,
          },
          {
            type: "Row",
            id: "contact-linkedin-row",
            children: [
              {
                type: "Text",
                id: "linkedin-icon",
                text: "💼",
              },
              {
                type: "Spacer",
                id: "spacer-email",
                width: 4,
              },
              {
                type: "Text",
                id: "linkedin-value",
                text: "linkedin.com/in/sarahjohnson",
                textStyle: "body",
              },
            ],
          },
          {
            type: "Divider",
            id: "divider-2",
          },
          {
            type: "Spacer",
            id: "spacer-contact-4",
            height: 8,
          },
          {
            type: "Row",
            id: "contact-actions",
            children: [
              {
                type: "Button",
                id: "call-btn",
                label: "📞 Call",
                variant: "primary",
                action: { name: "call" },
              },
              {
                type: "Button",
                id: "email-btn",
                label: "✉️ Email",
                variant: "secondary",
                action: { name: "email" },
              },
              {
                type: "Button",
                id: "msg-btn",
                label: "💬 Message",
                variant: "secondary",
                action: { name: "message" },
              },
            ],
          },
        ],
      },
    ],
  } as Types.Node,
};

// ============================================================
// ANALYTICS DASHBOARD SURFACE
// ============================================================
export const DEMO_CHART_SURFACE: Types.A2uiMessage = {
  surfaceId: "demo-analytics",
  root: {
    type: "Column",
    id: "chart-root",
    children: [
      {
        type: "Text",
        id: "chart-title",
        text: "📊 Analytics Dashboard",
        textStyle: "title",
      },
      {
        type: "Spacer",
        id: "spacer-1",
        height: 12,
      },
      {
        type: "Row",
        id: "stats-row-1",
        children: [
          {
            type: "Card",
            id: "stat-1",
            title: "12,549",
            subtitle: "Total Users",
            children: [
              {
                type: "Text",
                id: "stat-1-change",
                text: "↑ 12.5% from last month",
                textStyle: "caption",
              },
            ],
          },
          {
            type: "Card",
            id: "stat-2",
            title: "3,247",
            subtitle: "Active Today",
            children: [
              {
                type: "Text",
                id: "stat-2-change",
                text: "↑ 8.3% from yesterday",
                textStyle: "caption",
              },
            ],
          },
        ],
      },
      {
        type: "Spacer",
        id: "spacer-stats",
        height: 8,
      },
      {
        type: "Row",
        id: "stats-row-2",
        children: [
          {
            type: "Card",
            id: "stat-3",
            title: "$48.2K",
            subtitle: "Revenue",
            children: [
              {
                type: "Text",
                id: "stat-3-change",
                text: "↑ 23.1% this quarter",
                textStyle: "caption",
              },
            ],
          },
          {
            type: "Card",
            id: "stat-4",
            title: "98.5%",
            subtitle: "Uptime",
            children: [
              {
                type: "Text",
                id: "stat-4-change",
                text: "✓ Exceeds SLA target",
                textStyle: "caption",
              },
            ],
          },
        ],
      },
      {
        type: "Spacer",
        id: "spacer-2",
        height: 12,
      },
      {
        type: "Card",
        id: "chart-card",
        title: "Weekly Activity",
        subtitle: "User sessions per day",
        children: [
          {
            type: "Row",
            id: "chart-bars",
            horizontalAlignment: "spaceAround",
            children: [
              {
                type: "Column",
                id: "bar-col-1",
                children: [
                  {
                    type: "Text",
                    id: "bar-1",
                    text: "▓\n▓\n▓",
                    textStyle: "code",
                  },
                  {
                    type: "Text",
                    id: "label-1",
                    text: "Mon",
                    textStyle: "caption",
                  },
                ],
              },
              {
                type: "Column",
                id: "bar-col-2",
                children: [
                  {
                    type: "Text",
                    id: "bar-2",
                    text: "▓\n▓\n▓\n▓",
                    textStyle: "code",
                  },
                  {
                    type: "Text",
                    id: "label-2",
                    text: "Tue",
                    textStyle: "caption",
                  },
                ],
              },
              {
                type: "Column",
                id: "bar-col-3",
                children: [
                  {
                    type: "Text",
                    id: "bar-3",
                    text: "▓\n▓",
                    textStyle: "code",
                  },
                  {
                    type: "Text",
                    id: "label-3",
                    text: "Wed",
                    textStyle: "caption",
                  },
                ],
              },
              {
                type: "Column",
                id: "bar-col-4",
                children: [
                  {
                    type: "Text",
                    id: "bar-4",
                    text: "▓\n▓\n▓\n▓\n▓",
                    textStyle: "code",
                  },
                  {
                    type: "Text",
                    id: "label-4",
                    text: "Thu",
                    textStyle: "caption",
                  },
                ],
              },
              {
                type: "Column",
                id: "bar-col-5",
                children: [
                  {
                    type: "Text",
                    id: "bar-5",
                    text: "▓\n▓\n▓",
                    textStyle: "code",
                  },
                  {
                    type: "Text",
                    id: "label-5",
                    text: "Fri",
                    textStyle: "caption",
                  },
                ],
              },
              {
                type: "Column",
                id: "bar-col-6",
                children: [
                  {
                    type: "Text",
                    id: "bar-6",
                    text: "▓\n▓\n▓\n▓",
                    textStyle: "code",
                  },
                  {
                    type: "Text",
                    id: "label-6",
                    text: "Sat",
                    textStyle: "caption",
                  },
                ],
              },
              {
                type: "Column",
                id: "bar-col-7",
                children: [
                  {
                    type: "Text",
                    id: "bar-7",
                    text: "▓\n▓",
                    textStyle: "code",
                  },
                  {
                    type: "Text",
                    id: "label-7",
                    text: "Sun",
                    textStyle: "caption",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  } as Types.Node,
};

// ============================================================
// FORM INPUT SURFACE
// ============================================================
export const DEMO_FORM_SURFACE: Types.A2uiMessage = {
  surfaceId: "demo-form",
  root: {
    type: "Column",
    id: "form-root",
    children: [
      {
        type: "Text",
        id: "form-title",
        text: "📝 Sign Up Form",
        textStyle: "title",
      },
      {
        type: "Spacer",
        id: "spacer-form-1",
        height: 16,
      },
      {
        type: "Card",
        id: "form-card",
        children: [
          {
            type: "TextField",
            id: "name-field",
            label: "Full Name",
            placeholder: "Enter your name",
          },
          {
            type: "Spacer",
            id: "spacer-f1",
            height: 12,
          },
          {
            type: "TextField",
            id: "email-field",
            label: "Email Address",
            placeholder: "you@example.com",
          },
          {
            type: "Spacer",
            id: "spacer-f2",
            height: 12,
          },
          {
            type: "TextField",
            id: "password-field",
            label: "Password",
            placeholder: "••••••••",
            secure: true,
          },
          {
            type: "Spacer",
            id: "spacer-f3",
            height: 16,
          },
          {
            type: "Divider",
            id: "form-divider",
          },
          {
            type: "Spacer",
            id: "spacer-f4",
            height: 16,
          },
          {
            type: "Text",
            id: "prefs-title",
            text: "Preferences",
            textStyle: "subtitle",
          },
          {
            type: "Spacer",
            id: "spacer-f5",
            height: 8,
          },
          {
            type: "Row",
            id: "checkbox-row-1",
            children: [
              {
                type: "Text",
                id: "check-1",
                text: "☑️ Receive email updates",
                textStyle: "body",
              },
            ],
          },
          {
            type: "Row",
            id: "checkbox-row-2",
            children: [
              {
                type: "Text",
                id: "check-2",
                text: "☐ Enable notifications",
                textStyle: "body",
              },
            ],
          },
          {
            type: "Row",
            id: "checkbox-row-3",
            children: [
              {
                type: "Text",
                id: "check-3",
                text: "☑️ Accept terms & conditions",
                textStyle: "body",
              },
            ],
          },
          {
            type: "Spacer",
            id: "spacer-f6",
            height: 16,
          },
          {
            type: "Row",
            id: "form-actions",
            children: [
              {
                type: "Button",
                id: "submit-btn",
                label: "Create Account",
                variant: "primary",
                action: { name: "submit" },
              },
              {
                type: "Button",
                id: "cancel-btn",
                label: "Cancel",
                variant: "secondary",
                action: { name: "cancel" },
              },
            ],
          },
        ],
      },
    ],
  } as Types.Node,
};

// ============================================================
// LIST COMPONENT SURFACE
// ============================================================
export const DEMO_LIST_SURFACE: Types.A2uiMessage = {
  surfaceId: "demo-list",
  root: {
    type: "Column",
    id: "list-root",
    children: [
      {
        type: "Text",
        id: "list-title",
        text: "📋 To Do",
        textStyle: "title",
      },
      {
        type: "Spacer",
        id: "spacer-list-1",
        height: 12,
      },
      {
        type: "List",
        id: "task-list",
        direction: "vertical",
        children: [
          {
            type: "Card",
            id: "task-1",
            children: [
              {
                type: "Row",
                id: "task-1-row",
                children: [
                  {
                    type: "Text",
                    id: "task-1-check",
                    text: "✅",
                    textStyle: "body",
                  },
                  { type: "Spacer", id: "spacer-t5", width: 8 },
                  {
                    type: "Column",
                    id: "task-1-content",
                    children: [
                      {
                        type: "Text",
                        id: "task-1-title",
                        text: "Complete project proposal",
                        textStyle: "subtitle",
                      },
                      {
                        type: "Text",
                        id: "task-1-meta",
                        text: "Completed yesterday",
                        textStyle: "caption",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "Card",
            id: "task-2",
            children: [
              {
                type: "Row",
                id: "task-2-row",
                children: [
                  {
                    type: "Text",
                    id: "task-2-check",
                    text: "✅",
                    textStyle: "body",
                  },
                  { type: "Spacer", id: "spacer-t5", width: 8 },
                  {
                    type: "Column",
                    id: "task-2-content",
                    children: [
                      {
                        type: "Text",
                        id: "task-2-title",
                        text: "Review design mockups",
                        textStyle: "subtitle",
                      },
                      {
                        type: "Text",
                        id: "task-2-meta",
                        text: "Completed today",
                        textStyle: "caption",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "Card",
            id: "task-3",
            children: [
              {
                type: "Row",
                id: "task-3-row",
                children: [
                  {
                    type: "Text",
                    id: "task-3-check",
                    text: "⬜",
                    textStyle: "body",
                  },
                  { type: "Spacer", id: "spacer-t5", width: 8 },
                  {
                    type: "Column",
                    id: "task-3-content",
                    children: [
                      {
                        type: "Text",
                        id: "task-3-title",
                        text: "Schedule team meeting",
                        textStyle: "subtitle",
                      },
                      {
                        type: "Text",
                        id: "task-3-meta",
                        text: "Due tomorrow",
                        textStyle: "caption",
                      },
                    ],
                  },
                ],
              },
            ],
            actions: [
              { name: "complete", id: "complete-3", label: "Done" },
              { name: "reschedule", id: "reschedule-3", label: "Reschedule" },
            ],
          },
          {
            type: "Card",
            id: "task-4",
            children: [
              {
                type: "Row",
                id: "task-4-row",
                children: [
                  {
                    type: "Text",
                    id: "task-4-check",
                    text: "⬜",
                    textStyle: "body",
                  },
                  { type: "Spacer", id: "spacer-t5", width: 8 },
                  {
                    type: "Column",
                    id: "task-4-content",
                    children: [
                      {
                        type: "Text",
                        id: "task-4-title",
                        text: "Prepare quarterly report",
                        textStyle: "subtitle",
                      },
                      {
                        type: "Text",
                        id: "task-4-meta",
                        text: "Due in 3 days",
                        textStyle: "caption",
                      },
                    ],
                  },
                ],
              },
            ],
            actions: [{ name: "complete", id: "complete-4", label: "Done" }],
          },
          {
            type: "Card",
            id: "task-5",
            children: [
              {
                type: "Row",
                id: "task-5-row",
                children: [
                  {
                    type: "Text",
                    id: "task-5-check",
                    text: "⬜",
                    textStyle: "body",
                  },
                  { type: "Spacer", id: "spacer-t5", width: 8 },
                  {
                    type: "Column",
                    id: "task-5-content",
                    children: [
                      {
                        type: "Text",
                        id: "task-5-title",
                        text: "Update documentation",
                        textStyle: "subtitle",
                      },
                      {
                        type: "Text",
                        id: "task-5-meta",
                        text: "Due next week",
                        textStyle: "caption",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "Spacer",
        id: "spacer-list-2",
        height: 12,
      },
      {
        type: "Button",
        id: "add-task-btn",
        label: "+ Add New Task",
        variant: "primary",
        action: { name: "addTask" },
      },
    ],
  } as Types.Node,
};

// ============================================================
// IMAGE GALLERY SURFACE
// ============================================================
export const DEMO_IMAGE_SURFACE: Types.A2uiMessage = {
  surfaceId: "demo-gallery",
  root: {
    type: "Column",
    id: "gallery-root",
    children: [
      {
        type: "Text",
        id: "gallery-title",
        text: "🖼️ Images",
        textStyle: "title",
      },
      {
        type: "Text",
        id: "gallery-subtitle",
        text: "A2UI supports images with various sizing hints",
        textStyle: "caption",
      },
      {
        type: "Spacer",
        id: "spacer-gallery-1",
        height: 12,
      },
      {
        type: "Card",
        id: "featured-image-card",
        title: "Featured Photo",
        children: [
          {
            type: "Image",
            id: "featured-image",
            url: "https://picsum.photos/400/200",
            fit: "cover",
            usageHint: "largeFeature",
          },
          {
            type: "Spacer",
            id: "spacer-g1",
            height: 8,
          },
          {
            type: "Text",
            id: "featured-caption",
            text: "Beautiful landscape photography with cover fit",
            textStyle: "caption",
          },
        ],
      },
      {
        type: "Spacer",
        id: "spacer-gallery-2",
        height: 12,
      },
      {
        type: "Row",
        id: "thumbnail-row",
        children: [
          {
            type: "Card",
            id: "thumb-1",
            children: [
              {
                type: "Image",
                id: "thumb-img-1",
                url: "https://picsum.photos/300/300?random=1",
                usageHint: "smallFeature",
              },
            ],
          },
          {
            type: "Card",
            id: "thumb-2",
            children: [
              {
                type: "Image",
                id: "thumb-img-2",
                url: "https://picsum.photos/300/300?random=2",
                usageHint: "smallFeature",
              },
            ],
          },
          {
            type: "Card",
            id: "thumb-3",
            children: [
              {
                type: "Image",
                id: "thumb-img-3",
                url: "https://picsum.photos/300/300?random=3",
                usageHint: "smallFeature",
              },
            ],
          },
        ],
      },
      {
        type: "Spacer",
        id: "spacer-gallery-3",
        height: 12,
      },
      {
        type: "Row",
        id: "gallery-actions",
        children: [
          {
            type: "Button",
            id: "upload-btn",
            label: "📤 Upload",
            variant: "primary",
            action: { name: "upload" },
          },
          {
            type: "Spacer",
            id: "spacer-g2",
            width: 8,
          },
          {
            type: "Button",
            id: "share-btn",
            label: "🔗 Share",
            variant: "secondary",
            action: { name: "share" },
          },
        ],
      },
    ],
  } as Types.Node,
};

// ============================================================
// BUTTON VARIANTS SURFACE
// ============================================================
export const DEMO_BUTTONS_SURFACE: Types.A2uiMessage = {
  surfaceId: "demo-buttons",
  root: {
    type: "Column",
    id: "buttons-root",
    children: [
      {
        type: "Text",
        id: "buttons-title",
        text: "🔘 Button Variants",
        textStyle: "title",
      },
      {
        type: "Spacer",
        id: "spacer-b1",
        height: 16,
      },
      {
        type: "Card",
        id: "primary-section",
        title: "Primary Buttons",
        subtitle: "For main call-to-action",
        children: [
          {
            type: "Row",
            id: "primary-row",
            children: [
              {
                type: "Button",
                id: "btn-p1",
                label: "Submit",
                variant: "primary",
                action: { name: "submit" },
              },
              {
                type: "Button",
                id: "btn-p2",
                label: "Continue",
                variant: "primary",
                action: { name: "continue" },
              },
              {
                type: "Button",
                id: "btn-p3",
                label: "Save",
                variant: "primary",
                action: { name: "save" },
              },
            ],
          },
        ],
      },
      {
        type: "Spacer",
        id: "spacer-b2",
        height: 12,
      },
      {
        type: "Card",
        id: "secondary-section",
        title: "Secondary Buttons",
        subtitle: "For alternative actions",
        children: [
          {
            type: "Row",
            id: "secondary-row",
            children: [
              {
                type: "Button",
                id: "btn-s1",
                label: "Cancel",
                variant: "secondary",
                action: { name: "cancel" },
              },
              {
                type: "Button",
                id: "btn-s2",
                label: "Back",
                variant: "secondary",
                action: { name: "back" },
              },
              {
                type: "Button",
                id: "btn-s3",
                label: "Skip",
                variant: "secondary",
                action: { name: "skip" },
              },
            ],
          },
        ],
      },
      {
        type: "Spacer",
        id: "spacer-b3",
        height: 12,
      },
      {
        type: "Card",
        id: "icon-section",
        title: "Buttons with Icons",
        subtitle: "Using emoji as icon indicators",
        children: [
          {
            type: "Row",
            id: "icon-row",
            children: [
              {
                type: "Button",
                id: "btn-i1",
                label: "❤️ Like",
                variant: "secondary",
                action: { name: "like" },
              },
              {
                type: "Button",
                id: "btn-i2",
                label: "📤 Share",
                variant: "secondary",
                action: { name: "share" },
              },
              {
                type: "Button",
                id: "btn-i3",
                label: "💾 Save",
                variant: "primary",
                action: { name: "save" },
              },
            ],
          },
        ],
      },
    ],
  } as Types.Node,
};

// ============================================================
// FULL COMPONENT SHOWCASE SURFACE
// ============================================================
export const DEMO_SHOWCASE_SURFACE: Types.A2uiMessage = {
  surfaceId: "demo-showcase",
  root: {
    type: "Column",
    id: "showcase-root",
    children: [
      {
        type: "Text",
        id: "showcase-title",
        text: "🎨 A2UI Component Showcase",
        textStyle: "title",
      },
      {
        type: "Text",
        id: "showcase-subtitle",
        text: "All available NativeScript A2UI components",
        textStyle: "caption",
      },
      {
        type: "Spacer",
        id: "spacer-s1",
        height: 16,
      },
      // Text Styles
      {
        type: "Card",
        id: "text-section",
        title: "📝 Text Styles",
        children: [
          {
            type: "Text",
            id: "text-title",
            text: "Title Style",
            textStyle: "title",
          },
          {
            type: "Text",
            id: "text-subtitle",
            text: "Subtitle Style",
            textStyle: "subtitle",
          },
          {
            type: "Text",
            id: "text-body",
            text: "Body text style for regular content and paragraphs.",
            textStyle: "body",
          },
          { type: "Spacer", id: "spacer-text-1", height: 4 },
          {
            type: "Text",
            id: "text-caption",
            text: "Caption style for metadata and small text",
            textStyle: "caption",
          },
          {
            type: "Text",
            id: "text-code",
            text: 'const code = "monospace";',
            textStyle: "code",
          },
        ],
      },
      {
        type: "Spacer",
        id: "spacer-s2",
        height: 12,
      },
      // Layout Components
      {
        type: "Card",
        id: "layout-section",
        title: "📐 Layout Components",
        children: [
          {
            type: "Text",
            id: "layout-desc",
            text: "Row (horizontal) and Column (vertical) layouts:",
            textStyle: "caption",
          },
          {
            type: "Spacer",
            id: "spacer-layout-1",
            height: 8,
          },
          {
            type: "Row",
            id: "demo-row",
            children: [
              { type: "Card", id: "row-item-1", title: "Row 1", children: [] },
              { type: "Card", id: "row-item-2", title: "Row 2", children: [] },
              { type: "Card", id: "row-item-3", title: "Row 3", children: [] },
            ],
          },
          {
            type: "Spacer",
            id: "spacer-layout-2",
            height: 8,
          },
          {
            type: "Divider",
            id: "layout-divider",
          },
          {
            type: "Spacer",
            id: "spacer-layout-3",
            height: 8,
          },
          {
            type: "Text",
            id: "divider-note",
            text: "↑ Divider component above",
            textStyle: "caption",
          },
        ],
      },
      {
        type: "Spacer",
        id: "spacer-s3",
        height: 12,
      },
      // Interactive Components
      {
        type: "Card",
        id: "interactive-section",
        title: "👆 Interactive Components",
        children: [
          {
            type: "Text",
            id: "btn-desc",
            text: "Button variants:",
            textStyle: "caption",
          },
          {
            type: "Spacer",
            id: "spacer-int-1",
            height: 8,
          },
          {
            type: "Row",
            id: "btn-demo-row",
            children: [
              {
                type: "Button",
                id: "demo-primary",
                label: "Primary",
                variant: "primary",
                action: { name: "demo" },
              },
              {
                type: "Button",
                id: "demo-secondary",
                label: "Secondary",
                variant: "secondary",
                action: { name: "demo" },
              },
            ],
          },
          {
            type: "Spacer",
            id: "spacer-int-2",
            height: 12,
          },
          {
            type: "Text",
            id: "input-desc",
            text: "Input field:",
            textStyle: "caption",
          },
          {
            type: "Spacer",
            id: "spacer-int-3",
            height: 8,
          },
          {
            type: "TextField",
            id: "demo-input",
            label: "Sample Input",
            placeholder: "Type something...",
          },
        ],
      },
      {
        type: "Spacer",
        id: "spacer-s4",
        height: 12,
      },
      // Card with Actions
      {
        type: "Card",
        id: "action-card-section",
        title: "🎯 Card with Actions",
        subtitle: "Cards can have footer action buttons",
        children: [
          {
            type: "Text",
            id: "action-card-text",
            text: "This card demonstrates the actions property which renders as footer buttons.",
            textStyle: "body",
          },
        ],
        actions: [
          { name: "action1", id: "action-1", label: "Action 1" },
          { name: "action2", id: "action-2", label: "Action 2" },
          { name: "action3", id: "action-3", label: "More..." },
        ],
      },
      {
        type: "Spacer",
        id: "spacer-s5",
        height: 12,
      },
      // Spacer demo
      {
        type: "Card",
        id: "spacer-section",
        title: "📏 Spacer Component",
        children: [
          {
            type: "Text",
            id: "spacer-text-1",
            text: "No spacer below",
            textStyle: "body",
          },
          {
            type: "Text",
            id: "spacer-text-2",
            text: "Text right after",
            textStyle: "body",
          },
          { type: "Spacer", id: "demo-spacer", height: 24 },
          {
            type: "Text",
            id: "spacer-text-3",
            text: "24px spacer above",
            textStyle: "body",
          },
        ],
      },
    ],
  } as Types.Node,
};

// ============================================================
// MENU DEMO SURFACE
// ============================================================
export const DEMO_MENU_SURFACE: Types.A2uiMessage = {
  surfaceId: "demo-menu",
  root: {
    type: "Column",
    id: "menu-root",
    children: [
      {
        type: "Card",
        id: "menu-card-1",
        title: "Native Platform Menus",
        children: [
          {
            type: "Text",
            id: "menu-desc",
            text: "Tap the buttons below to see native dropdown menus. On iOS uses UIMenu, on Android uses PopupMenu.",
            textStyle: "body",
          },
          {
            type: "Spacer",
            id: "menu-spacer-2",
            height: 16,
          },
          {
            type: "Row",
            id: "menu-examples-row",
            children: [
              {
                type: "Menu",
                id: "options-menu",
                label: "⋮",
                title: "Options",
                items: [
                  { id: "edit", title: "Edit", icon: "pencil" },
                  { id: "share", title: "Share", icon: "square.and.arrow.up" },
                  { id: "duplicate", title: "Duplicate", icon: "doc.on.doc" },
                  {
                    id: "delete",
                    title: "Delete",
                    destructive: true,
                    icon: "trash",
                  },
                ],
              },
              {
                type: "Spacer",
                id: "menu-btn-spacer",
                width: 16,
              },
              {
                type: "Menu",
                id: "actions-menu",
                label: "Actions",
                title: "Quick Actions",
                items: [
                  {
                    id: "new-doc",
                    title: "New Document",
                    icon: "doc.badge.plus",
                  },
                  {
                    id: "new-folder",
                    title: "New Folder",
                    icon: "folder.badge.plus",
                  },
                  {
                    id: "import",
                    title: "Import File",
                    icon: "square.and.arrow.down",
                  },
                ],
              },
              {
                type: "Spacer",
                id: "menu-btn-spacer-2",
                width: 16,
              },
              {
                type: "Menu",
                id: "sort-menu",
                label: "Sort ▾",
                title: "Sort By",
                items: [
                  { id: "sort-name", title: "Name" },
                  { id: "sort-date", title: "Date Modified" },
                  { id: "sort-size", title: "Size" },
                  { id: "sort-type", title: "Type" },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "Spacer",
        id: "menu-spacer-3",
        height: 16,
      },
      {
        type: "Card",
        id: "menu-card-2",
        title: "Features",
        children: [
          {
            type: "Column",
            id: "menu-features",
            children: [
              {
                type: "Text",
                id: "mf-1",
                text: "• Native look and feel on each platform",
                textStyle: "body",
              },
              {
                type: "Text",
                id: "mf-2",
                text: "• Supports SF Symbols icons on iOS",
                textStyle: "body",
              },
              {
                type: "Text",
                id: "mf-3",
                text: "• Destructive items shown in red",
                textStyle: "body",
              },
              {
                type: "Text",
                id: "mf-4",
                text: "• Items can be disabled",
                textStyle: "body",
              },
              {
                type: "Text",
                id: "mf-5",
                text: "• Menu selections trigger actions",
                textStyle: "body",
              },
            ],
          },
        ],
      },
    ],
  } as Types.Node,
};

// ============================================================
// DEMO RESPONSE ROUTER
// ============================================================
export function getDemoResponse(query: string): {
  text: string;
  surface?: Types.A2uiMessage;
} {
  const q = query.toLowerCase().trim();

  // Restaurant/Food queries
  if (
    q.includes("restaurant") ||
    q.includes("food") ||
    q.includes("eat") ||
    q.includes("dinner") ||
    q.includes("lunch")
  ) {
    return {
      text: "🍕 I found some great restaurants near you! Here are my top recommendations:",
      surface: DEMO_RESTAURANT_SURFACE,
    };
  }

  // Contact queries
  if (
    q.includes("contact") ||
    q.includes("person") ||
    q.includes("profile") ||
    q.includes("john") ||
    q.includes("sarah")
  ) {
    return {
      text: "📇 Here's the contact information you requested:",
      surface: DEMO_CONTACT_SURFACE,
    };
  }

  // Analytics/Dashboard queries
  if (
    q.includes("analytics") ||
    q.includes("chart") ||
    q.includes("stats") ||
    q.includes("dashboard") ||
    q.includes("metrics")
  ) {
    return {
      text: "📊 Here's your analytics dashboard with the latest data:",
      surface: DEMO_CHART_SURFACE,
    };
  }

  // Form/Input queries
  if (
    q.includes("form") ||
    q.includes("input") ||
    q.includes("signup") ||
    q.includes("sign up") ||
    q.includes("register")
  ) {
    return {
      text: "📝 Here's a sign-up form:",
      surface: DEMO_FORM_SURFACE,
    };
  }

  // List queries
  if (
    q.includes("list") ||
    q.includes("task") ||
    q.includes("todo") ||
    q.includes("items") ||
    q.includes("scroll")
  ) {
    return {
      text: "📋 Here's your todos:",
      surface: DEMO_LIST_SURFACE,
    };
  }

  // Image/Gallery queries
  if (
    q.includes("image") ||
    q.includes("photo") ||
    q.includes("gallery") ||
    q.includes("picture")
  ) {
    return {
      text: "🖼️ Here's your recent images:",
      surface: DEMO_IMAGE_SURFACE,
    };
  }

  // Button queries
  if (q.includes("button") || q.includes("action") || q.includes("click")) {
    return {
      text: "🔘 Here are all the button variants available in A2UI:",
      surface: DEMO_BUTTONS_SURFACE,
    };
  }

  // Menu queries
  if (q.includes("menu") || q.includes("popup") || q.includes("dropdown")) {
    return {
      text: "📱 You bet! Here's native platform menus:",
      surface: DEMO_MENU_SURFACE,
    };
  }

  // Showcase/All components
  if (
    q.includes("all") ||
    q.includes("showcase") ||
    q.includes("components") ||
    q.includes("demo") ||
    q.includes("everything")
  ) {
    return {
      text: "🎨 Here's a comprehensive showcase of all A2UI components:",
      surface: DEMO_SHOWCASE_SURFACE,
    };
  }

  // Hello/Welcome
  if (
    q.includes("hello") ||
    q.includes("hi") ||
    q.includes("hey") ||
    q.includes("welcome") ||
    q.includes("start")
  ) {
    return {
      text: "Hello! 👋 I'm the A2UI demo agent. Let me show you what I can do!",
      surface: DEMO_WELCOME_SURFACE,
    };
  }

  // Help
  if (
    q.includes("help") ||
    q.includes("what can") ||
    q.includes("commands") ||
    q.includes("options")
  ) {
    return {
      text: `I can demonstrate A2UI's rich interface capabilities! Try these commands:

🍕 **"restaurants"** - Browse restaurant cards with actions
📇 **"contact"** - View a contact profile layout  
📊 **"dashboard"** - See an analytics dashboard
📝 **"form"** - Interactive form with inputs
📋 **"list"** - Scrollable task list
🖼️ **"gallery"** - Image gallery showcase
🔘 **"buttons"** - All button variants
📱 **"menu"** - Native platform menus
🎨 **"showcase"** - Full component demo

Each command displays an interactive UI surface!`,
    };
  }

  // Default response with welcome surface
  return {
    text: `I'm running in demo mode. Try one of these commands to see A2UI surfaces:

• **"restaurants"** - Card list with actions
• **"contact"** - Contact profile
• **"dashboard"** - Analytics stats  
• **"form"** - Input fields demo
• **"showcase"** - All components

Or say **"help"** for the full list!`,
    surface: DEMO_WELCOME_SURFACE,
  };
}

/**
 * Get all available demo surfaces for testing
 */
export function getAllDemoSurfaces(): Types.A2uiMessage[] {
  return [
    DEMO_WELCOME_SURFACE,
    DEMO_RESTAURANT_SURFACE,
    DEMO_CONTACT_SURFACE,
    DEMO_CHART_SURFACE,
    DEMO_FORM_SURFACE,
    DEMO_LIST_SURFACE,
    DEMO_IMAGE_SURFACE,
    DEMO_BUTTONS_SURFACE,
    DEMO_MENU_SURFACE,
    DEMO_SHOWCASE_SURFACE,
  ];
}
