import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import * as storage from '@/lib/storage';
import { Widget } from '@/types/widget';
import React from 'react';

vi.mock('@/lib/storage', () => ({
  getWidgets: vi.fn(),
  saveWidget: vi.fn(),
  deleteWidget: vi.fn(),
}));

describe('WidgetsContext', () => {
  const mockWidget: Widget = {
    id: '1',
    name: 'Test Widget',
    createdAt: new Date(),
    updatedAt: new Date(),
    root: 'root',
    components: [],
    dataStates: [],
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.mocked(storage.getWidgets).mockResolvedValue([mockWidget]);
  });

  const getTestUtils = async () => {
    const { WidgetsProvider, useWidgets } = await import('./widgets-context');
    
    const TestComponent = () => {
      const { widgets, loading, addWidget, updateWidget, removeWidget } = useWidgets();
      if (loading) return <div>Loading...</div>;
      return (
        <div>
          <div data-testid="count">{widgets.length}</div>
          {widgets.map(w => (
            <div key={w.id} data-testid={`widget-${w.id}`}>{w.name}</div>
          ))}
          <button onClick={() => addWidget({ id: '2', name: 'New', createdAt: new Date(), updatedAt: new Date(), root: 'root', components: [], dataStates: [] })}>Add</button>
          <button onClick={() => updateWidget('1', { name: 'Updated' })}>Update</button>
          <button onClick={() => removeWidget('1')}>Remove</button>
        </div>
      );
    };

    return { WidgetsProvider, TestComponent };
  };

  it('should load widgets on mount', async () => {
    const { WidgetsProvider, TestComponent } = await getTestUtils();
    await act(async () => {
      render(
        <WidgetsProvider>
          <TestComponent />
        </WidgetsProvider>
      );
    });

    const count = await screen.findByTestId('count');
    expect(count).toHaveTextContent('1');
    expect(screen.getByTestId('widget-1')).toHaveTextContent('Test Widget');
  });

  it('should add a widget', async () => {
    const { WidgetsProvider, TestComponent } = await getTestUtils();
    await act(async () => {
      render(
        <WidgetsProvider>
          <TestComponent />
        </WidgetsProvider>
      );
    });

    await screen.findByTestId('count');
    
    await act(async () => {
      screen.getByText('Add').click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(storage.saveWidget).toHaveBeenCalled();
  });

  it('should update a widget', async () => {
    const { WidgetsProvider, TestComponent } = await getTestUtils();
    await act(async () => {
      render(
        <WidgetsProvider>
          <TestComponent />
        </WidgetsProvider>
      );
    });

    await screen.findByTestId('count');
    
    await act(async () => {
      screen.getByText('Update').click();
    });

    expect(screen.getByTestId('widget-1')).toHaveTextContent('Updated');
    expect(storage.saveWidget).toHaveBeenCalled();
  });

  it('should remove a widget', async () => {
    const { WidgetsProvider, TestComponent } = await getTestUtils();
    await act(async () => {
      render(
        <WidgetsProvider>
          <TestComponent />
        </WidgetsProvider>
      );
    });

    await screen.findByTestId('count');
    
    await act(async () => {
      screen.getByText('Remove').click();
    });

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(storage.deleteWidget).toHaveBeenCalledWith('1');
  });
});
