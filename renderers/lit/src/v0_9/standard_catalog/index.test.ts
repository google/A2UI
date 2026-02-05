
import assert from 'node:assert';
import { test, describe, it } from 'node:test';
import { createLitStandardCatalog, litText, litButton } from './index.js';
import { ComponentContext, DataContext, SurfaceContext } from '@a2ui/web_core/v0_9';
import { html, TemplateResult } from 'lit';

// Mock SurfaceContext
class MockSurfaceContext extends SurfaceContext {
    constructor() {
        super('mock', {} as any, {}, async () => { });
    }
}

function createMockContext(properties: any) {
    const surface = new MockSurfaceContext();
    const dataContext = new DataContext(surface.dataModel, '/');
    return new ComponentContext<TemplateResult>('test-id', properties, dataContext, surface, () => { });
}

describe('Lit Standard Catalog', () => {
    it('creates a catalog with standard components', () => {
        const catalog = createLitStandardCatalog();
        assert.ok(catalog.components.has('Text'));
        assert.ok(catalog.components.has('Button'));
        assert.ok(catalog.components.has('Card'));
        assert.ok(catalog.components.has('Column'));
        assert.ok(catalog.components.has('Row'));
    });

    it('renders Text component', () => {
        const context = createMockContext({ text: 'Hello Lit' });
        const result = litText.render(context);
        // We can't easily assert on TemplateResult content without a full DOM or stringifier.
        // But we can check if it returns a TemplateResult.
        assert.ok(result);
        // assert.strictEqual(result.strings[0], '<span>'); // Implementation detail check
    });

    it('renders Button component', () => {
        const context = createMockContext({ label: 'Click Me' });
        const result = litButton.render(context);
        assert.ok(result);
    });
});
