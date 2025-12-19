/**
 * A2UI Catalog Registry System
 *
 * The catalog system allows different component sets to be registered
 * for different A2UI catalog versions (e.g., v0.8, v0.9).
 *
 * This enables:
 * - Version-specific component implementations
 * - Custom component catalogs
 * - Fallback to standard catalog
 */

import type { ComponentType } from 'react';
import type { A2UIComponentSpec } from '../types';

// =============================================================================
// TYPES
// =============================================================================

export type A2UIComponentFn = ComponentType<{ spec: A2UIComponentSpec }>;

export interface CatalogEntry {
  /** Component implementation */
  component: A2UIComponentFn;
  /** Minimum catalog version this component supports */
  minVersion?: string;
  /** Maximum catalog version this component supports */
  maxVersion?: string;
  /** Component description */
  description?: string;
}

export interface Catalog {
  /** Unique catalog identifier (URL or name) */
  id: string;
  /** Human-readable name */
  name?: string;
  /** Version string */
  version?: string;
  /** Component entries */
  components: Map<string, CatalogEntry>;
  /** Parent catalog to inherit from */
  parent?: string;
}

// =============================================================================
// DEFAULT CATALOG IDS
// =============================================================================

export const STANDARD_CATALOG_V08 = 'https://a2ui.org/catalog/standard/v0.8';
export const STANDARD_CATALOG_V09 = 'https://a2ui.org/catalog/standard/v0.9';
export const DEFAULT_CATALOG = STANDARD_CATALOG_V08;

// =============================================================================
// CATALOG REGISTRY
// =============================================================================

class CatalogRegistry {
  private catalogs = new Map<string, Catalog>();
  private defaultCatalogId = DEFAULT_CATALOG;

  /**
   * Register a new catalog
   */
  registerCatalog(catalog: Catalog): void {
    this.catalogs.set(catalog.id, catalog);
  }

  /**
   * Get a catalog by ID
   */
  getCatalog(catalogId: string): Catalog | undefined {
    return this.catalogs.get(catalogId);
  }

  /**
   * Register a component in a catalog
   */
  registerComponent(
    catalogId: string,
    componentType: string,
    entry: CatalogEntry | A2UIComponentFn
  ): void {
    let catalog = this.catalogs.get(catalogId);

    if (!catalog) {
      // Auto-create catalog if it doesn't exist
      catalog = {
        id: catalogId,
        components: new Map(),
      };
      this.catalogs.set(catalogId, catalog);
    }

    const normalizedEntry: CatalogEntry =
      typeof entry === 'function' ? { component: entry } : entry;

    catalog.components.set(componentType, normalizedEntry);
  }

  /**
   * Get a component from a catalog (with inheritance)
   */
  getComponent(catalogId: string, componentType: string): A2UIComponentFn | undefined {
    const catalog = this.catalogs.get(catalogId);

    if (!catalog) {
      // Fall back to default catalog
      if (catalogId !== this.defaultCatalogId) {
        return this.getComponent(this.defaultCatalogId, componentType);
      }
      return undefined;
    }

    const entry = catalog.components.get(componentType);
    if (entry) {
      return entry.component;
    }

    // Check parent catalog
    if (catalog.parent) {
      return this.getComponent(catalog.parent, componentType);
    }

    // Fall back to default catalog if different
    if (catalogId !== this.defaultCatalogId) {
      return this.getComponent(this.defaultCatalogId, componentType);
    }

    return undefined;
  }

  /**
   * Check if a component exists in a catalog
   */
  hasComponent(catalogId: string, componentType: string): boolean {
    return this.getComponent(catalogId, componentType) !== undefined;
  }

  /**
   * Get all component types in a catalog
   */
  getComponentTypes(catalogId: string): string[] {
    const types = new Set<string>();
    const visited = new Set<string>();

    const collectTypes = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const catalog = this.catalogs.get(id);
      if (!catalog) return;

      for (const type of catalog.components.keys()) {
        types.add(type);
      }

      if (catalog.parent) {
        collectTypes(catalog.parent);
      }
    };

    collectTypes(catalogId);

    // Also include default catalog types
    if (!visited.has(this.defaultCatalogId)) {
      collectTypes(this.defaultCatalogId);
    }

    return Array.from(types).sort();
  }

  /**
   * Set the default catalog
   */
  setDefaultCatalog(catalogId: string): void {
    this.defaultCatalogId = catalogId;
  }

  /**
   * Get the default catalog ID
   */
  getDefaultCatalogId(): string {
    return this.defaultCatalogId;
  }

  /**
   * Get all registered catalog IDs
   */
  getCatalogIds(): string[] {
    return Array.from(this.catalogs.keys());
  }

  /**
   * Clear all catalogs (for testing)
   */
  clear(): void {
    this.catalogs.clear();
    this.defaultCatalogId = DEFAULT_CATALOG;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

const globalRegistry = new CatalogRegistry();

/**
 * Get the global catalog registry
 */
export function getCatalogRegistry(): CatalogRegistry {
  return globalRegistry;
}

/**
 * Register a component in the default catalog
 * This is the primary way components are registered
 */
export function registerComponent(
  componentType: string,
  component: A2UIComponentFn
): void {
  globalRegistry.registerComponent(DEFAULT_CATALOG, componentType, component);
}

/**
 * Register a component in a specific catalog
 */
export function registerCatalogComponent(
  catalogId: string,
  componentType: string,
  component: A2UIComponentFn
): void {
  globalRegistry.registerComponent(catalogId, componentType, component);
}

/**
 * Get a component from a catalog
 */
export function getComponentFromCatalog(
  catalogId: string,
  componentType: string
): A2UIComponentFn | undefined {
  return globalRegistry.getComponent(catalogId, componentType);
}

/**
 * Get a component from the default catalog
 */
export function getComponent(componentType: string): A2UIComponentFn | undefined {
  return globalRegistry.getComponent(DEFAULT_CATALOG, componentType);
}

// =============================================================================
// STANDARD CATALOG SETUP
// =============================================================================

// Initialize standard catalogs
globalRegistry.registerCatalog({
  id: STANDARD_CATALOG_V08,
  name: 'A2UI Standard Catalog',
  version: '0.8',
  components: new Map(),
});

globalRegistry.registerCatalog({
  id: STANDARD_CATALOG_V09,
  name: 'A2UI Standard Catalog',
  version: '0.9',
  components: new Map(),
  parent: STANDARD_CATALOG_V08, // v0.9 inherits from v0.8
});
