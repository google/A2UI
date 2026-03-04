import type { Meta, StoryObj } from "@storybook/web-components";
import { renderSingleComponent, renderA2UI } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/Text",
};
export default meta;

type Story = StoryObj;

export const BasicLiteral: Story = {
  render: () =>
    renderSingleComponent("Text", {
      text: { literalString: "Hello, A2UI!" },
    }),
};

export const H1: Story = {
  render: () =>
    renderSingleComponent("Text", {
      text: { literalString: "Heading 1" },
      usageHint: "h1",
    }),
};

export const H2: Story = {
  render: () =>
    renderSingleComponent("Text", {
      text: { literalString: "Heading 2" },
      usageHint: "h2",
    }),
};

export const H3: Story = {
  render: () =>
    renderSingleComponent("Text", {
      text: { literalString: "Heading 3" },
      usageHint: "h3",
    }),
};

export const H4: Story = {
  render: () =>
    renderSingleComponent("Text", {
      text: { literalString: "Heading 4" },
      usageHint: "h4",
    }),
};

export const H5: Story = {
  render: () =>
    renderSingleComponent("Text", {
      text: { literalString: "Heading 5" },
      usageHint: "h5",
    }),
};

export const Body: Story = {
  render: () =>
    renderSingleComponent("Text", {
      text: { literalString: "Body text with normal weight." },
      usageHint: "body",
    }),
};

export const Caption: Story = {
  render: () =>
    renderSingleComponent("Text", {
      text: { literalString: "This is a caption" },
      usageHint: "caption",
    }),
};

export const Markdown: Story = {
  render: () =>
    renderSingleComponent("Text", {
      text: { literalString: "**Bold** and *italic* and `code`" },
    }),
};

export const LongText: Story = {
  render: () =>
    renderSingleComponent("Text", {
      text: {
        literalString:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      },
    }),
};

export const EmptyText: Story = {
  render: () =>
    renderSingleComponent("Text", {
      text: { literalString: "" },
    }),
};
