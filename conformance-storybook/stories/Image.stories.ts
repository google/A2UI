import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Image" };
export default meta;

export const Basic: StoryObj = {
  render: () => renderA2UI(simpleComponent("image-basic", [
    { id: "img1", component: "Image", url: "https://picsum.photos/400/300", alt: "Sample image" },
  ])),
};

export const WithFit: StoryObj = {
  render: () => renderA2UI(simpleComponent("image-fit", [
    { id: "img1", component: "Image", url: "https://picsum.photos/800/400", alt: "Cover image", fit: "cover" },
  ])),
};
