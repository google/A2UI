import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/List" };
export default meta;

export const Basic: StoryObj = {
  render: () => renderA2UI(simpleComponent("list-basic", [
    { id: "list1", component: "List", children: ["item1", "item2", "item3"] },
    { id: "item1", component: "Text", text: "Item 1", variant: "body" },
    { id: "item2", component: "Text", text: "Item 2", variant: "body" },
    { id: "item3", component: "Text", text: "Item 3", variant: "body" },
  ])),
};

export const WithCards: StoryObj = {
  render: () => renderA2UI(simpleComponent("list-cards", [
    { id: "list1", component: "List", children: ["card1", "card2"] },
    { id: "card1", component: "Card", child: "t1" },
    { id: "t1", component: "Text", text: "Card in a list", variant: "body" },
    { id: "card2", component: "Card", child: "t2" },
    { id: "t2", component: "Text", text: "Another card", variant: "body" },
  ])),
};
