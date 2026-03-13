import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Video" };
export default meta;

export const Basic: StoryObj = {
  render: () => renderA2UI(simpleComponent("video-basic", [
    { id: "v1", component: "Video", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
  ])),
};
