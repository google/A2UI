import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/Row",
};
export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () =>
    renderA2UI([
      {
        id: "row",
        component: {
          Row: {
            children: { explicitList: ["t1", "t2", "t3"] },
            distribution: "start",
            alignment: "center",
          },
        },
      },
      { id: "t1", component: { Text: { text: { literalString: "Left" } } } },
      { id: "t2", component: { Text: { text: { literalString: "Middle" } } } },
      { id: "t3", component: { Text: { text: { literalString: "Right" } } } },
    ]),
};

export const SpaceEvenly: Story = {
  render: () =>
    renderA2UI([
      {
        id: "row",
        component: {
          Row: {
            children: { explicitList: ["t1", "t2", "t3"] },
            distribution: "spaceEvenly",
            alignment: "center",
          },
        },
      },
      { id: "t1", component: { Text: { text: { literalString: "A" } } } },
      { id: "t2", component: { Text: { text: { literalString: "B" } } } },
      { id: "t3", component: { Text: { text: { literalString: "C" } } } },
    ]),
};

export const SpaceBetween: Story = {
  render: () =>
    renderA2UI([
      {
        id: "row",
        component: {
          Row: {
            children: { explicitList: ["t1", "t2"] },
            distribution: "spaceBetween",
            alignment: "center",
          },
        },
      },
      { id: "t1", component: { Text: { text: { literalString: "Start" } } } },
      { id: "t2", component: { Text: { text: { literalString: "End" } } } },
    ]),
};
