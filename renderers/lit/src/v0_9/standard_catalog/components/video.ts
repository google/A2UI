import { html, TemplateResult } from 'lit';
import { VideoComponent } from '@a2ui/web_core/v0_9';

export const litVideo = new VideoComponent<TemplateResult>(
    ({ url, showControls }) => html`
        <video 
            src="${url}" 
            ?controls="${showControls}" 
            class="a2ui-video"
        ></video>
    `
);
