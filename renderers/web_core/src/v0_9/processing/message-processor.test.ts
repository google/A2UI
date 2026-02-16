
import assert from 'node:assert';
import { test, describe, it, beforeEach } from 'node:test';
import { A2uiMessageProcessor } from './message-processor.js';
import { CatalogApi, ComponentApi } from '../catalog/types.js';
import { CommonTypes, annotated } from '../catalog/schema_types.js';
import { z } from 'zod';

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

  it('generates capabilities with correct references', () => {
    // 1. Define Test Components
    const SimpleComponentSchema = z.object({
      title: annotated(CommonTypes.DynamicString, 'The title text'),
      count: CommonTypes.DynamicNumber
    });

    const ComplexComponentSchema = z.object({
      action: CommonTypes.Action,
      children: CommonTypes.ChildList
    });

    const SimpleComp: ComponentApi = {
      name: 'Simple',
      schema: SimpleComponentSchema
    };

    const ComplexComp: ComponentApi = {
      name: 'Complex',
      schema: ComplexComponentSchema
    };

    const capsCatalog: CatalogApi = {
      id: 'caps-catalog',
      components: new Map([
        ['Simple', SimpleComp],
        ['Complex', ComplexComp]
      ])
    };

    // 2. Initialize Processor
    const capsProcessor = new A2uiMessageProcessor([capsCatalog], async () => {});

    // 3. Generate Capabilities
    const capabilities = capsProcessor.getClientCapabilities({ inlineCatalogs: [capsCatalog] });
    
    assert.ok(capabilities.inlineCatalogs, 'Should have inline catalogs');
    const generatedCatalog = capabilities.inlineCatalogs[0];
    assert.strictEqual(generatedCatalog.catalogId, 'caps-catalog');

    const components = generatedCatalog.components;
    assert.ok(components.Simple, 'Simple component should be present');
    assert.ok(components.Complex, 'Complex component should be present');

    // 4. Verify Simple Component Structure
    const simpleDef = components.Simple;
    assert.strictEqual(simpleDef.type, 'object');
    // Check Envelope
    const commonRef = simpleDef.allOf.find((x: any) => x.$ref === 'common_types.json#/$defs/ComponentCommon');
    assert.ok(commonRef, 'Should reference ComponentCommon');

    // Check Properties
    const propsSchema = simpleDef.allOf.find((x: any) => x.properties && x.properties.component);
    assert.ok(propsSchema, 'Should have properties block');
    assert.strictEqual(propsSchema.properties.component.const, 'Simple');
    
    // Check Property References (DynamicString -> $ref)
    const titleProp = propsSchema.properties.title;
    assert.strictEqual(titleProp.$ref, 'common_types.json#/$defs/DynamicString', 'title should ref DynamicString');
    assert.strictEqual(titleProp.description, 'The title text');

    // 5. Verify Complex Component Structure
    const complexDef = components.Complex;
    const complexProps = complexDef.allOf.find((x: any) => x.properties && x.properties.component).properties;
    
    assert.strictEqual(complexProps.action.$ref, 'common_types.json#/$defs/Action');
    assert.strictEqual(complexProps.children.$ref, 'common_types.json#/$defs/ChildList');
  });
});
