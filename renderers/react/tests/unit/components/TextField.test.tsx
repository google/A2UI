import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TestWrapper, TestRenderer, createSimpleMessages } from '../../utils';

/**
 * TextField tests following A2UI specification.
 * Required: label
 * Optional: text, type, validationRegexp
 *
 * NOTE: The A2UI spec uses `type` but the current React component
 * implementation reads `type`. Tests use `type` to match current behavior.
 * This should be aligned with the spec in the component implementation.
 */
describe('TextField Component', () => {
  describe('Basic Rendering', () => {
    it('should render an input element', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Username' },
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
    });

    it('should render with wrapper div', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Email' },
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const wrapper = container.querySelector('.a2ui-textfield');
      expect(wrapper).toBeInTheDocument();
    });

    it('should render with initial text value', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Name' },
        text: { literalString: 'John Doe' },
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('John Doe');
    });

    it('should render placeholder text', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Search' },
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.placeholder).toBe('Please enter a value');
    });
  });

  describe('Label Rendering', () => {
    it('should render label (required field)', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Username' },
      });

      render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should associate label with input via htmlFor', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Email Address' },
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const label = container.querySelector('label');
      const input = container.querySelector('input');
      expect(label?.getAttribute('for')).toBe(input?.id);
    });
  });

  describe('Input Types (type)', () => {
    it('should render text input by default (shortText)', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Name' },
        type: 'shortText',
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input?.type).toBe('text');
    });

    it('should render number input for type=number', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Age' },
        type: 'number',
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input?.type).toBe('number');
    });

    it('should render date input for type=date', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Birth Date' },
        type: 'date',
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input?.type).toBe('date');
    });

    it('should render textarea for type=longText', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Description' },
        type: 'longText',
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const textarea = container.querySelector('textarea');
      expect(textarea).toBeInTheDocument();
      expect(container.querySelector('input')).not.toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    it('should update value on change', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Input' },
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'New value' } });

      expect(input.value).toBe('New value');
    });

    it('should update textarea value on change', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Comments' },
        type: 'longText',
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Long text content' } });

      expect(textarea.value).toBe('Long text content');
    });
  });

  describe('Theme Support', () => {
    it('should render within section container', () => {
      const messages = createSimpleMessages('tf-1', 'TextField', {
        label: { literalString: 'Field' },
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section?.querySelector('input')).toBeInTheDocument();
    });
  });
});
