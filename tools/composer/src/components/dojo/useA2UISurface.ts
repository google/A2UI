import { useMemo } from 'react';

export interface ComponentInstance {
  id: string;
  type?: string;
  props?: any;
  component?: any; // Older format support
}

export interface A2UISurfaceState {
  root: string;
  components: ComponentInstance[];
  data: Record<string, any>;
}

export function useA2UISurface(messages: any[]): A2UISurfaceState {
  return useMemo(() => {
    let root = "root";
    const componentsMap = new Map<string, ComponentInstance>();
    let data: Record<string, any> = {};

    for (const msg of messages) {
      if (!msg) continue;

      // Handle createSurface
      if (msg.createSurface) {
        // v0.9 requirement: root is "root"
        root = "root";
      }

      // Handle updateComponents
      if (msg.updateComponents) {
        const newComponents = msg.updateComponents.components || [];
        for (const comp of newComponents) {
          if (comp.id) {
            componentsMap.set(comp.id, comp);
          }
        }
      }

      // Handle updateDataModel
      if (msg.updateDataModel) {
        const updates = msg.updateDataModel.updates || [];
        for (const update of updates) {
          if (update.path === "/" || !update.path) {
            data = { ...data, ...update.value };
          } else {
            // Simple path handling: "foo/bar" -> data.foo.bar
            const parts = update.path.split('/').filter(Boolean);
            let current = data;
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];
              if (!current[part]) current[part] = {};
              current = current[part];
            }
            current[parts[parts.length - 1]] = update.value;
          }
        }
      }

      // Support for older "beginRendering" / "surfaceUpdate" if encountered
      if (msg.beginRendering) {
        root = msg.beginRendering.root || "root";
      }
      if (msg.surfaceUpdate) {
        const newComponents = msg.surfaceUpdate.components || [];
        for (const comp of newComponents) {
          if (comp.id) {
            componentsMap.set(comp.id, comp);
          }
        }
      }
    }

    return {
      root,
      components: Array.from(componentsMap.values()),
      data,
    };
  }, [messages]);
}
