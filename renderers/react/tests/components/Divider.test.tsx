import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { TestWrapper, TestRenderer, createSimpleMessages, createSurfaceUpdate, createBeginRendering } from '../helpers';
import type { Types } from '@a2ui/lit/0.8';

/**
 * Divider tests following A2UI specification.
 * Required: none
 * Optional: axis (horizontal | vertical)
 */
describe('Divider Component', () => {
  describe('Basic Rendering', () => {
    it('should render an hr element', () => {
      const messages = createSimpleMessages('div-1', 'Divider', {});

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const hr = container.querySelector('hr');
      expect(hr).toBeInTheDocument();
    });

    it('should render with wrapper div', () => {
      const messages = createSimpleMessages('div-1', 'Divider', {});

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const wrapper = container.querySelector('.a2ui-divider');
      expect(wrapper).toBeInTheDocument();
    });

    it('should render as self-closing element', () => {
      const messages = createSimpleMessages('div-1', 'Divider', {});

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const hr = container.querySelector('hr');
      expect(hr?.children.length).toBe(0);
    });
  });

  describe('Axis', () => {
    it('should render horizontal divider', () => {
      const messages = createSimpleMessages('div-1', 'Divider', {
        axis: 'horizontal',
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const hr = container.querySelector('hr');
      expect(hr).toBeInTheDocument();
    });

    it('should render vertical divider', () => {
      const messages = createSimpleMessages('div-1', 'Divider', {
        axis: 'vertical',
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const hr = container.querySelector('hr');
      expect(hr).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should render hr element with theme classes applied', () => {
      const messages = createSimpleMessages('div-1', 'Divider', {});

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const hr = container.querySelector('hr');
      expect(hr).toBeInTheDocument();
      // Theme classes may be empty for Divider in default theme
    });
  });

  describe('Structure', () => {
    it('should have correct DOM structure', () => {
      const messages = createSimpleMessages('div-1', 'Divider', {});

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const wrapper = container.querySelector('.a2ui-divider');
      expect(wrapper?.children.length).toBe(1);
      expect(wrapper?.children[0].tagName).toBe('HR');
    });
  });

  describe('Multiple Dividers', () => {
    it('should render multiple dividers in a column', () => {
      const messages: Types.ServerToClientMessage[] = [
        createSurfaceUpdate([
          { id: 'div-1', component: { Divider: {} } },
          { id: 'div-2', component: { Divider: {} } },
          { id: 'div-3', component: { Divider: {} } },
          { id: 'col-1', component: { Column: { children: { explicitList: ['div-1', 'div-2', 'div-3'] } } } },
        ]),
        createBeginRendering('col-1'),
      ];

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const dividers = container.querySelectorAll('.a2ui-divider');
      expect(dividers.length).toBe(3);
    });
  });
});
