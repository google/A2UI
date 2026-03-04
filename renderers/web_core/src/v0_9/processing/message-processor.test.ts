/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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

    // Verify component creation.
    processor.processMessages([{
      updateComponents: {
        surfaceId: 's1',
        components: [{ id: 'btn', component: 'Button', label: 'Initial' }]
      }
    }]);

    const surface = processor.model.getSurface('s1');
    const btn = surface?.componentsModel.get('btn');
    assert.strictEqual(btn?.properties.label, 'Initial');

    // Verify component update.
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

    // Verify creation notification.
    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);
    assert.ok(created);
    assert.strictEqual(created.id, 's1');

    // Verify deletion notification.
    processor.processMessages([{
      deleteSurface: { surfaceId: 's1' }
    }]);
    assert.strictEqual(deletedId, 's1');

    // Verify unsubscribe stops notifications.
    created = null;
    sub.unsubscribe();
    processor.processMessages([{
      createSurface: { surfaceId: 's2', catalogId: 'test-catalog' }
    }]);
    assert.strictEqual(created, null);

    sub2.unsubscribe();
  });
  it('warns and ignores message with multiple update types', (t) => {
    const warn = t.mock.method(console, 'warn');
    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);

    processor.processMessages([{
      updateComponents: { surfaceId: 's1', components: [] },
      updateDataModel: { surfaceId: 's1', path: '/', value: {} }
    } as any]);

    assert.strictEqual(warn.mock.callCount(), 1);
    assert.match(warn.mock.calls[0].arguments[0], /Message contains multiple update types/);
  });

  it('warns when creating component without type', (t) => {
    const warn = t.mock.method(console, 'warn');
    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);

    processor.processMessages([{
      updateComponents: {
        surfaceId: 's1',
        components: [{ id: 'comp1', label: 'No Type' } as any]
      }
    }]);

    assert.strictEqual(warn.mock.callCount(), 1);
    assert.match(warn.mock.calls[0].arguments[0], /Cannot create component comp1 without a type/);
    const surface = processor.model.getSurface('s1');
    assert.strictEqual(surface?.componentsModel.get('comp1'), undefined);
  });

  it('recreates component when type changes', () => {
    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);

    processor.processMessages([{
      updateComponents: {
        surfaceId: 's1',
        components: [{ id: 'comp1', component: 'Button', label: 'Btn' }]
      }
    }]);

    let surface = processor.model.getSurface('s1');
    let comp = surface?.componentsModel.get('comp1');
    assert.strictEqual(comp?.type, 'Button');

    // Change type to Label
    processor.processMessages([{
      updateComponents: {
        surfaceId: 's1',
        components: [{ id: 'comp1', component: 'Label', text: 'Lbl' }]
      }
    }]);

    surface = processor.model.getSurface('s1');
    comp = surface?.componentsModel.get('comp1');
    assert.strictEqual(comp?.type, 'Label');
    assert.strictEqual(comp?.properties.text, 'Lbl');
    assert.strictEqual(comp?.properties.label, undefined);
  });

  it('getData and setData interact with data model', () => {
    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);

    processor.setData({ id: 'comp1' }, '/test', 'value', 's1');
    assert.strictEqual(processor.getData({ id: 'comp1' }, '/test', 's1'), 'value');

    // Test without surfaceId (should return undefined/do nothing)
    processor.setData({ id: 'comp1' }, '/test2', 'value');
    assert.strictEqual(processor.getData({ id: 'comp1' }, '/test2'), undefined);
  });

  it('warns when catalog not found', (t) => {
    const warn = t.mock.method(console, 'warn');
    processor.processMessages([{
      createSurface: {
        surfaceId: 's1',
        catalogId: 'unknown-catalog'
      }
    }]);
    assert.strictEqual(warn.mock.callCount(), 1);
    assert.match(warn.mock.calls[0].arguments[0], /Catalog not found: unknown-catalog/);
  });

  it('warns when duplicate surface created', (t) => {
    const warn = t.mock.method(console, 'warn');
    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);

    processor.processMessages([{
      createSurface: { surfaceId: 's1', catalogId: 'test-catalog' }
    }]);

    assert.strictEqual(warn.mock.callCount(), 1);
    assert.match(warn.mock.calls[0].arguments[0], /Surface s1 already exists/);
  });

  it('warns when updating non-existent surface', (t) => {
    const warn = t.mock.method(console, 'warn');
    processor.processMessages([{
      updateComponents: {
        surfaceId: 'unknown-s',
        components: []
      }
    }]);
    assert.strictEqual(warn.mock.callCount(), 1);
    assert.match(warn.mock.calls[0].arguments[0], /Surface not found for message: unknown-s/);
  });
});
