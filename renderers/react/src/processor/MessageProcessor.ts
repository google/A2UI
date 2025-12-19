/**
 * A2UI MessageProcessor
 * Central state machine that processes incoming A2UI protocol messages
 */

import type {
  A2UIServerMessage,
  SurfaceState,
  SurfaceUpdateMessage,
  DataModelUpdateMessage,
  ComponentDefinition,
  StoredComponent,
  DataEntry,
} from './types';
import {
  isBeginRendering,
  isSurfaceUpdate,
  isDataModelUpdate,
  isDeleteSurface,
} from './types';

const DEFAULT_CATALOG_ID = 'https://a2ui.org/catalog/standard/v0.8';

type Subscriber = (surfaceId: string) => void;

/**
 * MessageProcessor manages all surface state and processes incoming messages
 */
export class MessageProcessor {
  private surfaces: Map<string, SurfaceState> = new Map();
  private subscribers: Set<Subscriber> = new Set();
  private version = 0;

  /**
   * Process an incoming server message
   */
  processMessage(msg: A2UIServerMessage): void {
    if (isBeginRendering(msg)) {
      this.handleBeginRendering(msg);
    } else if (isSurfaceUpdate(msg)) {
      this.handleSurfaceUpdate(msg);
    } else if (isDataModelUpdate(msg)) {
      this.handleDataModelUpdate(msg);
    } else if (isDeleteSurface(msg)) {
      this.handleDeleteSurface(msg);
    } else {
      console.warn('[A2UI] Unknown message type:', (msg as { type: string }).type);
    }
  }

  /**
   * Get the state of a surface
   */
  getSurface(surfaceId: string): SurfaceState | undefined {
    return this.surfaces.get(surfaceId);
  }

  /**
   * Get all surface IDs
   */
  getSurfaceIds(): string[] {
    return Array.from(this.surfaces.keys());
  }

  /**
   * Get the current version (for React useSyncExternalStore)
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(handler: Subscriber): () => void {
    this.subscribers.add(handler);
    return () => {
      this.subscribers.delete(handler);
    };
  }

  /**
   * Clear all surfaces (for testing/reset)
   */
  clear(): void {
    this.surfaces.clear();
    this.version++;
    this.notifySubscribers('*');
  }

  // ===========================================================================
  // MESSAGE HANDLERS
  // ===========================================================================

  private handleBeginRendering(msg: A2UIServerMessage & { type: 'beginRendering' }): void {
    const existing = this.surfaces.get(msg.surfaceId);

    // Create or update surface state
    const surface: SurfaceState = {
      surfaceId: msg.surfaceId,
      status: 'ready',
      rootId: msg.root,
      catalogId: msg.catalogId || DEFAULT_CATALOG_ID,
      styles: msg.styles || {},
      components: existing?.components || new Map(),
      dataModel: existing?.dataModel || new Map(),
      buffer: { surfaceUpdates: [], dataModelUpdates: [] },
    };

    // Flush any buffered messages
    if (existing?.buffer) {
      for (const update of existing.buffer.surfaceUpdates) {
        this.applyComponentUpdates(surface, update.components);
      }
      for (const update of existing.buffer.dataModelUpdates) {
        this.applyDataModelUpdate(surface, update);
      }
    }

    this.surfaces.set(msg.surfaceId, surface);
    this.version++;
    this.notifySubscribers(msg.surfaceId);
  }

  private handleSurfaceUpdate(msg: SurfaceUpdateMessage): void {
    let surface = this.surfaces.get(msg.surfaceId);

    if (!surface) {
      // Create buffering surface
      surface = this.createBufferingSurface(msg.surfaceId);
      this.surfaces.set(msg.surfaceId, surface);
    }

    if (surface.status === 'buffering') {
      // Buffer until beginRendering
      surface.buffer.surfaceUpdates.push(msg);
    } else {
      // Apply immediately
      this.applyComponentUpdates(surface, msg.components);
      this.version++;
      this.notifySubscribers(msg.surfaceId);
    }
  }

