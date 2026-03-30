import type { ComponentApi } from '@a2ui/web_core/v0_9';
import type { ComponentType } from 'react';

/**
 * A component property bound to a reactive value with an update callback.
 */
export interface BoundProperty<T = any> {
  readonly value: T;
  readonly raw: any;
  readonly onUpdate: (newValue: T) => void;
}

/**
 * Props passed to every A2UI React component.
 */
export interface A2UIComponentProps {
  props: Record<string, BoundProperty>;
  surfaceId: string;
  componentId: string;
  dataContextPath: string;
  registry: ComponentRegistry;
}

/**
 * A registry mapping component type names to React components.
 */
export type ComponentRegistry = Map<string, ComponentType<A2UIComponentProps>>;
