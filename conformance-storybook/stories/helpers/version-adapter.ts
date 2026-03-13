/**
 * Version adapter: translates between A2UI spec formats.
 * Fixtures are stored in v0.10 (canonical) format.
 * The Lit renderer expects v0.8 format.
 */

export interface V010Message {
  createSurface?: { surfaceId: string; catalogId?: string };
  updateComponents?: { surfaceId: string; components: any[] };
  updateDataModel?: { surfaceId: string; path: string; value: any };
  deleteSurface?: { surfaceId: string };
}

export interface V08Message {
  version: string;
  beginRendering?: { surfaceId: string; root: string };
  surfaceUpdate?: { surfaceId: string; components: any[] };
  createSurface?: { surfaceId: string };
  updateComponents?: { surfaceId: string; components: any[] };
  dataModelUpdate?: { surfaceId: string; path: string; value: any };
  deleteSurface?: { surfaceId: string };
}

/**
 * Find the root component ID from a components array.
 * The root is the first component whose ID is not referenced as a child/children by any other component.
 * Fallback: first component with id "root", or just the first component.
 */
function findRootId(components: any[]): string {
  // Quick check for explicit "root" id
  if (components.some(c => c.id === "root")) return "root";

  // Build set of all child references
  const childIds = new Set<string>();
  for (const c of components) {
    if (c.child) childIds.add(c.child);
    if (c.children) for (const ch of c.children) childIds.add(ch);
  }

  // Root = first component not referenced as a child
  for (const c of components) {
    if (!childIds.has(c.id)) return c.id;
  }

  return components[0]?.id || "root";
}

/**
 * Translate v0.10 flat component format to v0.8 nested format.
 * 
 * v0.10: { id: "btn", component: "Button", child: "txt", variant: "primary", action: {...} }
 * v0.8:  { id: "btn", component: { Button: { child: "txt", variant: "primary", action: {...} } } }
 * 
 * Also renames ChoicePicker → MultipleChoice.
 */
function translateComponents(components: any[]): any[] {
  return components.map(c => {
    const { id, component, weight, ...props } = c;
    
    // If already in v0.8 nested format (component is an object), pass through
    if (typeof component === "object") {
      return c;
    }
    
    // Rename ChoicePicker → MultipleChoice
    const componentType = component === "ChoicePicker" ? "MultipleChoice" : component;
    
    // Property renames: v0.10 → v0.8 (component-specific)
    const RENAMES: Record<string, Record<string, string>> = {
      Text: { variant: "usageHint" },
    };
    const renames = RENAMES[componentType] || {};
    // Wrap string values in literalString for text-like properties
    const translatedProps: any = {};
    for (const [key, value] of Object.entries(props)) {
      const k = renames[key] || key;
      const STRING_PROPS = new Set(["text", "label", "hint", "name", "url", "src", "title", "placeholder", "description"]);
      if (STRING_PROPS.has(k) && typeof value === "string") {
        translatedProps[k] = { literalString: value };
      } else {
        translatedProps[k] = value;
      }
    }
    
    // Component-specific translations
    if (componentType === "Tabs" && translatedProps.tabs && Array.isArray(translatedProps.tabs)) {
      translatedProps.tabItems = translatedProps.tabs.map((t: any) => ({
        title: typeof t.label === "string" ? { literalString: t.label } : (typeof t.title === "string" ? { literalString: t.title } : t.title || t.label),
        child: t.child,
      }));
      delete translatedProps.tabs;
    }
    if (componentType === "MultipleChoice") {
      if (translatedProps.options && Array.isArray(translatedProps.options)) {
        translatedProps.options = translatedProps.options.map((o: any) => ({
          ...o,
          label: typeof o.label === "string" ? { literalString: o.label } : o.label,
        }));
      }
      if (translatedProps.value && !translatedProps.selections) {
        translatedProps.selections = translatedProps.value;
        delete translatedProps.value;
      }
      if (!translatedProps.selections) translatedProps.selections = [];
    }

    const result: any = {
      id,
      component: { [componentType]: translatedProps },
    };
    if (weight !== undefined) result.weight = weight;
    return result;
  });
}

/**
 * Translate v0.10 messages to v0.8 format for the Lit renderer.
 */
export function translateToV08(messages: V010Message[]): V08Message[] {
  const result: V08Message[] = [];

  // We need to look ahead: createSurface needs root ID from the next updateComponents
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (msg.createSurface) {
      // Find the root from the next updateComponents message for this surface
      let rootId = "root";
      for (let j = i + 1; j < messages.length; j++) {
        if (msg.createSurface && messages[j].updateComponents?.surfaceId === msg.createSurface.surfaceId) {
          rootId = findRootId(messages[j].updateComponents!.components);
          break;
        }
      }
      result.push({
        version: "v0.8",
        beginRendering: { surfaceId: msg.createSurface.surfaceId, root: rootId },
      });
    } else if (msg.updateComponents) {
      const translated = translateComponents(msg.updateComponents.components);
      result.push({
        version: "v0.8",
        surfaceUpdate: { surfaceId: msg.updateComponents.surfaceId, components: translated },
      });
    } else if (msg.updateDataModel) {
      result.push({
        version: "v0.8",
        dataModelUpdate: {
          surfaceId: msg.updateDataModel.surfaceId,
          path: msg.updateDataModel.path,
          value: msg.updateDataModel.value,
        },
      });
    } else if (msg.deleteSurface) {
      result.push({
        version: "v0.8",
        deleteSurface: msg.deleteSurface,
      });
    }
  }

  return result;
}
