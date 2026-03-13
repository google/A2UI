// AUTO-GENERATED — do not edit. Run: node scripts/generate-stories.mjs
import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/a2ui-story-wrapper.js";
import { translateToV08 } from "../helpers/version-adapter.js";
import type { V010Message } from "../helpers/version-adapter.js";

const meta: Meta = { title: "Generated/Components/Layout" };
export default meta;

const Row_Basic_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "s1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "s1",
      "components": [
        {
          "id": "root",
          "component": "Row",
          "children": [
            "t1",
            "t2",
            "t3"
          ]
        },
        {
          "id": "t1",
          "component": "Text",
          "text": "Left"
        },
        {
          "id": "t2",
          "component": "Text",
          "text": "Center"
        },
        {
          "id": "t3",
          "component": "Text",
          "text": "Right"
        }
      ]
    }
  }
];

export const Row_Basic_v08_Lit: StoryObj = {
  name: "Row Basic [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Row_Basic_messages), "s1"),
};

const Row_SpaceBetween_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "s1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "s1",
      "components": [
        {
          "id": "root",
          "component": "Row",
          "children": [
            "t1",
            "t2"
          ],
          "justify": "spaceBetween"
        },
        {
          "id": "t1",
          "component": "Text",
          "text": "Left"
        },
        {
          "id": "t2",
          "component": "Text",
          "text": "Right"
        }
      ]
    }
  }
];

export const Row_SpaceBetween_v08_Lit: StoryObj = {
  name: "Row SpaceBetween [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Row_SpaceBetween_messages), "s1"),
};

const Column_Basic_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "s1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "s1",
      "components": [
        {
          "id": "root",
          "component": "Column",
          "children": [
            "t1",
            "t2",
            "t3"
          ]
        },
        {
          "id": "t1",
          "component": "Text",
          "text": "First"
        },
        {
          "id": "t2",
          "component": "Text",
          "text": "Second"
        },
        {
          "id": "t3",
          "component": "Text",
          "text": "Third"
        }
      ]
    }
  }
];

export const Column_Basic_v08_Lit: StoryObj = {
  name: "Column Basic [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Column_Basic_messages), "s1"),
};

const Column_Aligned_Center_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "s1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "s1",
      "components": [
        {
          "id": "root",
          "component": "Column",
          "children": [
            "t1",
            "t2"
          ],
          "align": "center"
        },
        {
          "id": "t1",
          "component": "Text",
          "text": "Centered"
        },
        {
          "id": "t2",
          "component": "Text",
          "text": "Content"
        }
      ]
    }
  }
];

export const Column_Aligned_Center_v08_Lit: StoryObj = {
  name: "Column Aligned Center [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Column_Aligned_Center_messages), "s1"),
};

const Divider_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "s1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "s1",
      "components": [
        {
          "id": "root",
          "component": "Column",
          "children": [
            "t1",
            "div1",
            "t2"
          ]
        },
        {
          "id": "t1",
          "component": "Text",
          "text": "Above divider"
        },
        {
          "id": "div1",
          "component": "Divider",
          "axis": "horizontal"
        },
        {
          "id": "t2",
          "component": "Text",
          "text": "Below divider"
        }
      ]
    }
  }
];

export const Divider_v08_Lit: StoryObj = {
  name: "Divider [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Divider_messages), "s1"),
};

const Tabs_messages: V010Message[] = [
  {
    "createSurface": {
      "surfaceId": "s1",
      "catalogId": "https://a2ui.org/specification/v0_10/standard_catalog.json"
    }
  },
  {
    "updateComponents": {
      "surfaceId": "s1",
      "components": [
        {
          "id": "root",
          "component": "Tabs",
          "children": [
            "tab1",
            "tab2",
            "tab3"
          ],
          "labels": [
            "Tab A",
            "Tab B",
            "Tab C"
          ]
        },
        {
          "id": "tab1",
          "component": "Text",
          "text": "Content of Tab A"
        },
        {
          "id": "tab2",
          "component": "Text",
          "text": "Content of Tab B"
        },
        {
          "id": "tab3",
          "component": "Text",
          "text": "Content of Tab C"
        }
      ]
    }
  }
];

export const Tabs_v08_Lit: StoryObj = {
  name: "Tabs [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Tabs_messages), "s1"),
};

