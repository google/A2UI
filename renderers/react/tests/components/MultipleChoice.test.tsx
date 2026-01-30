import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { TestWrapper, TestRenderer, createSimpleMessages } from '../helpers';

/**
 * MultipleChoice tests following A2UI specification.
 * Required: selections, options (array of { label, value })
 * Optional: maxAllowedSelections
 *
 * When maxAllowedSelections is 1, renders radio buttons.
 * Otherwise, renders checkboxes.
 */
describe('MultipleChoice Component', () => {
  describe('Basic Rendering', () => {
    it('should render a multiple choice container', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Option A' }, value: 'a' },
          { label: { literalString: 'Option B' }, value: 'b' },
        ],
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const wrapper = container.querySelector('.a2ui-multiplechoice');
      expect(wrapper).toBeInTheDocument();
    });

    it('should render section with group role', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Option A' }, value: 'a' },
        ],
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should render all option labels', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'First Option' }, value: 'first' },
          { label: { literalString: 'Second Option' }, value: 'second' },
          { label: { literalString: 'Third Option' }, value: 'third' },
        ],
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      expect(container.textContent).toContain('First Option');
      expect(container.textContent).toContain('Second Option');
      expect(container.textContent).toContain('Third Option');
    });

    it('should render correct number of options', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'A' }, value: 'a' },
          { label: { literalString: 'B' }, value: 'b' },
          { label: { literalString: 'C' }, value: 'c' },
        ],
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const inputs = container.querySelectorAll('input');
      expect(inputs.length).toBe(3);
    });

    it('should render different options for different inputs', () => {
      const messages1 = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Alpha' }, value: 'alpha' },
        ],
      });
      const messages2 = createSimpleMessages('mc-2', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Beta' }, value: 'beta' },
          { label: { literalString: 'Gamma' }, value: 'gamma' },
        ],
      });

      const { container: container1 } = render(
        <TestWrapper>
          <TestRenderer messages={messages1} />
        </TestWrapper>
      );
      const { container: container2 } = render(
        <TestWrapper>
          <TestRenderer messages={messages2} />
        </TestWrapper>
      );

      expect(container1.textContent).toContain('Alpha');
      expect(container1.textContent).not.toContain('Beta');
      expect(container2.textContent).toContain('Beta');
      expect(container2.textContent).toContain('Gamma');
      expect(container2.textContent).not.toContain('Alpha');
    });
  });

  describe('Radio Buttons (maxAllowedSelections = 1)', () => {
    it('should render radio inputs by default (maxAllowedSelections defaults to 1)', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Option A' }, value: 'a' },
          { label: { literalString: 'Option B' }, value: 'b' },
        ],
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const inputs = container.querySelectorAll('input[type="radio"]');
      expect(inputs.length).toBe(2);
    });

    it('should render radio inputs when maxAllowedSelections = 1', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Option A' }, value: 'a' },
          { label: { literalString: 'Option B' }, value: 'b' },
        ],
        maxAllowedSelections: 1,
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const radioInputs = container.querySelectorAll('input[type="radio"]');
      const checkboxInputs = container.querySelectorAll('input[type="checkbox"]');

      expect(radioInputs.length).toBe(2);
      expect(checkboxInputs.length).toBe(0);
    });

    it('should have radiogroup role for radio buttons', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Option A' }, value: 'a' },
        ],
        maxAllowedSelections: 1,
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const section = container.querySelector('section');
      expect(section?.getAttribute('role')).toBe('radiogroup');
    });

    it('should select only one option at a time', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Option A' }, value: 'a' },
          { label: { literalString: 'Option B' }, value: 'b' },
        ],
        maxAllowedSelections: 1,
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const inputs = container.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;

      // Select first option
      fireEvent.click(inputs[0]);
      expect(inputs[0].checked).toBe(true);
      expect(inputs[1].checked).toBe(false);

      // Select second option - first should be deselected
      fireEvent.click(inputs[1]);
      expect(inputs[0].checked).toBe(false);
      expect(inputs[1].checked).toBe(true);
    });
  });

  describe('Checkboxes (maxAllowedSelections > 1)', () => {
    it('should render checkbox inputs when maxAllowedSelections > 1', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Option A' }, value: 'a' },
          { label: { literalString: 'Option B' }, value: 'b' },
        ],
        maxAllowedSelections: 2,
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const checkboxInputs = container.querySelectorAll('input[type="checkbox"]');
      const radioInputs = container.querySelectorAll('input[type="radio"]');

      expect(checkboxInputs.length).toBe(2);
      expect(radioInputs.length).toBe(0);
    });

    it('should have group role for checkboxes', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Option A' }, value: 'a' },
        ],
        maxAllowedSelections: 3,
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const section = container.querySelector('section');
      expect(section?.getAttribute('role')).toBe('group');
    });

    it('should allow multiple selections', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Option A' }, value: 'a' },
          { label: { literalString: 'Option B' }, value: 'b' },
          { label: { literalString: 'Option C' }, value: 'c' },
        ],
        maxAllowedSelections: 3,
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const inputs = container.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;

      // Select first option
      fireEvent.click(inputs[0]);
      expect(inputs[0].checked).toBe(true);

      // Select second option - first should remain selected
      fireEvent.click(inputs[1]);
      expect(inputs[0].checked).toBe(true);
      expect(inputs[1].checked).toBe(true);
    });

    it('should toggle checkbox on repeated click', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Option A' }, value: 'a' },
        ],
        maxAllowedSelections: 2,
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const input = container.querySelector('input[type="checkbox"]') as HTMLInputElement;

      expect(input.checked).toBe(false);

      fireEvent.click(input);
      expect(input.checked).toBe(true);

      fireEvent.click(input);
      expect(input.checked).toBe(false);
    });
  });

  describe('Different Input Types', () => {
    it('should render different input types for different maxAllowedSelections', () => {
      const messagesRadio = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [{ label: { literalString: 'A' }, value: 'a' }],
        maxAllowedSelections: 1,
      });
      const messagesCheckbox = createSimpleMessages('mc-2', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [{ label: { literalString: 'A' }, value: 'a' }],
        maxAllowedSelections: 2,
      });

      const { container: containerRadio } = render(
        <TestWrapper>
          <TestRenderer messages={messagesRadio} />
        </TestWrapper>
      );
      const { container: containerCheckbox } = render(
        <TestWrapper>
          <TestRenderer messages={messagesCheckbox} />
        </TestWrapper>
      );

      const radioInput = containerRadio.querySelector('input[type="radio"]');
      const checkboxInput = containerCheckbox.querySelector('input[type="checkbox"]');

      expect(radioInput).toBeInTheDocument();
      expect(checkboxInput).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('should have correct DOM structure: div > section > labels', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Option A' }, value: 'a' },
          { label: { literalString: 'Option B' }, value: 'b' },
        ],
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const wrapper = container.querySelector('.a2ui-multiplechoice');
      expect(wrapper?.tagName).toBe('DIV');

      const section = wrapper?.querySelector('section');
      expect(section).toBeInTheDocument();

      const labels = section?.querySelectorAll('label');
      expect(labels?.length).toBe(2);
    });

    it('should have input and span inside each label', () => {
      const messages = createSimpleMessages('mc-1', 'MultipleChoice', {
        selections: { literalArray: [] },
        options: [
          { label: { literalString: 'Option A' }, value: 'a' },
        ],
      });

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const label = container.querySelector('label');
      expect(label?.querySelector('input')).toBeInTheDocument();
      expect(label?.querySelector('span')).toBeInTheDocument();
    });
  });
});
