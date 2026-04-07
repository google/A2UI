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

/**
 * The actual CSS markup of the default A2UI theme.
 *
 * This should be only variable definitions, so they can pierce into the
 * shadow DOM of components.
 *
 * It uses `:where()` to ensure zero specificity, allowing page styles to
 * override these defaults as needed without having to deal with specificity.
 *
 * By default, the theme follows the user's `color-scheme` preference, but
 * developers can force either the light/dark variants using the `a2ui-light`
 * or `a2ui-dark` classes on the root element of their app.
 */
const DEFAULT_CSS = `
  :where(:root) {
    color-scheme: light dark;
  }

  :where(.a2ui-dark) {
    color-scheme: dark;
  }

  :where(.a2ui-light) {
    color-scheme: light;
  }

  :where(:root), :where(.a2ui-dark), :where(.a2ui-light) {
    --a2ui-color-background: light-dark(#eee, #111);
    --a2ui-color-on-background: light-dark(#333, #eee);

    --a2ui-color-surface: light-dark(
      color-mix(in oklab, var(--a2ui-color-background) 85%, white),
      color-mix(in oklab, var(--a2ui-color-background) 95%, white)
    );
    --a2ui-color-on-surface: light-dark(#333, #eee);

    --a2ui-color-primary: #17e;
    --a2ui-color-primary-light: color-mix(in oklab, var(--a2ui-color-primary) 85%, white);
    --a2ui-color-primary-dark: color-mix(in oklab, var(--a2ui-color-primary) 85%, black);
    --a2ui-color-primary-hover: light-dark(var(--a2ui-color-primary-dark), var(--a2ui-color-primary-light));
    --a2ui-color-on-primary: #fff;

    --a2ui-color-secondary: light-dark(#ddd, #333);
    --a2ui-color-secondary-light: color-mix(in oklab, var(--a2ui-color-secondary) 85%, white);
    --a2ui-color-secondary-dark: color-mix(in oklab, var(--a2ui-color-secondary) 95%, black);
    --a2ui-color-secondary-hover: light-dark(var(--a2ui-color-secondary-dark), var(--a2ui-color-secondary-light));
    --a2ui-color-on-secondary: light-dark(#333, #eee);

    --a2ui-border-radius: 0.25rem;
    --a2ui-color-border: light-dark(#ccc, #444);
    --a2ui-border-width: 1px;
    --a2ui-border: 1px solid var(--a2ui-color-border, #ccc);

    --a2ui-font-family-title: inherit;
    --a2ui-font-family-monospace: monospace;
    --a2ui-color-input: light-dark(#fff, #2a2a2a);
    --a2ui-color-on-input: light-dark(#333, #eee);

    --a2ui-grid-base: 0.5rem;
    --a2ui-spacing-xs: calc(var(--a2ui-spacing-s) / 2);
    --a2ui-spacing-s: calc(var(--a2ui-spacing-m) / 2);
    --a2ui-spacing-m: var(--a2ui-grid-base);
    --a2ui-spacing-l: calc(var(--a2ui-spacing-m) * 2);
    --a2ui-spacing-xl: calc(var(--a2ui-spacing-l) * 2);

    --a2ui-font-size: 1rem;
    --a2ui-font-scale: 1.2;
    --a2ui-font-size-xs: calc(var(--a2ui-font-size-s) / var(--a2ui-font-scale));
    --a2ui-font-size-s: calc(var(--a2ui-font-size-m) / var(--a2ui-font-scale));
    --a2ui-font-size-m: var(--a2ui-font-size);
    --a2ui-font-size-l: calc(var(--a2ui-font-size-m) * var(--a2ui-font-scale));
    --a2ui-font-size-xl: calc(var(--a2ui-font-size-l) * var(--a2ui-font-scale));
    --a2ui-font-size-2xl: calc(var(--a2ui-font-size-xl) * var(--a2ui-font-scale));

    --a2ui-line-height-headings: 1.2;
    --a2ui-line-height-body: 1.5;
  }
`;

/**
 * Caches the default stylesheet so it is only created once.
 */
let defaultStyleSheet: CSSStyleSheet | undefined;

/**
 * Retrieves the default CSSStyleSheet for A2UI components.
 *
 * If the stylesheet doesn't exist, it creates and initializes one with default
 * theme variables from the DEFAULT_CSS string.
 *
 * @returns The default CSSStyleSheet used by A2UI.
 */
function getDefaultStyleSheet(): CSSStyleSheet {
  if (!defaultStyleSheet) {
    defaultStyleSheet = new CSSStyleSheet();
    defaultStyleSheet.replaceSync(DEFAULT_CSS);
  }
  return defaultStyleSheet;
}

/**
 * Injects the default A2UI theme variables into the document.
 *
 * This method is used by the A2UI-provided basic catalogs of each renderer,
 * as needed, so design token values can be shared across all of them.
 *
 * End users may redefine the CSS variables defined in the default stylesheet
 * to customize the theme.
 *
 * This method ensures the default stylesheet is added to the root document
 * of the page, if it's not already present.
 */
export function injectDefaultA2uiTheme() {
  const sheet = getDefaultStyleSheet();
  if (!document.adoptedStyleSheets.includes(sheet)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }
}
