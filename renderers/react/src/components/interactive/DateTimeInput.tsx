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

import React, { useMemo, useCallback, useId, useState } from "react";
import { Types } from "@a2ui/lit/0.8";
import { useDataBinding } from "../../hooks/useDataBinding.js";
import { useTheme } from "../../context/ThemeContext.js";
import { cn, classMapToString } from "../../lib/utils.js";
import type { A2UIComponentProps } from "../../types/index.js";

interface DateTimeInputProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "DateTimeInput" };
}

export function DateTimeInput({ node, surfaceId }: DateTimeInputProps) {
  const theme = useTheme();
  const id = useId();
  const { resolveString, setValue } = useDataBinding(node, surfaceId);

  const properties = node.properties as {
    label?: { literalString?: string; path?: string };
    value?: { literalString?: string; path?: string };
    enableDate?: boolean;
    enableTime?: boolean;
    outputFormat?: string;
  };

  const label = resolveString(properties.label ?? null);
  const initialValue = resolveString(properties.value ?? null) ?? "";
  const enableDate = properties.enableDate ?? true;
  const enableTime = properties.enableTime ?? false;
  const valuePath = properties.value?.path;

  const [value, setLocalValue] = useState(initialValue);

  const containerClasses = useMemo(() => {
    return classMapToString(theme.components.DateTimeInput.container);
  }, [theme]);

  const elementClasses = useMemo(() => {
    return classMapToString(theme.components.DateTimeInput.element);
  }, [theme]);

  const labelClasses = useMemo(() => {
    return classMapToString(theme.components.DateTimeInput.label);
  }, [theme]);

  const inputType = useMemo(() => {
    if (enableDate && enableTime) {
      return "datetime-local";
    }
    if (enableTime) {
      return "time";
    }
    return "date";
  }, [enableDate, enableTime]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (valuePath) {
        setValue(valuePath, newValue);
      }
    },
    [valuePath, setValue]
  );

  return (
    <div className={cn(containerClasses)}>
      {label && (
        <label htmlFor={id} className={cn(labelClasses)}>
          {label}
        </label>
      )}
      <input
        type={inputType}
        id={id}
        value={value}
        onChange={handleChange}
        className={cn(elementClasses)}
      />
    </div>
  );
}
