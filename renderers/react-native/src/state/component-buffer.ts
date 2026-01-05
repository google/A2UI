/**
 * Component Buffer
 *
 * Stores and manages A2UI component definitions.
 * Provides efficient lookup and traversal of the component tree.
 */

import type { A2UIComponent } from '../types/a2ui-types';

export interface ComponentBuffer {
  /** Add or update a component */
  set: (component: A2UIComponent) => void;

  /** Get a component by ID */
  get: (id: string) => A2UIComponent | undefined;

  /** Check if a component exists */
  has: (id: string) => boolean;

  /** Remove a component */
  remove: (id: string) => boolean;

  /** Get all component IDs */
  getIds: () => string[];

  /** Get all components */
  getAll: () => A2UIComponent[];

  /** Clear all components */
  clear: () => void;

  /** Get component count */
  size: () => number;

  /** Get children of a component */
  getChildren: (id: string) => A2UIComponent[];

  /** Convert to Map */
  toMap: () => Map<string, A2UIComponent>;
}

/**
 * Creates a component buffer for managing A2UI components
 *
 * @example
 * ```typescript
 * const buffer = createComponentBuffer();
 * buffer.set({ id: 'btn1', type: 'Button', label: 'Click' });
 * const btn = buffer.get('btn1');
 * ```
 */
export function createComponentBuffer(): ComponentBuffer {
  const components = new Map<string, A2UIComponent>();

  function set(component: A2UIComponent): void {
    components.set(component.id, component);
  }

  function get(id: string): A2UIComponent | undefined {
    return components.get(id);
  }

  function has(id: string): boolean {
    return components.has(id);
  }

  function remove(id: string): boolean {
    return components.delete(id);
  }

  function getIds(): string[] {
    return Array.from(components.keys());
  }

  function getAll(): A2UIComponent[] {
    return Array.from(components.values());
  }

  function clear(): void {
    components.clear();
  }

  function size(): number {
    return components.size;
  }

  function getChildren(id: string): A2UIComponent[] {
    const parent = components.get(id);

    if (!parent || !parent.children) {
      return [];
    }

    return parent.children
      .map(childId => components.get(childId))
      .filter((c): c is A2UIComponent => c !== undefined);
  }

  function toMap(): Map<string, A2UIComponent> {
    return new Map(components);
  }

  return {
    set,
    get,
    has,
    remove,
    getIds,
    getAll,
    clear,
    size,
    getChildren,
    toMap,
  };
}

/**
 * Traverse the component tree depth-first
 *
 * @example
 * ```typescript
 * traverseComponents(buffer, 'root', (component, depth) => {
 *   console.log('  '.repeat(depth) + component.type);
 * });
 * ```
 */
export function traverseComponents(
  buffer: ComponentBuffer,
  rootId: string,
  visitor: (component: A2UIComponent, depth: number) => void | false
): void {
  function traverse(id: string, depth: number): boolean {
    const component = buffer.get(id);

    if (!component) {
      return true; // Continue traversal
    }

    const result = visitor(component, depth);

    if (result === false) {
      return false; // Stop traversal
    }

    if (component.children) {
      for (const childId of component.children) {
        const shouldContinue = traverse(childId, depth + 1);
        if (!shouldContinue) {
          return false;
        }
      }
    }

    return true;
  }

  traverse(rootId, 0);
}

/**
 * Find all components of a specific type
 */
export function findComponentsByType(
  buffer: ComponentBuffer,
  type: string
): A2UIComponent[] {
  return buffer.getAll().filter(c => c.type === type);
}

/**
 * Find a component by predicate
 */
export function findComponent(
  buffer: ComponentBuffer,
  predicate: (component: A2UIComponent) => boolean
): A2UIComponent | undefined {
  return buffer.getAll().find(predicate);
}

/**
 * Get the component tree as a nested structure (for debugging)
 */
export function getComponentTree(
  buffer: ComponentBuffer,
  rootId: string
): Record<string, unknown> | null {
  const root = buffer.get(rootId);

  if (!root) {
    return null;
  }

  const result: Record<string, unknown> = {
    id: root.id,
    type: root.type,
  };

  if (root.children && root.children.length > 0) {
    result.children = root.children
      .map(childId => getComponentTree(buffer, childId))
      .filter(c => c !== null);
  }

  return result;
}
