import { html, nothing, LitElement, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ComponentContext } from "@a2ui/web_core/v0_9";
import { A2uiController } from "../adapter.js";
import { ChildBuilder, LitComponentImplementation } from "../types.js";

@customElement("a2ui-node")
export class A2uiNode extends LitElement {
  @property({ type: Object }) accessor context!: ComponentContext;
  
  private controller?: A2uiController<any>;
  private implementation?: LitComponentImplementation;

  createRenderRoot() {
    return this;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.controller) {
      this.controller.dispose();
    }
  }

  protected willUpdate(changedProperties: PropertyValues) {
    super.willUpdate(changedProperties);
    if (changedProperties.has('context')) {
      if (this.controller) {
        this.removeController(this.controller);
        this.controller.dispose();
        this.controller = undefined;
      }
      
      if (this.context) {
        const type = this.context.componentModel.type;
        const catalog = this.context.dataContext.surface.catalog;
        this.implementation = catalog.components.get(type) as LitComponentImplementation | undefined;
        
        if (this.implementation) {
          this.controller = new A2uiController(this, this.implementation);
        } else {
          console.warn(`Component implementation not found for type: ${type}`);
        }
      }
    }
  }

  render() {
    if (!this.controller || !this.implementation || !this.context) return nothing;
    
    const buildChild: ChildBuilder = (id: string, overrideBasePath?: string) => {
        const surface = this.context.dataContext.surface;
        const basePath = overrideBasePath ?? this.context.dataContext.path;
        
        try {
            const childContext = new ComponentContext(surface, id, basePath);
            return html`<a2ui-node .context=${childContext}></a2ui-node>`;
        } catch (e) {
            console.error(`Error building child ${id}:`, e);
            return nothing;
        }
    };
    
    return this.implementation.render({
       props: this.controller.props,
       buildChild,
       context: this.context
    });
  }
}