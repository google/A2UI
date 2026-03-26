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

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderA2uiComponent } from '../utils';
import { MarkdownProvider, Text } from '../../src/v0_9';
import { type MarkdownRenderer } from '@a2ui/web_core/v0_9';

describe('Markdown Rendering in React v0.9', () => {
  it('renders plain text when no markdown renderer is provided', async () => {
    renderA2uiComponent(Text, 't1', { text: '**Bold**' });
    
    // It should render the raw markdown string as plain text
    expect(screen.getByText('**Bold**')).toBeDefined();
  });

  it('renders markdown when a renderer is provided via MarkdownProvider', async () => {
    const mockRenderer: MarkdownRenderer = vi.fn().mockResolvedValue('<strong>Bold</strong>');

    renderA2uiComponent(Text, 't1', { text: '**Bold**' }, {
      wrapper: ({ children }) => (
        <MarkdownProvider renderer={mockRenderer}>
          {children}
        </MarkdownProvider>
      )
    });

    // Wait for the mock renderer to be called and state to update
    await waitFor(() => expect(mockRenderer).toHaveBeenCalledWith('**Bold**'));
    
    // Check for rendered HTML. dangerouslySetInnerHTML is used.
    const element = screen.getByText('Bold');
    expect(element.tagName).toBe('STRONG');
    expect(element.parentElement?.tagName).toBe('SPAN'); // Default body variant is span
  });

  it('renders with correct semantic wrapper and injected markdown', async () => {
    const mockRenderer: MarkdownRenderer = vi.fn().mockResolvedValue('<u>Underline</u>');

    const { view } = renderA2uiComponent(Text, 't1', { text: 'text', variant: 'h2' }, {
      wrapper: ({ children }) => (
        <MarkdownProvider renderer={mockRenderer}>
          {children}
        </MarkdownProvider>
      )
    });

    await waitFor(() => {
      const h2 = view.container.querySelector('h2');
      expect(h2).not.toBeNull();
      expect(h2?.innerHTML).toBe('<u>Underline</u>');
    });
  });
});
