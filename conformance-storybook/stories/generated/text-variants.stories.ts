// AUTO-GENERATED — do not edit. Run: node scripts/generate-stories.mjs
import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/a2ui-story-wrapper.js";
import { translateToV08 } from "../helpers/version-adapter.js";
import type { V010Message } from "../helpers/version-adapter.js";

const meta: Meta = { title: "Generated/Components/Text" };
export default meta;

const Heading_1_messages: V010Message[] = [
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
          "component": "Text",
          "text": "Heading 1",
          "variant": "h1"
        }
      ]
    }
  }
];

export const Heading_1_v08_Lit: StoryObj = {
  name: "Heading 1 [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Heading_1_messages), "s1"),
};

const Heading_2_messages: V010Message[] = [
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
          "component": "Text",
          "text": "Heading 2",
          "variant": "h2"
        }
      ]
    }
  }
];

export const Heading_2_v08_Lit: StoryObj = {
  name: "Heading 2 [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Heading_2_messages), "s1"),
};

const Heading_3_messages: V010Message[] = [
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
          "component": "Text",
          "text": "Heading 3",
          "variant": "h3"
        }
      ]
    }
  }
];

export const Heading_3_v08_Lit: StoryObj = {
  name: "Heading 3 [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Heading_3_messages), "s1"),
};

const Body_messages: V010Message[] = [
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
          "component": "Text",
          "text": "This is body text with normal styling.",
          "variant": "body"
        }
      ]
    }
  }
];

export const Body_v08_Lit: StoryObj = {
  name: "Body [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Body_messages), "s1"),
};

const Caption_messages: V010Message[] = [
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
          "component": "Text",
          "text": "Caption text",
          "variant": "caption"
        }
      ]
    }
  }
];

export const Caption_v08_Lit: StoryObj = {
  name: "Caption [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Caption_messages), "s1"),
};

