import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Card" };
export default meta;

export const Basic: StoryObj = {
  render: () => renderA2UI(simpleComponent("card-basic", [
    { id: "card1", component: "Card", child: "col1" },
    { id: "col1", component: "Column", children: ["t1", "t2"] },
    { id: "t1", component: "Text", text: "Card Title", variant: "h3" },
    { id: "t2", component: "Text", text: "Card body content goes here.", variant: "body" },
  ])),
};

export const WithHeader: StoryObj = {
  render: () => renderA2UI(simpleComponent("card-header", [
    { id: "card1", component: "Card", child: "content", header: "header_row" },
    { id: "header_row", component: "Row", children: ["header_icon", "header_text"], align: "center" },
    { id: "header_icon", component: "Icon", name: "info" },
    { id: "header_text", component: "Text", text: "Card Header", variant: "h4" },
    { id: "content", component: "Text", text: "This card has a header section.", variant: "body" },
  ])),
};
