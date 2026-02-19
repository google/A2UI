import assert from 'node:assert';
import { describe, it, beforeEach } from 'node:test';
import { SurfaceGroupModel } from './surface-group-model.js';
import { CatalogApi } from '../catalog/types.js';
import { SurfaceModel } from './surface-model.js';

describe('SurfaceGroupModel', () => {
  let model: SurfaceGroupModel<CatalogApi>;
  let catalog: CatalogApi;

  beforeEach(() => {
    model = new SurfaceGroupModel<CatalogApi>();
    catalog = { id: 'test-catalog', components: new Map() };
  });

  it('adds surface', () => {
    const surface = new SurfaceModel('s1', catalog, {});
    model.addSurface(surface);
    assert.ok(model.getSurface('s1'));
    assert.strictEqual(model.getSurface('s1'), surface);
  });

  it('ignores duplicate surface addition', () => {
    const s1 = new SurfaceModel('s1', catalog, {});
    const s2 = new SurfaceModel('s1', catalog, {}); // Same ID
    model.addSurface(s1);
    model.addSurface(s2);
    assert.strictEqual(model.getSurface('s1'), s1); // Should still be the first one
  });

  it('deletes surface', () => {
    const surface = new SurfaceModel('s1', catalog, {});
    model.addSurface(surface);
    assert.ok(model.getSurface('s1'));
    
    model.deleteSurface('s1');
    assert.strictEqual(model.getSurface('s1'), undefined);
  });

  it('notifies lifecycle listeners', () => {
    let created: SurfaceModel<CatalogApi> | undefined;
    let deletedId: string | undefined;

    model.addLifecycleListener({
      onSurfaceCreated: (s) => created = s,
      onSurfaceDeleted: (id) => deletedId = id
    });

    const surface = new SurfaceModel('s1', catalog, {});
    model.addSurface(surface);
    assert.ok(created);
    assert.strictEqual(created?.id, 's1');

    model.deleteSurface('s1');
    assert.strictEqual(deletedId, 's1');
  });

  it('propagates actions from surfaces', async () => {
    let receivedAction: any;
    model.addActionListener((action) => {
        receivedAction = action;
    });

    const surface = new SurfaceModel('s1', catalog, {});
    model.addSurface(surface);

    await surface.dispatchAction({ type: 'test' });
    assert.deepStrictEqual(receivedAction, { type: 'test' });
  });

  it('stops propagating actions after deletion', async () => {
    let callCount = 0;
    model.addActionListener(() => {
        callCount++;
    });

    const surface = new SurfaceModel('s1', catalog, {});
    model.addSurface(surface);
    model.deleteSurface('s1');

    await surface.dispatchAction({ type: 'test' });
    assert.strictEqual(callCount, 0);
  });
});
