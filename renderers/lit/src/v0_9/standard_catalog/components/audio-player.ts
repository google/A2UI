import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { AudioPlayerComponent } from '@a2ui/web_core/v0_9';

export const litAudioPlayer = new AudioPlayerComponent<TemplateResult>(
    ({ url, weight }, context) => {
        const classes = context.surfaceContext.theme.components.AudioPlayer;
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
        ></audio>
    `;
    }
);
