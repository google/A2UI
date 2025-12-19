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

type TextFieldType = "shortText" | "longText" | "number" | "obscured" | "date";

interface TextFieldProps extends A2UIComponentProps {
  node: Types.AnyComponentNode & { type: "TextField" };
}

export function TextField({ node, surfaceId }: TextFieldProps) {
  const theme = useTheme();
  const id = useId();
  const { resolveString, setValue } = useDataBinding(node, surfaceId);

  const properties = node.properties as {
    label?: { literalString?: string; path?: string };
    text?: { literalString?: string; path?: string };
    placeholder?: { literalString?: string; path?: string };
    textFieldType?: TextFieldType;
    validationRegexp?: string;
  };

  const label = resolveString(properties.label ?? null);
  const initialValue = resolveString(properties.text ?? null) ?? "";
  const placeholder = resolveString(properties.placeholder ?? null) ?? undefined;
  const textFieldType = properties.textFieldType ?? "shortText";
  const validationRegexp = properties.validationRegexp;
  const textPath = properties.text?.path;

  const [value, setLocalValue] = useState(initialValue);
  const [isValid, setIsValid] = useState(true);

  const containerClasses = useMemo(() => {
    return classMapToString(theme.components.TextField.container);
  }, [theme]);

  const elementClasses = useMemo(() => {
    return classMapToString(theme.components.TextField.element);
  }, [theme]);

  const labelClasses = useMemo(() => {
    return classMapToString(theme.components.TextField.label);
  }, [theme]);

  const inputType = useMemo(() => {
    switch (textFieldType) {
      case "number":
        return "number";
      case "obscured":
        return "password";
      case "date":
        return "date";
      default:
        return "text";
    }
  }, [textFieldType]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      if (validationRegexp) {
        const regex = new RegExp(validationRegexp);
        setIsValid(regex.test(newValue));
      }

      if (textPath) {
        setValue(textPath, newValue);
      }
    },
    [validationRegexp, textPath, setValue]
  );

  const isTextArea = textFieldType === "longText";

  return (
    <div className={cn(containerClasses)}>
      {label && (
        <label htmlFor={id} className={cn(labelClasses)}>
          {label}
        </label>
      )}
      {isTextArea ? (
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          className={cn(
            elementClasses,
            "min-h-[80px] resize-y",
            !isValid && "border-destructive"
          )}
        />
      ) : (
        <input
          type={inputType}
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          className={cn(elementClasses, !isValid && "border-destructive")}
        />
      )}
    </div>
  );
}
