
import assert from 'node:assert';
import { test, describe, it, beforeEach } from 'node:test';
import { A2uiMessageProcessor } from './message-processor.js';
import { CatalogApi } from '../catalog/types.js';

describe('A2uiMessageProcessor', () => {
  let processor: A2uiMessageProcessor<CatalogApi>;
  let testCatalog: CatalogApi;
  let actions: any[] = [];

  beforeEach(() => {
    actions = [];
    testCatalog = {
      id: 'test-catalog',
      components: new Map()
    };
    processor = new A2uiMessageProcessor<CatalogApi>([testCatalog], async (a) => { actions.push(a); });
  });

  it('creates surface', () => {
    processor.processMessages([{
      createSurface: {
        surfaceId: 's1',
        catalogId: 'test-catalog',
        theme: {}
      }
    }]);
    const surface = processor.getSurfaceModel('s1');
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

    const surface = processor.getSurfaceModel('s1');
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

    const surface = processor.getSurfaceModel('s1');
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
    assert.ok(processor.getSurfaceModel('s1'));

    processor.processMessages([{
      deleteSurface: { surfaceId: 's1' }
    }]);
    assert.strictEqual(processor.getSurfaceModel('s1'), undefined);
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

    const surface = processor.getSurfaceModel('s1');
    assert.strictEqual(surface?.dataModel.get('/foo'), 'bar');
  });

  it('notifies lifecycle listeners', () => {
    let created: any = null;
    let deletedId: string | null = null;

    const unsubscribe = processor.addLifecycleListener({
      onSurfaceCreated: (s) => created = s,
      onSurfaceDeleted: (id) => deletedId = id
    });

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
    unsubscribe();
    processor.processMessages([{
      createSurface: { surfaceId: 's2', catalogId: 'test-catalog' }
    }]);
    assert.strictEqual(created, null);
  });
});
