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

import { useState, useCallback, useRef } from "react";
import { SurfaceRenderer, Types } from "@a2ui/react";

interface GallerySample {
  id: string;
  title: string;
  description: string;
  surface: Types.Surface;
}

function createComponent(type: string, properties: Record<string, unknown>) {
  return {
    id: "generated-" + Math.random().toString(36).substr(2, 9),
    type,
    properties,
  };
}

function createSingleComponentSurface(
  type: string,
  properties: Record<string, unknown>
): Types.Surface {
  const rootId = "root";
  return {
    rootComponentId: rootId,
    dataModel: new Map(),
    styles: {},
    componentTree: {
      id: rootId,
      type,
      properties,
    } as Types.AnyComponentNode,
    components: new Map(),
  };
}

const samples: GallerySample[] = [
  {
    id: "welcome",
    title: "Welcome Card",
    description: "A simple welcome card with an image and text.",
    surface: createSingleComponentSurface("Card", {
      child: createComponent("Column", {
        children: [
          createComponent("Image", {
            url: { literalString: "https://picsum.photos/id/10/300/200" },
          }),
          createComponent("Heading", {
            text: { literalString: "Welcome to A2UI Gallery" },
          }),
          createComponent("Text", {
            text: {
              literalString:
                "Explore the possibilities of A2UI components with this interactive gallery.",
            },
          }),
          createComponent("Button", {
            label: { literalString: "Get Started" },
            action: { type: "click", payload: { action: "start" } },
          }),
        ],
        alignment: "center",
      }),
    }),
  },
  {
    id: "form",
    title: "Contact Form",
    description: "A sample contact form with validation.",
    surface: createSingleComponentSurface("Card", {
      child: createComponent("Column", {
        children: [
          createComponent("Heading", {
            text: { literalString: "Contact Us" },
          }),
          createComponent("TextField", {
            label: { literalString: "Full Name" },
            text: { literalString: "" },
          }),
          createComponent("TextField", {
            label: { literalString: "Email Address" },
            type: "email",
            text: { literalString: "" },
          }),
          createComponent("TextField", {
            label: { literalString: "Message" },
            text: { literalString: "" },
          }),
          createComponent("Button", {
            action: { type: "submit" },
            child: createComponent("Text", {
              text: { literalString: "Send Message" },
            }),
          }),
        ],
      }),
    }),
  },
  {
    id: "product",
    title: "Product Card",
    description: "A product display card with image, price, and actions.",
    surface: createSingleComponentSurface("Card", {
      child: createComponent("Column", {
        children: [
          createComponent("Image", {
            url: { literalString: "https://picsum.photos/id/26/300/200" },
          }),
          createComponent("Heading", {
            text: { literalString: "Premium Headphones" },
          }),
          createComponent("Text", {
            text: {
              literalString:
                "High-quality wireless headphones with noise cancellation.",
            },
          }),
          createComponent("Text", {
            text: { literalString: "$299.99" },
            usageHint: "heading",
          }),
          createComponent("Row", {
            children: [
              createComponent("Button", {
                action: { type: "click" },
                child: createComponent("Text", {
                  text: { literalString: "Add to Cart" },
                }),
              }),
              createComponent("Button", {
                action: { type: "click" },
                child: createComponent("Icon", {
                  name: { literalString: "favorite_border" },
                }),
              }),
            ],
            distribution: "space-around",
          }),
        ],
        alignment: "center",
      }),
    }),
  },
  {
    id: "settings",
    title: "Settings Panel",
    description: "A settings panel with various input controls.",
    surface: createSingleComponentSurface("Card", {
      child: createComponent("Column", {
        children: [
          createComponent("Heading", {
            text: { literalString: "Settings" },
          }),
          createComponent("Divider", {}),
          createComponent("CheckBox", {
            label: { literalString: "Enable notifications" },
            value: { literalBoolean: true },
          }),
          createComponent("CheckBox", {
            label: { literalString: "Dark mode" },
            value: { literalBoolean: false },
          }),
          createComponent("Divider", {}),
          createComponent("Text", {
            text: { literalString: "Volume" },
          }),
          createComponent("Slider", {
            value: { literalNumber: 75 },
            minValue: 0,
            maxValue: 100,
          }),
          createComponent("Divider", {}),
          createComponent("MultipleChoice", {
            options: [
              { value: "en", label: { literalString: "English" } },
              { value: "es", label: { literalString: "Spanish" } },
              { value: "fr", label: { literalString: "French" } },
            ],
            selections: { literalString: "en" },
          }),
        ],
      }),
    }),
  },
];

export function Gallery() {
  const [activeSection, setActiveSection] = useState("welcome");
  const [showJsonId, setShowJsonId] = useState<string | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((id: string) => {
    setActiveSection(id);
    const element = document.getElementById("section-" + id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;
    const sections = container.querySelectorAll(".component-section");

    let current = "";
    const containerTop = container.scrollTop;

    sections.forEach((section) => {
      const htmlSection = section as HTMLElement;
      const sectionTop = htmlSection.offsetTop - container.offsetTop;

      if (sectionTop <= containerTop + 100) {
        const id = section.getAttribute("id");
        if (id) {
          current = id.replace("section-", "");
        }
      }
    });

    if (current) {
      setActiveSection(current);
    }
  }, []);

  const toggleJson = useCallback((id: string) => {
    setShowJsonId((prev) => (prev === id ? null : id));
  }, []);

  const getJson = useCallback((surface: Types.Surface): string => {
    return JSON.stringify(
      surface,
      (key, value) => {
        if (
          key === "rootComponentId" ||
          key === "dataModel" ||
          key === "styles"
        )
          return undefined;
        if (value instanceof Map) return Object.fromEntries(value.entries());
        return value;
      },
      2
    );
  }, []);

  return (
    <div className="gallery-container">
      <div className="sidebar">
        <h2>Gallery Samples</h2>
        <div className="nav-list">
          {samples.map((sample) => (
            <div
              key={sample.id}
              className={`nav-item ${
                activeSection === sample.id ? "active" : ""
              }`}
              onClick={() => scrollTo(sample.id)}
            >
              {sample.title}
            </div>
          ))}
        </div>
      </div>

      <div
        className="main-content"
        ref={mainContentRef}
        onScroll={handleScroll}
      >
        <div className="component-list">
          {samples.map((sample) => (
            <div
              key={sample.id}
              className="component-section"
              id={`section-${sample.id}`}
            >
              <div className="section-header">
                <div>
                  <h3>{sample.title}</h3>
                  <p className="description">{sample.description}</p>
                </div>
                <button
                  className="json-toggle"
                  onClick={() => toggleJson(sample.id)}
                >
                  {showJsonId === sample.id ? "Hide JSON" : "Show JSON"}
                </button>
              </div>

              <div
                className={`gallery-content-wrapper ${
                  showJsonId === sample.id ? "with-json" : ""
                }`}
              >
                <div className="preview-card">
                  <SurfaceRenderer
                    surfaceId={`gallery-${sample.id}`}
                    surface={sample.surface}
                  />
                </div>

                {showJsonId === sample.id && (
                  <div className="json-pane">
                    <pre>{getJson(sample.surface)}</pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
