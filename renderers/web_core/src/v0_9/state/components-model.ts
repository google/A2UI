import { ComponentModel } from './component-model.js';

export interface ComponentsLifecycleListener {
  onComponentCreated: (component: ComponentModel) => void;
  onComponentDeleted?: (componentId: string) => void;
}

export class ComponentsModel {
  private components: Map<string, ComponentModel> = new Map();
  private listeners: Set<ComponentsLifecycleListener> = new Set();

  constructor() {}

  get(id: string): ComponentModel | undefined {
    return this.components.get(id);
  }

  createComponent(id: string, type: string, properties: Record<string, any>): ComponentModel {
    if (this.components.has(id)) {
      throw new Error(`Component with id '${id}' already exists.`);
    }

    const newComponent = new ComponentModel(id, type, properties);
    this.components.set(id, newComponent);
    this.notifyCreated(newComponent);
    return newComponent;
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
