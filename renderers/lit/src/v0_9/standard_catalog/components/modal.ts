import { html, TemplateResult, nothing, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ModalComponent } from '@a2ui/web_core/v0_9';

@customElement('a2ui-modal-wrapper-v0-9')
export class A2UiModalWrapper extends LitElement {
  @property({ attribute: false }) accessor trigger: any;
  @property({ attribute: false }) accessor content: any;

  @state() accessor isOpen = false;

  render() {
    return html`
            <div @click="${() => this.isOpen = true}" style="display: inline-block;">
                ${this.trigger}
            </div>
            ${this.isOpen ? html`
                <div class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
                    <div class="modal-content" style="background: white; padding: 20px; border-radius: 8px; min-width: 300px;">
                        ${this.content}
                        <div style="margin-top: 20px; text-align: right;">
                             <button @click="${() => this.isOpen = false}">Close</button>
                        </div>
                    </div>
                </div>
            ` : nothing}
        `;
  }
}

export const litModal = new ModalComponent<TemplateResult>(
  ({ trigger, content }) => {
    return html`
            <a2ui-modal-wrapper-v0-9 .trigger="${trigger}" .content="${content}"></a2ui-modal-wrapper-v0-9>
        `;
  }
);
