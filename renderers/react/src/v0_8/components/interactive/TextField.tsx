/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { memo, useId, useState, useEffect } from 'react';
import { useA2UIComponent } from '../../hooks/useA2UIComponent';
import { A2UIComponentProps, Types } from '../../types';
import { TextFieldType } from '../../types/Primitives';

/**
 * A standard text input component.
 *
 * Supports various input types (text, number, date, etc.) via the 'textFieldType' property.
 * Synchronizes with the A2UI data model for two-way binding.
 */
export const TextField = memo(function TextField({
  node,
  surfaceId,
}: A2UIComponentProps<Types.TextFieldNode>) {
  const {theme, resolveString, setValue} = useA2UIComponent(node, surfaceId);
  const props = node.properties;
  const id = useId();

  const label = resolveString(props.label);
  const textPath = props.text?.path;
  const initialValue = resolveString(props.text) ?? '';
  // Fallback to 'type' if 'textFieldType' is not present in the model version
  const fieldType = (props as any).textFieldType || (props as any).type;
  const validationRegexp = props.validationRegexp;

  const [value, setLocalValue] = useState(initialValue);
  // Validation state tracked for potential future use (e.g., error styling)
  const [_isValid, setIsValid] = useState(true);

  // Sync with external data model changes
  useEffect(() => {
    if (textPath) {
      setLocalValue(initialValue);
    }
  }, [initialValue, textPath]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Basic validation if regex is provided
    if (validationRegexp) {
      const regex = new RegExp(validationRegexp);
      setIsValid(regex.test(newValue));
    }

    // Update global state
    if (textPath) {
      setValue(textPath, newValue);
    }
  };

  const isLongText = fieldType === 'longText';
  const inputType = fieldType === 'longText' ? 'text' : (fieldType || 'shortText');

  return (
    <div className={theme.components.TextField?.container}>
      {label && (
        <label htmlFor={id} className={theme.components.TextField?.label}>
          {label}
        </label>
      )}
      {isLongText ? (
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          className={theme.components.TextField?.element}
        />
      ) : (
        <input
          id={id}
          type={inputType === 'shortText' ? 'text' : inputType}
          value={value}
          onChange={handleChange}
          className={theme.components.TextField?.element}
        />
      )}
    </div>
  );
});
