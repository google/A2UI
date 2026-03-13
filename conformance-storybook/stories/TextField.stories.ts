import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, componentWithData } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/TextField" };
export default meta;

export const ShortText: StoryObj = {
  render: () => renderA2UI(componentWithData("tf-short", [
    { id: "tf1", component: "TextField", label: "Name", value: { path: "/form/name" }, variant: "shortText" },
  ], "/form", { name: "John Doe" })),
};

export const LongText: StoryObj = {
  render: () => renderA2UI(componentWithData("tf-long", [
    { id: "tf1", component: "TextField", label: "Description", value: { path: "/form/desc" }, variant: "longText" },
  ], "/form", { desc: "A longer description..." })),
};
