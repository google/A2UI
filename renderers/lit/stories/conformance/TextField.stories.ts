import type { Meta, StoryObj } from "@storybook/web-components";
import { renderSingleComponent } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/TextField",
};
export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () =>
    renderSingleComponent("TextField", {
      label: { literalString: "Enter some text" },
      text: { path: "/textField" },
    }),
};

export const WithRegexValidation: Story = {
  render: () =>
    renderSingleComponent("TextField", {
      label: { literalString: "Enter exactly 5 digits" },
      text: { path: "/zip" },
      validationRegexp: "^\\d{5}$",
    }),
};

export const WithPlaceholder: Story = {
  render: () =>
    renderSingleComponent("TextField", {
      label: { literalString: "Email" },
      text: { path: "/email" },
      placeholder: { literalString: "user@example.com" },
    }),
};
