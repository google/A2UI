import { html, nothing, LitElement, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { SurfaceModel, ComponentContext } from "@a2ui/web_core/v0_9";
import "./render-node.js";

@customElement("a2ui-surface")
export class A2uiSurface extends LitElement {
  @property({ type: Object }) accessor surface: SurfaceModel<any> | undefined = undefined;
  
  @state() accessor _hasRoot = false;
  private unsub?: () => void;

  createRenderRoot() {
    return this;
  }

  protected willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('surface')) {
      if (this.unsub) {
        this.unsub();
        this.unsub = undefined;
      }
      this._hasRoot = !!this.surface?.componentsModel.get("root");
      
      if (this.surface && !this._hasRoot) {
        const sub = this.surface.componentsModel.onCreated.subscribe((comp) => {
          if (comp.id === "root") {
            this._hasRoot = true;
            this.unsub?.();
            this.unsub = undefined;
          }
        });
        this.unsub = () => sub.unsubscribe();
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsub) {
      this.unsub();
      this.unsub = undefined;
    }
  }

  render() {
    if (!this.surface) return nothing;
    if (!this._hasRoot) {
      return html`<slot name="loading"><div>Loading surface...</div></slot>`;
    }
    
    try {
        const rootContext = new ComponentContext(this.surface, "root", "/");
        return html`<a2ui-node .context=${rootContext}></a2ui-node>`;
    } catch (e) {
        console.error("Error creating root context:", e);
        return html`<div>Error rendering surface</div>`;
    }
  }
}