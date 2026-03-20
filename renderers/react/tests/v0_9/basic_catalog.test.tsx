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
import { screen, fireEvent, act } from '@testing-library/react';
import { ComponentModel } from '@a2ui/web_core/v0_9';
import { renderA2uiComponent } from '../utils';

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
} from '../../src/v0_9/catalog/basic';

describe('Basic Catalog Components', () => {
  describe('ReactText', () => {
    it('renders static text', () => {
      renderA2uiComponent(ReactText, 't1', { text: 'Hello World' });
      expect(screen.getByText('Hello World')).toBeDefined();
    });

    it('renders reactive text from data model', async () => {
      const { updateData } = renderA2uiComponent(
        ReactText, 
        't1', 
        { text: { path: '/msg' } },
        { initialData: { msg: 'Initial' } }
      );
      
      expect(screen.getByText('Initial')).toBeDefined();

      await act(async () => {
        await updateData('/msg', 'Updated');
      });

      expect(screen.getByText('Updated')).toBeDefined();
    });

    it('renders with correct heading tag based on variant', () => {
      const { view } = renderA2uiComponent(ReactText, 't1', { text: 'Title', variant: 'h1' });
      const h1 = view.container.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1?.textContent).toBe('Title');
    });
  });

  describe('ReactImage', () => {
    it('renders image with url and object-fit', () => {
      const { view } = renderA2uiComponent(ReactImage, 'i1', { 
        url: 'https://example.com/img.png',
        fit: 'cover'
      });
      const img = view.container.querySelector('img') as HTMLImageElement;
      expect(img.src).toBe('https://example.com/img.png');
      expect(img.style.objectFit).toBe('cover');
    });

    it('applies variant-specific styling (avatar)', () => {
      const { view } = renderA2uiComponent(ReactImage, 'i1', { 
        url: 'url',
        variant: 'avatar'
      });
      const img = view.container.querySelector('img') as HTMLImageElement;
      expect(img.style.borderRadius).toBe('50%');
      expect(img.style.width).toBe('40px');
    });
  });

  describe('ReactIcon', () => {
    it('renders material icon by name', () => {
      const { view } = renderA2uiComponent(ReactIcon, 'ic1', { name: 'settings' });
      expect(view.container.textContent).toContain('settings');
      expect(view.container.querySelector('.material-symbols-outlined')).not.toBeNull();
    });
  });

  describe('ReactVideo', () => {
    it('renders video element with source and controls', () => {
      const { view } = renderA2uiComponent(ReactVideo, 'v1', { url: 'vid.mp4' });
      const video = view.container.querySelector('video') as HTMLVideoElement;
      expect(video.src).toContain('vid.mp4');
      expect(video.controls).toBe(true);
    });
  });

  describe('ReactAudioPlayer', () => {
    it('renders audio element and description', () => {
      renderA2uiComponent(ReactAudioPlayer, 'a1', { 
        url: 'audio.mp3',
        description: 'Listen to this'
      });
      expect(screen.getByText('Listen to this')).toBeDefined();
      const audio = document.querySelector('audio') as HTMLAudioElement;
      expect(audio.src).toContain('audio.mp3');
    });
  });

  describe('ReactButton', () => {
    it('dispatches action on click', async () => {
      const { surface } = renderA2uiComponent(ReactButton, 'b1', { 
        action: { event: { name: 'submit_clicked' } },
        child: 'label1'
      });

      const actionSpy = vi.fn();
      surface.onAction.subscribe(actionSpy);

      fireEvent.click(screen.getByRole('button'));
      
      expect(actionSpy).toHaveBeenCalledWith({ event: { name: 'submit_clicked' } });
    });

    it('is disabled when isValid is false (via checks)', async () => {
      const { updateData } = renderA2uiComponent(
        ReactButton, 
        'b1', 
        { 
          action: { event: { name: 'submit' } },
          checks: [
            {
              call: 'required',
              args: { value: { path: '/name' } },
              message: 'Name is required'
            }
          ]
        },
        { initialData: { name: '' } }
      );

      const button = screen.getByRole('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);

      await act(async () => {
        await updateData('/name', 'Alice');
      });

      expect(button.disabled).toBe(false);
    });

    it('delegates child rendering to buildChild', () => {
      const { buildChild } = renderA2uiComponent(ReactButton, 'b1', { child: 'inner1' });
      expect(buildChild).toHaveBeenCalledWith('inner1');
      expect(screen.getByTestId('child-inner1')).toBeDefined();
    });
  });

  describe('ReactTextField', () => {
    it('updates data model on change', () => {
      const { surface } = renderA2uiComponent(ReactTextField, 'f1', { 
        label: 'Name',
        value: { path: '/user/name' }
      });

      const input = screen.getByLabelText('Name');
      fireEvent.change(input, { target: { value: 'Bob' } });
      
      expect(surface.dataModel.get('/user/name')).toBe('Bob');
    });

    it('shows validation error message', async () => {
      const { updateData } = renderA2uiComponent(
        ReactTextField, 
        'f1', 
        { 
          label: 'Email',
          value: { path: '/email' },
          checks: [{ call: 'required', args: { value: { path: '/email' } }, message: 'Required!' }]
        },
        { initialData: { email: '' } }
      );

      expect(screen.getByText('Required!')).toBeDefined();

      await act(async () => {
        await updateData('/email', 'test@test.com');
      });

      expect(screen.queryByText('Required!')).toBeNull();
    });
  });

  describe('Layout and Structural Components', () => {
    it('ReactRow renders multiple children', () => {
      const { buildChild } = renderA2uiComponent(ReactRow, 'r1', { 
        children: ['c1', 'c2']
      });

      expect(buildChild).toHaveBeenCalledWith('c1');
      expect(buildChild).toHaveBeenCalledWith('c2');
      expect(screen.getByTestId('child-c1')).toBeDefined();
      expect(screen.getByTestId('child-c2')).toBeDefined();
    });

    it('ReactColumn renders children vertically', () => {
      const { buildChild, view } = renderA2uiComponent(ReactColumn, 'col1', { 
        children: ['c1']
      });
      expect(buildChild).toHaveBeenCalledWith('c1');
      expect(view.container.firstChild).toHaveStyle({ flexDirection: 'column' });
    });

    it('ReactList supports dynamic templates with scoped data context', () => {
      renderA2uiComponent(
        ReactList, 
        'list1', 
        { 
          children: { componentId: 'itemComp', path: '/items' } 
        },
        {
          initialData: { items: [{ n: 'A' }, { n: 'B' }] },
          additionalImpls: [ReactText],
          additionalComponents: [
            new ComponentModel('itemComp', 'Text', { text: { path: 'n' } })
          ]
        }
      );

      expect(screen.getByText('A')).toBeDefined();
      expect(screen.getByText('B')).toBeDefined();
    });

    it('ReactCard renders its child', () => {
      const { buildChild } = renderA2uiComponent(ReactCard, 'card1', { child: 'c1' });
      expect(buildChild).toHaveBeenCalledWith('c1');
      expect(screen.getByTestId('child-c1')).toBeDefined();
    });

    it('ReactTabs switches active tab content', () => {
      renderA2uiComponent(ReactTabs, 'tabs1', {
        tabs: [
          { title: 'Home', child: 'home_c' },
          { title: 'Settings', child: 'settings_c' }
        ]
      });

      expect(screen.getByTestId('child-home_c')).toBeDefined();
      expect(screen.queryByTestId('child-settings_c')).toBeNull();

      fireEvent.click(screen.getByText('Settings'));

      expect(screen.queryByTestId('child-home_c')).toBeNull();
      expect(screen.getByTestId('child-settings_c')).toBeDefined();
    });

    it('ReactModal opens content on trigger click', () => {
      renderA2uiComponent(ReactModal, 'm1', {
        trigger: 't1',
        content: 'c1'
      });

      expect(screen.getByTestId('child-t1')).toBeDefined();
      expect(screen.queryByTestId('child-c1')).toBeNull();

      fireEvent.click(screen.getByTestId('child-t1'));

      expect(screen.getByTestId('child-c1')).toBeDefined();
    });

    it('ReactDivider renders a themed line', () => {
      const { view } = renderA2uiComponent(ReactDivider, 'd1', { axis: 'horizontal' });
      expect(view.container.firstChild).toHaveStyle({ height: '1px' });
    });
  });

  describe('Input Components', () => {
    it('ReactCheckBox updates data', () => {
      const { surface } = renderA2uiComponent(ReactCheckBox, 'cb1', {
        label: 'Agree',
        value: { path: '/agreed' }
      });

      fireEvent.click(screen.getByLabelText('Agree'));
      expect(surface.dataModel.get('/agreed')).toBe(true);
    });

    it('ReactSlider updates data', () => {
      const { surface } = renderA2uiComponent(ReactSlider, 's1', {
        label: 'Volume',
        value: { path: '/vol' },
        max: 100
      });

      fireEvent.change(screen.getByLabelText('Volume'), { target: { value: '75' } });
      expect(surface.dataModel.get('/vol')).toBe(75);
    });

    it('ReactChoicePicker mutuallyExclusive selection', () => {
      const { surface } = renderA2uiComponent(ReactChoicePicker, 'cp1', {
        label: 'Pick',
        options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }],
        value: { path: '/picked' },
        variant: 'mutuallyExclusive'
      });

      fireEvent.click(screen.getByLabelText('A'));
      expect(surface.dataModel.get('/picked')).toEqual(['a']);
      
      fireEvent.click(screen.getByLabelText('B'));
      expect(surface.dataModel.get('/picked')).toEqual(['b']);
    });

    it('ReactDateTimeInput handles date changes', () => {
      const { surface } = renderA2uiComponent(ReactDateTimeInput, 'dt1', {
        label: 'When',
        value: { path: '/date' },
        enableDate: true
      });

      fireEvent.change(screen.getByLabelText('When'), { target: { value: '2026-03-20' } });
      expect(surface.dataModel.get('/date')).toBe('2026-03-20');
    });
  });
});
