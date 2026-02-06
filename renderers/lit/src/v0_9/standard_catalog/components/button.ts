import { resolve } from 'path';
import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ButtonComponent } from '@a2ui/web_core/v0_9';
import { getStyleMap } from '../../ui/utils.js';

export const litButton = new ButtonComponent<TemplateResult>(
  ({ label, disabled, onAction, child, weight }, context) => {
    const classes = context.surfaceContext.theme.components.Button;
    const styles = getStyleMap(context, 'Button');
    
    if (weight !== undefined) {
      styles['flex-grow'] = String(weight);
    }

    return html`
    <button class=${classMap(classes)} style=${styleMap(styles)} ?disabled=${disabled} @click=${onAction}>
      ${child ? child : label}
    </button>
  `;
  }
);
