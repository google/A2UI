import React, { useRef, useSyncExternalStore, useCallback } from "react";
import { z } from "zod";
import { ComponentContext } from "@a2ui/web_core/v0_9";
import type { ComponentApi, DataBinding, FunctionCall, Action, ChildList } from "@a2ui/web_core/v0_9";

export type ResolveA2uiProp<T> =
  [NonNullable<T>] extends [Action] ? (() => void) | Extract<T, undefined> :
  [NonNullable<T>] extends [ChildList] ? any | Extract<T, undefined> :
  Exclude<T, DataBinding | FunctionCall> extends never ? any : Exclude<T, DataBinding | FunctionCall>;

export type ResolveA2uiProps<T> = T extends object ? {
  [K in keyof T]: ResolveA2uiProp<T[K]>
} : T;

export interface ReactComponentImplementation extends ComponentApi {
  /** The framework-specific rendering wrapper. */
  render: React.FC<{
    context: ComponentContext;
    buildChild: (id: string, basePath?: string) => React.ReactNode;
  }>;
}

export type ReactA2uiComponentProps<T> = {
  props: T;
  buildChild: (id: string, basePath?: string) => React.ReactNode;
  context: ComponentContext;
};

// --- Schema Scraping ---

export type BehaviorNode =
  | { type: 'DYNAMIC' }
  | { type: 'ACTION' }
  | { type: 'STRUCTURAL' }
  | { type: 'STATIC' }
  | { type: 'OBJECT'; shape: Record<string, BehaviorNode> }
  | { type: 'ARRAY'; element: BehaviorNode };

function getFieldBehavior(type: z.ZodTypeAny): BehaviorNode {
  let current = type;
  
  // Unwrap optionals/nullables/defaults
  while (
    current._def.typeName === "ZodOptional" ||
    current._def.typeName === "ZodNullable" ||
    current._def.typeName === "ZodDefault"
  ) {
    current = current._def.innerType;
  }

  // Structural matching for A2UI primitives using typeName to avoid dual-module instanceof issues
  if (current._def.typeName === "ZodUnion") {
    const options = current._def.options as z.ZodTypeAny[];
    
    // ActionSchema is a union containing { event: ... }
    const isAction = options.some(o => o._def.typeName === "ZodObject" && o._def.shape().event);
    if (isAction) return { type: 'ACTION' };

    // Dynamic strings/values are unions containing DataBindingSchema { path: ... } but NOT { componentId: ... }
    const isDynamic = options.some(o => o._def.typeName === "ZodObject" && o._def.shape().path && !o._def.shape().componentId);
    if (isDynamic) return { type: 'DYNAMIC' };
    
    // ChildList is a union containing an array and an object with { componentId, path }
    const isChildList = options.some(o => o._def.typeName === "ZodObject" && o._def.shape().componentId && o._def.shape().path);
    if (isChildList) return { type: 'STRUCTURAL' };
  } else if (current._def.typeName === "ZodString") {
    // ComponentId falls back to STATIC since we can't perfectly identify it, which is fine because STATIC returns strings as-is.
  }

  // Recursive array scraping
  if (current._def.typeName === "ZodArray") {
    return {
      type: 'ARRAY',
      element: getFieldBehavior(current._def.type)
    };
  }

  // Recursive object scraping
  if (current._def.typeName === "ZodObject") {
    const shape: Record<string, BehaviorNode> = {};
    const objShape = current._def.shape();
    for (const [key, value] of Object.entries(objShape)) {
      shape[key] = getFieldBehavior(value as z.ZodTypeAny);
    }
    return { type: 'OBJECT', shape };
  }

  // Fallback
  return { type: 'STATIC' };
}

export function scrapeSchemaBehavior(schema: z.ZodTypeAny): BehaviorNode {
  return getFieldBehavior(schema);
}

// --- Generic Binder ---

export class ComponentBinding<T> {
  private dataListeners: (() => void)[] = [];
  private propsListeners: ((props: T) => void)[] = [];
  public currentProps: Partial<T> = {};
  private compUnsub?: () => void;
  private isConnected = false;

  private context: ComponentContext;
  private behaviorTree: BehaviorNode;

  constructor(context: ComponentContext, schema: z.ZodTypeAny) {
    this.context = context;
    this.behaviorTree = scrapeSchemaBehavior(schema);

    if (this.behaviorTree.type !== 'OBJECT') {
      // Components might not have schemas (e.g. if poorly defined), fallback to empty object shape
      this.behaviorTree = { type: 'OBJECT', shape: {} };
    }

    this.resolveInitialProps();
  }

  private resolveInitialProps() {
    const props = this.context.componentModel.properties;
    // We pass isSync=true to avoid saving listeners before we are connected
    this.currentProps = this.resolveAndBind(props, this.behaviorTree, [], true) as Partial<T>;
  }

  private connect() {
    if (this.isConnected) return;
    this.isConnected = true;
    const sub = this.context.componentModel.onUpdated.subscribe(() => {
      this.rebuildAllBindings();
    });
    this.compUnsub = () => sub.unsubscribe();
    this.rebuildAllBindings();
  }

