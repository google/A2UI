import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Button" };
export default meta;

export const Primary: StoryObj = {
  render: () => renderA2UI(simpleComponent("btn-primary", [
    { id: "btn", component: { Button: { child: "txt", primary: true, action: { name: "click" } } } },
    { id: "txt", component: { Text: { text: { literalString: "Primary Button" } } } },
  ])),
};

export const Outlined: StoryObj = {
  render: () => renderA2UI(simpleComponent("btn-outlined", [
    { id: "btn", component: { Button: { child: "txt", outlined: true, action: { name: "click" } } } },
    { id: "txt", component: { Text: { text: { literalString: "Outlined Button" } } } },
  ])),
};

export const TextVariant: StoryObj = {
  render: () => renderA2UI(simpleComponent("btn-text", [
    { id: "btn", component: { Button: { child: "txt", action: { name: "click" } } } },
    { id: "txt", component: { Text: { text: { literalString: "Text Button" } } } },
  ])),
};

export const IconButton: StoryObj = {
  render: () => renderA2UI(simpleComponent("btn-icon", [
    { id: "btn", component: { Button: { child: "ico", variant: "icon", action: { name: "click" } } } },
    { id: "ico", component: { Icon: { name: { literalString: "favorite" } } } },
  ])),
};
