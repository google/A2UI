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

interface ComponentSample {
  name: string;
  surface: Types.Surface;
}

interface Category {
  name: string;
  samples: ComponentSample[];
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

const categories: Category[] = [
  {
    name: "Layout",
    samples: [
      {
        name: "Card",
        surface: createSingleComponentSurface("Card", {
          child: createComponent("Text", {
            text: { literalString: "Content inside a card" },
          }),
        }),
      },
      {
        name: "Column",
        surface: createSingleComponentSurface("Column", {
          children: [
            createComponent("Text", {
              text: { literalString: "Item 1" },
            }),
            createComponent("Text", {
              text: { literalString: "Item 2" },
            }),
            createComponent("Text", {
              text: { literalString: "Item 3" },
            }),
          ],
          alignment: "center",
          distribution: "space-around",
        }),
      },
      {
        name: "Divider",
        surface: createSingleComponentSurface("Column", {
          children: [
            createComponent("Text", {
              text: { literalString: "Above Divider" },
            }),
            createComponent("Divider", {}),
            createComponent("Text", {
              text: { literalString: "Below Divider" },
            }),
          ],
        }),
      },
      {
        name: "List",
        surface: createSingleComponentSurface("List", {
          children: [
            createComponent("Text", {
              text: { literalString: "List Item 1" },
            }),
            createComponent("Text", {
              text: { literalString: "List Item 2" },
            }),
            createComponent("Text", {
              text: { literalString: "List Item 3" },
            }),
          ],
          direction: "vertical",
        }),
      },
      {
        name: "Modal",
        surface: createSingleComponentSurface("Modal", {
          entryPointChild: createComponent("Button", {
            action: { type: "none" },
            child: createComponent("Text", {
              text: { literalString: "Open Modal" },
            }),
          }),
          contentChild: createComponent("Card", {
            child: createComponent("Text", {
              text: { literalString: "This is the modal content." },
            }),
          }),
        }),
      },
      {
        name: "Row",
        surface: createSingleComponentSurface("Row", {
          children: [
            createComponent("Text", {
              text: { literalString: "Left" },
            }),
            createComponent("Text", {
              text: { literalString: "Center" },
            }),
            createComponent("Text", {
              text: { literalString: "Right" },
            }),
          ],
          alignment: "center",
          distribution: "space-between",
        }),
      },
      {
        name: "Tabs",
        surface: createSingleComponentSurface("Tabs", {
          tabItems: [
            {
              title: { literalString: "Tab 1" },
              child: createComponent("Text", {
                text: { literalString: "Content for Tab 1" },
              }),
            },
            {
              title: { literalString: "Tab 2" },
              child: createComponent("Text", {
                text: { literalString: "Content for Tab 2" },
              }),
            },
          ],
        }),
      },
      {
        name: "Text",
        surface: createSingleComponentSurface("Column", {
          children: [
            createComponent("Heading", {
              text: { literalString: "Heading Text" },
            }),
            createComponent("Text", {
              text: { literalString: "Standard body text." },
            }),
            createComponent("Text", {
              text: { literalString: "Caption text" },
              usageHint: "caption",
            }),
          ],
        }),
      },
    ],
  },
  {
    name: "Media",
    samples: [
      {
        name: "AudioPlayer",
        surface: createSingleComponentSurface("AudioPlayer", {
          url: {
            literalString:
              "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          },
        }),
      },
      {
        name: "Icon",
        surface: createSingleComponentSurface("Row", {
          children: [
            createComponent("Icon", { name: { literalString: "home" } }),
            createComponent("Icon", { name: { literalString: "favorite" } }),
            createComponent("Icon", { name: { literalString: "settings" } }),
          ],
          distribution: "space-around",
        }),
      },
      {
        name: "Image",
        surface: createSingleComponentSurface("Image", {
          url: { literalString: "https://picsum.photos/id/10/300/200" },
        }),
      },
      {
        name: "Video",
        surface: createSingleComponentSurface("Video", {
          url: {
            literalString:
              "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          },
        }),
      },
    ],
  },
  {
    name: "Inputs",
    samples: [
      {
        name: "Button",
        surface: createSingleComponentSurface("Row", {
          children: [
            createComponent("Button", {
              label: { literalString: "Primary" },
              action: { type: "click" },
              child: createComponent("Text", {
                text: { literalString: "Primary" },
              }),
            }),
            createComponent("Button", {
              label: { literalString: "Secondary" },
              action: { type: "click" },
              child: createComponent("Text", {
                text: { literalString: "Secondary" },
              }),
            }),
          ],
          distribution: "space-around",
        }),
      },
      {
        name: "CheckBox",
        surface: createSingleComponentSurface("Column", {
          children: [
            createComponent("CheckBox", {
              label: { literalString: "Unchecked" },
              value: { literalBoolean: false },
            }),
            createComponent("CheckBox", {
              label: { literalString: "Checked" },
              value: { literalBoolean: true },
            }),
          ],
        }),
      },
      {
        name: "DateTimeInput",
        surface: createSingleComponentSurface("Column", {
          children: [
            createComponent("DateTimeInput", {
              enableDate: true,
              enableTime: false,
              value: { literalString: "2025-12-09" },
            }),
            createComponent("DateTimeInput", {
              enableDate: true,
              enableTime: true,
              value: { literalString: "2025-12-09T12:00:00" },
            }),
          ],
        }),
      },
      {
        name: "MultipleChoice",
        surface: createSingleComponentSurface("MultipleChoice", {
          options: [
            { value: "opt1", label: { literalString: "Option 1" } },
            { value: "opt2", label: { literalString: "Option 2" } },
            { value: "opt3", label: { literalString: "Option 3" } },
          ],
          selections: { literalString: "opt1" },
        }),
      },
      {
        name: "Slider",
        surface: createSingleComponentSurface("Slider", {
          value: { literalNumber: 50 },
          minValue: 0,
          maxValue: 100,
        }),
      },
      {
        name: "TextField",
        surface: createSingleComponentSurface("Column", {
          children: [
            createComponent("TextField", {
              label: { literalString: "Standard Input" },
              text: { literalString: "Some text" },
            }),
            createComponent("TextField", {
              label: { literalString: "Password" },
              type: "password",
              text: { literalString: "" },
            }),
          ],
        }),
      },
    ],
  },
];

export function Library() {
  const [activeSection, setActiveSection] = useState("");
  const [showJsonId, setShowJsonId] = useState<string | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((name: string) => {
    setActiveSection(name);
    const element = document.getElementById("section-" + name);
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

  const toggleJson = useCallback((name: string) => {
    setShowJsonId((prev) => (prev === name ? null : name));
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
    <div className="library-container">
      <div className="sidebar">
        <h2>Components</h2>
        <div className="nav-list">
          {categories.map((category) => (
            <div key={category.name}>
              <div className="category-header">{category.name}</div>
              {category.samples.map((sample) => (
                <div
                  key={sample.name}
                  className={`nav-item ${
                    activeSection === sample.name ? "active" : ""
                  }`}
                  onClick={() => scrollTo(sample.name)}
                >
                  {sample.name}
                </div>
              ))}
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
          {categories.map((category) => (
            <div key={category.name} className="category-section">
              <h2>{category.name}</h2>
              {category.samples.map((sample) => (
                <div
                  key={sample.name}
                  className="component-section"
                  id={`section-${sample.name}`}
                >
                  <div className="section-header">
                    <h3>{sample.name}</h3>
                    <button
                      className="json-toggle"
                      onClick={() => toggleJson(sample.name)}
                    >
                      {showJsonId === sample.name ? "Hide JSON" : "Show JSON"}
                    </button>
                  </div>

                  <div
                    className={`content-wrapper ${
                      showJsonId === sample.name ? "with-json" : ""
                    }`}
                  >
                    <div className="preview-card">
                      <SurfaceRenderer
                        surfaceId={`lib-${sample.name}`}
                        surface={sample.surface}
                      />
                    </div>

                    {showJsonId === sample.name && (
                      <div className="json-pane">
                        <pre>{getJson(sample.surface)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
