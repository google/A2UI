import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentContext, ComponentModel, SurfaceModel, Catalog } from '@a2ui/web_core/v0_9';

import { ReactText } from './components/ReactText';
import { ReactButton } from './components/ReactButton';
import { ReactRow } from './components/ReactRow';
import { ReactColumn } from './components/ReactColumn';
import { ReactTextField } from './components/ReactTextField';

const mockCatalog = new Catalog('test', [], {});

function createContext(type: string, properties: any) {
  const surface = new SurfaceModel<any>('test-surface', mockCatalog);
  const compModel = new ComponentModel('test-id', type, properties);
  surface.componentsModel.addComponent(compModel);
  return new ComponentContext(surface, 'test-id', '/');
}

describe('ReactText', () => {
  it('renders text and variant correctly', () => {
    const ctx = createContext('Text', { text: 'Hello', variant: 'h1' });
    const { container } = render(<ReactText.render context={ctx} buildChild={() => null} />);
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe('Hello');
  });

  it('renders default variant', () => {
    const ctx = createContext('Text', { text: 'Hello' });
    const { container } = render(<ReactText.render context={ctx} buildChild={() => null} />);
    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe('Hello');
  });
});

describe('ReactButton', () => {
  it('renders and dispatches action', () => {
    const ctx = createContext('Button', { 
      child: 'btn-child',
      variant: 'primary',
      action: { event: { name: 'test_action' } }
    });

    const spy = vi.spyOn(ctx, 'dispatchAction').mockResolvedValue();

    const buildChild = vi.fn().mockImplementation((id) => <span data-testid="child">{id}</span>);

    render(<ReactButton.render context={ctx} buildChild={buildChild} />);

    const button = screen.getByRole('button');
    expect(button).not.toBeNull();
    expect(screen.getByTestId('child').textContent).toBe('btn-child');
    
    // Check style for primary variant
    expect(button.style.backgroundColor).toBe('rgb(0, 123, 255)'); // #007bff in rgb

    fireEvent.click(button);
    expect(spy).toHaveBeenCalledWith({ event: { name: 'test_action' } });
  });
});

describe('ReactRow', () => {
  it('renders children with correct flex styles', () => {
    const ctx = createContext('Row', {
      children: ['c1', 'c2'],
      justify: 'spaceBetween',
      align: 'center'
    });

    const buildChild = vi.fn().mockImplementation((id) => <div data-testid={id}>{id}</div>);

    const { container } = render(<ReactRow.render context={ctx} buildChild={buildChild} />);
    const rowDiv = container.firstChild as HTMLElement;
    expect(rowDiv.style.display).toBe('flex');
    expect(rowDiv.style.flexDirection).toBe('row');
    expect(rowDiv.style.justifyContent).toBe('space-between');
    expect(rowDiv.style.alignItems).toBe('center');

    expect(screen.getByTestId('c1')).toBeDefined();
    expect(screen.getByTestId('c2')).toBeDefined();
  });
});

describe('ReactColumn', () => {
  it('renders children with correct flex styles', () => {
    const ctx = createContext('Column', {
      children: ['c1'],
      justify: 'center',
      align: 'start'
    });

    const buildChild = vi.fn().mockImplementation((id) => <div data-testid={id}>{id}</div>);

    const { container } = render(<ReactColumn.render context={ctx} buildChild={buildChild} />);
    const colDiv = container.firstChild as HTMLElement;
    expect(colDiv.style.display).toBe('flex');
    expect(colDiv.style.flexDirection).toBe('column');
    expect(colDiv.style.justifyContent).toBe('center');
    expect(colDiv.style.alignItems).toBe('flex-start');

    expect(screen.getByTestId('c1')).toBeDefined();
  });
});

describe('ReactTextField', () => {
  it('renders label and text input', () => {
    const ctx = createContext('TextField', {
      label: 'Username',
      value: 'alice',
      variant: 'shortText'
    });

    const { container } = render(<ReactTextField.render context={ctx} buildChild={() => null} />);
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

    const { container } = render(<ReactTextField.render context={ctx} buildChild={() => null} />);
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

    const { container } = render(<ReactTextField.render context={ctx} buildChild={() => null} />);
    const input = container.querySelector('input');
    
    fireEvent.change(input!, { target: { value: 'bob' } });
    
    expect(spySet).toHaveBeenCalledWith('/user', 'bob');
  });
});
