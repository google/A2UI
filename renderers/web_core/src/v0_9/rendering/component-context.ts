
import { DataContext } from '../state/data-context.js';
import { SurfaceContext } from '../state/surface-context.js';
import { z } from 'zod';

export interface AccessibilityContext {
  /**
   * The resolved label for accessibility (e.g., aria-label).
   */
  readonly label: string | undefined;

  /**
   * The resolved description for accessibility (e.g., aria-description).
   */
  readonly description: string | undefined;
}

export class ComponentContext<T> {
  constructor(
    readonly id: string,
    readonly properties: Record<string, any>,
    readonly dataContext: DataContext,
    readonly surfaceContext: SurfaceContext,
    private readonly updateCallback: () => void
  ) { }

  /**
   * The accessibility attributes for this component, resolved from the 
   * 'accessibility' property in the A2UI message.
   */
  get accessibility(): AccessibilityContext {
    const accessProp = this.properties['accessibility'];
    if (!accessProp) return { label: undefined, description: undefined };

    return {
      label: this.resolve<string | undefined>(accessProp.label),
      description: this.resolve<string | undefined>(accessProp.description)
    };
  }

  /**
   * Validates the current component properties against the provided schema.
   * Logs warnings if validation fails (lazy validation).
   */
  validate(schema: z.ZodType<any>): boolean {
    const result = schema.safeParse(this.properties);
    if (!result.success) {
      console.warn(`Validation failed for ${this.id}:`, result.error);
      return false;
    }
    return true;
  }

  /**
   * Resolves a dynamic value (literal, path, or function call).
   * When the underlying data changes, it calls `this.updateCallback()`.
   */
  resolve<V>(value: any): V {
    // 1. Subscription Check
    if (value && typeof value === 'object') {
      if ('path' in value && typeof value.path === 'string') {
        const sub = this.dataContext.subscribe(value.path);
        sub.onChange = () => this.updateCallback();
        // Note: Subscription lifecycle management is implicit here (leaky).
        // In a real implementation, we should track subscriptions and dispose them on unmount.
        // For this prototype/refactor, we follow existing pattern but with new API.
      }
    }

    // 2. Delegation
    return this.dataContext.resolve<V>(value);
  }

  /**
   * Renders a child component by its ID.
   */
  renderChild(childId: string, customDataContext?: DataContext): T | null {
    const def = this.surfaceContext.getComponentDefinition(childId);
    if (!def) return null;

    const component = this.surfaceContext.catalog.components.get(def.type);
    if (!component) return null;

    const childCtx = new ComponentContext<T>(
      def.id,
      def.properties || {},
      customDataContext || this.dataContext,
      this.surfaceContext,
      this.updateCallback
    );

    return component.render(childCtx);
  }

  /**
   * Resolves a single child property (ID).
   */
  resolveChild(propertyName: string): T | null {
    const childId = this.properties[propertyName];
    if (typeof childId === 'string') {
      return this.renderChild(childId);
    }
    return null;
  }

  /**
   * Resolves a children property which can be an explicit list of IDs or a template.
   */
  resolveChildren(propertyName: string): T[] {
    const childrenProp = this.properties[propertyName];
    if (!childrenProp) return [];

    const renderedChildren: T[] = [];

    // Case 1: Explicit List
    if (childrenProp.explicitList) {
      const list = childrenProp.explicitList as string[];
      for (const childId of list) {
        const child = this.renderChild(childId);
        if (child) renderedChildren.push(child);
      }
      return renderedChildren;
    }

    // Case 2: Template
    if (childrenProp.template) {
      const { items, component } = childrenProp.template;

      // Resolve items array from DataModel
      // items should be a path binding e.g. { path: '/myItems' }
      let dataArray: any[] = [];
      if (items && items.path) {
        const sub = this.dataContext.subscribe(items.path);
        sub.onChange = () => this.updateCallback();
        const val = this.dataContext.getValue(items.path);
        if (Array.isArray(val)) {
          dataArray = val;
        }
      }

      // Render a component for each item
      if (component && component.type) {
        const compImpl = this.surfaceContext.catalog.components.get(component.type);
        if (compImpl) {
          dataArray.forEach((_, index) => {
            const itemPath = `${items.path}/${index}`;
            const nestedContext = new DataContext(this.surfaceContext.dataModel, itemPath);

            const childCtx = new ComponentContext<T>(
              `template-item-${index}`,
              component.properties || {},
              nestedContext,
              this.surfaceContext,
              this.updateCallback
            );

            renderedChildren.push(compImpl.render(childCtx));
          });
        }
      }
      return renderedChildren;
    }

    return [];
  }

  dispatchAction(action: any): Promise<void> {
    return this.surfaceContext.dispatchAction(action);
  }
}
