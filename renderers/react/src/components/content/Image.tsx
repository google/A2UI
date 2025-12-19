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
import { useDataBinding } from "../../hooks/useDataBinding.js";
import { useTheme } from "../../context/ThemeContext.js";
import { cn, classMapToString } from "../../lib/utils.js";
import type { A2UIComponentProps } from "../../types/index.js";

type ImageFit = "contain" | "cover" | "fill" | "none" | "scale-down";
type ImageUsageHint =
  | "icon"
  | "avatar"
  | "smallFeature"
  | "mediumFeature"
  | "largeFeature"
  | "header";

interface ImageProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "Image" };
}

export function Image({ node, surfaceId }: ImageProps) {
  const theme = useTheme();
  const { resolveString } = useDataBinding(node, surfaceId);

  const properties = node.properties as {
    url?: { literalString?: string; path?: string };
    alt?: { literalString?: string; path?: string };
    fit?: ImageFit;
    usageHint?: ImageUsageHint;
  };

  const url = resolveString(properties.url ?? null) ?? "";
  const alt = resolveString(properties.alt ?? null) ?? "";
  const fit = properties.fit ?? "cover";
  const usageHint = properties.usageHint;

  const themeClasses = useMemo(() => {
    const baseClasses = classMapToString(theme.components.Image.all);
    if (usageHint && theme.components.Image[usageHint]) {
      const hintClasses = classMapToString(theme.components.Image[usageHint]);
      return cn(baseClasses, hintClasses);
    }
    return baseClasses;
  }, [theme, usageHint]);

  const fitClass = useMemo(() => {
    switch (fit) {
      case "contain":
        return "object-contain";
      case "cover":
        return "object-cover";
      case "fill":
        return "object-fill";
      case "none":
        return "object-none";
      case "scale-down":
        return "object-scale-down";
      default:
        return "object-cover";
    }
  }, [fit]);

  if (!url) {
    return null;
  }

  return (
    <img
      src={url}
      alt={alt}
      className={cn(themeClasses, fitClass)}
      loading="lazy"
    />
  );
}
