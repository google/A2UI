/*
 * Copyright 2026 Google LLC
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
import {describe, it, beforeEach} from 'node:test';
import {SurfaceModel} from './surface-model.js';
import {Catalog, ComponentApi} from '../catalog/types.js';
import {ComponentModel} from './component-model.js';
import {A2uiNode} from './node-types.js';
import {z} from 'zod';
import {CommonSchemas} from '../schema/common-types.js';

describe('Node Layer', () => {
  let catalog: Catalog<ComponentApi>;
  let surface: SurfaceModel<ComponentApi>;

  beforeEach(() => {
    const textApi: ComponentApi = {
      name: 'Text',
      schema: z.object({
        text: CommonSchemas.DynamicString,
      }),
    };
    const rowApi: ComponentApi = {
      name: 'Row',
      schema: z.object({
        children: CommonSchemas.ChildList,
      }),
    };
    catalog = new Catalog('test', [textApi, rowApi]);
    surface = new SurfaceModel('s1', catalog);
  });

  it('automatically creates root node when "root" component is added', () => {
    assert.strictEqual(surface.rootNode.value, undefined);

    surface.componentsModel.addComponent(
      new ComponentModel('root', 'Text', {text: 'Hello'})
    );

    const root = surface.rootNode.value as any;
    assert.ok(root);
    assert.strictEqual(root.instanceId, 'root');
    assert.strictEqual(root.type, 'Text');
    assert.strictEqual(root.props.value.text, 'Hello');
  });

  it('updates root node reactively when component properties change', () => {
    const comp = new ComponentModel('root', 'Text', {text: 'Initial'});
    surface.componentsModel.addComponent(comp);

    const root = surface.rootNode.value as any;
    assert.strictEqual(root.props.value.text, 'Initial');

    comp.properties = {text: 'Updated'};
    assert.strictEqual(root.props.value.text, 'Updated');
  });

  it('destroys root node when "root" component is deleted', () => {
    surface.componentsModel.addComponent(
      new ComponentModel('root', 'Text', {text: 'Hello'})
    );
    assert.ok(surface.rootNode.value);

    let destroyed = false;
    (surface.rootNode.value as any).onDestroyed.subscribe(() => {
      destroyed = true;
    });

    surface.componentsModel.removeComponent('root');
    assert.strictEqual(surface.rootNode.value, undefined);
    assert.strictEqual(destroyed, true);
  });

  it('expands static child lists into child nodes', async () => {
    surface.componentsModel.addComponent(
      new ComponentModel('root', 'Row', {children: ['child1']})
    );
    surface.componentsModel.addComponent(
      new ComponentModel('child1', 'Text', {text: 'I am a child'})
    );

    // Wait for async notifications to process
    await new Promise(resolve => setTimeout(resolve, 0));

    const root = surface.rootNode.value as any;
    const children = root.props.value.children;

    assert.ok(Array.isArray(children));
    assert.strictEqual(children.length, 1);
    assert.ok(children[0], 'Child node should be defined');
    assert.strictEqual(children[0].componentId, 'child1');
    assert.strictEqual(children[0].instanceId, 'child1');
    assert.strictEqual(children[0].props.value.text, 'I am a child');
  });

  it('expands template child lists into multiple child nodes based on data', async () => {
    surface.dataModel.set('/items', ['A', 'B']);

    surface.componentsModel.addComponent(
      new ComponentModel('root', 'Row', {
        children: {
          componentId: 'item-template',
          path: '/items',
        },
      })
    );
    surface.componentsModel.addComponent(
      new ComponentModel('item-template', 'Text', {text: {path: '.'}})
    );

    // Wait for async notifications
    await new Promise(resolve => setTimeout(resolve, 0));

    const root = surface.rootNode.value as any;
    let children = root.props.value.children;

    assert.strictEqual(children.length, 2);
    assert.ok(children[0]);
    assert.strictEqual(children[0].instanceId, 'item-template-[/items/0]');
    assert.strictEqual(children[0].props.value.text, 'A');
    assert.ok(children[1]);
    assert.strictEqual(children[1].instanceId, 'item-template-[/items/1]');
    assert.strictEqual(children[1].props.value.text, 'B');

    // Update data
    surface.dataModel.set('/items', ['A', 'B', 'C']);
    children = root.props.value.children;
    assert.strictEqual(children.length, 3);
    assert.ok(children[2]);
    assert.strictEqual(children[2].props.value.text, 'C');
  });

  it('recursively destroys child nodes when parent is destroyed', async () => {
    surface.componentsModel.addComponent(
      new ComponentModel('root', 'Row', {children: ['child1']})
    );
    surface.componentsModel.addComponent(
      new ComponentModel('child1', 'Text', {text: 'Child'})
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    const root = surface.rootNode.value as any;
    const child = root.props.value.children[0];
    assert.ok(child);

    let childDestroyed = false;
    child.onDestroyed.subscribe(() => {
      childDestroyed = true;
    });

    surface.componentsModel.removeComponent('root');
    assert.strictEqual(childDestroyed, true);
  });

  it('destroys child nodes when they are removed from the list', async () => {
    const rootComp = new ComponentModel('root', 'Row', {children: ['c1', 'c2']});
    surface.componentsModel.addComponent(rootComp);
    surface.componentsModel.addComponent(new ComponentModel('c1', 'Text', {text: '1'}));
    surface.componentsModel.addComponent(new ComponentModel('c2', 'Text', {text: '2'}));

    await new Promise(resolve => setTimeout(resolve, 0));

    const root = surface.rootNode.value as any;
    const c2 = root.props.value.children[1];
    assert.ok(c2);

    let c2Destroyed = false;
    c2.onDestroyed.subscribe(() => {
      c2Destroyed = true;
    });

    // Remove c2 from root's children
    rootComp.properties = {children: ['c1']};

    assert.strictEqual(root.props.value.children.length, 1);
    assert.strictEqual(c2Destroyed, true);
  });

  it('supports shared nodes via reference counting', async () => {
    // A2UI adjacency list allows multiple parents to refer to the same ID.
    // In Node Layer, if they have the same dataPath, they share the Node instance.
    
    surface.componentsModel.addComponent(
      new ComponentModel('root', 'Row', {children: ['parent1', 'parent2']})
    );
    surface.componentsModel.addComponent(
      new ComponentModel('parent1', 'Row', {children: ['shared']})
    );
    surface.componentsModel.addComponent(
      new ComponentModel('parent2', 'Row', {children: ['shared']})
    );
    surface.componentsModel.addComponent(
      new ComponentModel('shared', 'Text', {text: 'Shared'})
    );

    await new Promise(resolve => setTimeout(resolve, 0));

    const root = surface.rootNode.value as any;
    const p1 = root.props.value.children[0];
    const p2 = root.props.value.children[1];
    
    assert.ok(p1);
    assert.ok(p2);

    const shared1 = p1.props.value.children[0];
    const shared2 = p2.props.value.children[0];

    assert.ok(shared1);
    assert.ok(shared2);
    assert.strictEqual(shared1, shared2, 'Nodes with same instanceId should be shared');

    let sharedDestroyed = false;
    shared1.onDestroyed.subscribe(() => {
      sharedDestroyed = true;
    });

    // Remove shared from p1
    surface.componentsModel.get('parent1')!.properties = {children: []};
    assert.strictEqual(sharedDestroyed, false, 'Shared node should not be destroyed if still used by p2');

    // Remove parent2 from root
    surface.componentsModel.get('root')!.properties = {children: ['parent1']};
    assert.strictEqual(sharedDestroyed, true, 'Shared node should be destroyed when no longer referenced');
  });
});
