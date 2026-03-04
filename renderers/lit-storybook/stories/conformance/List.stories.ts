import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/List",
};
export default meta;

type Story = StoryObj;

export const VerticalList: Story = {
  render: () =>
    renderA2UI([
      {
        id: "list",
        component: {
          List: {
            children: { explicitList: ["i1", "i2", "i3"] },
            direction: "vertical",
          },
        },
      },
      { id: "i1", component: { Text: { text: { literalString: "Item One" } } } },
      { id: "i2", component: { Text: { text: { literalString: "Item Two" } } } },
      { id: "i3", component: { Text: { text: { literalString: "Item Three" } } } },
    ]),
};

export const HorizontalList: Story = {
  render: () =>
    renderA2UI([
      {
        id: "list",
        component: {
          List: {
            children: { explicitList: ["i1", "i2", "i3"] },
            direction: "horizontal",
          },
        },
      },
      { id: "i1", component: { Text: { text: { literalString: "A" } } } },
      { id: "i2", component: { Text: { text: { literalString: "B" } } } },
      { id: "i3", component: { Text: { text: { literalString: "C" } } } },
    ]),
};

export const EmptyList: Story = {
  name: "Empty List (Edge Case)",
  render: () =>
    renderA2UI([
      {
        id: "list",
        component: {
          List: { children: { explicitList: [] } },
        },
      },
    ]),
};
