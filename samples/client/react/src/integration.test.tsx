import { describe, it, expect } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { MessageProcessor } from '@a2ui/web_core/v0_9';
import { A2uiSurface, minimalCatalog } from '@a2ui/react';

import ex1 from "../../../../specification/v0_9/json/catalogs/minimal/examples/1_simple_text.json";
import ex2 from "../../../../specification/v0_9/json/catalogs/minimal/examples/2_row_layout.json";
import ex4 from "../../../../specification/v0_9/json/catalogs/minimal/examples/4_login_form.json";
import ex6 from "../../../../specification/v0_9/json/catalogs/minimal/examples/6_capitalized_text.json";
import ex7 from "../../../../specification/v0_9/json/catalogs/minimal/examples/7_incremental.json";

describe('Gallery Integration Tests', () => {
  it('renders Simple Text -> "Hello Minimal Catalog"', async () => {
    const processor = new MessageProcessor([minimalCatalog as any], async () => {});
    processor.processMessages(ex1.messages as any[]);
    
    const surface = processor.model.getSurface("example_1");
    expect(surface).toBeDefined();

    render(
      <React.StrictMode>
        <A2uiSurface surface={surface!} />
      </React.StrictMode>
    );

    expect(screen.getByText('Hello, Minimal Catalog!')).toBeInTheDocument();
  });

  it('renders Row layout -> content visibility', async () => {
    const processor = new MessageProcessor([minimalCatalog as any], async () => {});
    processor.processMessages(ex2.messages as any[]);
    
    const surface = processor.model.getSurface("example_2");
    expect(surface).toBeDefined();

    render(
      <React.StrictMode>
        <A2uiSurface surface={surface!} />
      </React.StrictMode>
    );

    expect(screen.getByText('Left Content')).toBeInTheDocument();
    expect(screen.getByText('Right Content')).toBeInTheDocument();
  });

  it('handles Login form -> input updates data model', async () => {
    const processor = new MessageProcessor([minimalCatalog as any], async () => {});
    processor.processMessages(ex4.messages as any[]);
    
    const surface = processor.model.getSurface("example_4");
    expect(surface).toBeDefined();

    render(
      <React.StrictMode>
        <A2uiSurface surface={surface!} />
      </React.StrictMode>
    );

    const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;
    expect(usernameInput).toBeDefined();

    await act(async () => {
      fireEvent.change(usernameInput, { target: { value: 'alice' } });
    });

    expect(surface!.dataModel.get('/username')).toBe('alice');
  });

  it('handles Capitalize text -> dynamic input to capitalized output', async () => {
    const processor = new MessageProcessor([minimalCatalog as any], async () => {});
    processor.processMessages(ex6.messages as any[]);
    
    const surface = processor.model.getSurface("example_6");
    expect(surface).toBeDefined();

    render(
      <React.StrictMode>
        <A2uiSurface surface={surface!} />
      </React.StrictMode>
    );

    const input = screen.getByLabelText('Type something in lowercase:') as HTMLInputElement;
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'hello world' } });
    });

    // The data model should be updated
    expect(surface!.dataModel.get('/inputValue')).toBe('hello world');

    // The output Text component should show the capitalized string
    expect(screen.getByText('HELLO WORLD')).toBeInTheDocument();
  });

  it('renders Incremental list -> correctly scopes nested components against array items', async () => {
    const processor = new MessageProcessor([minimalCatalog as any], async () => {});
    
    // Process all messages to build the final list state
    processor.processMessages(ex7.messages as any[]);
    
    const surface = processor.model.getSurface("example_7");
    expect(surface).toBeDefined();

    render(
      <React.StrictMode>
        <A2uiSurface surface={surface!} />
      </React.StrictMode>
    );

    // Verify all 4 restaurants rendered their titles
    expect(screen.getByText('The Golden Fork')).toBeInTheDocument();
    expect(screen.getByText('Ocean\'s Bounty')).toBeInTheDocument();
    expect(screen.getByText('Pizzeria Roma')).toBeInTheDocument();
    expect(screen.getByText('Spice Route')).toBeInTheDocument();

    // Verify the buttons rendered
    const buttons = screen.getAllByText('Book now');
    expect(buttons).toHaveLength(4);
  });

  it('emits book_now event with correct restaurant name context', async () => {
    let emittedAction: any = null;
    const processor = new MessageProcessor([minimalCatalog as any], async (action) => {
      emittedAction = action;
    });
    
    // Process all messages
    processor.processMessages(ex7.messages as any[]);
    
    const surface = processor.model.getSurface("example_7");
    expect(surface).toBeDefined();

    render(
      <React.StrictMode>
        <A2uiSurface surface={surface!} />
      </React.StrictMode>
    );

    // Find all "Book now" buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    
    // Click the first one (should be "The Golden Fork")
    await act(async () => {
      fireEvent.click(buttons[0]);
    });

    expect(emittedAction).toBeDefined();
    // The emitted action is exactly what's in the A2UI 'action' field, but with paths resolved.
    expect(emittedAction.event).toBeDefined();
    expect(emittedAction.event.name).toBe('book_now');
    expect(emittedAction.event.context.restaurantName).toBe('The Golden Fork');

    // Click the last one (should be "Spice Route")
    await act(async () => {
      fireEvent.click(buttons[3]);
    });

    expect(emittedAction.event.context.restaurantName).toBe('Spice Route');
  });
});