  private rebuildAllBindings() {
    this.dataListeners.forEach(l => l());
    this.dataListeners = [];

    const props = this.context.componentModel.properties;
    this.currentProps = this.resolveAndBind(props, this.behaviorTree, [], false) as Partial<T>;

    this.notify();
  }

  private resolveAndBind(value: any, behavior: BehaviorNode, path: string[], isSync: boolean): any {
    if (value === undefined || value === null) return value;

    switch (behavior.type) {
      case 'DYNAMIC': {
        const bound = this.context.dataContext.subscribeDynamicValue(value, (newVal) => {
          this.updateDeepValue(path, newVal);
          this.notify();
        });

        if (!isSync) {
          this.dataListeners.push(() => bound.unsubscribe());
        } else {
          // If called during init, unsubscribe immediately so we don't leak before mount.
          bound.unsubscribe();
        }
        return bound.value;
      }

      case 'ACTION': {
        return () => {
          const resolveDeepSync = (val: any): any => {
            if (typeof val !== 'object' || val === null) return val;
            if ('path' in val || 'call' in val) return this.context.dataContext.resolveDynamicValue(val);
            if (Array.isArray(val)) return val.map(resolveDeepSync);
            const res: any = {};
            for (const [k, v] of Object.entries(val)) res[k] = resolveDeepSync(v);
            return res;
          };
          this.context.dispatchAction(resolveDeepSync(value));
        };
      }

      case 'STRUCTURAL':
      case 'STATIC':
        return value;

      case 'ARRAY': {
        if (!Array.isArray(value)) return value;
        return value.map((item, index) =>
          this.resolveAndBind(item, behavior.element, [...path, index.toString()], isSync)
        );
      }

      case 'OBJECT': {
        if (typeof value !== 'object') return value;
        const result: any = {};
        for (const [k, v] of Object.entries(value)) {
          const childBehavior = behavior.shape[k] || { type: 'STATIC' };
          result[k] = this.resolveAndBind(v, childBehavior, [...path, k], isSync);
        }
        return result;
      }
    }
  }

  private updateDeepValue(path: string[], newValue: any) {
    this.currentProps = this.cloneAndUpdate(this.currentProps, path, newValue);
  }

  private cloneAndUpdate(obj: any, path: string[], newValue: any): any {
    if (path.length === 0) return newValue;
    const [key, ...rest] = path;

    if (Array.isArray(obj)) {
      const newArr = [...obj];
      newArr[Number(key)] = this.cloneAndUpdate(newArr[Number(key)], rest, newValue);
      return newArr;
    } else {
      return {
        ...(obj || {}),
        [key]: this.cloneAndUpdate((obj || {})[key], rest, newValue)
      };
    }
  }

  private disconnect() {
    if (!this.isConnected) return;
    this.isConnected = false;
    this.dataListeners.forEach(l => l());
    this.dataListeners = [];
    if (this.compUnsub) {
      this.compUnsub();
      this.compUnsub = undefined;
    }
  }

  private notify() {
    this.propsListeners.forEach(l => l(this.currentProps as T));
  }

  addPropsListener(listener: (props: T) => void) {
    if (this.propsListeners.length === 0) {
      this.connect();
    }
    this.propsListeners.push(listener);

    return {
      value: this.currentProps as T,
      removeListener: () => {
        this.propsListeners = this.propsListeners.filter(l => l !== listener);
        if (this.propsListeners.length === 0) {
          this.disconnect();
        }
      }
    };
  }

  get snapshot() {
    return this.currentProps as T;
  }
}

// --- Component Factories ---

/**
 * Creates a React component implementation using the deep generic binder.
 */
export function createReactComponent<Schema extends z.ZodTypeAny>(
  api: { name: string; schema: Schema },
  RenderComponent: React.FC<ReactA2uiComponentProps<ResolveA2uiProps<z.infer<Schema>>>>
): ReactComponentImplementation {
  type Props = ResolveA2uiProps<z.infer<Schema>>;
  
  const ReactWrapper: React.FC<{ context: ComponentContext, buildChild: any }> = ({ context, buildChild }) => {
    const bindingRef = useRef<ComponentBinding<Props>>(null);

    if (!bindingRef.current) {
      bindingRef.current = new ComponentBinding<Props>(context, api.schema);
    }
    const binding = bindingRef.current;

    const subscribe = useCallback((callback: () => void) => {
      const bound = binding.addPropsListener(callback);
      return () => bound.removeListener();
    }, [binding]);

    const getSnapshot = useCallback(() => binding.snapshot, [binding]);
    const props = useSyncExternalStore(subscribe, getSnapshot);

    return <RenderComponent props={props || ({} as Props)} buildChild={buildChild} context={context} />;
  };

  return {
    name: api.name,
    schema: api.schema,
    render: ReactWrapper
  };
}

/**
 * Creates a React component implementation that manages its own context bindings (no generic binder).
 */
export function createBinderlessComponent(
  api: ComponentApi,
  RenderComponent: React.FC<{
    context: ComponentContext;
    buildChild: (id: string, basePath?: string) => React.ReactNode;
  }>
): ReactComponentImplementation {
  return {
    name: api.name,
    schema: api.schema,
    render: RenderComponent
  };
}
