/*
 * A2UI Renderer
 *
 * Renders A2UI JSON payloads into the chat interface using the A2UI web components.
 * Uses the signal-based model processor for proper reactivity.
 */

import { v0_8 } from "@a2ui/web-lib";
import type { SourceInfo } from "./a2a-client";

// Type alias for the processor - use InstanceType to get the instance type from the class
type A2UIModelProcessorInstance = InstanceType<typeof v0_8.Data.A2UIModelProcessor>;

// Extended surface element type
interface A2UISurfaceElement extends HTMLElement {
  surfaceId: string;
  surface: v0_8.Types.Surface;
  processor: A2UIModelProcessorInstance;
}

export class A2UIRenderer {
  private processors: Map<string, A2UIModelProcessorInstance> = new Map();

  constructor() {
    console.log("[A2UIRenderer] Initialized with signal model processor");
  }

  /**
   * Render A2UI JSON into a message element.
   */
  render(messageElement: HTMLDivElement, a2uiMessages: unknown[], source?: SourceInfo): void {
    console.log("[A2UIRenderer] Rendering A2UI content:", a2uiMessages);

    if (!a2uiMessages || a2uiMessages.length === 0) {
      console.warn("[A2UIRenderer] No A2UI messages to render");
      return;
    }

    // Create a container for the A2UI content
    const container = document.createElement("div");
    container.className = "a2ui-container";

    // Find the message content element
    const contentEl = messageElement.querySelector(".message-content");
    if (!contentEl) {
      console.error("[A2UIRenderer] Message content element not found");
      return;
    }

    contentEl.appendChild(container);

    // Create a model processor for this render
    const processor = v0_8.Data.createSignalA2UIModelProcessor();

    // Process all A2UI messages to build the model
    try {
      processor.processMessages(a2uiMessages as v0_8.Types.ServerToClientMessage[]);
    } catch (error) {
      console.error("[A2UIRenderer] Error processing messages:", error);
    }

    // Now render the surfaces
    const surfaces = processor.getSurfaces();
    console.log("[A2UIRenderer] Surfaces to render:", Array.from(surfaces.keys()));

    for (const [surfaceId, surface] of surfaces.entries()) {
      this.renderSurface(container, surfaceId, surface, processor);
      this.processors.set(surfaceId, processor);
    }

    // Add source attribution if available
    if (source && (source.url || source.provider)) {
      this.renderSourceAttribution(container, source);
    }
  }

  /**
   * Render source attribution below the A2UI content.
   */
  private renderSourceAttribution(container: HTMLElement, source: SourceInfo): void {
    const attribution = document.createElement("div");
    attribution.className = "source-attribution";

    // If we have a URL, make it a link; otherwise just show the text
    if (source.url) {
      attribution.innerHTML = `
        <span class="source-label">Source:</span>
        <a href="${source.url}" target="_blank" rel="noopener noreferrer" class="source-link">
          ${source.title || source.provider}
        </a>
        <span class="source-provider">— ${source.provider}</span>
      `;
    } else {
      attribution.innerHTML = `
        <span class="source-label">Source:</span>
        <span class="source-link">${source.title || source.provider}</span>
        <span class="source-provider">— ${source.provider}</span>
      `;
    }
    container.appendChild(attribution);
  }

  /**
   * Render a surface using a2ui-surface component.
   */
  private renderSurface(
    container: HTMLElement,
    surfaceId: string,
    surface: v0_8.Types.Surface,
    processor: A2UIModelProcessorInstance
  ): void {
    console.log("[A2UIRenderer] Rendering surface:", surfaceId);

    // Create the a2ui-surface element
    const surfaceEl = document.createElement("a2ui-surface") as A2UISurfaceElement;

    surfaceEl.surfaceId = surfaceId;
    surfaceEl.surface = surface;
    surfaceEl.processor = processor;

    // Add some styling for the container
    surfaceEl.style.display = "block";
    surfaceEl.style.marginTop = "16px";

    container.appendChild(surfaceEl);
  }

  /**
   * Get a processor for a surface ID.
   */
  getProcessor(surfaceId: string): A2UIModelProcessorInstance | undefined {
    return this.processors.get(surfaceId);
  }

  /**
   * Clear all rendered surfaces.
   */
  clear(): void {
    this.processors.clear();
  }
}
