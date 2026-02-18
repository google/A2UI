import { html, TemplateResult, LitElement } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { customElement, property, state } from 'lit/decorators.js';
import { TabsComponent } from '@a2ui/web_core/v0_9';
import { getAccessibilityAttributes } from '../../ui/utils.js';

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
                        aria-selected="${i === this.activeIndex}"
                        role="tab"
                    >
                        ${tab.title}
                    </button>
                `)}
            </div>
            <div class="tabs-content" role="tabpanel">
                ${this.tabs[this.activeIndex]?.child}
            </div>
        `;
  }
}

export const litTabs = new TabsComponent<TemplateResult>(
  ({ tabs, weight }, context) => {
    const classes = context.surfaceContext.theme.components.Tabs;
    const a11y = getAccessibilityAttributes(context);
    const styles: Record<string, string> = {};
    if (weight !== undefined) {
        styles['flex-grow'] = String(weight);
    }

    return html`
            <a2ui-tabs-wrapper-v0-9 
                .tabs="${tabs}" 
                class=${classMap(classes)}
                style=${styleMap(styles)}
                aria-label=${a11y['aria-label'] || null} 
                aria-description=${a11y['aria-description'] || null}
            ></a2ui-tabs-wrapper-v0-9>
        `;
  }
);
