
import assert from 'node:assert';
import { test, describe, it, beforeEach } from 'node:test';
import { A2uiMessageProcessor } from './message-processor.js';
import { Catalog } from '../catalog/types.js';

describe('A2uiMessageProcessor', () => {
  let processor: A2uiMessageProcessor;
  let testCatalog: Catalog<any>;
  let actions: any[] = [];

  beforeEach(() => {
    actions = [];
    testCatalog = {
      id: 'test-catalog',
      components: new Map(),
      getComponent: () => undefined
    };
    processor = new A2uiMessageProcessor([testCatalog], async (a) => { actions.push(a); });
  });

  it('creates surface', () => {
    processor.processMessages([{
      createSurface: {
        surfaceId: 's1',
        catalogId: 'test-catalog',
        theme: {}
      }
    }]);
    const surface = processor.getSurfaceContext('s1');
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
        components: [{ id: 'root', componentProperties: { Box: {} } }]
      }
    }]);

    const surface = processor.getSurfaceContext('s1');
    assert.strictEqual(surface?.rootComponentId, 'root');
  });

  it('deletes surface', () => {
    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);
    assert.ok(processor.getSurfaceContext('s1'));

    processor.processMessages([{
      deleteSurface: { surfaceId: 's1' }
    }]);
    assert.strictEqual(processor.getSurfaceContext('s1'), undefined);
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

    const surface = processor.getSurfaceContext('s1');
    assert.strictEqual(surface?.dataModel.get('/foo'), 'bar');
  });
});
