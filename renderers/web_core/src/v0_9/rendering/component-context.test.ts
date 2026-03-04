import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { ComponentContext } from './component-context.js';
import { SurfaceModel } from '../state/surface-model.js';
import { ComponentModel } from '../state/component-model.js';

describe('ComponentContext', () => {
    const mockSurface = new SurfaceModel('surface1', {} as any);
    const componentId = 'comp1';

    // Add a component to the surface model for testing
    const componentModel = new ComponentModel(componentId, 'TestComponent', {});
    mockSurface.componentsModel.addComponent(componentModel);

    it('initializes correctly', () => {
        const context = new ComponentContext(mockSurface, componentId);
        assert.strictEqual(context.componentModel, componentModel);
        assert.ok(context.dataContext);
        assert.strictEqual(context.surfaceComponents, mockSurface.componentsModel);
    });

    it('dispatches actions', async () => {
        const context = new ComponentContext(mockSurface, componentId);
        let actionDispatched = null;

        const subscription = mockSurface.onAction.subscribe((action: any) => {
            actionDispatched = action;
        });

        await context.dispatchAction({ type: 'test' });

        assert.deepStrictEqual(actionDispatched, { type: 'test' });
        subscription.unsubscribe();
    });

    it('throws error if component not found', () => {
        assert.throws(() => {
            new ComponentContext(mockSurface, 'nonExistentId');
        }, /Component not found: nonExistentId/);
    });

    it('creates data context with correct base path', () => {
        const context = new ComponentContext(mockSurface, componentId, '/foo/bar');
        assert.strictEqual(context.dataContext.path, '/foo/bar');
    });
});
