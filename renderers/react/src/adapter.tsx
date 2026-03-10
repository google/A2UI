import React, { useRef, useSyncExternalStore, useEffect, useState } from "react";
import { ComponentContext } from "@a2ui/web_core/v0_9";

export class ComponentBinding<T> {
  private listeners: (() => void)[] = [];
  private propsListeners: ((props: T) => void)[] = [];
  private currentProps: Partial<T> = {};
  private compUnsub?: () => void;
  private isDisposed = false;

  constructor(private context: ComponentContext, private structuralKeys: string[]) {
    this.bindProps();
    this.compUnsub = this.context.componentModel.addUpdatedListener(() => {
       if (!this.isDisposed) {
          this.bindProps();
       }
    });
  }

  private bindProps() {
    // Clean up old listeners
    this.listeners.forEach(l => l());
    this.listeners = [];
    
    const props = this.context.componentModel.properties;
    const newProps: Partial<T> = {};
    
    for (const key of Object.keys(props)) {
      if (key === 'component' || key === 'id') continue;
      
      if (this.structuralKeys.includes(key)) {
         newProps[key as keyof T] = props[key];
      } else {
         const bound = this.context.dataContext.addDynamicValueListener(props[key], (val: any) => {
            if (!this.isDisposed) {
               this.currentProps = { ...this.currentProps, [key]: val };
               this.notify();
            }
         });
         newProps[key as keyof T] = bound.value as any;
         this.listeners.push(() => bound.removeListener());
      }
    }
    
    this.currentProps = newProps;
    this.notify();
  }

  private notify() {
    if (this.isDisposed) return;
    this.propsListeners.forEach((l: (props: T) => void) => l(this.currentProps as T));
  }

  addPropsListener(listener: (props: T) => void) {
    this.propsListeners.push(listener);
    return {
       value: this.currentProps as T,
       removeListener: () => {
         this.propsListeners = this.propsListeners.filter((l: (props: T) => void) => l !== listener);
       }
    };
  }

  get snapshot() {
    return this.currentProps as T;
  }

  dispose() {
    this.isDisposed = true;
    this.listeners.forEach(l => l());
    this.listeners = [];
    this.propsListeners = [];
    if (this.compUnsub) {
      this.compUnsub();
      this.compUnsub = undefined;
    }
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

    // If remounting in strict mode after an unmount, the old binding is disposed.
    // We must recreate it synchronously during render.
    if (!bindingRef.current || (bindingRef.current as any).isDisposed) {
      bindingRef.current = binderFactory(context);
    }
    const binding = bindingRef.current;

    const props = useSyncExternalStore(
      (callback) => {
        const bound = binding.addPropsListener(callback);
        return () => bound.removeListener();
      },
      () => binding.snapshot
    );

    useEffect(() => {
      return () => {
        binding.dispose();
      };
    }, [binding]);

    return <RenderComponent props={props || ({} as T)} buildChild={buildChild} context={context} />;
  };
}
