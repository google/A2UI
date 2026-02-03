import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useEffect } from 'react';
import { A2UIProvider, A2UIRenderer, useA2UI } from '../../src';
import type { Types } from '@a2ui/lit/0.8';
import {
  TestWrapper,
  TestRenderer,
  createSurfaceUpdate,
  createBeginRendering,
  createDataModelUpdate,
} from '../utils';

/**
 * Data Binding Integration Tests
 *
 * Tests for dataModelUpdate messages and path bindings between components.
 */

describe('Data Binding', () => {
  describe('dataModelUpdate Messages', () => {
    it('should initialize data model via dataModelUpdate before rendering', () => {
      function DataModelRenderer() {
        const { processMessages } = useA2UI();

        useEffect(() => {
          processMessages([
            createDataModelUpdate([
              { key: 'greeting', value: 'Hello from data model' },
            ]),
            createSurfaceUpdate([
              {
                id: 'text-1',
                component: {
                  Text: { text: { path: 'greeting' } },
                },
              },
            ]),
            createBeginRendering('text-1'),
          ]);
        }, [processMessages]);

        return <A2UIRenderer surfaceId="@default" />;
      }

      render(
        <A2UIProvider>
          <DataModelRenderer />
        </A2UIProvider>
      );

      expect(screen.getByText('Hello from data model')).toBeInTheDocument();
    });

    it('should update existing data model values', async () => {
      function DataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [step, setStep] = React.useState(0);

        useEffect(() => {
          if (step === 0) {
            processMessages([
              createDataModelUpdate([{ key: 'counter', value: 'Count: 0' }]),
              createSurfaceUpdate([
                { id: 'text-1', component: { Text: { text: { path: 'counter' } } } },
              ]),
              createBeginRendering('text-1'),
            ]);
            setStep(1);
          } else if (step === 1) {
            setTimeout(() => {
              processMessages([
                createDataModelUpdate([{ key: 'counter', value: 'Count: 1' }]),
              ]);
            }, 10);
          }
        }, [processMessages, step]);

        return <A2UIRenderer surfaceId="@default" />;
      }

      render(
        <A2UIProvider>
          <DataUpdateRenderer />
        </A2UIProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Count: 1')).toBeInTheDocument();
      });
    });
  });

  describe('Path Bindings', () => {
    it('should propagate data changes across components sharing the same path', async () => {
      function SharedDataRenderer() {
        const { processMessages } = useA2UI();

        useEffect(() => {
          processMessages([
            createSurfaceUpdate([
              {
                id: 'tf-1',
                component: {
                  TextField: {
                    text: { path: 'shared.name' },
                    label: { literalString: 'Name' },
                  },
                },
              },
              {
                id: 'text-1',
                component: {
                  Text: { text: { path: 'shared.name' } },
                },
              },
              {
                id: 'col-1',
                component: {
                  Column: { children: { explicitList: ['tf-1', 'text-1'] } },
                },
              },
            ]),
            createBeginRendering('col-1'),
          ]);
        }, [processMessages]);

        return <A2UIRenderer surfaceId="@default" />;
      }

      const { container } = render(
        <A2UIProvider>
          <SharedDataRenderer />
        </A2UIProvider>
      );

      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();

      fireEvent.change(input!, { target: { value: 'Alice' } });

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });
    });

    it('should handle TextField value binding', () => {
      const messages: Types.ServerToClientMessage[] = [
        createSurfaceUpdate([
          {
            id: 'tf-1',
            component: {
              TextField: {
                value: { path: 'form.username' },
                label: { literalString: 'Username' },
              },
            },
          },
        ]),
        createBeginRendering('tf-1'),
      ];

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();

      fireEvent.change(input!, { target: { value: 'testuser' } });
      expect(input).toHaveValue('testuser');
    });

    it('should handle CheckBox checked binding via path', () => {
      const messages: Types.ServerToClientMessage[] = [
        createSurfaceUpdate([
          {
            id: 'cb-1',
            component: {
              CheckBox: {
                value: { path: 'form.agree' },
                label: { literalString: 'I agree' },
              },
            },
          },
        ]),
        createBeginRendering('cb-1'),
      ];

      const { container } = render(
        <TestWrapper>
          <TestRenderer messages={messages} />
        </TestWrapper>
      );

      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox).toBeInTheDocument();
      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });
});
