/**
 * Type definitions for component fixtures.
 */

export interface ComponentFixture {
  root: string;
  components: Array<{
    id: string;
    component: Record<string, unknown>;
  }>;
  /**
   * Initial data model values.
   * Keys are JSON Pointer paths (e.g., "/settings/checked").
   * These are sent as updateDataModel messages before rendering.
   */
  data?: Record<string, unknown>;
}
