import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Tabs" };
export default meta;

export const Basic: StoryObj = {
  render: () => renderA2UI(simpleComponent("tabs-basic", [
    { id: "tabs1", component: { Tabs: {
      tabItems: [
        { title: { literalString: "Tab 1" }, child: "content1" },
        { title: { literalString: "Tab 2" }, child: "content2" },
        { title: { literalString: "Tab 3" }, child: "content3" },
      ],
    }}},
    { id: "content1", component: { Text: { text: { literalString: "Content of Tab 1" } } } },
    { id: "content2", component: { Text: { text: { literalString: "Content of Tab 2" } } } },
    { id: "content3", component: { Text: { text: { literalString: "Content of Tab 3" } } } },
  ])),
};
