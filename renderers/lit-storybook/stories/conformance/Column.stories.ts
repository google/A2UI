import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/Column",
};
export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () =>
    renderA2UI([
      {
        id: "col",
        component: {
          Column: {
            children: { explicitList: ["t1", "t2", "t3"] },
            distribution: "start",
            alignment: "stretch",
          },
        },
      },
      { id: "t1", component: { Text: { text: { literalString: "Item 1" } } } },
      { id: "t2", component: { Text: { text: { literalString: "Item 2" } } } },
      { id: "t3", component: { Text: { text: { literalString: "Item 3" } } } },
    ]),
};

export const CenterAligned: Story = {
  render: () =>
    renderA2UI([
      {
        id: "col",
        component: {
          Column: {
            children: { explicitList: ["t1", "t2"] },
            distribution: "center",
            alignment: "center",
          },
        },
      },
      { id: "t1", component: { Text: { text: { literalString: "Centered 1" } } } },
      { id: "t2", component: { Text: { text: { literalString: "Centered 2" } } } },
    ]),
};
