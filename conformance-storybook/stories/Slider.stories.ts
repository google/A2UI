import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, componentWithData } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/Slider" };
export default meta;

export const Basic: StoryObj = {
  render: () => renderA2UI(componentWithData("slider-basic", [
    { id: "s1", component: "Slider", label: "Volume", min: 0, max: 100, step: 1, value: { path: "/form/vol" } },
  ], "/form", { vol: 50 })),
};

export const WithRange: StoryObj = {
  render: () => renderA2UI(componentWithData("slider-range", [
    { id: "s1", component: "Slider", label: "Temperature (°F)", min: 60, max: 90, step: 1, value: { path: "/form/temp" } },
  ], "/form", { temp: 72 })),
};
