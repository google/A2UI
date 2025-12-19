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

import React, { useMemo } from "react";
import { Types } from "@a2ui/lit/0.8";
import { useTheme } from "../../context/ThemeContext.js";
import { cn, classMapToString } from "../../lib/utils.js";
import type { A2UIComponentProps } from "../../types/index.js";

type DividerAxis = "horizontal" | "vertical";

interface DividerProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "Divider" };
}

export function Divider({ node }: DividerProps) {
  const theme = useTheme();

  const properties = node.properties as {
    axis?: DividerAxis;
  };

  const axis = properties.axis ?? "horizontal";

  const themeClasses = useMemo(() => {
    return classMapToString(theme.components.Divider);
  }, [theme]);

  const orientationClasses = useMemo(() => {
    return axis === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]";
  }, [axis]);

  return (
    <div
      role="separator"
      aria-orientation={axis}
      className={cn(themeClasses, orientationClasses)}
    />
  );
}
