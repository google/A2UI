import { ComponentModel } from './component-model.js';

export interface ComponentsLifecycleListener {
  onComponentCreated: (component: ComponentModel) => void;
  onComponentDeleted?: (componentId: string) => void;
}

export class SurfaceComponentsModel {
  private components: Map<string, ComponentModel> = new Map();
  private listeners: Set<ComponentsLifecycleListener> = new Set();

  constructor() {}

  get(id: string): ComponentModel | undefined {
    return this.components.get(id);
  }

  addComponent(component: ComponentModel): void {
    if (this.components.has(component.id)) {
      throw new Error(`Component with id '${component.id}' already exists.`);
    }

    this.components.set(component.id, component);
    this.notifyCreated(component);
  }

  addLifecycleListener(listener: ComponentsLifecycleListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  removeLifecycleListener(listener: ComponentsLifecycleListener): void {
    this.listeners.delete(listener);
  }

  private notifyCreated(component: ComponentModel): void {
    for (const listener of this.listeners) {
      try {
        listener.onComponentCreated(component);
      } catch (e) {
        console.error('Error in ComponentsLifecycleListener.onComponentCreated:', e);
      }
    }
  }
}
