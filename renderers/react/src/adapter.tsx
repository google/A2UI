import React, { useRef, useSyncExternalStore, useCallback } from "react";
import { ComponentContext } from "@a2ui/web_core/v0_9";

export class ComponentBinding<T> {
  private dataListeners: (() => void)[] = [];
  private propsListeners: ((props: T) => void)[] = [];
  private currentProps: Partial<T> = {};
  private compUnsub?: () => void;
  private isConnected = false;

  private context: ComponentContext;
  private structuralKeys: string[];

  constructor(context: ComponentContext, structuralKeys: string[]) {
    this.context = context;
    this.structuralKeys = structuralKeys;
    // Resolve initial synchronous props so the first render has data
    this.resolveInitialProps();
  }

  private resolveInitialProps() {
    const props = this.context.componentModel.properties;
    const newProps: Partial<T> = {};
    for (const key of Object.keys(props)) {
      if (key === 'component' || key === 'id') continue;
      if (this.structuralKeys.includes(key)) {
         newProps[key as keyof T] = props[key];
      } else {
         newProps[key as keyof T] = this.context.dataContext.resolveDynamicValue(props[key]) as any;
      }
    }
    this.currentProps = newProps;
  }

  private connect() {
    if (this.isConnected) return;
    this.isConnected = true;
    const sub = this.context.componentModel.onUpdated.subscribe(() => {
       this.bindDataListeners();
    });
    this.compUnsub = () => sub.unsubscribe();
    this.bindDataListeners();
  }

  private bindDataListeners() {
    this.dataListeners.forEach(l => l());
    this.dataListeners = [];
    
    const props = this.context.componentModel.properties;
    const newProps: Partial<T> = {};
    
    for (const key of Object.keys(props)) {
      if (key === 'component' || key === 'id') continue;
      
      if (this.structuralKeys.includes(key)) {
         newProps[key as keyof T] = props[key];
      } else {
         const bound = this.context.dataContext.subscribeDynamicValue(props[key], (val: any) => {
            this.currentProps = { ...this.currentProps, [key]: val };
            this.notify();
         });
         newProps[key as keyof T] = bound.value as any;
         this.dataListeners.push(() => bound.unsubscribe());
      }
    }
    
    this.currentProps = newProps;
    this.notify();
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

export function createGenericBinding<T>(context: ComponentContext, structuralKeys: string[] = ['child', 'children']): ComponentBinding<T> {
  return new ComponentBinding<T>(context, structuralKeys);
}

export type ReactA2uiComponentProps<T> = {
  props: T;
  buildChild: (id: string, basePath?: string) => React.ReactNode;
  context: ComponentContext;
};

export function createReactComponent<T>(
  binderFactory: (ctx: ComponentContext) => ComponentBinding<T>,
  RenderComponent: React.FC<ReactA2uiComponentProps<T>>
) {
  return function ReactWrapper({ context, buildChild }: { context: ComponentContext, buildChild: (id: string, basePath?: string) => React.ReactNode }) {
    const bindingRef = useRef<ComponentBinding<T>>(null);

    if (!bindingRef.current) {
      bindingRef.current = binderFactory(context);
    }
    const binding = bindingRef.current;

    const subscribe = useCallback((callback: () => void) => {
      const bound = binding.addPropsListener(callback);
      return () => bound.removeListener();
    }, [binding]);

    const getSnapshot = useCallback(() => binding.snapshot, [binding]);

    const props = useSyncExternalStore(subscribe, getSnapshot);

    return <RenderComponent props={props || ({} as T)} buildChild={buildChild} context={context} />;
  };
}
