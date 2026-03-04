import type { Meta, StoryObj } from "@storybook/web-components";
import { renderSingleComponent } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/Video",
};
export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () =>
    renderSingleComponent("Video", {
      url: {
        literalString:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      },
    }),
};

export const NoUrl: Story = {
  name: "No URL (Edge Case)",
  render: () => renderSingleComponent("Video", {}),
};
