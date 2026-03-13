import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Divider" };
export default meta;

export const Horizontal: StoryObj = {
  render: () => renderA2UI(simpleComponent("divider-h", [
    { id: "col1", component: "Column", children: ["t1", "d1", "t2"] },
    { id: "t1", component: "Text", text: "Above the divider", variant: "body" },
    { id: "d1", component: "Divider", axis: "horizontal" },
    { id: "t2", component: "Text", text: "Below the divider", variant: "body" },
  ])),
};
