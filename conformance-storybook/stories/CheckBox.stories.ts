import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, componentWithData } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/CheckBox" };
export default meta;

export const Unchecked: StoryObj = {
  render: () => renderA2UI(componentWithData("cb-off", [
    { id: "cb1", component: "CheckBox", label: "Accept terms", value: { path: "/form/terms" } },
  ], "/form", { terms: false })),
};

export const Checked: StoryObj = {
  render: () => renderA2UI(componentWithData("cb-on", [
    { id: "cb1", component: "CheckBox", label: "Subscribe to newsletter", value: { path: "/form/sub" } },
  ], "/form", { sub: true })),
};
