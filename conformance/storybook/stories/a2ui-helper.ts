/**
 * Helper to render A2UI components in Storybook stories.
 * 
 * Uses the Lit renderer's web components and A2uiMessageProcessor from web_core.
 */
import { html, TemplateResult } from "lit";
import { v0_8 } from "@a2ui/lit";

// Import all UI components to ensure custom elements are registered
import "@a2ui/lit/ui";

type ServerToClientMessage = v0_8.Types.ServerToClientMessage;
type ComponentProperties = v0_8.Types.ComponentProperties;

/**
 * Creates a v0.8 format ServerToClientMessage with beginRendering + surfaceUpdate.
 */
export function createMessages(
  surfaceId: string,
  rootId: string,
  components: Array<{ id: string; component: Record<string, unknown>; weight?: number }>
): ServerToClientMessage[] {
  return [
    {
      beginRendering: { surfaceId, root: rootId },
    },
    {
      surfaceUpdate: {
        surfaceId,
        components: components.map((c) => ({
          id: c.id,
          weight: c.weight,
          component: c.component as ComponentProperties,
        })),
      },
    },
  ];
}

/**
 * Renders A2UI components by processing messages through A2uiMessageProcessor
 * and displaying them in an a2ui-surface element.
 */
export function renderA2UI(
  surfaceId: string,
  messages: ServerToClientMessage[],
  width = "600px"
): TemplateResult {
  // We need to create the processor and surface imperatively
  // because the surface element needs the processor reference
  const processorScript = `
    (function() {
      const surfaceEl = document.currentScript.previousElementSibling;
      // The processor will be set up by the surface component itself
    })();
  `;

  return html`
    <div style="max-width: ${width}; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; background: white;">
      <div id="surface-container-${surfaceId}"></div>
      <script type="module">
        import { v0_8 } from "@a2ui/lit";
        import "@a2ui/lit/ui";
        
        const { SignalMap, SignalArray, SignalSet, SignalObject } = v0_8.Signals;
        const processor = new v0_8.A2uiMessageProcessor({
          mapCtor: SignalMap,
          arrayCtor: SignalArray,
          setCtor: SignalSet,
          objCtor: SignalObject,
        });
        
        const messages = ${JSON.stringify(messages)};
        processor.processMessages(messages);
        
        const surface = processor.getSurfaces().get("${surfaceId}");
        if (surface) {
          const el = document.createElement("a2ui-surface");
          el.surfaceId = "${surfaceId}";
          el.surface = surface;
          el.processor = processor;
          document.getElementById("surface-container-${surfaceId}").appendChild(el);
        }
      </script>
    </div>
  `;
}

/**
 * Simpler: just render an inline component setup using a <script> in the story.
 * This is the approach we'll use - create the surface element and processor inline.
 */
export function renderA2UIStory(
  surfaceId: string,
  components: Array<{ id: string; component: Record<string, unknown>; weight?: number }>,
  rootId?: string,
  options?: { width?: string; dataModel?: Record<string, unknown> }
): TemplateResult {
  const root = rootId || components[0]?.id || "root";
  const width = options?.width || "600px";
  
  const messages: ServerToClientMessage[] = [
    {
      beginRendering: { surfaceId, root },
    },
    {
      surfaceUpdate: {
        surfaceId,
        components: components.map((c) => ({
          id: c.id,
          weight: c.weight,
          component: c.component as ComponentProperties,
        })),
      },
    },
  ];

  // Add data model if provided
  if (options?.dataModel) {
    const contents: v0_8.Types.ValueMap[] = Object.entries(options.dataModel).map(
      ([key, value]) => {
        const vm: any = { key };
        if (typeof value === "string") vm.valueString = value;
        else if (typeof value === "number") vm.valueNumber = value;
        else if (typeof value === "boolean") vm.valueBoolean = value;
        return vm;
      }
    );
    messages.push({
      dataModelUpdate: {
        surfaceId,
        path: "/",
        contents,
      },
    });
  }

  // Generate unique container ID
  const containerId = `a2ui-${surfaceId}-${Date.now()}`;

  return html`
    <div style="max-width: ${width}; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; background: white; font-family: system-ui, sans-serif;">
      <div id="${containerId}"></div>
    </div>
  `;
}
