/**
 * Component Buffer Tests
 */

import {
  createComponentBuffer,
  traverseComponents,
  findComponentsByType,
  findComponent,
  getComponentTree,
} from '../state/component-buffer';
import type { TextComponent } from '../types/a2ui-types';

describe('createComponentBuffer', () => {
  describe('basic operations', () => {
    it('should add and retrieve components', () => {
      const buffer = createComponentBuffer();
      const component: TextComponent = {
        id: 'text1',
        type: 'Text',
        content: 'Hello World',
      };

      buffer.set(component);

      expect(buffer.get('text1')).toEqual(component);
    });

    it('should check if component exists', () => {
      const buffer = createComponentBuffer();
      buffer.set({ id: 'text1', type: 'Text', content: 'Hello' });

      expect(buffer.has('text1')).toBe(true);
      expect(buffer.has('nonexistent')).toBe(false);
    });

    it('should remove components', () => {
      const buffer = createComponentBuffer();
      buffer.set({ id: 'text1', type: 'Text', content: 'Hello' });

      expect(buffer.remove('text1')).toBe(true);
      expect(buffer.has('text1')).toBe(false);
      expect(buffer.remove('text1')).toBe(false);
    });

    it('should return undefined for missing components', () => {
      const buffer = createComponentBuffer();

      expect(buffer.get('nonexistent')).toBeUndefined();
    });

    it('should update existing components', () => {
      const buffer = createComponentBuffer();
      buffer.set({ id: 'text1', type: 'Text', content: 'Hello' } as TextComponent);
      buffer.set({ id: 'text1', type: 'Text', content: 'Updated' } as TextComponent);

      const component = buffer.get('text1') as TextComponent;
      expect(component?.content).toBe('Updated');
    });
  });

  describe('collection operations', () => {
    it('should get all component IDs', () => {
      const buffer = createComponentBuffer();
      buffer.set({ id: 'a', type: 'Text', content: 'A' });
      buffer.set({ id: 'b', type: 'Text', content: 'B' });
      buffer.set({ id: 'c', type: 'Text', content: 'C' });

      const ids = buffer.getIds();

      expect(ids).toHaveLength(3);
      expect(ids).toContain('a');
      expect(ids).toContain('b');
      expect(ids).toContain('c');
    });

    it('should get all components', () => {
      const buffer = createComponentBuffer();
      buffer.set({ id: 'a', type: 'Text', content: 'A' } as TextComponent);
      buffer.set({ id: 'b', type: 'Image', src: 'http://example.com/b.png' });

      const components = buffer.getAll();

      expect(components).toHaveLength(2);
      expect(components.map(c => c.id)).toContain('a');
      expect(components.map(c => c.id)).toContain('b');
    });

    it('should clear all components', () => {
      const buffer = createComponentBuffer();
      buffer.set({ id: 'a', type: 'Text', content: 'A' });
      buffer.set({ id: 'b', type: 'Text', content: 'B' });

      buffer.clear();

      expect(buffer.size()).toBe(0);
      expect(buffer.getIds()).toHaveLength(0);
    });

    it('should return correct size', () => {
      const buffer = createComponentBuffer();

      expect(buffer.size()).toBe(0);

      buffer.set({ id: 'a', type: 'Text', content: 'A' });
      expect(buffer.size()).toBe(1);

      buffer.set({ id: 'b', type: 'Text', content: 'B' });
      expect(buffer.size()).toBe(2);

      buffer.remove('a');
      expect(buffer.size()).toBe(1);
    });

    it('should convert to Map', () => {
      const buffer = createComponentBuffer();
      buffer.set({ id: 'a', type: 'Text', content: 'A' } as TextComponent);
      buffer.set({ id: 'b', type: 'Image', src: 'http://example.com/b.png' });

      const map = buffer.toMap();

      expect(map).toBeInstanceOf(Map);
      expect(map.size).toBe(2);
      expect(map.get('a')?.type).toBe('Text');
      expect(map.get('b')?.type).toBe('Image');
    });
  });

  describe('getChildren', () => {
    it('should get children of a component', () => {
      const buffer = createComponentBuffer();
      buffer.set({ id: 'parent', type: 'Column', children: ['child1', 'child2'] });
      buffer.set({ id: 'child1', type: 'Text', content: 'Child 1' });
      buffer.set({ id: 'child2', type: 'Text', content: 'Child 2' });

      const children = buffer.getChildren('parent');

      expect(children).toHaveLength(2);
      expect(children[0].id).toBe('child1');
      expect(children[1].id).toBe('child2');
    });

    it('should return empty array for component without children', () => {
      const buffer = createComponentBuffer();
      buffer.set({ id: 'text1', type: 'Text', content: 'Hello' });

      const children = buffer.getChildren('text1');

      expect(children).toHaveLength(0);
    });

    it('should return empty array for nonexistent component', () => {
      const buffer = createComponentBuffer();

      const children = buffer.getChildren('nonexistent');

      expect(children).toHaveLength(0);
    });

    it('should filter out missing children', () => {
      const buffer = createComponentBuffer();
      buffer.set({ id: 'parent', type: 'Column', children: ['child1', 'missing', 'child2'] });
      buffer.set({ id: 'child1', type: 'Text', content: 'Child 1' });
      buffer.set({ id: 'child2', type: 'Text', content: 'Child 2' });

      const children = buffer.getChildren('parent');

      expect(children).toHaveLength(2);
    });
  });
});

