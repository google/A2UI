import { useMemo } from 'react';
import { transpileToV0_8 } from '@/lib/transcoder';

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
      const v0_8msg = transpileToV0_8(msg);

      // Handle beginRendering
      if (v0_8msg.beginRendering) {
        root = v0_8msg.beginRendering.root || "root";
      }

      // Handle surfaceUpdate
      if (v0_8msg.surfaceUpdate) {
        const newComponents = v0_8msg.surfaceUpdate.components || [];
        for (const comp of newComponents) {
          if (comp.id) {
            componentsMap.set(comp.id, comp);
          }
        }
      }

      // Handle dataModelUpdate
      if (v0_8msg.dataModelUpdate) {
        const updates = v0_8msg.dataModelUpdate.contents || [];
        for (const update of updates) {
          const path = v0_8msg.dataModelUpdate.path || "/";
          if (path === "/" || !path) {
            data = { ...data, ...update };
          } else {
            // Simple path handling: "foo/bar" -> data.foo.bar
            const parts = path.split('/').filter(Boolean);
            let current = data;
            for (let i = 0; i < parts.length - 1; i++) {
              const part = parts[i];
              if (!current[part]) current[part] = {};
              current = current[part];
            }
            current[parts[parts.length - 1]] = update;
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
