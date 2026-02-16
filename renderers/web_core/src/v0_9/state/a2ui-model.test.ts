import assert from 'node:assert';
import { describe, it, beforeEach } from 'node:test';
import { A2uiModel } from './a2ui-model.js';
import { CatalogApi } from '../catalog/types.js';
import { SurfaceModel } from './surface-model.js';

describe('A2uiModel', () => {
  let model: A2uiModel<CatalogApi>;
  let catalog: CatalogApi;

  beforeEach(() => {
    model = new A2uiModel<CatalogApi>();
    catalog = { id: 'test-catalog', components: new Map() };
  });

  it('creates surface', () => {
    const surface = model.createSurface('s1', catalog, {}, async () => {});
    assert.ok(surface);
    assert.strictEqual(surface.id, 's1');
    assert.strictEqual(model.getSurface('s1'), surface);
  });

  it('returns existing surface if created again', () => {
    const s1 = model.createSurface('s1', catalog, {}, async () => {});
    const s2 = model.createSurface('s1', catalog, {}, async () => {});
    assert.strictEqual(s1, s2);
  });

  it('deletes surface', () => {
    model.createSurface('s1', catalog, {}, async () => {});
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

    model.createSurface('s1', catalog, {}, async () => {});
    assert.ok(created);
    assert.strictEqual(created?.id, 's1');

    model.deleteSurface('s1');
    assert.strictEqual(deletedId, 's1');
  });
});
