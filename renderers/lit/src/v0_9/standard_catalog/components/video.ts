import { html, TemplateResult } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { VideoComponent } from '@a2ui/web_core/v0_9';

export const litVideo = new VideoComponent<TemplateResult>(
    ({ url, showControls }, context) => {
        const classes = context.surfaceContext.theme.components.Video;
        return html`
        <video 
            src="${url}" 
            ?controls="${showControls}" 
            class=${classMap(classes)}
        ></video>
    `;
    }
);
