import { describe, it } from 'node:test';
import { litTabs } from './tabs.js';
import { createLitTestContext, assertTemplateContains } from '../../test/test-utils.js';

describe('Lit Tabs', () => {
    it('renders tabs wrapper', () => {
        const context = createLitTestContext({ tabs: [] });
        const result = litTabs.render(context);
        assertTemplateContains(result, 'a2ui-tabs-wrapper-v0-9');
    });
});
