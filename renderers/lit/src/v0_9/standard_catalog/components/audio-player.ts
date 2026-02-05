import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { AudioPlayerComponent } from '@a2ui/web_core/v0_9';

export const litAudioPlayer = new AudioPlayerComponent<TemplateResult>(
    ({ url }, context) => {
        const classes = context.surfaceContext.theme.components.AudioPlayer;
        return html`
        <audio 
            src="${url}" 
            controls 
            class=${classMap(classes)}
        ></audio>
    `;
    }
);
