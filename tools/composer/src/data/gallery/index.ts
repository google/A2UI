/**
 * Gallery widget registry.
 *
 * Exports version-specific gallery arrays. The gallery page selects
 * which set to display based on the global SpecVersion context.
 */
export { V08_GALLERY_WIDGETS } from './v08';
export { V09_GALLERY_WIDGETS } from './v09';

// Re-export all individual widgets for direct imports
export * from './v08';
export * from './v09';
