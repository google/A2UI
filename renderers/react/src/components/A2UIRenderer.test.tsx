/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import React from "react";
import { A2UIProvider } from "../context/A2UIContext.js";
import { ThemeProvider } from "../context/ThemeContext.js";
import { A2UIRenderer } from "./A2UIRenderer.js";
import { useA2UI } from "../hooks/useA2UI.js";

// Helper component to process messages and render
function TestRenderer({
  messages,
  surfaceId = "@default",
  onAction,
}: {
  messages: any[];
  surfaceId?: string;
  onAction?: (action: any) => void;
}) {
  const { processMessages } = useA2UI();

  React.useEffect(() => {
    processMessages(messages);
  }, [messages, processMessages]);

  return <A2UIRenderer surfaceId={surfaceId} />;
}

// Full test wrapper with providers
function TestWrapper({
  children,
  onAction,
}: {
  children: React.ReactNode;
  onAction?: (action: any) => void;
}) {
  return (
    <ThemeProvider>
      <A2UIProvider onAction={onAction}>{children}</A2UIProvider>
    </ThemeProvider>
  );
}

describe("A2UIRenderer", () => {
  describe("Basic Rendering", () => {
    it("should render fallback when surface is not found", () => {
      render(
        <TestWrapper>
          <A2UIRenderer surfaceId="non-existent" fallback={<div>Loading...</div>} />
        </TestWrapper>
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should render nothing when surface is not found and no fallback", () => {
      const { container } = render(
        <TestWrapper>
          <A2UIRenderer surfaceId="non-existent" />
        </TestWrapper>
      );

      expect(container.innerHTML).toBe("");
    });

    it("should render Text component", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "text-1",
                component: {
                  Text: { text: { literalString: "Hello World" } },
                },
              },
            ],
          },
        },
        {
          beginRendering: {
            root: "text-1",
            surfaceId: "@default",
          },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("should render with custom className", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "text-1",
                component: {
                  Text: { text: { literalString: "Test" } },
                },
              },
            ],
          },
        },
        {
          beginRendering: {
            root: "text-1",
            surfaceId: "@default",
          },
        },
      ];

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const surface = container.querySelector(".a2ui-surface");
      expect(surface).toBeInTheDocument();
    });
  });

  describe("Layout Components", () => {
    it("should render Row layout", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "row",
                component: {
                  Row: { children: { explicitList: ["text-1", "text-2"] } },
                },
              },
              {
                id: "text-1",
                component: { Text: { text: { literalString: "Item 1" } } },
              },
              {
                id: "text-2",
                component: { Text: { text: { literalString: "Item 2" } } },
              },
            ],
          },
        },
        {
          beginRendering: { root: "row", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("should render Column layout", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "column",
                component: {
                  Column: { children: { explicitList: ["text-1", "text-2"] } },
                },
              },
              {
                id: "text-1",
                component: { Text: { text: { literalString: "First" } } },
              },
              {
                id: "text-2",
                component: { Text: { text: { literalString: "Second" } } },
              },
            ],
          },
        },
        {
          beginRendering: { root: "column", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
    });

    it("should render Card layout", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "card",
                component: {
                  Card: { child: "card-content" },
                },
              },
              {
                id: "card-content",
                component: { Text: { text: { literalString: "Card Content" } } },
              },
            ],
          },
        },
        {
          beginRendering: { root: "card", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText("Card Content")).toBeInTheDocument();
    });

    it("should render List with items", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "list",
                component: {
                  List: {
                    direction: "vertical",
                    children: { explicitList: ["item-1", "item-2", "item-3"] },
                  },
                },
              },
              {
                id: "item-1",
                component: { Text: { text: { literalString: "List Item 1" } } },
              },
              {
                id: "item-2",
                component: { Text: { text: { literalString: "List Item 2" } } },
              },
              {
                id: "item-3",
                component: { Text: { text: { literalString: "List Item 3" } } },
              },
            ],
          },
        },
        {
          beginRendering: { root: "list", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText("List Item 1")).toBeInTheDocument();
      expect(screen.getByText("List Item 2")).toBeInTheDocument();
      expect(screen.getByText("List Item 3")).toBeInTheDocument();
    });
  });

  describe("Interactive Components", () => {
    it("should render Button and handle click action", () => {
      const onAction = vi.fn();
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "button",
                component: {
                  Button: {
                    child: "button-text",
                    action: {
                      name: "submit",
                      context: [
                        { key: "formId", value: { literalString: "login-form" } },
                      ],
                    },
                  },
                },
              },
              {
                id: "button-text",
                component: { Text: { text: { literalString: "Submit" } } },
              },
            ],
          },
        },
        {
          beginRendering: { root: "button", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper onAction={onAction}>
          <TestRenderer messages={messages} onAction={onAction} />
        </TestWrapper>
      );

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(screen.getByText("Submit")).toBeInTheDocument();

      fireEvent.click(button);

      expect(onAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "a2ui.action",
          actionId: "submit",
        })
      );
    });

    it("should render TextField", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "textfield",
                component: {
                  TextField: {
                    label: { literalString: "Username" },
                    placeholder: { literalString: "Enter username" },
                    textFieldType: "text",
                  },
                },
              },
            ],
          },
        },
        {
          beginRendering: { root: "textfield", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText("Username")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter username")).toBeInTheDocument();
    });

    it("should render CheckBox", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "checkbox",
                component: {
                  CheckBox: {
                    label: { literalString: "Accept Terms" },
                    value: { literalBoolean: false },
                  },
                },
              },
            ],
          },
        },
        {
          beginRendering: { root: "checkbox", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText("Accept Terms")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });
  });

  describe("Content Components", () => {
    it("should render Image", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "image",
                component: {
                  Image: {
                    url: { literalString: "https://example.com/image.jpg" },
                    alt: { literalString: "Test Image" },
                  },
                },
              },
            ],
          },
        },
        {
          beginRendering: { root: "image", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const image = screen.getByAltText("Test Image");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
    });

    it("should render Divider", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "column",
                component: {
                  Column: { children: { explicitList: ["text-1", "divider", "text-2"] } },
                },
              },
              {
                id: "text-1",
                component: { Text: { text: { literalString: "Above" } } },
              },
              {
                id: "divider",
                component: { Divider: { orientation: "horizontal" } },
              },
              {
                id: "text-2",
                component: { Text: { text: { literalString: "Below" } } },
              },
            ],
          },
        },
        {
          beginRendering: { root: "column", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText("Above")).toBeInTheDocument();
      expect(screen.getByText("Below")).toBeInTheDocument();
      expect(screen.getByRole("separator")).toBeInTheDocument();
    });
  });

  describe("Text Component Variants", () => {
    it("should render Text with h1 usage hint", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "heading",
                component: {
                  Text: {
                    text: { literalString: "Main Heading" },
                    usageHint: "h1",
                  },
                },
              },
            ],
          },
        },
        {
          beginRendering: { root: "heading", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent("Main Heading");
    });

    it("should render Text with caption usage hint", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "caption-text",
                component: {
                  Text: {
                    text: { literalString: "Caption text" },
                    usageHint: "caption",
                  },
                },
              },
            ],
          },
        },
        {
          beginRendering: { root: "caption-text", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText("Caption text")).toBeInTheDocument();
    });
  });

  describe("Data Binding", () => {
    it("should render text from data model", () => {
      const messages = [
        {
          dataModelUpdate: {
            surfaceId: "@default",
            path: "/",
            contents: [{ key: "message", valueString: "Hello from Data Model" }],
          },
        },
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "text",
                component: {
                  Text: { text: { path: "/message" } },
                },
              },
            ],
          },
        },
        {
          beginRendering: { root: "text", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText("Hello from Data Model")).toBeInTheDocument();
    });

    it("should render list from template with data binding", () => {
      const messages = [
        {
          dataModelUpdate: {
            surfaceId: "@default",
            path: "/",
            contents: [
              {
                key: "items",
                valueString: JSON.stringify([
                  { title: "Item A" },
                  { title: "Item B" },
                  { title: "Item C" },
                ]),
              },
            ],
          },
        },
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "list",
                component: {
                  List: {
                    children: {
                      template: {
                        componentId: "item-template",
                        dataBinding: "/items",
                      },
                    },
                  },
                },
              },
              {
                id: "item-template",
                component: { Text: { text: { path: "title" } } },
              },
            ],
          },
        },
        {
          beginRendering: { root: "list", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText("Item A")).toBeInTheDocument();
      expect(screen.getByText("Item B")).toBeInTheDocument();
      expect(screen.getByText("Item C")).toBeInTheDocument();
    });
  });

  describe("Nested Component Structures", () => {
    it("should render deeply nested structures", () => {
      const messages = [
        {
          surfaceUpdate: {
            surfaceId: "@default",
            components: [
              {
                id: "outer-column",
                component: {
                  Column: { children: { explicitList: ["heading", "card"] } },
                },
              },
              {
                id: "heading",
                component: { Text: { text: { literalString: "Dashboard" }, usageHint: "h1" } },
              },
              {
                id: "card",
                component: { Card: { child: "inner-row" } },
              },
              {
                id: "inner-row",
                component: {
                  Row: { children: { explicitList: ["stat-1", "stat-2"] } },
                },
              },
              {
                id: "stat-1",
                component: {
                  Column: { children: { explicitList: ["stat-1-label", "stat-1-value"] } },
                },
              },
              {
                id: "stat-1-label",
                component: { Text: { text: { literalString: "Users" }, usageHint: "caption" } },
              },
              {
                id: "stat-1-value",
                component: { Text: { text: { literalString: "1,234" }, usageHint: "h2" } },
              },
              {
                id: "stat-2",
                component: {
                  Column: { children: { explicitList: ["stat-2-label", "stat-2-value"] } },
                },
              },
              {
                id: "stat-2-label",
                component: { Text: { text: { literalString: "Orders" }, usageHint: "caption" } },
              },
              {
                id: "stat-2-value",
                component: { Text: { text: { literalString: "5,678" }, usageHint: "h2" } },
              },
            ],
          },
        },
        {
          beginRendering: { root: "outer-column", surfaceId: "@default" },
        },
      ];

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Users")).toBeInTheDocument();
      expect(screen.getByText("1,234")).toBeInTheDocument();
      expect(screen.getByText("Orders")).toBeInTheDocument();
      expect(screen.getByText("5,678")).toBeInTheDocument();
    });
  });
});
