
import { DataContext } from '../state/data-context.js';
import { SurfaceContext } from '../state/surface-context.js';

export class ComponentContext<T> {
  constructor(
    readonly id: string,
    readonly properties: Record<string, any>,
    readonly dataContext: DataContext,
    readonly surfaceContext: SurfaceContext,
    private readonly updateCallback: () => void
  ) { }

  /**
   * Resolves a dynamic value (literal, path, or function call).
   * When the underlying data changes, it calls `this.updateCallback()`.
   */
  resolve<V>(value: any): V {
    // 1. Literal Check: If it's a primitive or null, return it directly.
    if (typeof value !== 'object' || value === null) {
      return value as V;
    }

    // 2. Path Check: If it's a data binding { path: "..." }
    if ('path' in value && typeof value.path === 'string') {
      // Subscribe to changes. When data changes, trigger a re-render.
      this.dataContext.subscribe(value.path, () => this.updateCallback());
      return this.dataContext.getValue(value.path);
    }

    // 3. Function Call: If it's { call: "...", args: ... }
    // TODO: Implement function calls
    if ('call' in value) {
      // Placeholder
    }

    // Fallback: return as is (maybe it's a nested object that's just a literal structure)
    return value as V;
  }

  /**
   * Renders a child component by its ID.
   */
  renderChild(childId: string, customDataContext?: DataContext): T | null {
    const def = this.surfaceContext.getComponentDefinition(childId);
    if (!def) return null;

    const component = this.surfaceContext.catalog.getComponent(def.type);
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
        this.dataContext.subscribe(items.path, () => this.updateCallback());
        const val = this.dataContext.getValue(items.path);
        if (Array.isArray(val)) {
          dataArray = val;
        }
      }

      // Render a component for each item
      if (component && component.type) {
        const compImpl = this.surfaceContext.catalog.getComponent(component.type);
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
