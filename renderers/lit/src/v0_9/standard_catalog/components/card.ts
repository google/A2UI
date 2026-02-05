import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { CardComponent } from '@a2ui/web_core/v0_9';
import { getStyleMap } from '../../ui/utils.js';

export const litCard = new CardComponent<TemplateResult>(
  ({ child }, context) => {
    const classes = context.surfaceContext.theme.components.Card;
    const styles = getStyleMap(context, 'Card');
    return html`
    <div class=${classMap(classes)} style=${styleMap(styles)}>
      ${child}
    </div>
  `;
  }
);
