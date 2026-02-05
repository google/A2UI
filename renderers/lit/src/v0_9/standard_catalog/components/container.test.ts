import { describe, it } from 'node:test';
import { litColumn, litRow } from './container.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Container', () => {
    it('renders column', () => {
        const context = createLitTestContext({ children: [], direction: 'column' }); // Container logic might be different if it resolves children first
        // Note: The ContainerComponent implementation in web_core might pass specific props to renderer.
        // ContainerComponent passes { children: ..., direction: ... } to renderer.
        // So passing properties to createLitTestContext works IF the lit component calls the web_core component logic?
        // Ah, litColumn is an INSTANCE of ContainerComponent.
        // So calling litColumn.render(context) WILL execute web_core logic (resolveChildren) then call the renderer function.
        // We need to make sure resolveChildren returns something or empty array.
        
        const result = litColumn.render(context);
        assertTemplateContains(result, 'display: flex');
        assertTemplateContains(result, 'flex-direction: column');
    });

    it('renders row', () => {
        const context = createLitTestContext({ children: [], direction: 'row' });
        const result = litRow.render(context);
        assertTemplateContains(result, 'flex-direction: row');
    });
});
