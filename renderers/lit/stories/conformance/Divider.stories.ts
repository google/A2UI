import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, renderSingleComponent } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/Divider",
};
export default meta;

type Story = StoryObj;

export const Horizontal: Story = {
  render: () =>
    renderA2UI([
      {
        id: "col",
        component: {
          Column: {
            children: { explicitList: ["t1", "div", "t2"] },
            distribution: "start",
            alignment: "stretch",
          },
        },
      },
      { id: "t1", component: { Text: { text: { literalString: "Above" } } } },
      { id: "div", component: { Divider: { axis: "horizontal" } } },
      { id: "t2", component: { Text: { text: { literalString: "Below" } } } },
    ]),
};

export const Standalone: Story = {
  render: () => renderSingleComponent("Divider", { axis: "horizontal" }),
};
