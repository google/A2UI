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

interface AudioPlayerProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "AudioPlayer" };
}

export function AudioPlayer({ node, surfaceId }: AudioPlayerProps) {
  const theme = useTheme();
  const { resolveString } = useDataBinding(node, surfaceId);

  const properties = node.properties as {
    url?: { literalString?: string; path?: string };
    description?: { literalString?: string; path?: string };
  };

  const url = resolveString(properties.url ?? null) ?? "";
  const description = resolveString(properties.description ?? null);

  const themeClasses = useMemo(() => {
    return classMapToString(theme.components.AudioPlayer);
  }, [theme]);

  if (!url) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-2", themeClasses)}>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <audio src={url} controls className="w-full" preload="metadata" />
    </div>
  );
}
