import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/Tabs",
};
export default meta;

type Story = StoryObj;

export const TwoTabs: Story = {
  render: () =>
    renderA2UI([
      {
        id: "tabs",
        component: {
          Tabs: {
            tabItems: [
              { title: { literalString: "Tab One" }, child: "t1" },
              { title: { literalString: "Tab Two" }, child: "t2" },
            ],
          },
        },
      },
      { id: "t1", component: { Text: { text: { literalString: "First tab content" } } } },
      { id: "t2", component: { Text: { text: { literalString: "Second tab content" } } } },
    ]),
};

export const ThreeTabs: Story = {
  render: () =>
    renderA2UI([
      {
        id: "tabs",
        component: {
          Tabs: {
            tabItems: [
              { title: { literalString: "Overview" }, child: "t1" },
              { title: { literalString: "Details" }, child: "t2" },
              { title: { literalString: "History" }, child: "t3" },
            ],
          },
        },
      },
      { id: "t1", component: { Text: { text: { literalString: "Overview content" } } } },
      { id: "t2", component: { Text: { text: { literalString: "Details content" } } } },
      { id: "t3", component: { Text: { text: { literalString: "History content" } } } },
    ]),
};
