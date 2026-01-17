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

/**
 * Theme configuration for A2UI Playground
 */
export interface ThemeConfig {
    "font-family"?: string;
    "primary-hue"?: number;
    "primary-chroma"?: number;
    "neutral-hue"?: number;
    "neutral-chroma"?: number;
    "corner-radius-small"?: string;
    "corner-radius-medium"?: string;
    "corner-radius-large"?: string;
    "spacing-small"?: string;
    "spacing-medium"?: string;
    "spacing-large"?: string;
}

/**
 * Default theme for the A2UI Playground
 */
export const theme: ThemeConfig = {
    "font-family": "Inter, system-ui, sans-serif",
    "primary-hue": 270,
    "primary-chroma": 30,
    "neutral-hue": 280,
    "neutral-chroma": 5,
    "corner-radius-small": "8px",
    "corner-radius-medium": "12px",
    "corner-radius-large": "16px",
    "spacing-small": "8px",
    "spacing-medium": "16px",
    "spacing-large": "24px",
};
