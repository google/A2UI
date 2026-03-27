/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentContext, ComponentModel, SurfaceModel, Catalog } from '@a2ui/web_core/v0_9';

import { Text } from '../../src/v0_9/catalog/minimal/components/Text';
import { Button } from '../../src/v0_9/catalog/minimal/components/Button';
import { Row } from '../../src/v0_9/catalog/minimal/components/Row';
import { Column } from '../../src/v0_9/catalog/minimal/components/Column';
import { TextField } from '../../src/v0_9/catalog/minimal/components/TextField';

const mockCatalog = new Catalog('test', [], []);

function createContext(type: string, properties: any) {
  const surface = new SurfaceModel<any>('test-surface', mockCatalog);
  const compModel = new ComponentModel('test-id', type, properties);
  surface.componentsModel.addComponent(compModel);
  return new ComponentContext(surface, 'test-id', '/');
}

describe('Text', () => {
  it('renders text and variant correctly', () => {
    const ctx = createContext('Text', { text: 'Hello', variant: 'h1' });
    const { container } = render(<Text.render context={ctx} buildChild={() => null} />);
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe('Hello');
  });

  it('renders default variant', () => {
    const ctx = createContext('Text', { text: 'Hello' });
    const { container } = render(<Text.render context={ctx} buildChild={() => null} />);
    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe('Hello');
  });
});

describe('Button', () => {
  it('renders and dispatches action', () => {
    const ctx = createContext('Button', { 
      child: 'btn-child',
      variant: 'primary',
      action: { event: { name: 'test_action' } }
    });

    const spy = vi.spyOn(ctx, 'dispatchAction').mockResolvedValue();

    const buildChild = vi.fn().mockImplementation((id) => <span data-testid="child">{id}</span>);

    render(<Button.render context={ctx} buildChild={buildChild} />);

    const button = screen.getByRole('button');
    expect(button).not.toBeNull();
    expect(screen.getByTestId('child').textContent).toBe('btn-child');
    
    // Check style for primary variant
    expect(button.style.backgroundColor).toBe('rgb(0, 123, 255)'); // #007bff in rgb

    fireEvent.click(button);
    expect(spy).toHaveBeenCalledWith({ event: { name: 'test_action' } });
  });
});

describe('Row', () => {
  it('renders children with correct flex styles', () => {
    const ctx = createContext('Row', {
      children: ['c1', 'c2'],
      justify: 'spaceBetween',
      align: 'center'
    });

    const buildChild = vi.fn().mockImplementation((id) => <div data-testid={id}>{id}</div>);

    const { container } = render(<Row.render context={ctx} buildChild={buildChild} />);
    const rowDiv = container.firstChild as HTMLElement;
    expect(rowDiv.style.display).toBe('flex');
    expect(rowDiv.style.flexDirection).toBe('row');
    expect(rowDiv.style.justifyContent).toBe('space-between');
    expect(rowDiv.style.alignItems).toBe('center');

    expect(screen.getByTestId('c1')).toBeDefined();
    expect(screen.getByTestId('c2')).toBeDefined();
  });
});

describe('Column', () => {
  it('renders children with correct flex styles', () => {
    const ctx = createContext('Column', {
      children: ['c1'],
      justify: 'center',
      align: 'start'
    });

    const buildChild = vi.fn().mockImplementation((id) => <div data-testid={id}>{id}</div>);

    const { container } = render(<Column.render context={ctx} buildChild={buildChild} />);
    const colDiv = container.firstChild as HTMLElement;
    expect(colDiv.style.display).toBe('flex');
    expect(colDiv.style.flexDirection).toBe('column');
    expect(colDiv.style.justifyContent).toBe('center');
    expect(colDiv.style.alignItems).toBe('flex-start');

    expect(screen.getByTestId('c1')).toBeDefined();
  });
});

describe('TextField', () => {
  it('renders label and text input', () => {
    const ctx = createContext('TextField', {
      label: 'Username',
      value: 'alice',
      variant: 'shortText'
    });

    const { container } = render(<TextField.render context={ctx} buildChild={() => null} />);
    const label = container.querySelector('label');
    expect(label?.textContent).toBe('Username');

    const input = container.querySelector('input');
    expect(input?.type).toBe('text');
    expect(input?.value).toBe('alice');
  });

  it('renders textarea for longText', () => {
    const ctx = createContext('TextField', {
      label: 'Comments',
      value: 'lots of text',
      variant: 'longText'
    });

    const { container } = render(<TextField.render context={ctx} buildChild={() => null} />);
    const textarea = container.querySelector('textarea');
    expect(textarea).not.toBeNull();
    expect(textarea?.value).toBe('lots of text');
  });

  it('updates data model on change', () => {
    const ctx = createContext('TextField', {
      label: 'Username',
      value: { path: '/user' }
    });

    const spySet = vi.spyOn(ctx.dataContext, 'set');

    const { container } = render(<TextField.render context={ctx} buildChild={() => null} />);
    const input = container.querySelector('input');
    
    fireEvent.change(input!, { target: { value: 'bob' } });
    
    expect(spySet).toHaveBeenCalledWith('/user', 'bob');
  });
});
