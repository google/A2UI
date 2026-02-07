import { html, TemplateResult, nothing, LitElement } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { customElement, property, state } from 'lit/decorators.js';
import { ModalComponent } from '@a2ui/web_core/v0_9';

@customElement('a2ui-modal-wrapper-v0-9')
export class A2UiModalWrapper extends LitElement {
  @property({ attribute: false }) accessor trigger: any;
  @property({ attribute: false }) accessor content: any;
  @property({ type: Number }) accessor weight: number | undefined;

  @state() accessor isOpen = false;

  render() {
    const styles: Record<string, string> = {};
    if (this.weight !== undefined) {
        styles['flex-grow'] = String(this.weight);
    }

    return html`
            <div @click="${() => this.isOpen = true}" style=${styleMap({ ...styles, display: 'inline-block' })}>
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
  ({ trigger, content, weight }, context) => {
    const classes = context.surfaceContext.theme.components.Modal;
    return html`
            <a2ui-modal-wrapper-v0-9 .trigger="${trigger}" .content="${content}" .weight="${weight}" class=${classMap(classes)}></a2ui-modal-wrapper-v0-9>
        `;
  }
);
