import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Icon" };
export default meta;

export const MaterialIcon: StoryObj = {
  render: () => renderA2UI(simpleComponent("icon-material", [
    { id: "i1", component: "Icon", name: "home" },
  ])),
};

export const MultipleIcons: StoryObj = {
  render: () => renderA2UI(simpleComponent("icon-multi", [
    { id: "row1", component: "Row", children: ["i1", "i2", "i3", "i4"] },
    { id: "i1", component: "Icon", name: "home" },
    { id: "i2", component: "Icon", name: "settings" },
    { id: "i3", component: "Icon", name: "mail" },
    { id: "i4", component: "Icon", name: "search" },
  ])),
};
