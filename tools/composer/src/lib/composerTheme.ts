/**
 * Composer theme for A2UI React renderer.
 *
 * Extends the standard litTheme with additionalStyles to fix styling gaps
 * that arise from rendering in Light DOM (React) vs Shadow DOM (Lit).
 *
 * The litTheme's utility classes (components, elements, markdown) are used
 * as-is — no duplication. Only additionalStyles are added here to handle
 * CSS variable scoping that Shadow DOM provided for free.
 */
import { litTheme } from "@a2ui/react";

export const composerTheme = {
  ...litTheme,
  additionalStyles: {
    /**
     * Remap neutral text colors to white inside buttons.
     *
     * The litTheme's markdown.p applies color-c-n10 to <p> tags, which
     * overrides the button's white text (color-c-p100). In the Lit renderer,
     * the themed-a2ui-surface solved this by remapping --n-10/--n-35 to
     * --n-100 (white) via additionalStyles on the button element.
     */
    Button: {
      '--n-10': 'var(--n-100)',
      '--n-35': 'var(--n-100)',
    },
  },
};
