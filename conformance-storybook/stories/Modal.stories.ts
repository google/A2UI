import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Modal" };
export default meta;

export const Basic: StoryObj = {
  render: () => renderA2UI(simpleComponent("modal-basic", [
    { id: "modal1", component: "Modal", child: "content", title: "Modal Title" },
    { id: "content", component: "Column", children: ["t1", "btn1"] },
    { id: "t1", component: "Text", text: "This is modal content.", variant: "body" },
    { id: "btn1", component: "Button", child: "btn_text", variant: "primary", action: { event: { name: "close" } } },
    { id: "btn_text", component: "Text", text: "Close" },
  ])),
};
