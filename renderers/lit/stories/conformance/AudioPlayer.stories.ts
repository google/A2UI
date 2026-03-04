import type { Meta, StoryObj } from "@storybook/web-components";
import { renderSingleComponent } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/AudioPlayer",
};
export default meta;

type Story = StoryObj;

export const Basic: Story = {
  render: () =>
    renderSingleComponent("AudioPlayer", {
      url: {
        literalString:
          "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      },
    }),
};

export const NoUrl: Story = {
  name: "No URL (Edge Case)",
  render: () => renderSingleComponent("AudioPlayer", {}),
};
