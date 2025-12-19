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

import React, { useMemo, type ReactNode } from "react";
import { Types } from "@a2ui/lit/0.8";
import { useTheme } from "../../context/ThemeContext.js";
import { cn, classMapToString } from "../../lib/utils.js";
import type { A2UIComponentProps } from "../../types/index.js";

type ListDirection = "vertical" | "horizontal";
type Alignment = "start" | "center" | "end" | "stretch";

interface ListProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "List" };
  children?: ReactNode;
}

export function List({ node, children }: ListProps) {
  const theme = useTheme();

  const properties = node.properties as {
    direction?: ListDirection;
    alignment?: Alignment;
  };

  const direction = properties.direction ?? "vertical";
  const alignment = properties.alignment ?? "stretch";

  const themeClasses = useMemo(() => {
    return classMapToString(theme.components.List);
  }, [theme]);

  const directionClass = useMemo(() => {
    return direction === "horizontal" ? "flex-row" : "flex-col";
  }, [direction]);

  const alignmentClass = useMemo(() => {
    switch (alignment) {
      case "start":
        return "items-start";
      case "center":
        return "items-center";
      case "end":
        return "items-end";
      case "stretch":
        return "items-stretch";
      default:
        return "items-stretch";
    }
  }, [alignment]);

  const overflowClass = useMemo(() => {
    return direction === "horizontal"
      ? "overflow-x-auto overflow-y-hidden"
      : "overflow-y-auto overflow-x-hidden";
  }, [direction]);

  return (
    <div
      className={cn(
        themeClasses,
        directionClass,
        alignmentClass,
        overflowClass
      )}
    >
      {children}
    </div>
  );
}
