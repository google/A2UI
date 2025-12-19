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

interface StringValue {
  literalString?: string;
  path?: string;
}

interface Option {
  value?: string;
  label?: StringValue;
}

interface MultipleChoiceProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "MultipleChoice" };
}

export function MultipleChoice({ node, surfaceId }: MultipleChoiceProps) {
  const theme = useTheme();
  const id = useId();
  const { resolveString, setValue, getValue } = useDataBinding(
    node,
    surfaceId
  );

  const properties = node.properties as {
    label?: { literalString?: string; path?: string };
    options?: Option[];
    selections?: { path?: string };
    maxAllowedSelections?: number;
  };

  const label = resolveString(properties.label ?? null);
  const options = properties.options ?? [];
  const selectionsPath = properties.selections?.path;
  const maxAllowedSelections = properties.maxAllowedSelections ?? 1;

  const currentSelections = useMemo(() => {
    if (!selectionsPath) return [];
    const data = getValue(selectionsPath);
    if (Array.isArray(data)) return data as string[];
    if (typeof data === "string") return [data];
    return [];
  }, [selectionsPath, getValue]);

  const [selections, setSelections] = useState<string[]>(currentSelections);

  const containerClasses = useMemo(() => {
    return classMapToString(theme.components.MultipleChoice.container);
  }, [theme]);

  const elementClasses = useMemo(() => {
    return classMapToString(theme.components.MultipleChoice.element);
  }, [theme]);

  const labelClasses = useMemo(() => {
    return classMapToString(theme.components.MultipleChoice.label);
  }, [theme]);

  const isMultiple = maxAllowedSelections > 1;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      let newSelections: string[];

      if (isMultiple) {
        const selectedOptions = Array.from(
          e.target.selectedOptions,
          (opt) => opt.value
        );
        newSelections = selectedOptions.slice(0, maxAllowedSelections);
      } else {
        newSelections = [e.target.value];
      }

      setSelections(newSelections);

      if (selectionsPath) {
        setValue(
          selectionsPath,
          isMultiple ? newSelections : newSelections[0]
        );
      }
    },
    [isMultiple, maxAllowedSelections, selectionsPath, setValue]
  );

  return (
    <div className={cn(containerClasses)}>
      {label && (
        <label htmlFor={id} className={cn(labelClasses)}>
          {label}
        </label>
      )}
      <select
        id={id}
        multiple={isMultiple}
        value={isMultiple ? selections : selections[0] ?? ""}
        onChange={handleChange}
        className={cn(elementClasses)}
      >
        {options.map((option, index) => {
          const labelText = resolveString(option.label ?? null);
          return (
            <option key={index} value={option.value ?? labelText ?? ""}>
              {labelText ?? option.value ?? `Option ${index + 1}`}
            </option>
          );
        })}
      </select>
    </div>
  );
}
