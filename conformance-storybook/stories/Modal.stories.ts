import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Modal" };
export default meta;

export const Basic: StoryObj = {
  render: () => renderA2UI(simpleComponent("modal-basic", [
    { id: "modal1", component: { Modal: {
      child: "modal-content",
      title: { literalString: "Dialog Title" },
    }}},
    { id: "modal-content", component: { Text: { text: { literalString: "This is modal content. Click the entry point to open." } } } },
  ])),
};
