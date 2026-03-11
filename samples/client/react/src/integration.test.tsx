import { describe, it, expect } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { MessageProcessor } from '@a2ui/web_core/v0_9';
import { A2uiSurface, minimalCatalog } from '@a2ui/react';

import ex1 from "../../../../specification/v0_9/json/catalogs/minimal/examples/1_simple_text.json";
import ex2 from "../../../../specification/v0_9/json/catalogs/minimal/examples/2_row_layout.json";
import ex4 from "../../../../specification/v0_9/json/catalogs/minimal/examples/4_login_form.json";
import ex6 from "../../../../specification/v0_9/json/catalogs/minimal/examples/6_capitalized_text.json";

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
});
