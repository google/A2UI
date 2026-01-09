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

type Alignment = "start" | "center" | "end" | "stretch";
type Distribution =
  | "start"
  | "center"
  | "end"
  | "spaceBetween"
  | "spaceAround"
  | "spaceEvenly";

interface ColumnProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "Column" };
  children?: ReactNode;
}

export function Column({ node, children }: ColumnProps) {
  const theme = useTheme();

  const properties = node.properties as {
    alignment?: Alignment;
    distribution?: Distribution;
  };

  const alignment = properties.alignment ?? "stretch";
  const distribution = properties.distribution ?? "start";

  const themeClasses = useMemo(() => {
    return classMapToString(theme.components.Column);
  }, [theme]);

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

  const distributionClass = useMemo(() => {
    switch (distribution) {
      case "start":
        return "justify-start";
      case "center":
        return "justify-center";
      case "end":
        return "justify-end";
      case "spaceBetween":
        return "justify-between";
      case "spaceAround":
        return "justify-around";
      case "spaceEvenly":
        return "justify-evenly";
      default:
        return "justify-start";
    }
  }, [distribution]);

  return (
    <div className={cn(themeClasses, alignmentClass, distributionClass)}>
      {children}
    </div>
  );
}
