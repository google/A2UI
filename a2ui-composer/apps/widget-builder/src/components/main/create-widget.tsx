'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import {
  useAgent,
  useCopilotKit,
  useFrontendTool,
} from '@copilotkit/react-core/v2';
import { z } from 'zod';
import { WidgetInput } from './widget-input';
import { useWidgets } from '@/contexts/widgets-context';
import type { Widget } from '@/types/widget';
import type { ComponentInstance } from '@copilotkitnext/a2ui-renderer';

const DEFAULT_COMPONENTS: ComponentInstance[] = [
  {
    id: 'root',
    component: {
      Card: {
        child: 'content',
      },
    },
  },
  {
    id: 'content',
    component: {
      Text: {
        text: { path: '/title' },
      },
    },
  },
];

const DEFAULT_DATA = { title: 'Hello World' };

export function CreateWidget() {
  const router = useRouter();
  const { addWidget } = useWidgets();
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();

  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Refs to capture tool results
  const generatedName = useRef<string | null>(null);
  const generatedComponents = useRef<ComponentInstance[] | null>(null);
  const generatedData = useRef<Record<string, unknown> | null>(null);

  // Frontend tool for creating new widgets - captures AI output
  useFrontendTool({
    name: 'editWidget',
    description:
      'Create a new widget with the specified name, data, and components.',
    parameters: z.object({
      name: z
        .string()
        .describe('A short descriptive name for the widget (e.g. "User Profile Card", "Weather Widget").'),
      data: z
        .string()
        .describe('The data object for the widget in JSON.'),
      components: z
        .string()
        .describe('The components array for the widget in JSON.'),
    }),
    handler: async ({ name, data, components }) => {
      generatedName.current = name;
      generatedData.current = JSON.parse(data);
      generatedComponents.current = JSON.parse(components);
      return { success: true };
    },
  });

  const handleCreate = async () => {
    if (!inputValue.trim() || isGenerating) return;

    setIsGenerating(true);

    // Reset refs
    generatedName.current = null;
    generatedComponents.current = null;
    generatedData.current = null;

    const widgetId = uuidv4();

    try {
      // Reset agent for fresh conversation
      agent.setMessages([]);
      agent.threadId = widgetId;

      // Add user message
      agent.addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: inputValue,
      });

      // Run agent (will call editWidget tool)
      await copilotkit.runAgent({ agent });

      // Create widget with generated content (or defaults if tool wasn't called)
      const newWidget: Widget = {
        id: widgetId,
        name: generatedName.current ?? 'Untitled widget',
        createdAt: new Date(),
        updatedAt: new Date(),
        root: 'root',
        components: generatedComponents.current ?? DEFAULT_COMPONENTS,
        dataStates: [
          {
            name: 'default',
            data: generatedData.current ?? DEFAULT_DATA,
          },
        ],
      };

      await addWidget(newWidget);
      router.push(`/widget/${widgetId}`);
    } catch (error) {
      console.error('Failed to generate widget:', error);
      setIsGenerating(false);
    }
  };

  const handleStartBlank = async () => {
    const id = uuidv4();
    const newWidget: Widget = {
      id,
      name: 'Untitled widget',
      createdAt: new Date(),
      updatedAt: new Date(),
      root: 'root',
      components: DEFAULT_COMPONENTS,
      dataStates: [
        {
          name: 'default',
          data: DEFAULT_DATA,
        },
      ],
    };
    await addWidget(newWidget);
    router.push(`/widget/${id}`);
  };

  return (
    <div className="flex w-full flex-col items-center gap-4 px-4">
      <h1 className="text-4xl font-extralight tracking-tight">What would you like to build?</h1>
      <WidgetInput
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleCreate}
        disabled={isGenerating}
      />
      <span className="text-xs text-muted-foreground">
        Powered by 🪁 CopilotKit
      </span>
      {isGenerating ? (
        <span className="mt-4 text-sm text-muted-foreground">Generating widget...</span>
      ) : (
        <button
          onClick={handleStartBlank}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          or <span className="underline">Start Blank</span>
        </button>
      )}
    </div>
  );
}
