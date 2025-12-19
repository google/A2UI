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
import MarkdownIt from "markdown-it";
import { Types } from "@a2ui/lit/0.8";
import { useDataBinding } from "../../hooks/useDataBinding.js";
import { useTheme } from "../../context/ThemeContext.js";
import { cn, classMapToString } from "../../lib/utils.js";
import type { A2UIComponentProps } from "../../types/index.js";

const md = new MarkdownIt({
  html: false, // Disable HTML for security
  breaks: true,
  linkify: true,
});

type TextUsageHint = "h1" | "h2" | "h3" | "h4" | "h5" | "caption" | "body";

interface TextProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "Text" };
}

export function Text({ node, surfaceId }: TextProps) {
  const theme = useTheme();
  const { resolveString } = useDataBinding(node, surfaceId);

  const properties = node.properties as {
    text?: { literalString?: string; path?: string };
    usageHint?: TextUsageHint;
  };

  const text = resolveString(properties.text ?? null) ?? "";
  const usageHint = properties.usageHint ?? "body";

  const themeClasses = useMemo(() => {
    const baseClasses = classMapToString(theme.components.Text.all);
    const hintClasses = classMapToString(
      theme.components.Text[usageHint] ?? theme.components.Text.body
    );
    return cn(baseClasses, hintClasses);
  }, [theme, usageHint]);

  const htmlContent = useMemo(() => {
    return md.render(text);
  }, [text]);

  const Element = useMemo(() => {
    switch (usageHint) {
      case "h1":
        return "h1";
      case "h2":
        return "h2";
      case "h3":
        return "h3";
      case "h4":
        return "h4";
      case "h5":
        return "h5";
      case "caption":
        return "span";
      default:
        return "div";
    }
  }, [usageHint]);

  return (
    <Element
      className={themeClasses}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
