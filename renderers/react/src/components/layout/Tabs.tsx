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

import React, { useState, useMemo, type ReactNode } from "react";
import { Types } from "@a2ui/lit/0.8";
import { useTheme } from "../../context/ThemeContext.js";
import { cn, classMapToString } from "../../lib/utils.js";
import type { A2UIComponentProps } from "../../types/index.js";

interface TabItem {
  title?: { literalString?: string; path?: string };
  child?: Types.AnyComponentNode;
}

interface TabsProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "Tabs" };
  renderChild?: (node: Types.AnyComponentNode) => ReactNode;
}

export function Tabs({ node, renderChild }: TabsProps) {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  const properties = node.properties as {
    tabItems?: TabItem[];
  };

  const tabItems = properties.tabItems ?? [];

  const containerClasses = useMemo(() => {
    return classMapToString(theme.components.Tabs.container);
  }, [theme]);

  const controlsClasses = useMemo(() => {
    return classMapToString(theme.components.Tabs.controls.all);
  }, [theme]);

  const selectedClasses = useMemo(() => {
    return classMapToString(theme.components.Tabs.controls.selected);
  }, [theme]);

  if (tabItems.length === 0) {
    return null;
  }

  return (
    <div className={cn(containerClasses)}>
      {/* Tab controls */}
      <div className={cn(controlsClasses)} role="tablist">
        {tabItems.map((item, index) => {
          const title = item.title?.literalString ?? `Tab ${index + 1}`;
          const isSelected = index === activeIndex;

          return (
            <button
              key={index}
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isSelected && selectedClasses
              )}
            >
              {title}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="mt-2" role="tabpanel">
        {tabItems[activeIndex]?.child && renderChild
          ? renderChild(tabItems[activeIndex].child as Types.AnyComponentNode)
          : null}
      </div>
    </div>
  );
}
