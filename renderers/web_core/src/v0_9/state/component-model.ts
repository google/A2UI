export interface ComponentUpdateListener {
  onComponentUpdated(component: ComponentModel): void;
}

export interface AccessibilityProperties {
  label?: any;
  description?: any;
  [key: string]: any;
}

export class ComponentModel {
  private _properties: Record<string, any>;
  private listeners: Set<ComponentUpdateListener> = new Set();

  constructor(
    readonly id: string,
    readonly type: string,
    initialProperties: Record<string, any>
  ) {
    this._properties = initialProperties;
  }

  get properties(): Record<string, any> {
    return this._properties;
  }

  get accessibility(): AccessibilityProperties | undefined {
    return this._properties['accessibility'];
  }

  update(newProperties: Record<string, any>): void {
    this._properties = newProperties;
    this.notifyListeners();
  }

  addUpdateListener(listener: ComponentUpdateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  removeUpdateListener(listener: ComponentUpdateListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener.onComponentUpdated(this);
      } catch (e) {
        console.error(`Error in ComponentUpdateListener for ${this.id}:`, e);
      }
    }
  }
}
