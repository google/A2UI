/**
 * Default color palette CSS variables.
 * Defines all the color values (--n-*, --p-*, --s-*, --t-*, --nv-*, --e-*)
 * that the utility classes reference.
 */
export declare const defaultPalette: string;

/**
 * Structural CSS styles converted from Lit renderer.
 * Uses :root {} instead of :host {} for non-Shadow DOM usage.
 */
export declare const structuralStyles: string;

/**
 * Injects the A2UI structural styles into the document head.
 * Call this once at application startup when using litTheme.
 */
export declare function injectStyles(): void;

/**
 * Removes the injected A2UI structural styles from the document.
 */
export declare function removeStyles(): void;
