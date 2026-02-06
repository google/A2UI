
import { DataContext } from '../state/data-context.js';
import { ComponentContext } from '../rendering/component-context.js';
import { z } from 'zod';

/**
 * A definition of a UI component.
 * @template T The type of the rendered output (e.g. TemplateResult).
 */
export interface Component<T> {
  /** The name of the component as it appears in the A2UI JSON (e.g., 'Button'). */
  name: string;

  /**
   * The Zod schema describing the **custom properties** of this component.
   * This should NOT include 'component', 'id', 'weight', or 'accessibility' 
   * as those are handled by the framework/envelope.
   */
  readonly schema: z.ZodType<any>;

  /**
   * Renders the component given the context.
   */
  render(context: ComponentContext<T>): T;
}

export interface Catalog<T> {
  id: string;

  /** 
   * A map of available components. 
   * This is readonly to encourage immutable extension patterns.
   */
  readonly components: ReadonlyMap<string, Component<T>>;
}
