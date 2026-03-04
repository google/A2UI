import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/Modal",
};
export default meta;

type Story = StoryObj;

export const BasicModal: Story = {
  render: () =>
    renderA2UI([
      {
        id: "modal",
        component: {
          Modal: {
            child: "modal-content",
            title: { literalString: "Dialog Title" },
          },
        },
      },
      {
        id: "modal-content",
        component: {
          Text: { text: { literalString: "This is modal content." } },
        },
      },
    ]),
};

export const ModalWithActions: Story = {
  render: () =>
    renderA2UI([
      {
        id: "modal",
        component: {
          Modal: {
            child: "modal-col",
            title: { literalString: "Confirm Action" },
          },
        },
      },
      {
        id: "modal-col",
        component: {
          Column: {
            children: { explicitList: ["modal-text", "modal-btn"] },
          },
        },
      },
      {
        id: "modal-text",
        component: {
          Text: { text: { literalString: "Are you sure?" } },
        },
      },
      {
        id: "modal-btn",
        component: {
          Button: {
            child: "btn-text",
            action: { name: "confirm" },
          },
        },
      },
      {
        id: "btn-text",
        component: { Text: { text: { literalString: "Confirm" } } },
      },
    ]),
};
