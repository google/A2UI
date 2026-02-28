import assert from 'node:assert';
import { test, describe, it, beforeEach, mock } from 'node:test';
import { SurfaceModel } from './surface-model.js';
import { Catalog, ComponentApi } from '../catalog/types.js';
import { ComponentModel } from './component-model.js';
import { ComponentContext } from '../rendering/component-context.js';

describe('SurfaceModel', () => {
  let surface: SurfaceModel<ComponentApi>;
  let catalog: Catalog<ComponentApi>;
  let actions: any[] = [];

  beforeEach(() => {
    actions = [];
    catalog = new Catalog('test-catalog', []);
    surface = new SurfaceModel<ComponentApi>('surface-1', catalog, {});
    surface.onAction.subscribe(async (action) => {
      actions.push(action);
    });
  });

  it('initializes with empty data model', () => {
    assert.deepStrictEqual(surface.dataModel.get('/'), {});
  });

  it('exposes components model', () => {
    surface.componentsModel.addComponent(new ComponentModel('c1', 'Button', {}));
    assert.ok(surface.componentsModel.get('c1'));
  });

  it('dispatches actions', async () => {
    await surface.dispatchAction({ type: 'click' });
    assert.strictEqual(actions.length, 1);
    assert.strictEqual(actions[0].type, 'click');
  });

  it('creates a component context', () => {
    surface.componentsModel.addComponent(new ComponentModel('root', 'Box', {}));
    const ctx = new ComponentContext(surface, 'root', '/mydata');
    assert.ok(ctx);
    assert.strictEqual(ctx.componentModel.id, 'root');
    assert.strictEqual(ctx.dataContext.path, '/mydata');
  });
});
