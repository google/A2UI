import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Row" };
export default meta;

export const Basic: StoryObj = {
  render: () => renderA2UI(simpleComponent("row-basic", [
    { id: "row1", component: "Row", children: ["t1", "t2", "t3"] },
    { id: "t1", component: "Text", text: "Left", variant: "body" },
    { id: "t2", component: "Text", text: "Center", variant: "body" },
    { id: "t3", component: "Text", text: "Right", variant: "body" },
  ])),
};

export const SpaceBetween: StoryObj = {
  render: () => renderA2UI(simpleComponent("row-space", [
    { id: "row1", component: "Row", children: ["t1", "t2"], justify: "spaceBetween" },
    { id: "t1", component: "Text", text: "Start", variant: "body" },
    { id: "t2", component: "Text", text: "End", variant: "body" },
  ])),
};
