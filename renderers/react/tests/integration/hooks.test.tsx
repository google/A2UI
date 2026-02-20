import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { A2UIProvider, useA2UI } from '../../src';
import { getElement } from '../utils';

/**
 * Context Hooks Integration Tests
 *
 * Tests for React context hooks behavior and stability.
 */

describe('Context Hooks', () => {
  it('should throw error when useA2UI is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BadComponent() {
      useA2UI();
      return null;
    }

    expect(() => {
      render(<BadComponent />);
    }).toThrow();

    consoleSpy.mockRestore();
  });

  it('should provide stable action references across renders', () => {
    const actionRefs: Array<ReturnType<typeof useA2UI>> = [];

    function ActionTracker() {
      const api = useA2UI();
      actionRefs.push(api);

      return (
        <button onClick={() => api.processMessages([])}>Trigger</button>
      );
    }

    const { rerender } = render(
      <A2UIProvider>
        <ActionTracker />
      </A2UIProvider>
    );

    rerender(
      <A2UIProvider>
        <ActionTracker />
      </A2UIProvider>
    );

    const ref0 = getElement(actionRefs, 0);
    const ref1 = getElement(actionRefs, 1);
    expect(ref0.processMessages).toBe(ref1.processMessages);
  });
});
