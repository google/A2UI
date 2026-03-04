import type { Meta, StoryObj } from "@storybook/web-components";
import { renderSingleComponent } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/CheckBox",
};
export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () =>
    renderSingleComponent("CheckBox", {
      label: { literalString: "Toggle me" },
      value: { path: "/checkbox" },
    }),
};

export const WithDescription: Story = {
  render: () =>
    renderSingleComponent("CheckBox", {
      label: { literalString: "Accept terms" },
      description: "You must agree to the terms of service.",
      value: { path: "/terms" },
    }),
};
