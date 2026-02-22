/**
 * Surface Registry Tests
 */

import {
  createSurfaceRegistry,
  getComponentFromSurface,
  getRootComponent,
} from '../state/surface-registry';
import type { A2UIComponent, TextComponent } from '../types/a2ui-types';

describe('createSurfaceRegistry', () => {
  describe('surface creation', () => {
    it('should create a new surface', () => {
      const registry = createSurfaceRegistry();

      registry.createSurface('main', 'root');

      expect(registry.hasSurface('main')).toBe(true);
      const surface = registry.getSurface('main');
      expect(surface?.id).toBe('main');
      expect(surface?.rootId).toBe('root');
    });

    it('should update rootId of existing surface', () => {
      const registry = createSurfaceRegistry();

      registry.createSurface('main', 'root1');
      registry.createSurface('main', 'root2');

      const surface = registry.getSurface('main');
      expect(surface?.rootId).toBe('root2');
    });

    it('should call onSurfaceCreated callback', () => {
      const onSurfaceCreated = jest.fn();
      const registry = createSurfaceRegistry({ onSurfaceCreated });

      registry.createSurface('main', 'root');

      expect(onSurfaceCreated).toHaveBeenCalledTimes(1);
      expect(onSurfaceCreated).toHaveBeenCalledWith('main');
    });

    it('should not call onSurfaceCreated for existing surface', () => {
      const onSurfaceCreated = jest.fn();
      const registry = createSurfaceRegistry({ onSurfaceCreated });

      registry.createSurface('main', 'root');
      registry.createSurface('main', 'newRoot');

      expect(onSurfaceCreated).toHaveBeenCalledTimes(1);
    });
  });

  describe('surface retrieval', () => {
    it('should get surface by ID', () => {
      const registry = createSurfaceRegistry();
      registry.createSurface('main', 'root');

      const surface = registry.getSurface('main');

      expect(surface).toBeDefined();
      expect(surface?.id).toBe('main');
    });

    it('should return undefined for nonexistent surface', () => {
      const registry = createSurfaceRegistry();

      const surface = registry.getSurface('nonexistent');

      expect(surface).toBeUndefined();
    });

    it('should check if surface exists', () => {
      const registry = createSurfaceRegistry();
      registry.createSurface('main', 'root');

      expect(registry.hasSurface('main')).toBe(true);
      expect(registry.hasSurface('nonexistent')).toBe(false);
    });

    it('should get all surface IDs', () => {
      const registry = createSurfaceRegistry();
      registry.createSurface('main', 'root');
      registry.createSurface('secondary', 'root2');

      const ids = registry.getSurfaceIds();

      expect(ids).toHaveLength(2);
      expect(ids).toContain('main');
      expect(ids).toContain('secondary');
    });
  });

  describe('surface deletion', () => {
    it('should delete a surface', () => {
      const registry = createSurfaceRegistry();
      registry.createSurface('main', 'root');

      const result = registry.deleteSurface('main');

      expect(result).toBe(true);
      expect(registry.hasSurface('main')).toBe(false);
    });

    it('should return false for nonexistent surface', () => {
      const registry = createSurfaceRegistry();

      const result = registry.deleteSurface('nonexistent');

      expect(result).toBe(false);
    });

    it('should call onSurfaceDeleted callback', () => {
      const onSurfaceDeleted = jest.fn();
      const registry = createSurfaceRegistry({ onSurfaceDeleted });
      registry.createSurface('main', 'root');

      registry.deleteSurface('main');

      expect(onSurfaceDeleted).toHaveBeenCalledTimes(1);
      expect(onSurfaceDeleted).toHaveBeenCalledWith('main');
    });
  });

  describe('component updates', () => {
    it('should update components in a surface', () => {
      const registry = createSurfaceRegistry();
      registry.createSurface('main', 'root');

      const components: A2UIComponent[] = [
        { id: 'root', type: 'Column', children: ['text1'] },
        { id: 'text1', type: 'Text', content: 'Hello' },
      ];
      registry.updateComponents('main', components);

      const surface = registry.getSurface('main');
      expect(surface?.components.get('root')).toBeDefined();
      expect(surface?.components.get('text1')).toBeDefined();
    });

    it('should call onSurfaceUpdated callback', () => {
      const onSurfaceUpdated = jest.fn();
      const registry = createSurfaceRegistry({ onSurfaceUpdated });
      registry.createSurface('main', 'root');

      registry.updateComponents('main', [
        { id: 'root', type: 'Text', content: 'Hello' },
      ]);

      expect(onSurfaceUpdated).toHaveBeenCalledWith('main');
    });

    it('should ignore updates to nonexistent surface', () => {
      const onSurfaceUpdated = jest.fn();
      const registry = createSurfaceRegistry({ onSurfaceUpdated });

      registry.updateComponents('nonexistent', [
        { id: 'root', type: 'Text', content: 'Hello' },
      ]);

      expect(onSurfaceUpdated).not.toHaveBeenCalled();
    });
  });

  describe('data model updates', () => {
    it('should update data model at path', () => {
      const registry = createSurfaceRegistry();
      registry.createSurface('main', 'root');

      registry.updateDataModel('main', ['user', 'name'], 'John');

      const surface = registry.getSurface('main');
      expect(surface?.dataModel).toEqual({
        user: { name: 'John' },
      });
    });

    it('should replace entire data model with empty path', () => {
      const registry = createSurfaceRegistry();
      registry.createSurface('main', 'root');

      const newData = { users: [], settings: { theme: 'dark' } };
      registry.updateDataModel('main', [], newData);

      const surface = registry.getSurface('main');
      expect(surface?.dataModel).toEqual(newData);
    });

    it('should create nested objects', () => {
      const registry = createSurfaceRegistry();
      registry.createSurface('main', 'root');

      registry.updateDataModel('main', ['a', 'b', 'c'], 'value');

      const surface = registry.getSurface('main');
      expect(surface?.dataModel).toEqual({
        a: { b: { c: 'value' } },
      });
    });

    it('should call onSurfaceUpdated callback', () => {
      const onSurfaceUpdated = jest.fn();
      const registry = createSurfaceRegistry({ onSurfaceUpdated });
      registry.createSurface('main', 'root');

      registry.updateDataModel('main', ['key'], 'value');

      expect(onSurfaceUpdated).toHaveBeenCalledWith('main');
    });

    it('should ignore updates to nonexistent surface', () => {
      const onSurfaceUpdated = jest.fn();
      const registry = createSurfaceRegistry({ onSurfaceUpdated });

      registry.updateDataModel('nonexistent', ['key'], 'value');

      expect(onSurfaceUpdated).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all surfaces', () => {
      const registry = createSurfaceRegistry();
      registry.createSurface('main', 'root');
      registry.createSurface('secondary', 'root2');

      registry.clear();

      expect(registry.getSurfaceIds()).toHaveLength(0);
      expect(registry.hasSurface('main')).toBe(false);
      expect(registry.hasSurface('secondary')).toBe(false);
    });

    it('should call onSurfaceDeleted for each surface', () => {
      const onSurfaceDeleted = jest.fn();
      const registry = createSurfaceRegistry({ onSurfaceDeleted });
      registry.createSurface('main', 'root');
      registry.createSurface('secondary', 'root2');

      registry.clear();

      expect(onSurfaceDeleted).toHaveBeenCalledTimes(2);
    });
  });

  describe('subscription', () => {
    it('should notify subscribers on surface creation', () => {
      const registry = createSurfaceRegistry();
      const listener = jest.fn();

      registry.subscribe(listener);
      registry.createSurface('main', 'root');

      expect(listener).toHaveBeenCalledWith('main');
    });

    it('should notify subscribers on component update', () => {
      const registry = createSurfaceRegistry();
      const listener = jest.fn();
      registry.createSurface('main', 'root');

      registry.subscribe(listener);
      registry.updateComponents('main', [{ id: 'text', type: 'Text', content: 'Hi' }]);

      expect(listener).toHaveBeenCalledWith('main');
    });

    it('should notify subscribers on data model update', () => {
      const registry = createSurfaceRegistry();
      const listener = jest.fn();
      registry.createSurface('main', 'root');

      registry.subscribe(listener);
      registry.updateDataModel('main', ['key'], 'value');

      expect(listener).toHaveBeenCalledWith('main');
    });

    it('should notify subscribers on deletion', () => {
      const registry = createSurfaceRegistry();
      const listener = jest.fn();
      registry.createSurface('main', 'root');

      registry.subscribe(listener);
      registry.deleteSurface('main');

      expect(listener).toHaveBeenCalledWith('main');
    });

    it('should allow unsubscribing', () => {
      const registry = createSurfaceRegistry();
      const listener = jest.fn();

      const unsubscribe = registry.subscribe(listener);
      unsubscribe();
      registry.createSurface('main', 'root');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple subscribers', () => {
      const registry = createSurfaceRegistry();
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      registry.subscribe(listener1);
      registry.subscribe(listener2);
      registry.createSurface('main', 'root');

      expect(listener1).toHaveBeenCalledWith('main');
      expect(listener2).toHaveBeenCalledWith('main');
    });
  });
});

