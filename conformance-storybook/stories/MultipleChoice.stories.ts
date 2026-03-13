import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI, simpleComponent } from "./helpers/a2ui-story-wrapper.js";

const meta: Meta = { title: "Components/ChoicePicker (MultipleChoice)" };
export default meta;

export const MutuallyExclusive: StoryObj = {
  render: () => renderA2UI(simpleComponent("mc-exclusive", [
    { id: "mc1", component: { MultipleChoice: {
      selections: { path: "/pref" },
      options: [
        { label: { literalString: "Email" }, value: "email" },
        { label: { literalString: "Phone" }, value: "phone" },
        { label: { literalString: "SMS" }, value: "sms" },
      ],
    }}},
  ])),
};

export const MultiSelect: StoryObj = {
  render: () => renderA2UI(simpleComponent("mc-multi", [
    { id: "mc1", component: { MultipleChoice: {
      selections: { path: "/langs" },
      options: [
        { label: { literalString: "JavaScript" }, value: "js" },
        { label: { literalString: "Python" }, value: "py" },
        { label: { literalString: "Rust" }, value: "rs" },
      ],
    }}},
  ])),
};

export const Chips: StoryObj = {
  render: () => renderA2UI(simpleComponent("mc-chips", [
    { id: "mc1", component: { MultipleChoice: {
      selections: { path: "/size" },
      variant: "chips",
      options: [
        { label: { literalString: "Small" }, value: "s" },
        { label: { literalString: "Medium" }, value: "m" },
        { label: { literalString: "Large" }, value: "l" },
      ],
    }}},
  ])),
};
