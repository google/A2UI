import type { Meta, StoryObj } from "@storybook/web-components";
import { renderSingleComponent } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/Image",
};
export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () =>
    renderSingleComponent("Image", {
      url: { literalString: "https://picsum.photos/400/300" },
    }),
};

export const MediumFeature: Story = {
  render: () =>
    renderSingleComponent("Image", {
      url: { literalString: "https://picsum.photos/600/400" },
      usageHint: "mediumFeature",
    }),
};

export const SmallIcon: Story = {
  render: () =>
    renderSingleComponent("Image", {
      url: { literalString: "https://picsum.photos/100/100" },
      usageHint: "smallIcon",
    }),
};

export const BrokenUrl: Story = {
  name: "Broken URL (Edge Case)",
  render: () =>
    renderSingleComponent("Image", {
      url: { literalString: "https://invalid.example.com/404.png" },
    }),
};
