import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { CardComponent } from '@a2ui/web_core/v0_9';
import { getStyleMap, getAccessibilityAttributes } from '../../ui/utils.js';

export const litCard = new CardComponent<TemplateResult>(
  ({ child, weight }, context) => {
    const classes = context.surfaceContext.theme.components.Card;
    const styles = getStyleMap(context, 'Card');
    const a11y = getAccessibilityAttributes(context);

    if (weight !== undefined) {
      styles['flex-grow'] = String(weight);
    }

    return html`
    <div class=${classMap(classes)} style=${styleMap(styles)} aria-label=${a11y['aria-label'] || null} aria-description=${a11y['aria-description'] || null}>
      ${child}
    </div>
  `;
  }
);
