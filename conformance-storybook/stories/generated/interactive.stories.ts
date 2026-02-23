// AUTO-GENERATED — do not edit. Run: node scripts/generate-stories.mjs
import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/a2ui-story-wrapper.js";
import { translateToV08 } from "../helpers/version-adapter.js";
import type { V010Message } from "../helpers/version-adapter.js";

const meta: Meta = { title: "Generated/Components/Interactive" };
export default meta;

const Modal_with_Content_messages: V010Message[] = [
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
          "component": "Modal",
          "child": "content",
          "title": "Example Modal"
        },
        {
          "id": "content",
          "component": "Column",
          "children": [
            "msg",
            "btn1"
          ]
        },
        {
          "id": "msg",
          "component": "Text",
          "text": "This is modal content."
        },
        {
          "id": "btn1",
          "component": "Button",
          "child": "btn_txt",
          "variant": "primary",
          "action": {
            "event": {
              "name": "close"
            }
          }
        },
        {
          "id": "btn_txt",
          "component": "Text",
          "text": "Close"
        }
      ]
    }
  }
];

export const Modal_with_Content_v08_Lit: StoryObj = {
  name: "Modal with Content [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(Modal_with_Content_messages), "s1"),
};

const List_Basic_messages: V010Message[] = [
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
          "component": "List",
          "children": [
            "item1",
            "item2",
            "item3"
          ]
        },
        {
          "id": "item1",
          "component": "Text",
          "text": "Item 1"
        },
        {
          "id": "item2",
          "component": "Text",
          "text": "Item 2"
        },
        {
          "id": "item3",
          "component": "Text",
          "text": "Item 3"
        }
      ]
    }
  }
];

export const List_Basic_v08_Lit: StoryObj = {
  name: "List Basic [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(List_Basic_messages), "s1"),
};

const List_with_Cards_messages: V010Message[] = [
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
          "component": "List",
          "children": [
            "card1",
            "card2"
          ]
        },
        {
          "id": "card1",
          "component": "Card",
          "child": "c1txt"
        },
        {
          "id": "c1txt",
          "component": "Text",
          "text": "Card Item 1"
        },
        {
          "id": "card2",
          "component": "Card",
          "child": "c2txt"
        },
        {
          "id": "c2txt",
          "component": "Text",
          "text": "Card Item 2"
        }
      ]
    }
  }
];

export const List_with_Cards_v08_Lit: StoryObj = {
  name: "List with Cards [v0.8 Lit]",
  render: () => renderA2UI(translateToV08(List_with_Cards_messages), "s1"),
};

