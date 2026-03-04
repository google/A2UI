import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/render-a2ui.js";

const meta: Meta = {
  title: "A2UI/Components/Card",
};
export default meta;

type Story = StoryObj;

export const BasicCard: Story = {
  render: () =>
    renderA2UI([
      { id: "card", component: { Card: { child: "card-text" } } },
      {
        id: "card-text",
        component: { Text: { text: { literalString: "I am inside a Card" } } },
      },
    ]),
};

export const CardWithMultipleChildren: Story = {
  render: () =>
    renderA2UI([
      {
        id: "card",
        component: {
          Card: { children: { explicitList: ["title", "body"] } },
        },
      },
      {
        id: "title",
        component: {
          Text: { text: { literalString: "Card Title" }, usageHint: "h3" },
        },
      },
      {
        id: "body",
        component: {
          Text: {
            text: {
              literalString: "This card contains a title and body text.",
            },
          },
        },
      },
    ]),
};

export const NestedCards: Story = {
  render: () =>
    renderA2UI([
      { id: "outer", component: { Card: { child: "inner" } } },
      { id: "inner", component: { Card: { child: "text" } } },
      {
        id: "text",
        component: {
          Text: { text: { literalString: "Nested card content" } },
        },
      },
    ]),
};
