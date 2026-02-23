import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = {
  title: "Components/Text",
};
export default meta;

export const Heading1: StoryObj = {
  render: () => renderA2UI(simpleComponent("text-h1", [
    { id: "t1", component: "Text", text: "Hello World", variant: "h1" },
  ])),
};

export const Heading2: StoryObj = {
  render: () => renderA2UI(simpleComponent("text-h2", [
    { id: "t1", component: "Text", text: "Heading 2", variant: "h2" },
  ])),
};

export const Heading3: StoryObj = {
  render: () => renderA2UI(simpleComponent("text-h3", [
    { id: "t1", component: "Text", text: "Heading 3", variant: "h3" },
  ])),
};

export const Body: StoryObj = {
  render: () => renderA2UI(simpleComponent("text-body", [
    { id: "t1", component: "Text", text: "This is body text with **markdown** support.", variant: "body" },
  ])),
};

export const Caption: StoryObj = {
  render: () => renderA2UI(simpleComponent("text-caption", [
    { id: "t1", component: "Text", text: "Caption text", variant: "caption" },
  ])),
};
