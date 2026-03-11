import { describe, it, expect } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { MessageProcessor } from '@a2ui/web_core/v0_9';
import { A2uiSurface } from './A2uiSurface';
import { minimalCatalog } from './catalog';

describe('Integration: Typing in TextField', () => {
  it('updates the input value when typing', async () => {
    const processor = new MessageProcessor([minimalCatalog as any], async () => {});

    // Create surface and components
    processor.processMessages([
      {
        version: "v0.9",
        createSurface: {
          surfaceId: "test_form",
          catalogId: "https://a2ui.org/specification/v0_9/catalogs/minimal/minimal_catalog.json"
        }
      } as any,
      {
        version: "v0.9",
        updateComponents: {
          surfaceId: "test_form",
          components: [
            {
              id: "root",
              component: "TextField",
              label: "Username",
              value: { path: "/username" }
            }
          ]
        }
      } as any
    ]);

    const surface = processor.model.getSurface("test_form");
    expect(surface).toBeDefined();

    render(
      <React.StrictMode>
        <A2uiSurface surface={surface!} />
      </React.StrictMode>
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeDefined();
    
    // Initially empty
    expect(input.value).toBe('');

    // Type "A"
    await act(async () => {
      fireEvent.change(input, { target: { value: 'A' } });
    });

    // Wait and check if the input value has been updated
    expect(input.value).toBe('A');
    expect(surface!.dataModel.get('/username')).toBe('A');
    
    // Type "B"
    await act(async () => {
      fireEvent.change(input, { target: { value: 'AB' } });
    });

    expect(input.value).toBe('AB');
    expect(surface!.dataModel.get('/username')).toBe('AB');
  });
});
