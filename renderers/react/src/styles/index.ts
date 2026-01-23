import { Styles } from '@a2ui/lit/0.8';

/**
 * Default color palette CSS variables.
 * These define the actual color values that the utility classes reference.
 * Scoped to .a2ui-surface to avoid affecting the rest of the page.
 */
export const defaultPalette: string = `
.a2ui-surface {
  /* Neutral palette */
  --n-100: #ffffff;
  --n-99: #fcfcfc;
  --n-98: #f9f9f9;
  --n-95: #f1f1f1;
  --n-90: #e2e2e2;
  --n-80: #c6c6c6;
  --n-70: #ababab;
  --n-60: #919191;
  --n-50: #777777;
  --n-40: #5e5e5e;
  --n-35: #525252;
  --n-30: #474747;
  --n-25: #3b3b3b;
  --n-20: #303030;
  --n-15: #262626;
  --n-10: #1b1b1b;
  --n-5: #111111;
  --n-0: #000000;

  /* Primary palette */
  --p-100: #ffffff;
  --p-99: #fffbff;
  --p-98: #fcf8ff;
  --p-95: #f2efff;
  --p-90: #e1e0ff;
  --p-80: #c0c1ff;
  --p-70: #a0a3ff;
  --p-60: #8487ea;
  --p-50: #6a6dcd;
  --p-40: #5154b3;
  --p-35: #4447a6;
  --p-30: #383b99;
  --p-25: #2c2e8d;
  --p-20: #202182;
  --p-15: #131178;
  --p-10: #06006c;
  --p-5: #03004d;
  --p-0: #000000;

  /* Secondary palette */
  --s-100: #ffffff;
  --s-99: #fffbff;
  --s-98: #fcf8ff;
  --s-95: #f2efff;
  --s-90: #e2e0f9;
  --s-80: #c6c4dd;
  --s-70: #aaa9c1;
  --s-60: #8f8fa5;
  --s-50: #75758b;
  --s-40: #5d5c72;
  --s-35: #515165;
  --s-30: #454559;
  --s-25: #393a4d;
  --s-20: #2e2f42;
  --s-15: #242437;
  --s-10: #191a2c;
  --s-5: #0f0f21;
  --s-0: #000000;

  /* Tertiary palette */
  --t-100: #ffffff;
  --t-99: #fffbff;
  --t-98: #fff8f9;
  --t-95: #ffecf4;
  --t-90: #ffd8ec;
  --t-80: #e9b9d3;
  --t-70: #cc9eb8;
  --t-60: #af849d;
  --t-50: #946b83;
  --t-40: #79526a;
  --t-35: #6b465d;
  --t-30: #5d3b50;
  --t-25: #4f3044;
  --t-20: #412538;
  --t-15: #341a2d;
  --t-10: #270f22;
  --t-5: #1a0517;
  --t-0: #000000;

  /* Neutral variant palette */
  --nv-100: #ffffff;
  --nv-99: #fdfbff;
  --nv-98: #faf8ff;
  --nv-95: #f1effa;
  --nv-90: #e3e1ec;
  --nv-80: #c7c5d0;
  --nv-70: #abaab4;
  --nv-60: #919099;
  --nv-50: #77767f;
  --nv-40: #5e5d66;
  --nv-35: #52525a;
  --nv-30: #46464e;
  --nv-25: #3b3b43;
  --nv-20: #303038;
  --nv-15: #26252d;
  --nv-10: #1b1b23;
  --nv-5: #111118;
  --nv-0: #000000;

  /* Error palette */
  --e-100: #ffffff;
  --e-99: #fffbff;
  --e-98: #fff8f7;
  --e-95: #ffedea;
  --e-90: #ffdad6;
  --e-80: #ffb4ab;
  --e-70: #ff897d;
  --e-60: #ff5449;
  --e-50: #de3730;
  --e-40: #ba1a1a;
  --e-35: #a80e0e;
  --e-30: #930006;
  --e-25: #7e0003;
  --e-20: #690001;
  --e-15: #540001;
  --e-10: #410001;
  --e-5: #2d0001;
  --e-0: #000000;

  /* Font family - matches Lit's default-font-family for visual parity */
  --font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-family-flex: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-family-mono: "Courier New", Courier, monospace;

  /* Color scheme for light-dark() function - default to light mode */
  --color-scheme: light;
  color-scheme: light;
}

`;

/**
 * Structural CSS styles from the Lit renderer, converted for global DOM use.
 * These styles define all the utility classes (layout-*, typography-*, color-*, etc.)
 * Converts :host selectors to .a2ui-surface for scoped use outside Shadow DOM.
 */
