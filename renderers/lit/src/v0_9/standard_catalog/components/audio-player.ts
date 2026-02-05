import { html, TemplateResult } from 'lit';
import { AudioPlayerComponent } from '@a2ui/web_core/v0_9';

export const litAudioPlayer = new AudioPlayerComponent<TemplateResult>(
    ({ url }) => html`
        <audio 
            src="${url}" 
            controls 
            class="a2ui-audio"
        ></audio>
    `
);
