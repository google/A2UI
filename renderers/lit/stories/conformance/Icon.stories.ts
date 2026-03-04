import type { Meta, StoryObj } from "@storybook/web-components";
import { renderSingleComponent, renderA2UI } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/Icon",
};
export default meta;

type Story = StoryObj;

export const Star: Story = {
  render: () =>
    renderSingleComponent("Icon", {
      name: { literalString: "star" },
    }),
};

export const Home: Story = {
  render: () =>
    renderSingleComponent("Icon", {
      name: { literalString: "home" },
    }),
};

export const Settings: Story = {
  render: () =>
    renderSingleComponent("Icon", {
      name: { literalString: "settings" },
    }),
};

export const MultipleIcons: Story = {
  render: () =>
    renderA2UI([
      {
        id: "row",
        component: {
          Row: {
            children: { explicitList: ["i1", "i2", "i3", "i4"] },
            distribution: "spaceEvenly",
            alignment: "center",
          },
        },
      },
      { id: "i1", component: { Icon: { name: { literalString: "star" } } } },
      { id: "i2", component: { Icon: { name: { literalString: "home" } } } },
      { id: "i3", component: { Icon: { name: { literalString: "settings" } } } },
      { id: "i4", component: { Icon: { name: { literalString: "favorite" } } } },
    ]),
};