export const structuralStyles: string = Styles.structuralStyles.replace(
  /:host\s*\{/g,
  '.a2ui-surface {'
);

/**
 * CSS overrides that must come AFTER structural styles to take precedence.
 * These fix React-specific issues and allow CSS variable customization.
 * All rules scoped to .a2ui-surface to avoid affecting the rest of the page.
 *
 * IMPORTANT: These styles replicate the Shadow DOM scoped CSS from Lit components.
 * When Lit has `static styles = [...]` with element selectors, we need equivalent
 * rules here since React uses Light DOM where page CSS can interfere.
 */
export const styleOverrides: string = `
/* =========================================================================
 * Button
 * ========================================================================= */

/* NOTE: Previously had an override to force button text to inherit color.
 * This was removed to match Lit behavior where nested Text components
 * apply their own color classes (e.g., color-c-n10 from theme.markdown.p).
 *
 * If you want white text in buttons, use the pr-365 approach:
 * - Set theme.markdown.p to use color-c-n35 instead of color-c-n10
 * - Add additionalStyles.Button = { "--n-35": "var(--n-100)" }
 * This overrides the CSS variable only within buttons.
 */

/* =========================================================================
 * Card (matches Lit card.ts Shadow DOM styles)
 * ========================================================================= */

/* Allow card background to be overridden via CSS variable --a2ui-card-bg */
.a2ui-surface .color-bgc-n100 {
  background-color: var(--a2ui-card-bg, light-dark(var(--n-100), var(--n-0))) !important;
}

/* Match Lit Card's ::slotted(*) rule - direct children get full size */
.a2ui-surface .a2ui-card > div {
  height: 100%;
  width: 100%;
}

/* =========================================================================
 * Divider (matches Lit divider.ts Shadow DOM styles)
 * ========================================================================= */

/* Match Lit Divider's Shadow DOM hr styling */
/* Lit has: hr { height: 1px; background: #ccc; border: none; } */
.a2ui-surface hr {
  height: 1px;
  background: #ccc;
  border: none;
  margin: 8px 0;
}

/* =========================================================================
 * Text (matches Lit text.ts Shadow DOM styles)
 * ========================================================================= */

/* Ensure markdown paragraph margins are reset (matches Lit structural styles) */
.a2ui-surface section p {
  margin: 0;
}

/* Match Lit Text's h1-h5 reset - prevents browser defaults from affecting text */
/* Lit has: h1, h2, h3, h4, h5 { line-height: inherit; font: inherit; } */
/* Note: Do NOT reset margin here - margins are controlled by theme classes (layout-mb-*) */
.a2ui-surface section h1,
.a2ui-surface section h2,
.a2ui-surface section h3,
.a2ui-surface section h4,
.a2ui-surface section h5 {
  line-height: inherit;
  font: inherit;
}

/* =========================================================================
 * TextField (matches Lit text-field.ts Shadow DOM styles)
 * ========================================================================= */

/* Match Lit TextField's input styling */
/* Lit has: input { display: block; width: 100%; } */
.a2ui-surface section input[type="text"],
.a2ui-surface section input[type="number"],
.a2ui-surface section input[type="date"] {
  display: block;
  width: 100%;
  box-sizing: border-box;
}

/* Match Lit TextField's label styling */
/* Lit has: label { display: block; margin-bottom: 4px; } */
.a2ui-surface section > label {
  display: block;
  margin-bottom: 4px;
}

/* Match Lit TextField's textarea styling */
.a2ui-surface section textarea {
  display: block;
  width: 100%;
  box-sizing: border-box;
}

/* =========================================================================
 * CheckBox (matches Lit checkbox.ts Shadow DOM styles)
 * ========================================================================= */

/* Match Lit CheckBox's input styling */
/* Lit has: input { display: block; width: 100%; } */
/* Note: checkbox input width: 100% is from Lit but may need adjustment */
.a2ui-surface section input[type="checkbox"] {
  box-sizing: border-box;
}

/* =========================================================================
 * Slider (matches Lit slider.ts Shadow DOM styles)
 * ========================================================================= */

/* Match Lit Slider's input styling */
/* Lit has: input { display: block; width: 100%; } */
.a2ui-surface section input[type="range"] {
  display: block;
  width: 100%;
  box-sizing: border-box;
}

/* =========================================================================
 * Global box-sizing (matches Lit's * { box-sizing: border-box; } in components)
 * ========================================================================= */

.a2ui-surface *,
.a2ui-surface *::before,
.a2ui-surface *::after {
  box-sizing: border-box;
}
`;

/**
 * Injects A2UI styles into the document head.
 * Includes both the color palette CSS variables and the structural utility classes.
 * Call this once at application startup.
 *
 * @example
 * ```tsx
 * import { injectStyles } from '@a2ui/react/styles';
 *
 * // In your app entry point:
 * injectStyles();
 * ```
 */
export function injectStyles(): void {
  if (typeof document === 'undefined') {
    return; // SSR safety
  }

  const styleId = 'a2ui-structural-styles';

  // Avoid duplicate injection
  if (document.getElementById(styleId)) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  // Include palette (CSS variables), structural (utility classes), and overrides
  styleElement.textContent = defaultPalette + '\n' + structuralStyles + '\n' + styleOverrides;
  document.head.appendChild(styleElement);
}

/**
 * Removes injected A2UI styles from the document.
 * Useful for cleanup in tests or when unmounting.
 */
export function removeStyles(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const styleElement = document.getElementById('a2ui-structural-styles');
  if (styleElement) {
    styleElement.remove();
  }
}
