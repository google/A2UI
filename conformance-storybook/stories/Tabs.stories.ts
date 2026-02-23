import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Tabs" };
export default meta;

export const Basic: StoryObj = {
  render: () => renderA2UI(simpleComponent("tabs-basic", [
    { id: "tabs1", component: "Tabs", tabs: [
      { label: "Tab 1", child: "content1" },
      { label: "Tab 2", child: "content2" },
      { label: "Tab 3", child: "content3" },
    ]},
    { id: "content1", component: "Text", text: "Content of Tab 1", variant: "body" },
    { id: "content2", component: "Text", text: "Content of Tab 2", variant: "body" },
    { id: "content3", component: "Text", text: "Content of Tab 3", variant: "body" },
  ])),
};
