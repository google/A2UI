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

import React, { useMemo, useCallback, useId } from "react";
import { Types } from "@a2ui/lit/0.8";
import { useDataBinding } from "../../hooks/useDataBinding.js";
import { useTheme } from "../../context/ThemeContext.js";
import { cn, classMapToString } from "../../lib/utils.js";
import type { A2UIComponentProps } from "../../types/index.js";

interface CheckBoxProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "CheckBox" };
}

export function CheckBox({ node, surfaceId }: CheckBoxProps) {
  const theme = useTheme();
  const id = useId();
  const { resolveString, resolveBoolean, setValue } = useDataBinding(
    node,
    surfaceId
  );

  const properties = node.properties as {
    label?: { literalString?: string; path?: string };
    value?: { literalBoolean?: boolean; path?: string };
  };

  const label = resolveString(properties.label ?? null);
  const checked = resolveBoolean(properties.value ?? null) ?? false;
  const valuePath = properties.value?.path;

  const containerClasses = useMemo(() => {
    return classMapToString(theme.components.CheckBox.container);
  }, [theme]);

  const elementClasses = useMemo(() => {
    return classMapToString(theme.components.CheckBox.element);
  }, [theme]);

  const labelClasses = useMemo(() => {
    return classMapToString(theme.components.CheckBox.label);
  }, [theme]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (valuePath) {
        setValue(valuePath, e.target.checked);
      }
    },
    [valuePath, setValue]
  );

  return (
    <div className={cn(containerClasses)}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={handleChange}
        className={cn(elementClasses)}
      />
      {label && (
        <label htmlFor={id} className={cn(labelClasses)}>
          {label}
        </label>
      )}
    </div>
  );
}
