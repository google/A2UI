/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface HintedStyles {
  h1: Record<string, string>;
  h2: Record<string, string>;
  h3: Record<string, string>;
  h4: Record<string, string>;
  h5: Record<string, string>;
  body: Record<string, string>;
  caption: Record<string, string>;
}

const hintedStyleKeys = ["h1", "h2", "h3", "h4", "h5", "caption", "body"] as const;

export function isHintedStyles(styles: unknown): styles is HintedStyles {
  if (!styles || typeof styles !== "object" || Array.isArray(styles)) {
    return false;
  }

  const styleRecord = styles as Record<string, unknown>;
  return hintedStyleKeys.some((key) => {
    const value = styleRecord[key];
    return !!value && typeof value === "object" && !Array.isArray(value);
  });
}
