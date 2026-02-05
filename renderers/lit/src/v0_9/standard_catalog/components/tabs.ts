import { html, TemplateResult, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { TabsComponent } from '@a2ui/web_core/v0_9';

@customElement('a2ui-tabs-wrapper-v0-9')
export class A2UiTabsWrapper extends LitElement {
  @property({ type: Array }) accessor tabs: { title: string; child: any }[] = [];
  @state() accessor activeIndex = 0;

  render() {
    return html`
            <div class="tabs-header" style="display: flex; gap: 8px; border-bottom: 1px solid #ccc;">
                ${this.tabs.map((tab, i) => html`
                    <button 
                        @click="${() => this.activeIndex = i}"
                        style="${i === this.activeIndex ? 'font-weight: bold; border-bottom: 2px solid blue;' : ''}"
                    >
                        ${tab.title}
                    </button>
                `)}
            </div>
            <div class="tabs-content">
                ${this.tabs[this.activeIndex]?.child}
            </div>
        `;
  }
}

export const litTabs = new TabsComponent<TemplateResult>(
  ({ tabs }) => {
    return html`
            <a2ui-tabs-wrapper-v0-9 .tabs="${tabs}"></a2ui-tabs-wrapper-v0-9>
        `;
  }
);
