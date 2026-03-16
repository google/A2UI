import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { A2uiController } from "../../../adapter.js";
import { ComponentContext } from "@a2ui/web_core/v0_9";
import { ModalApi } from "@a2ui/web_core/v0_9/basic_catalog";
import { ChildBuilder, LitComponentImplementation } from "../../../types.js";

@customElement("a2ui-lit-modal")
export class A2uiLitModal extends LitElement {
  @property({ type: Object }) accessor context!: ComponentContext;
  @property({ type: Function }) accessor buildChild!: ChildBuilder;
  private a2ui = new A2uiController(this as any, ModalApi);
  @query("dialog") accessor dialog!: HTMLDialogElement;

  render() {
    const props = this.a2ui.props as any;
    return html`
      <div @click=${() => this.dialog?.showModal()}>
        ${props.trigger ? this.buildChild(props.trigger) : ''}
      </div>
      <dialog class="a2ui-modal" style="border: 1px solid #ccc; border-radius: 8px; padding: 24px; min-width: 300px;">
        <form method="dialog" style="text-align: right;"><button>×</button></form>
        ${props.content ? this.buildChild(props.content) : ''}
      </dialog>
    `;
  }
}

export const A2uiModal: LitComponentImplementation = {
  name: "Modal",
  schema: ModalApi.schema,
  render: ({ context, buildChild }) => html`<a2ui-lit-modal .context=${context} .buildChild=${buildChild}></a2ui-lit-modal>`
};