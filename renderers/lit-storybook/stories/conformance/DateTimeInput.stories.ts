import type { Meta, StoryObj } from "@storybook/web-components";
import { renderSingleComponent } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/DateTimeInput",
};
export default meta;

type Story = StoryObj;

export const DateOnly: Story = {
  render: () =>
    renderSingleComponent("DateTimeInput", {
      value: { path: "/date" },
      enableDate: true,
    }),
};

export const TimeOnly: Story = {
  render: () =>
    renderSingleComponent("DateTimeInput", {
      value: { path: "/time" },
      enableTime: true,
    }),
};

export const DateAndTime: Story = {
  render: () =>
    renderSingleComponent("DateTimeInput", {
      value: { path: "/datetime" },
      enableDate: true,
      enableTime: true,
    }),
};
