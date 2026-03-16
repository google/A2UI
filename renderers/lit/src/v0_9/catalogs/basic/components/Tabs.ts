import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { A2uiController } from "../../../adapter.js";
import { ComponentContext } from "@a2ui/web_core/v0_9";
import { TabsApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { ChildBuilder, LitComponentImplementation } from "../../../types.js";

@customElement("a2ui-lit-tabs")
export class A2uiLitTabs extends LitElement {
  @property({ type: Object }) accessor context!: ComponentContext;
  @property({ type: Function }) accessor buildChild!: ChildBuilder;
  private a2ui = new A2uiController(this as any, TabsApi);
  @state() accessor activeIndex = 0;

  render() {
    const props = this.a2ui.props as any;
    if (!props.tabs) return html``;
    return html`
      <div class="a2ui-tabs">
        <div class="a2ui-tab-headers" style="display:flex; gap: 8px; border-bottom: 1px solid #ccc; margin-bottom: 16px;">
          ${props.tabs.map((tab: any, i: number) => html`
            <button @click=${() => this.activeIndex = i} style="padding: 8px; background: ${i === this.activeIndex ? '#eee' : 'transparent'}; border: none;">
              ${tab.title}
            </button>
          `)}
        </div>
        <div class="a2ui-tab-content">
          ${props.tabs[this.activeIndex] ? this.buildChild(props.tabs[this.activeIndex].child) : ''}
        </div>
      </div>
    `;
  }
}

export const A2uiTabs: LitComponentImplementation = {
  name: "Tabs",
  schema: TabsApi.schema,
  render: ({ context, buildChild }) => html`<a2ui-lit-tabs .context=${context} .buildChild=${buildChild}></a2ui-lit-tabs>`
};