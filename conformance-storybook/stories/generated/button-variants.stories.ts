// AUTO-GENERATED — do not edit. Run: node scripts/generate-stories.mjs
import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/a2ui-story-wrapper.js";
import { translateToV08 } from "../helpers/version-adapter.js";
import type { V010Message } from "../helpers/version-adapter.js";

const meta: Meta = { title: "Generated/Components/Button" };
export default meta;

const Primary_messages: V010Message[] = [
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
          "component": "Button",
          "child": "txt1",
          "variant": "primary",
          "action": {
            "event": {
              "name": "click"
            }
          }
        },
        {
          "id": "txt1",
          "component": "Text",
          "text": "Primary Button"
        }
      ]
    }
  }
];

export const Primary_v08_Lit: StoryObj = {
  name: "Primary [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Primary_messages), "s1"),
};

const Outlined_messages: V010Message[] = [
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
          "component": "Button",
          "child": "txt1",
          "variant": "outlined",
          "action": {
            "event": {
              "name": "click"
            }
          }
        },
        {
          "id": "txt1",
          "component": "Text",
          "text": "Outlined Button"
        }
      ]
    }
  }
];

export const Outlined_v08_Lit: StoryObj = {
  name: "Outlined [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Outlined_messages), "s1"),
};

const Text_messages: V010Message[] = [
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
          "component": "Button",
          "child": "txt1",
          "variant": "text",
          "action": {
            "event": {
              "name": "click"
            }
          }
        },
        {
          "id": "txt1",
          "component": "Text",
          "text": "Text Button"
        }
      ]
    }
  }
];

export const Text_v08_Lit: StoryObj = {
  name: "Text [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Text_messages), "s1"),
};

const Icon_messages: V010Message[] = [
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
          "component": "Button",
          "child": "ico1",
          "variant": "icon",
          "action": {
            "event": {
              "name": "click"
            }
          }
        },
        {
          "id": "ico1",
          "component": "Icon",
          "name": "favorite"
        }
      ]
    }
  }
];

export const Icon_v08_Lit: StoryObj = {
  name: "Icon [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Icon_messages), "s1"),
};

