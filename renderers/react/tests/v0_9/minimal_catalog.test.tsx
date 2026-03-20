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
import { screen, fireEvent } from '@testing-library/react';
import { renderA2uiComponent } from '../utils';

import {
  ReactText,
  ReactButton,
  ReactRow,
  ReactColumn,
  ReactTextField,
} from '../../src/v0_9/catalog/minimal';

describe('Minimal Catalog Components', () => {
  describe('ReactText', () => {
    it('renders text correctly', () => {
      renderA2uiComponent(ReactText, 't1', { text: 'Minimal Text' });
      expect(screen.getByText('Minimal Text')).toBeDefined();
    });
  });

  describe('ReactButton', () => {
    it('handles click and renders child', () => {
      const { surface, buildChild } = renderA2uiComponent(ReactButton, 'b1', {
        action: { event: { name: 'click' } },
        child: 'label'
      });
      const actionSpy = vi.fn();
      surface.onAction.subscribe(actionSpy);

      fireEvent.click(screen.getByRole('button'));
      expect(actionSpy).toHaveBeenCalledWith({ event: { name: 'click' } });
      expect(buildChild).toHaveBeenCalledWith('label');
    });
  });

  describe('ReactTextField', () => {
    it('updates data model on change', () => {
      const { surface } = renderA2uiComponent(ReactTextField, 'f1', {
        label: 'Name',
        value: { path: '/name' }
      });

      const input = screen.getByLabelText('Name');
      fireEvent.change(input, { target: { value: 'Bob' } });
      expect(surface.dataModel.get('/name')).toBe('Bob');
    });
  });

  describe('Layout', () => {
    it('ReactRow renders children', () => {
      const { buildChild } = renderA2uiComponent(ReactRow, 'r1', {
        children: ['c1', 'c2']
      });
      expect(buildChild).toHaveBeenCalledWith('c1');
      expect(buildChild).toHaveBeenCalledWith('c2');
    });

    it('ReactColumn renders children', () => {
      const { buildChild } = renderA2uiComponent(ReactColumn, 'col1', {
        children: ['c1']
      });
      expect(buildChild).toHaveBeenCalledWith('c1');
    });
  });
});
