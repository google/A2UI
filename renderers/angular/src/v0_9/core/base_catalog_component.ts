import { ComponentApi } from "@a2ui/web_core/v0_9";
import { Directive, input } from "@angular/core";
import { ComponentApiToProps } from './types';

/**
 * Base class for A2UI catalog component in Angular.
 * 
 * All Angular catalog components should extend this base class,
 * which provides type safe access to props() and other common
 * fields.
 */
@Directive()
export abstract class BaseCatalogComponent<Api extends ComponentApi> {
  /**
   * Reactive properties resolved from the A2UI ComponentModel.
   */
  protected readonly props = input<ComponentApiToProps<Api>>({} as any);
  protected readonly surfaceId = input.required<string>();
  protected readonly componentId = input.required<string>();
  protected readonly dataContextPath = input<string>('/');
}