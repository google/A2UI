import { html, TemplateResult, nothing, LitElement } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { customElement, property, state } from 'lit/decorators.js';
import { ModalComponent } from '@a2ui/web_core/v0_9';
import { getAccessibilityAttributes } from '../../ui/utils.js';

@customElement('a2ui-modal-wrapper-v0-9')
export class A2UiModalWrapper extends LitElement {
  @property({ attribute: false }) accessor trigger: any;
  @property({ attribute: false }) accessor content: any;
  @property({ type: Number }) accessor weight: number | undefined;
  @property({ attribute: false }) accessor a11y: Record<string, string | undefined> = {};

  @state() accessor isOpen = false;

  render() {
    const styles: Record<string, string> = {};
    if (this.weight !== undefined) {
        styles['flex-grow'] = String(this.weight);
    }

    return html`
            <div 
                @click="${() => this.isOpen = true}" 
                style=${styleMap({ ...styles, display: 'inline-block' })}
                aria-label=${this.a11y['aria-label'] || null}
                aria-description=${this.a11y['aria-description'] || null}
                aria-haspopup="dialog"
            >
                ${this.trigger}
            </div>
            ${this.isOpen ? html`
                <div class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
                    <div class="modal-content" role="dialog" aria-modal="true" style="background: white; padding: 20px; border-radius: 8px; min-width: 300px;">
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
    const a11y = getAccessibilityAttributes(context);
    return html`
            <a2ui-modal-wrapper-v0-9 
                .trigger="${trigger}" 
                .content="${content}" 
                .weight="${weight}" 
                .a11y="${a11y}"
                class=${classMap(classes)}
            ></a2ui-modal-wrapper-v0-9>
        `;
  }
);
