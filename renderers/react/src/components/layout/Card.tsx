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

interface CardProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "Card" };
  children?: ReactNode;
}

export function Card({ children }: CardProps) {
  const theme = useTheme();

  const themeClasses = useMemo(() => {
    return classMapToString(theme.components.Card);
  }, [theme]);

  return <div className={cn(themeClasses)}>{children}</div>;
}
