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
  Text,
  Button,
  Row,
  Column,
  TextField,
} from '../../src/v0_9/catalog/minimal';

describe('Minimal Catalog Components', () => {
  describe('Text', () => {
    it('renders text correctly', () => {
      renderA2uiComponent(Text, 't1', { text: 'Minimal Text' });
      expect(screen.getByText('Minimal Text')).toBeDefined();
    });
  });

  describe('Button', () => {
    it('handles click and renders child', () => {
      const { surface, buildChild } = renderA2uiComponent(Button, 'b1', {
        action: { event: { name: 'click' } },
        child: 'label'
      });
      const actionSpy = vi.fn();
      surface.onAction.subscribe(actionSpy);

      fireEvent.click(screen.getByRole('button'));
      expect(actionSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'click' }));
      expect(buildChild).toHaveBeenCalledWith('label');
    });
  });

  describe('TextField', () => {
    it('updates data model on change', () => {
      const { surface } = renderA2uiComponent(TextField, 'f1', {
        label: 'Name',
        value: { path: '/name' }
      });

      const input = screen.getByLabelText('Name');
      fireEvent.change(input, { target: { value: 'Bob' } });
      expect(surface.dataModel.get('/name')).toBe('Bob');
    });
  });

  describe('Layout', () => {
    it('Row renders children', () => {
      const { buildChild } = renderA2uiComponent(Row, 'r1', {
        children: ['c1', 'c2']
      });
      expect(buildChild).toHaveBeenCalledWith('c1');
      expect(buildChild).toHaveBeenCalledWith('c2');
    });

    it('Column renders children', () => {
      const { buildChild } = renderA2uiComponent(Column, 'col1', {
        children: ['c1']
      });
      expect(buildChild).toHaveBeenCalledWith('c1');
    });
  });
});
