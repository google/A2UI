// AUTO-GENERATED — do not edit. Run: node scripts/generate-stories.mjs
import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/a2ui-story-wrapper.js";
import { translateToV08 } from "../helpers/version-adapter.js";
import type { V010Message } from "../helpers/version-adapter.js";

const meta: Meta = { title: "Generated/Components/Card" };
export default meta;

const Simple_Card_messages: V010Message[] = [
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
          "component": "Card",
          "child": "txt1"
        },
        {
          "id": "txt1",
          "component": "Text",
          "text": "Simple card content"
        }
      ]
    }
  }
];

export const Simple_Card_v08_Lit: StoryObj = {
  name: "Simple Card [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Simple_Card_messages), "s1"),
};

const Card_with_Header_messages: V010Message[] = [
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
          "component": "Card",
          "child": "col1"
        },
        {
          "id": "col1",
          "component": "Column",
          "children": [
            "header",
            "divider",
            "body"
          ]
        },
        {
          "id": "header",
          "component": "Text",
          "text": "Card Title",
          "variant": "h2"
        },
        {
          "id": "divider",
          "component": "Divider",
          "axis": "horizontal"
        },
        {
          "id": "body",
          "component": "Text",
          "text": "Card body content goes here."
        }
      ]
    }
  }
];

export const Card_with_Header_v08_Lit: StoryObj = {
  name: "Card with Header [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Card_with_Header_messages), "s1"),
};

const Nested_Cards_messages: V010Message[] = [
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
          "component": "Card",
          "child": "col1"
        },
        {
          "id": "col1",
          "component": "Column",
          "children": [
            "title",
            "inner_card"
          ]
        },
        {
          "id": "title",
          "component": "Text",
          "text": "Outer Card",
          "variant": "h2"
        },
        {
          "id": "inner_card",
          "component": "Card",
          "child": "inner_txt"
        },
        {
          "id": "inner_txt",
          "component": "Text",
          "text": "Inner card content"
        }
      ]
    }
  }
];

export const Nested_Cards_v08_Lit: StoryObj = {
  name: "Nested Cards [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Nested_Cards_messages), "s1"),
};

