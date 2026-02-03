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

  describe('Server-Driven Data Model Updates', () => {
    it('should update TextField when dataModelUpdate changes bound path value', async () => {
      function TextFieldDataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            processMessages([
              createDataModelUpdate([{ key: 'user.name', value: 'Alice' }]),
              createSurfaceUpdate([
                {
                  id: 'tf-1',
                  component: {
                    TextField: {
                      text: { path: 'user.name' },
                      label: { literalString: 'Name' },
                    },
                  },
                },
              ]),
              createBeginRendering('tf-1'),
            ]);
            setTimeout(() => setStage('updated'), 10);
          } else if (stage === 'updated') {
            processMessages([
              createDataModelUpdate([{ key: 'user.name', value: 'Bob' }]),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      const { container } = render(
        <A2UIProvider>
          <TextFieldDataUpdateRenderer />
        </A2UIProvider>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toHaveValue('Alice');

      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('updated');
        expect(input).toHaveValue('Bob');
      });
    });

    it('should update CheckBox when dataModelUpdate changes bound path value', async () => {
      function CheckBoxDataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            processMessages([
              createDataModelUpdate([{ key: 'settings.enabled', value: false }]),
              createSurfaceUpdate([
                {
                  id: 'cb-1',
                  component: {
                    CheckBox: {
                      value: { path: 'settings.enabled' },
                      label: { literalString: 'Enable feature' },
                    },
                  },
                },
              ]),
              createBeginRendering('cb-1'),
            ]);
            setTimeout(() => setStage('updated'), 10);
          } else if (stage === 'updated') {
            processMessages([
              createDataModelUpdate([{ key: 'settings.enabled', value: true }]),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      render(
        <A2UIProvider>
          <CheckBoxDataUpdateRenderer />
        </A2UIProvider>
      );

      expect(screen.getByRole('checkbox')).not.toBeChecked();

      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('updated');
        expect(screen.getByRole('checkbox')).toBeChecked();
      });
    });

    it('should update Slider when dataModelUpdate changes bound path value', async () => {
      function SliderDataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            processMessages([
              createDataModelUpdate([{ key: 'volume', value: 30 }]),
              createSurfaceUpdate([
                {
                  id: 'slider-1',
                  component: {
                    Slider: {
                      value: { path: 'volume' },
                      minValue: 0,
                      maxValue: 100,
                    },
                  },
                },
              ]),
              createBeginRendering('slider-1'),
            ]);
            setTimeout(() => setStage('updated'), 10);
          } else if (stage === 'updated') {
            processMessages([
              createDataModelUpdate([{ key: 'volume', value: 80 }]),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      render(
        <A2UIProvider>
          <SliderDataUpdateRenderer />
        </A2UIProvider>
      );

      expect(screen.getByRole('slider')).toHaveValue('30');

      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('updated');
        expect(screen.getByRole('slider')).toHaveValue('80');
      });
    });

    it('should update multiple components bound to the same path simultaneously', async () => {
      function MultiComponentDataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            processMessages([
              createDataModelUpdate([{ key: 'shared.value', value: 'Initial' }]),
              createSurfaceUpdate([
                {
                  id: 'text-1',
                  component: { Text: { text: { path: 'shared.value' } } },
                },
                {
                  id: 'tf-1',
                  component: {
                    TextField: {
                      text: { path: 'shared.value' },
                      label: { literalString: 'Input' },
                    },
                  },
                },
                {
                  id: 'col-1',
                  component: { Column: { children: { explicitList: ['text-1', 'tf-1'] } } },
                },
              ]),
              createBeginRendering('col-1'),
            ]);
            setTimeout(() => setStage('updated'), 10);
          } else if (stage === 'updated') {
            processMessages([
              createDataModelUpdate([{ key: 'shared.value', value: 'Updated' }]),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      const { container } = render(
        <A2UIProvider>
          <MultiComponentDataUpdateRenderer />
        </A2UIProvider>
      );

      expect(screen.getByText('Initial')).toBeInTheDocument();
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toHaveValue('Initial');

      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('updated');
        expect(screen.getByText('Updated')).toBeInTheDocument();
        expect(input).toHaveValue('Updated');
      });
    });

    it('should handle dataModelUpdate with multiple key/value pairs at once', async () => {
      function MultiKeyDataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            processMessages([
              createDataModelUpdate([
                { key: 'form.firstName', value: 'John' },
                { key: 'form.lastName', value: 'Doe' },
              ]),
              createSurfaceUpdate([
                { id: 'text-first', component: { Text: { text: { path: 'form.firstName' } } } },
                { id: 'text-last', component: { Text: { text: { path: 'form.lastName' } } } },
                {
                  id: 'row-1',
                  component: { Row: { children: { explicitList: ['text-first', 'text-last'] } } },
                },
              ]),
              createBeginRendering('row-1'),
            ]);
            setTimeout(() => setStage('updated'), 10);
          } else if (stage === 'updated') {
            processMessages([
              createDataModelUpdate([
                { key: 'form.firstName', value: 'Jane' },
                { key: 'form.lastName', value: 'Smith' },
              ]),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      render(
        <A2UIProvider>
          <MultiKeyDataUpdateRenderer />
        </A2UIProvider>
      );

      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('updated');
        expect(screen.getByText('Jane')).toBeInTheDocument();
        expect(screen.getByText('Smith')).toBeInTheDocument();
        expect(screen.queryByText('John')).not.toBeInTheDocument();
        expect(screen.queryByText('Doe')).not.toBeInTheDocument();
      });
    });

    it('should handle deeply nested path values in dataModelUpdate', async () => {
      function NestedPathRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            processMessages([
              createDataModelUpdate([
                { key: 'user.profile.address.city', value: 'New York' },
              ]),
              createSurfaceUpdate([
                {
                  id: 'text-1',
                  component: { Text: { text: { path: 'user.profile.address.city' } } },
                },
              ]),
              createBeginRendering('text-1'),
            ]);
            setTimeout(() => setStage('updated'), 10);
          } else if (stage === 'updated') {
            processMessages([
              createDataModelUpdate([
                { key: 'user.profile.address.city', value: 'Los Angeles' },
              ]),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      render(
        <A2UIProvider>
          <NestedPathRenderer />
        </A2UIProvider>
      );

      expect(screen.getByText('New York')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('updated');
        expect(screen.getByText('Los Angeles')).toBeInTheDocument();
        expect(screen.queryByText('New York')).not.toBeInTheDocument();
      });
    });

    it('should update DateTimeInput when dataModelUpdate changes bound path value', async () => {
      function DateTimeInputDataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            processMessages([
              createDataModelUpdate([{ key: 'appointment.date', value: '2024-01-15' }]),
              createSurfaceUpdate([
                {
                  id: 'dt-1',
                  component: {
                    DateTimeInput: {
                      value: { path: 'appointment.date' },
                      enableDate: true,
                      enableTime: false,
                    },
                  },
                },
              ]),
              createBeginRendering('dt-1'),
            ]);
            setTimeout(() => setStage('updated'), 10);
          } else if (stage === 'updated') {
            processMessages([
              createDataModelUpdate([{ key: 'appointment.date', value: '2024-06-20' }]),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      const { container } = render(
        <A2UIProvider>
          <DateTimeInputDataUpdateRenderer />
        </A2UIProvider>
      );

      const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      expect(dateInput).toHaveValue('2024-01-15');

      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('updated');
        expect(dateInput).toHaveValue('2024-06-20');
      });
    });

    it('should update MultipleChoice when dataModelUpdate changes bound path value', async () => {
      function MultipleChoiceDataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            processMessages([
              createDataModelUpdate([{ key: 'survey.answers', value: ['option1'] }]),
              createSurfaceUpdate([
                {
                  id: 'mc-1',
                  component: {
                    MultipleChoice: {
                      selections: { path: 'survey.answers' },
                      options: [
                        { label: { literalString: 'Option 1' }, value: 'option1' },
                        { label: { literalString: 'Option 2' }, value: 'option2' },
                        { label: { literalString: 'Option 3' }, value: 'option3' },
                      ],
                      maxAllowedSelections: 2,
                    },
                  },
                },
              ]),
              createBeginRendering('mc-1'),
            ]);
            setTimeout(() => setStage('updated'), 10);
          } else if (stage === 'updated') {
            processMessages([
              createDataModelUpdate([{ key: 'survey.answers', value: ['option2', 'option3'] }]),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      const { container } = render(
        <A2UIProvider>
          <MultipleChoiceDataUpdateRenderer />
        </A2UIProvider>
      );

      // Initially option1 should be selected
      const checkboxes = container.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      expect(checkboxes[0]).toBeChecked(); // option1
      expect(checkboxes[1]).not.toBeChecked(); // option2
      expect(checkboxes[2]).not.toBeChecked(); // option3

      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('updated');
        // After update, option2 and option3 should be selected
        expect(checkboxes[0]).not.toBeChecked(); // option1
        expect(checkboxes[1]).toBeChecked(); // option2
        expect(checkboxes[2]).toBeChecked(); // option3
      });
    });

    it('should update Image when dataModelUpdate changes bound path value', async () => {
      function ImageDataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            processMessages([
              createDataModelUpdate([{ key: 'product.imageUrl', value: 'https://example.com/old-product.jpg' }]),
              createSurfaceUpdate([
                {
                  id: 'img-1',
                  component: {
                    Image: { url: { path: 'product.imageUrl' } },
                  },
                },
              ]),
              createBeginRendering('img-1'),
            ]);
            setTimeout(() => setStage('updated'), 10);
          } else if (stage === 'updated') {
            processMessages([
              createDataModelUpdate([{ key: 'product.imageUrl', value: 'https://example.com/new-product.jpg' }]),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      const { container } = render(
        <A2UIProvider>
          <ImageDataUpdateRenderer />
        </A2UIProvider>
      );

      const img = container.querySelector('img') as HTMLImageElement;
      expect(img).toHaveAttribute('src', 'https://example.com/old-product.jpg');

      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('updated');
        expect(img).toHaveAttribute('src', 'https://example.com/new-product.jpg');
      });
    });

    it('should update Icon when dataModelUpdate changes bound path value', async () => {
      function IconDataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            processMessages([
              createDataModelUpdate([{ key: 'ui.statusIcon', value: 'check' }]),
              createSurfaceUpdate([
                {
                  id: 'icon-1',
                  component: {
                    Icon: { name: { path: 'ui.statusIcon' } },
                  },
                },
              ]),
              createBeginRendering('icon-1'),
            ]);
            setTimeout(() => setStage('updated'), 10);
          } else if (stage === 'updated') {
            processMessages([
              createDataModelUpdate([{ key: 'ui.statusIcon', value: 'error' }]),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      const { container } = render(
        <A2UIProvider>
          <IconDataUpdateRenderer />
        </A2UIProvider>
      );

      expect(container.querySelector('.g-icon')).toHaveTextContent('check');

      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('updated');
        expect(container.querySelector('.g-icon')).toHaveTextContent('error');
      });
    });

    it('should update Video when dataModelUpdate changes bound path value', async () => {
      function VideoDataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            processMessages([
              createDataModelUpdate([{ key: 'media.videoUrl', value: 'https://example.com/old-video.mp4' }]),
              createSurfaceUpdate([
                {
                  id: 'video-1',
                  component: {
                    Video: { url: { path: 'media.videoUrl' } },
                  },
                },
              ]),
              createBeginRendering('video-1'),
            ]);
            setTimeout(() => setStage('updated'), 10);
          } else if (stage === 'updated') {
            processMessages([
              createDataModelUpdate([{ key: 'media.videoUrl', value: 'https://example.com/new-video.mp4' }]),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      const { container } = render(
        <A2UIProvider>
          <VideoDataUpdateRenderer />
        </A2UIProvider>
      );

      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video).toHaveAttribute('src', 'https://example.com/old-video.mp4');

      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('updated');
        expect(video).toHaveAttribute('src', 'https://example.com/new-video.mp4');
      });
    });

    it('should update AudioPlayer when dataModelUpdate changes bound path value', async () => {
      function AudioPlayerDataUpdateRenderer() {
        const { processMessages } = useA2UI();
        const [stage, setStage] = React.useState<'initial' | 'updated'>('initial');

        useEffect(() => {
          if (stage === 'initial') {
            processMessages([
              createDataModelUpdate([{ key: 'media.audioUrl', value: 'https://example.com/old-audio.mp3' }]),
              createSurfaceUpdate([
                {
                  id: 'audio-1',
                  component: {
                    AudioPlayer: {
                      url: { path: 'media.audioUrl' },
                      description: { literalString: 'Audio track' },
                    },
                  },
                },
              ]),
              createBeginRendering('audio-1'),
            ]);
            setTimeout(() => setStage('updated'), 10);
          } else if (stage === 'updated') {
            processMessages([
              createDataModelUpdate([{ key: 'media.audioUrl', value: 'https://example.com/new-audio.mp3' }]),
            ]);
          }
        }, [processMessages, stage]);

        return (
          <>
            <A2UIRenderer surfaceId="@default" />
            <span data-testid="stage">{stage}</span>
          </>
        );
      }

      const { container } = render(
        <A2UIProvider>
          <AudioPlayerDataUpdateRenderer />
        </A2UIProvider>
      );

      const audio = container.querySelector('audio') as HTMLAudioElement;
      expect(audio).toHaveAttribute('src', 'https://example.com/old-audio.mp3');

      await waitFor(() => {
        expect(screen.getByTestId('stage')).toHaveTextContent('updated');
        expect(audio).toHaveAttribute('src', 'https://example.com/new-audio.mp3');
      });
    });
  });
});
