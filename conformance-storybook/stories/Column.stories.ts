import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Column" };
export default meta;

export const Basic: StoryObj = {
  render: () => renderA2UI(simpleComponent("col-basic", [
    { id: "col1", component: "Column", children: ["t1", "t2", "t3"] },
    { id: "t1", component: "Text", text: "First item", variant: "body" },
    { id: "t2", component: "Text", text: "Second item", variant: "body" },
    { id: "t3", component: "Text", text: "Third item", variant: "body" },
  ])),
};

export const WithAlignment: StoryObj = {
  render: () => renderA2UI(simpleComponent("col-align", [
    { id: "col1", component: "Column", children: ["t1", "t2", "t3"], align: "center", justify: "center" },
    { id: "t1", component: "Text", text: "Centered", variant: "h3" },
    { id: "t2", component: "Text", text: "Column", variant: "body" },
    { id: "t3", component: "Text", text: "Items", variant: "body" },
  ])),
};
