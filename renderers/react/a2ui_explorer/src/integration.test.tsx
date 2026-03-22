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

import {describe, it, expect} from 'vitest';
import {render, screen, act, fireEvent} from '@testing-library/react';
import React from 'react';
import {MessageProcessor} from '@a2ui/web_core/v0_9';
import {A2uiSurface, minimalCatalog} from '@a2ui/react/v0_9';

import ex1 from '../../../../specification/v0_9/json/catalogs/minimal/examples/1_simple_text.json';
import ex2 from '../../../../specification/v0_9/json/catalogs/minimal/examples/2_row_layout.json';
import ex4 from '../../../../specification/v0_9/json/catalogs/minimal/examples/4_login_form.json';

describe('Gallery Integration Tests', () => {
  it('renders Simple Text -> "Hello Minimal Catalog"', async () => {
    const processor = new MessageProcessor([minimalCatalog as any], async () => {});
    processor.processMessages(ex1.messages as any[]);

    const surface = processor.model.getSurface('example_1');
    expect(surface).toBeDefined();

    render(
      <React.StrictMode>
        <A2uiSurface surface={surface as any} />
      </React.StrictMode>
    );

    expect(screen.getByText('Hello, Minimal Catalog!')).toBeInTheDocument();
  });

  it('renders Row layout -> content visibility', async () => {
    const processor = new MessageProcessor([minimalCatalog as any], async () => {});
    processor.processMessages(ex2.messages as any[]);

    const surface = processor.model.getSurface('example_2');
    expect(surface).toBeDefined();

    render(
      <React.StrictMode>
        <A2uiSurface surface={surface as any} />
      </React.StrictMode>
    );

    expect(screen.getByText('Left Content')).toBeInTheDocument();
    expect(screen.getByText('Right Content')).toBeInTheDocument();
  });

  it('handles Login form -> input updates data model', async () => {
    const processor = new MessageProcessor([minimalCatalog as any], async () => {});
    processor.processMessages(ex4.messages as any[]);

    const surface = processor.model.getSurface('example_4');
    expect(surface).toBeDefined();

    render(
      <React.StrictMode>
        <A2uiSurface surface={surface as any} />
      </React.StrictMode>
    );

    const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;
    expect(usernameInput).toBeDefined();

    await act(async () => {
      fireEvent.change(usernameInput, {target: {value: 'alice'}});
    });

    expect(surface!.dataModel.get('/username')).toBe('alice');
  });
});