  private handleDataModelUpdate(msg: DataModelUpdateMessage): void {
    let surface = this.surfaces.get(msg.surfaceId);

    if (!surface) {
      // Create buffering surface
      surface = this.createBufferingSurface(msg.surfaceId);
      this.surfaces.set(msg.surfaceId, surface);
    }

    if (surface.status === 'buffering') {
      // Buffer until beginRendering
      surface.buffer.dataModelUpdates.push(msg);
    } else {
      // Apply immediately
      this.applyDataModelUpdate(surface, msg);
      this.version++;
      this.notifySubscribers(msg.surfaceId);
    }
  }

  private handleDeleteSurface(msg: A2UIServerMessage & { type: 'deleteSurface' }): void {
    const surface = this.surfaces.get(msg.surfaceId);
    if (surface) {
      surface.status = 'deleted';
      this.version++;
      this.notifySubscribers(msg.surfaceId);

      // Clean up after a short delay to allow React to unmount
      setTimeout(() => {
        this.surfaces.delete(msg.surfaceId);
        this.version++;
        this.notifySubscribers(msg.surfaceId);
      }, 100);
    }
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private createBufferingSurface(surfaceId: string): SurfaceState {
    return {
      surfaceId,
      status: 'buffering',
      rootId: null,
      catalogId: DEFAULT_CATALOG_ID,
      styles: {},
      components: new Map(),
      dataModel: new Map(),
      buffer: { surfaceUpdates: [], dataModelUpdates: [] },
    };
  }

  private applyComponentUpdates(
    surface: SurfaceState,
    components: ComponentDefinition[]
  ): void {
    for (const def of components) {
      const stored = this.parseComponentDefinition(def);
      if (stored) {
        surface.components.set(def.id, stored);
      }
    }
  }

  private parseComponentDefinition(def: ComponentDefinition): StoredComponent | null {
    // Component format: { id: "x", component: { "Text": { text: "..." } } }
    const componentWrapper = def.component;
    const types = Object.keys(componentWrapper);

    if (types.length !== 1) {
      console.warn('[A2UI] Invalid component definition:', def);
      return null;
    }

    const type = types[0];
    const props = componentWrapper[type] as Record<string, unknown>;

    return {
      id: def.id,
      type,
      props,
    };
  }

  private applyDataModelUpdate(
    surface: SurfaceState,
    msg: DataModelUpdateMessage
  ): void {
    const basePath = msg.path || '';

    for (const entry of msg.contents) {
      const fullPath = basePath ? `${basePath}/${entry.key}` : entry.key;
      const value = this.extractDataEntryValue(entry);
      surface.dataModel.set(fullPath, value);
    }
  }

  private extractDataEntryValue(entry: DataEntry): unknown {
    if (entry.valueString !== undefined) return entry.valueString;
    if (entry.valueNumber !== undefined) return entry.valueNumber;
    if (entry.valueBoolean !== undefined) return entry.valueBoolean;
    if (entry.valueMap !== undefined) {
      // Recursively build nested object
      const obj: Record<string, unknown> = {};
      for (const nested of entry.valueMap) {
        obj[nested.key] = this.extractDataEntryValue(nested);
      }
      return obj;
    }
    return null;
  }

  private notifySubscribers(surfaceId: string): void {
    for (const handler of this.subscribers) {
      try {
        handler(surfaceId);
      } catch (error) {
        console.error('[A2UI] Subscriber error:', error);
      }
    }
  }
}

/**
 * Create a singleton MessageProcessor instance
 */
let defaultProcessor: MessageProcessor | null = null;

export function getDefaultProcessor(): MessageProcessor {
  if (!defaultProcessor) {
    defaultProcessor = new MessageProcessor();
  }
  return defaultProcessor;
}

export function resetDefaultProcessor(): void {
  defaultProcessor?.clear();
  defaultProcessor = null;
}
