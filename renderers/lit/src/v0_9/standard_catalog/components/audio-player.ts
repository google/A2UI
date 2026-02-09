import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { AudioPlayerComponent } from '@a2ui/web_core/v0_9';
import { getAccessibilityAttributes } from '../../ui/utils.js';

export const litAudioPlayer = new AudioPlayerComponent<TemplateResult>(
    ({ url, description, weight }, context) => {
        const classes = context.surfaceContext.theme.components.AudioPlayer;
        const a11y = getAccessibilityAttributes(context);
        const styles: Record<string, string> = {};
        if (weight !== undefined) {
            styles['flex-grow'] = String(weight);
        }

        return html`
        <audio 
            src="${url}" 
            controls 
            class=${classMap(classes)}
            style=${styleMap(styles)}
            title=${description || a11y['aria-label'] || null}
            aria-label=${a11y['aria-label'] || null}
            aria-description=${a11y['aria-description'] || description || null}
        ></audio>
    `;
    }
);
