import type { Meta, StoryObj } from "@storybook/web-components";
import { renderSingleComponent } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/ChoicePicker (MultipleChoice)",
};
export default meta;

type Story = StoryObj;

// Note: v0.10 spec calls this "ChoicePicker" but the v0.8 Lit renderer
// implements it as "MultipleChoice". This tests the actual renderer component.

export const Default: Story = {
  render: () =>
    renderSingleComponent("MultipleChoice", {
      selections: { path: "/favorites" },
      options: [
        { label: { literalString: "Apple" }, value: "A" },
        { label: { literalString: "Banana" }, value: "B" },
        { label: { literalString: "Cherry" }, value: "C" },
      ],
    }),
};

export const Chips: Story = {
  render: () =>
    renderSingleComponent("MultipleChoice", {
      selections: { path: "/tags" },
      variant: "chips",
      options: [
        { label: { literalString: "Work" }, value: "work" },
        { label: { literalString: "Home" }, value: "home" },
        { label: { literalString: "Urgent" }, value: "urgent" },
      ],
    }),
};

export const Filterable: Story = {
  render: () =>
    renderSingleComponent("MultipleChoice", {
      selections: { path: "/countries" },
      filterable: true,
      options: [
        { label: { literalString: "United States" }, value: "US" },
        { label: { literalString: "Canada" }, value: "CA" },
        { label: { literalString: "United Kingdom" }, value: "UK" },
        { label: { literalString: "Australia" }, value: "AU" },
        { label: { literalString: "Germany" }, value: "DE" },
      ],
    }),
};

export const SingleOption: Story = {
  name: "Single Option (Edge Case)",
  render: () =>
    renderSingleComponent("MultipleChoice", {
      selections: { path: "/single" },
      options: [{ label: { literalString: "Only Option" }, value: "only" }],
    }),
};
