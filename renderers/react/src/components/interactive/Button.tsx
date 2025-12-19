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

import React, { useMemo, useCallback, type ReactNode } from "react";
import { Types } from "@a2ui/lit/0.8";
import { useTheme } from "../../context/ThemeContext.js";
import { useA2UIContext } from "../../context/A2UIContext.js";
import { cn, classMapToString } from "../../lib/utils.js";
import type { A2UIComponentProps } from "../../types/index.js";

interface Action {
  name?: string;
  context?: Array<{ key: string; value: unknown }>;
}

interface ButtonProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "Button" };
  children?: ReactNode;
}

export function Button({ node, surfaceId, children }: ButtonProps) {
  const theme = useTheme();
  const { sendAction, processor } = useA2UIContext();

  const properties = node.properties as {
    action?: Action;
    primary?: boolean;
  };

  const action = properties.action;
  const isPrimary = properties.primary ?? true;

  const themeClasses = useMemo(() => {
    return classMapToString(theme.components.Button);
  }, [theme]);

  const variantClasses = useMemo(() => {
    if (isPrimary) {
      return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
    return "border border-input bg-background hover:bg-accent hover:text-accent-foreground";
  }, [isPrimary]);

  const handleClick = useCallback(() => {
    if (!action?.name) return;

    const resolvedContext: Record<string, unknown> = {};
    if (action.context && Array.isArray(action.context)) {
      for (const item of action.context) {
        const value = item.value;
        if (
          typeof value === "object" &&
          value !== null &&
          "path" in value &&
          typeof value.path === "string"
        ) {
          const resolvedValue = processor.getData(
            node,
            value.path,
            surfaceId
          );
          resolvedContext[item.key] = resolvedValue;
        } else if (
          typeof value === "object" &&
          value !== null &&
          "literalString" in value
        ) {
          resolvedContext[item.key] = value.literalString;
        } else {
          resolvedContext[item.key] = value;
        }
      }
    }

    sendAction({
      type: "a2ui.action",
      actionId: action.name,
      context: resolvedContext,
    });
  }, [action, processor, node, surfaceId, sendAction]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(themeClasses, variantClasses)}
    >
      {children}
    </button>
  );
}
