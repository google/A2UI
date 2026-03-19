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
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ComponentContext, ComponentModel, SurfaceModel, Catalog } from '@a2ui/web_core/v0_9';
import { BASIC_FUNCTIONS } from '@a2ui/web_core/v0_9/basic_catalog';

import {
  ReactText,
  ReactImage,
  ReactIcon,
  ReactVideo,
  ReactAudioPlayer,
  ReactRow,
  ReactColumn,
  ReactList,
  ReactCard,
  ReactTabs,
  ReactDivider,
  ReactModal,
  ReactButton,
  ReactTextField,
  ReactCheckBox,
  ReactChoicePicker,
  ReactSlider,
  ReactDateTimeInput,
} from '../../src/v0_9/basic_catalog';

const mockCatalog = new Catalog('test', [], BASIC_FUNCTIONS);

function createContext(type: string, properties: any) {
  const surface = new SurfaceModel<any>('test-surface', mockCatalog);
  const compModel = new ComponentModel('test-id', type, properties);
  surface.componentsModel.addComponent(compModel);
  return new ComponentContext(surface, 'test-id', '/');
}

describe('Basic Catalog Components', () => {
  describe('ReactText', () => {
    it('renders text correctly', () => {
      const ctx = createContext('Text', { text: 'Hello Basic' });
      render(<ReactText.render context={ctx} buildChild={() => null} />);
      expect(screen.getByText('Hello Basic')).toBeDefined();
    });
  });

  describe('ReactImage', () => {
    it('renders image with url', () => {
      const ctx = createContext('Image', { url: 'https://example.com/img.png' });
      const { container } = render(<ReactImage.render context={ctx} buildChild={() => null} />);
      const img = container.querySelector('img') as HTMLImageElement;
      expect(img.src).toBe('https://example.com/img.png');
    });
  });

  describe('ReactIcon', () => {
    it('renders icon with name', () => {
      const ctx = createContext('Icon', { name: 'search' });
      const { container } = render(<ReactIcon.render context={ctx} buildChild={() => null} />);
      expect(container.textContent).toContain('search');
    });
  });

  describe('ReactButton', () => {
    it('renders and handles clicks', () => {
      const ctx = createContext('Button', { child: 'btn-label' });
      const spy = vi.spyOn(ctx, 'dispatchAction').mockResolvedValue();
      const buildChild = (id: string) => <span key={id}>{id}</span>;

      render(<ReactButton.render context={ctx} buildChild={buildChild} />);
      const button = screen.getByRole('button');
      expect(screen.getByText('btn-label')).toBeDefined();
      
      fireEvent.click(button);
      // Even if action is undefined in props, it shouldn't crash.
      // But let's test with an action.
      const ctxWithAction = createContext('Button', { child: 'btn2', action: { event: { name: 'test' } } });
      const spy2 = vi.spyOn(ctxWithAction, 'dispatchAction').mockResolvedValue();
      render(<ReactButton.render context={ctxWithAction} buildChild={buildChild} />);
      fireEvent.click(screen.getAllByRole('button')[1]!);
      expect(spy2).toHaveBeenCalled();
    });
  });

  describe('ReactTextField', () => {
    it('handles value changes', () => {
      const ctx = createContext('TextField', { label: 'Name', value: { path: '/name' } });
      const spySet = vi.spyOn(ctx.dataContext, 'set');
      render(<ReactTextField.render context={ctx} buildChild={() => null} />);
      
      const input = screen.getByLabelText('Name');
      fireEvent.change(input, { target: { value: 'Bob' } });
      expect(spySet).toHaveBeenCalledWith('/name', 'Bob');
    });

    it('displays validation errors', async () => {
      const ctx = createContext('TextField', { 
        label: 'Email', 
        value: { path: '/email' },
        checks: [
          {
            call: 'required',
            args: { value: { path: '/email' } },
            message: 'Email is required'
          }
        ]
      });
      
      render(<ReactTextField.render context={ctx} buildChild={() => null} />);
      
      expect(screen.getByText('Email is required')).toBeDefined();

      await act(async () => {
        ctx.dataContext.set('/email', 'test@example.com');
      });

      expect(screen.queryByText('Email is required')).toBeNull();
    });
  });

  describe('ReactCheckBox', () => {
    it('handles toggle', () => {
      const ctx = createContext('CheckBox', { label: 'Accept', value: { path: '/accept' } });
      const spySet = vi.spyOn(ctx.dataContext, 'set');
      render(<ReactCheckBox.render context={ctx} buildChild={() => null} />);
      
      const checkbox = screen.getByLabelText('Accept');
      fireEvent.click(checkbox);
      expect(spySet).toHaveBeenCalledWith('/accept', true);
    });
  });

  describe('ReactSlider', () => {
    it('handles value change', () => {
      const ctx = createContext('Slider', { label: 'Volume', value: { path: '/vol' }, max: 100 });
      const spySet = vi.spyOn(ctx.dataContext, 'set');
      render(<ReactSlider.render context={ctx} buildChild={() => null} />);
      
      const slider = screen.getByLabelText('Volume');
      fireEvent.change(slider, { target: { value: '50' } });
      expect(spySet).toHaveBeenCalledWith('/vol', 50);
    });
  });

  describe('ReactChoicePicker', () => {
    it('handles selection', () => {
      const options = [
        { label: 'One', value: '1' },
        { label: 'Two', value: '2' }
      ];
      const ctx = createContext('ChoicePicker', { 
        label: 'Choose', 
        options, 
        value: { path: '/choice' },
        variant: 'mutuallyExclusive'
      });
      const spySet = vi.spyOn(ctx.dataContext, 'set');
      render(<ReactChoicePicker.render context={ctx} buildChild={() => null} />);
      
      const radio = screen.getByLabelText('One');
      fireEvent.click(radio);
      expect(spySet).toHaveBeenCalledWith('/choice', ['1']);
    });
  });

  describe('ReactDateTimeInput', () => {
    it('handles date change', () => {
      const ctx = createContext('DateTimeInput', { 
        label: 'Date', 
        value: { path: '/date' },
        enableDate: true 
      });
      const spySet = vi.spyOn(ctx.dataContext, 'set');
      render(<ReactDateTimeInput.render context={ctx} buildChild={() => null} />);
      
      const input = screen.getByLabelText('Date');
      fireEvent.change(input, { target: { value: '2026-03-19' } });
      expect(spySet).toHaveBeenCalledWith('/date', '2026-03-19');
    });
  });

  describe('Layout and Containers', () => {
    const buildChild = (id: string) => <div data-testid={id} key={id}>{id}</div>;

    it('renders Row with children', () => {
      const ctx = createContext('Row', { children: ['c1', 'c2'] });
      render(<ReactRow.render context={ctx} buildChild={buildChild} />);
      expect(screen.getByTestId('c1')).toBeDefined();
      expect(screen.getByTestId('c2')).toBeDefined();
    });

    it('renders Column with children', () => {
      const ctx = createContext('Column', { children: ['c1'] });
      render(<ReactColumn.render context={ctx} buildChild={buildChild} />);
      expect(screen.getByTestId('c1')).toBeDefined();
    });

    it('renders List with children', () => {
      const ctx = createContext('List', { children: ['c1', 'c2'] });
      render(<ReactList.render context={ctx} buildChild={buildChild} />);
      expect(screen.getByTestId('c1')).toBeDefined();
      expect(screen.getByTestId('c2')).toBeDefined();
    });

    it('renders Card with child', () => {
      const ctx = createContext('Card', { child: 'c1' });
      render(<ReactCard.render context={ctx} buildChild={buildChild} />);
      expect(screen.getByTestId('c1')).toBeDefined();
    });

    it('renders Tabs with titles', () => {
      const ctx = createContext('Tabs', { 
        tabs: [
          { title: 'Tab 1', child: 'c1' },
          { title: 'Tab 2', child: 'c2' }
        ]
      });
      render(<ReactTabs.render context={ctx} buildChild={buildChild} />);
      expect(screen.getByText('Tab 1')).toBeDefined();
      expect(screen.getByText('Tab 2')).toBeDefined();
      expect(screen.getByTestId('c1')).toBeDefined();
      
      fireEvent.click(screen.getByText('Tab 2'));
      expect(screen.getByTestId('c2')).toBeDefined();
    });

    it('renders Divider', () => {
      const ctx = createContext('Divider', {});
      const { container } = render(<ReactDivider.render context={ctx} buildChild={() => null} />);
      expect(container.firstChild).toBeDefined();
    });

    it('renders Modal and handles trigger', () => {
      const ctx = createContext('Modal', { trigger: 't1', content: 'm1' });
      render(<ReactModal.render context={ctx} buildChild={buildChild} />);
      
      expect(screen.getByTestId('t1')).toBeDefined();
      expect(screen.queryByTestId('m1')).toBeNull();
      
      fireEvent.click(screen.getByTestId('t1'));
      expect(screen.getByTestId('m1')).toBeDefined();
    });
  });
});