describe('getComponentFromSurface', () => {
  it('should get component from surface by ID', () => {
    const registry = createSurfaceRegistry();
    registry.createSurface('main', 'root');
    registry.updateComponents('main', [
      { id: 'text1', type: 'Text', content: 'Hello' } as TextComponent,
    ]);

    const surface = registry.getSurface('main')!;
    const component = getComponentFromSurface(surface, 'text1') as TextComponent;

    expect(component?.content).toBe('Hello');
  });

  it('should return undefined for missing component', () => {
    const registry = createSurfaceRegistry();
    registry.createSurface('main', 'root');

    const surface = registry.getSurface('main')!;
    const component = getComponentFromSurface(surface, 'nonexistent');

    expect(component).toBeUndefined();
  });
});

describe('getRootComponent', () => {
  it('should get root component of surface', () => {
    const registry = createSurfaceRegistry();
    registry.createSurface('main', 'root');
    registry.updateComponents('main', [
      { id: 'root', type: 'Column', children: ['text1'] },
      { id: 'text1', type: 'Text', content: 'Hello' },
    ]);

    const surface = registry.getSurface('main')!;
    const root = getRootComponent(surface);

    expect(root?.id).toBe('root');
    expect(root?.type).toBe('Column');
  });

  it('should return undefined if root not in components', () => {
    const registry = createSurfaceRegistry();
    registry.createSurface('main', 'root');

    const surface = registry.getSurface('main')!;
    const root = getRootComponent(surface);

    expect(root).toBeUndefined();
  });
});
