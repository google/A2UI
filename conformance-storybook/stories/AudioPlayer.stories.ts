import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/AudioPlayer" };
export default meta;

export const Basic: StoryObj = {
  render: () => renderA2UI(simpleComponent("audio-basic", [
    { id: "a1", component: "AudioPlayer", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", title: "Sample Audio" },
  ])),
};
