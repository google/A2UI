import type { Meta, StoryObj } from "@storybook/web-components";
import { renderSingleComponent } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/Slider",
};
export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () =>
    renderSingleComponent("Slider", {
      value: { path: "/slider" },
      minValue: 0,
      maxValue: 100,
    }),
};

export const CustomRange: Story = {
  render: () =>
    renderSingleComponent("Slider", {
      value: { path: "/temp" },
      minValue: -20,
      maxValue: 50,
    }),
};

export const SmallRange: Story = {
  render: () =>
    renderSingleComponent("Slider", {
      value: { path: "/rating" },
      minValue: 1,
      maxValue: 5,
    }),
};