describe('traverseComponents', () => {
  it('should traverse component tree depth-first', () => {
    const buffer = createComponentBuffer();
    buffer.set({ id: 'root', type: 'Column', children: ['a', 'b'] });
    buffer.set({ id: 'a', type: 'Row', children: ['a1', 'a2'] });
    buffer.set({ id: 'a1', type: 'Text', content: 'A1' });
    buffer.set({ id: 'a2', type: 'Text', content: 'A2' });
    buffer.set({ id: 'b', type: 'Text', content: 'B' });

    const visited: string[] = [];
    traverseComponents(buffer, 'root', (component) => {
      visited.push(component.id);
    });

    expect(visited).toEqual(['root', 'a', 'a1', 'a2', 'b']);
  });

  it('should provide correct depth', () => {
    const buffer = createComponentBuffer();
    buffer.set({ id: 'root', type: 'Column', children: ['a'] });
    buffer.set({ id: 'a', type: 'Row', children: ['a1'] });
    buffer.set({ id: 'a1', type: 'Text', content: 'A1' });

    const depths: Record<string, number> = {};
    traverseComponents(buffer, 'root', (component, depth) => {
      depths[component.id] = depth;
    });

    expect(depths).toEqual({ root: 0, a: 1, a1: 2 });
  });

  it('should stop traversal when visitor returns false', () => {
    const buffer = createComponentBuffer();
    buffer.set({ id: 'root', type: 'Column', children: ['a', 'b', 'c'] });
    buffer.set({ id: 'a', type: 'Text', content: 'A' } as TextComponent);
    buffer.set({ id: 'b', type: 'Text', content: 'B' } as TextComponent);
    buffer.set({ id: 'c', type: 'Text', content: 'C' } as TextComponent);

    const visited: string[] = [];
    traverseComponents(buffer, 'root', (component): void | false => {
      visited.push(component.id);
      if (component.id === 'b') return false;
      return;
    });

    expect(visited).toEqual(['root', 'a', 'b']);
  });

  it('should handle missing root', () => {
    const buffer = createComponentBuffer();

    const visited: string[] = [];
    traverseComponents(buffer, 'nonexistent', (component) => {
      visited.push(component.id);
    });

    expect(visited).toHaveLength(0);
  });
});

describe('findComponentsByType', () => {
  it('should find all components of a type', () => {
    const buffer = createComponentBuffer();
    buffer.set({ id: 'text1', type: 'Text', content: 'A' } as TextComponent);
    buffer.set({ id: 'img1', type: 'Image', src: 'http://example.com/b.png' });
    buffer.set({ id: 'text2', type: 'Text', content: 'C' } as TextComponent);
    buffer.set({ id: 'img2', type: 'Image', src: 'http://example.com/d.png' });

    const textComponents = findComponentsByType(buffer, 'Text');

    expect(textComponents).toHaveLength(2);
    expect(textComponents.map(c => c.id)).toContain('text1');
    expect(textComponents.map(c => c.id)).toContain('text2');
  });

  it('should return empty array when no components match', () => {
    const buffer = createComponentBuffer();
    buffer.set({ id: 'text1', type: 'Text', content: 'A' } as TextComponent);

    const images = findComponentsByType(buffer, 'Image');

    expect(images).toHaveLength(0);
  });
});

describe('findComponent', () => {
  it('should find component by predicate', () => {
    const buffer = createComponentBuffer();
    buffer.set({ id: 'text1', type: 'Text', content: 'Hello' } as TextComponent);
    buffer.set({ id: 'text2', type: 'Text', content: 'World' } as TextComponent);

    const found = findComponent(buffer, c => (c as TextComponent).content === 'World');

    expect(found?.id).toBe('text2');
  });

  it('should return undefined when no component matches', () => {
    const buffer = createComponentBuffer();
    buffer.set({ id: 'text1', type: 'Text', content: 'Hello' } as TextComponent);

    const found = findComponent(buffer, c => (c as TextComponent).content === 'NotFound');

    expect(found).toBeUndefined();
  });
});

describe('getComponentTree', () => {
  it('should build nested tree structure', () => {
    const buffer = createComponentBuffer();
    buffer.set({ id: 'root', type: 'Column', children: ['a', 'b'] });
    buffer.set({ id: 'a', type: 'Text', content: 'A' });
    buffer.set({ id: 'b', type: 'Row', children: ['b1'] });
    buffer.set({ id: 'b1', type: 'Text', content: 'B1' });

    const tree = getComponentTree(buffer, 'root');

    expect(tree).toEqual({
      id: 'root',
      type: 'Column',
      children: [
        { id: 'a', type: 'Text' },
        {
          id: 'b',
          type: 'Row',
          children: [{ id: 'b1', type: 'Text' }],
        },
      ],
    });
  });

  it('should return null for missing root', () => {
    const buffer = createComponentBuffer();

    const tree = getComponentTree(buffer, 'nonexistent');

    expect(tree).toBeNull();
  });

  it('should handle leaf components', () => {
    const buffer = createComponentBuffer();
    buffer.set({ id: 'text', type: 'Text', content: 'Hello' });

    const tree = getComponentTree(buffer, 'text');

    expect(tree).toEqual({ id: 'text', type: 'Text' });
  });

  it('should filter out null children', () => {
    const buffer = createComponentBuffer();
    buffer.set({ id: 'root', type: 'Column', children: ['a', 'missing', 'b'] });
    buffer.set({ id: 'a', type: 'Text', content: 'A' });
    buffer.set({ id: 'b', type: 'Text', content: 'B' });

    const tree = getComponentTree(buffer, 'root');

    expect(tree?.children).toHaveLength(2);
  });
});
