import { z } from 'zod';

/**
 * A definition of a UI component's API.
 * This interface defines the contract for a component's capabilities and properties,
 * independent of any specific rendering implementation.
 */
export interface ComponentApi {
  /** The name of the component as it appears in the A2UI JSON (e.g., 'Button'). */
  name: string;

  /**
   * The Zod schema describing the **properties** of this component.
   * 
   * - MUST include catalog-specific common properties (e.g. 'weight', 'accessibility').
   * - MUST NOT include 'component' or 'id' as those are handled by the framework/envelope.
   */
  readonly schema: z.ZodType<any>;
}

export class Catalog<T extends ComponentApi> {
  readonly id: string;

  /** 
   * A map of available components. 
   * This is readonly to encourage immutable extension patterns.
   */
  readonly components: ReadonlyMap<string, T>;

  constructor(id: string, components: T[]) {
    this.id = id;
    const map = new Map<string, T>();
    for (const comp of components) {
      map.set(comp.name, comp);
    }
    this.components = map;
  }
}
