import assert from 'node:assert';
import { test, describe, it, beforeEach } from 'node:test';
import { MessageProcessor } from './message-processor.js';
import { Catalog, ComponentApi } from '../catalog/types.js';

describe('MessageProcessor', () => {
  let processor: MessageProcessor<ComponentApi>;
  let testCatalog: Catalog<ComponentApi>;
  let actions: any[] = [];

  beforeEach(() => {
    actions = [];
    testCatalog = new Catalog('test-catalog', []);
    processor = new MessageProcessor<ComponentApi>([testCatalog], async (a) => { actions.push(a); });
  });

  it('creates surface', () => {
    processor.processMessages([{
      createSurface: {
        surfaceId: 's1',
        catalogId: 'test-catalog',
        theme: {}
      }
    }]);
    const surface = processor.model.getSurface('s1');
    assert.ok(surface);
    assert.strictEqual(surface.id, 's1');
  });

  it('updates components on correct surface', () => {
    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);

    processor.processMessages([{
      updateComponents: {
        surfaceId: 's1',
        components: [{ id: 'root', component: 'Box' }]
      }
    }]);

    const surface = processor.model.getSurface('s1');
    assert.ok(surface?.componentsModel.get('root'));
  });

  it('updates existing components via message', () => {
    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);

    // Create
    processor.processMessages([{
      updateComponents: {
        surfaceId: 's1',
        components: [{ id: 'btn', component: 'Button', label: 'Initial' }]
      }
    }]);

    const surface = processor.model.getSurface('s1');
    const btn = surface?.componentsModel.get('btn');
    assert.strictEqual(btn?.properties.label, 'Initial');

    // Update
    processor.processMessages([{
      updateComponents: {
        surfaceId: 's1',
        components: [{ id: 'btn', component: 'Button', label: 'Updated' }]
      }
    }]);

    assert.strictEqual(btn?.properties.label, 'Updated');
  });

  it('deletes surface', () => {
    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);
    assert.ok(processor.model.getSurface('s1'));

    processor.processMessages([{
      deleteSurface: { surfaceId: 's1' }
    }]);
    assert.strictEqual(processor.model.getSurface('s1'), undefined);
  });

  it('routes data model updates', () => {
    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);

    processor.processMessages([{
      updateDataModel: {
        surfaceId: 's1',
        path: '/foo',
        value: 'bar'
      }
    }]);

    const surface = processor.model.getSurface('s1');
    assert.strictEqual(surface?.dataModel.get('/foo'), 'bar');
  });

  it('notifies lifecycle listeners', () => {
    let created: any = null;
    let deletedId: string | null = null;

    const sub = processor.onSurfaceCreated((s) => { created = s; });
    const sub2 = processor.onSurfaceDeleted((id) => { deletedId = id; });

    // Create
    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);
    assert.ok(created);
    assert.strictEqual(created.id, 's1');

    // Delete
    processor.processMessages([{
      deleteSurface: { surfaceId: 's1' }
    }]);
    assert.strictEqual(deletedId, 's1');

    // Test Unsubscribe
    created = null;
    sub.unsubscribe();
    processor.processMessages([{
      createSurface: { surfaceId: 's2', catalogId: 'test-catalog' }
    }]);
    assert.strictEqual(created, null);
    
    sub2.unsubscribe();
  });
});
