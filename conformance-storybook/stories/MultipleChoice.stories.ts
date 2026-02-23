import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, componentWithData } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/ChoicePicker (MultipleChoice)" };
export default meta;

// Note: Lit renderer v0.8 uses "MultipleChoice" — v0.10 renames to "ChoicePicker"
export const MutuallyExclusive: StoryObj = {
  render: () => renderA2UI(componentWithData("mc-exclusive", [
    { id: "mc1", component: "MultipleChoice", variant: "mutuallyExclusive", options: [
      { label: "Email", value: "email" },
      { label: "Phone", value: "phone" },
      { label: "SMS", value: "sms" },
    ], value: { path: "/form/pref" } },
  ], "/form", { pref: ["email"] })),
};

export const MultiSelect: StoryObj = {
  render: () => renderA2UI(componentWithData("mc-multi", [
    { id: "mc1", component: "MultipleChoice", variant: "multiSelect", options: [
      { label: "JavaScript", value: "js" },
      { label: "Python", value: "py" },
      { label: "Rust", value: "rs" },
      { label: "Go", value: "go" },
    ], value: { path: "/form/langs" } },
  ], "/form", { langs: ["js", "py"] })),
};

export const Chips: StoryObj = {
  render: () => renderA2UI(componentWithData("mc-chips", [
    { id: "mc1", component: "MultipleChoice", variant: "chips", options: [
      { label: "Small", value: "s" },
      { label: "Medium", value: "m" },
      { label: "Large", value: "l" },
    ], value: { path: "/form/size" } },
  ], "/form", { size: ["m"] })),
};
