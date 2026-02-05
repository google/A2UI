
import assert from 'node:assert';
import { test, describe, it, beforeEach, mock } from 'node:test';
import { SurfaceContext } from './surface-context.js';
import { Catalog } from '../catalog/types.js';

describe('SurfaceContext', () => {
  let surface: SurfaceContext;
  let catalog: Catalog<any>;
  let actions: any[] = [];

  beforeEach(() => {
    actions = [];
    catalog = {
      id: 'test-catalog',
      components: new Map(),
      getComponent: (_) => undefined
    };
    surface = new SurfaceContext('surface-1', catalog, {}, async (action) => {
      actions.push(action);
    });
  });

  it('initializes with empty data model', () => {
    assert.deepStrictEqual(surface.dataModel.get('/'), {});
  });

  it('updates data model from message', () => {
    surface.handleMessage({
      updateDataModel: {
        surfaceId: 'surface-1',
        path: '/user',
        value: { name: 'Alice' }
      }
    });
    assert.strictEqual(surface.dataModel.get('/user/name'), 'Alice');
  });

  it('updates components from message', () => {
    surface.handleMessage({
      updateComponents: {
        surfaceId: 'surface-1',
        components: [
          { id: 'root', component: 'Column', children: [] },
          { id: 'btn1', component: 'Button', label: 'Click' }
        ]
      }
    });
    assert.equal(surface.rootComponentId, 'root');
    const rootDef = surface.getComponentDefinition('root');
    assert.strictEqual(rootDef?.type, 'Column');

    const btnDef = surface.getComponentDefinition('btn1');
    assert.strictEqual(btnDef?.type, 'Button');
    assert.strictEqual(btnDef?.properties?.label, 'Click');
  });

  it('ignores messages for other surfaces', () => {
    surface.handleMessage({
      updateDataModel: {
        surfaceId: 'other-surface',
        path: '/foo',
        value: 'bar'
      }
    });
    assert.strictEqual(surface.dataModel.get('/foo'), undefined);
  });

  it('dispatches actions', async () => {
    await surface.dispatchAction({ type: 'click' });
    assert.strictEqual(actions.length, 1);
    assert.strictEqual(actions[0].type, 'click');
  });
});
