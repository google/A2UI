import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/Button",
};
export default meta;

type Story = StoryObj;

export const Primary: Story = {
  render: () =>
    renderA2UI([
      {
        id: "btn",
        component: {
          Button: {
            child: "btn-text",
            primary: true,
            action: { name: "submit" },
          },
        },
      },
      {
        id: "btn-text",
        component: { Text: { text: { literalString: "Primary Button" } } },
      },
    ]),
};

export const Default: Story = {
  render: () =>
    renderA2UI([
      {
        id: "btn",
        component: {
          Button: {
            child: "btn-text",
            action: { name: "click" },
          },
        },
      },
      {
        id: "btn-text",
        component: { Text: { text: { literalString: "Default Button" } } },
      },
    ]),
};

export const WithIcon: Story = {
  render: () =>
    renderA2UI([
      {
        id: "btn",
        component: {
          Button: {
            child: "btn-row",
            action: { name: "settings" },
          },
        },
      },
      {
        id: "btn-row",
        component: {
          Row: {
            children: { explicitList: ["btn-icon", "btn-text"] },
            alignment: "center",
          },
        },
      },
      {
        id: "btn-icon",
        component: { Icon: { name: { literalString: "settings" } } },
      },
      {
        id: "btn-text",
        component: { Text: { text: { literalString: "Settings" } } },
      },
    ]),
};

export const NoAction: Story = {
  name: "No Action (Edge Case)",
  render: () =>
    renderA2UI([
      {
        id: "btn",
        component: { Button: { child: "btn-text" } },
      },
      {
        id: "btn-text",
        component: { Text: { text: { literalString: "No Action" } } },
      },
    ]),
};
