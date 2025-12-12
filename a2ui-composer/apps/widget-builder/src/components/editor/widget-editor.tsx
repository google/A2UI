"use client";

import { useState, useCallback } from "react";
import {
  CopilotChat,
  useAgentContext,
  useFrontendTool,
} from "@copilotkit/react-core/v2";
import { z } from "zod";
import { EditorHeader } from "./editor-header";
import { CodeEditor } from "./code-editor";
import { PreviewPane } from "./preview-pane";
import { DataPanel } from "./data-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useWidgets } from "@/contexts/widgets-context";
import type { Widget, DataState } from "@/types/widget";
import type { ComponentInstance } from "@copilotkitnext/a2ui-renderer";

interface WidgetEditorProps {
  widget: Widget;
}

export function WidgetEditor({ widget }: WidgetEditorProps) {
  const { updateWidget } = useWidgets();

  // Local state for components (JSON string for editor)
  const [componentsJson, setComponentsJson] = useState(() =>
    JSON.stringify(widget.components, null, 2),
  );

  // Local state for dataStates
  const [dataStates, setDataStates] = useState<DataState[]>(widget.dataStates);
  const [activeDataStateIndex, setActiveDataStateIndex] = useState(0);

  // Parsed components for preview (null if invalid JSON)
  const [components, setComponents] = useState<ComponentInstance[]>(
    widget.components,
  );

  const handleComponentsChange = useCallback(
    (json: string) => {
      setComponentsJson(json);
      try {
        const parsed = JSON.parse(json) as ComponentInstance[];
        setComponents(parsed);
        updateWidget(widget.id, { components: parsed });
      } catch {
        // Invalid JSON, don't update
      }
    },
    [widget.id, updateWidget],
  );

  const handleDataStatesChange = useCallback(
    (newDataStates: DataState[]) => {
      setDataStates(newDataStates);
      updateWidget(widget.id, { dataStates: newDataStates });
    },
    [widget.id, updateWidget],
  );

  const handleAddDataState = useCallback(() => {
    const newState: DataState = {
      name: `state-${dataStates.length + 1}`,
      data: dataStates[0]?.data ? { ...dataStates[0].data } : {},
    };
    const newDataStates = [...dataStates, newState];
    handleDataStatesChange(newDataStates);
    setActiveDataStateIndex(newDataStates.length - 1);
  }, [dataStates, handleDataStatesChange]);

  const handleUpdateDataState = useCallback(
    (index: number, data: Record<string, unknown>) => {
      const newDataStates = dataStates.map((ds, i) =>
        i === index ? { ...ds, data } : ds,
      );
      handleDataStatesChange(newDataStates);
    },
    [dataStates, handleDataStatesChange],
  );

  const handleRenameDataState = useCallback(
    (index: number, name: string) => {
      const newDataStates = dataStates.map((ds, i) =>
        i === index ? { ...ds, name } : ds,
      );
      handleDataStatesChange(newDataStates);
    },
    [dataStates, handleDataStatesChange],
  );

  const handleDeleteDataState = useCallback(
    (index: number) => {
      if (dataStates.length <= 1) return; // Keep at least one state
      const newDataStates = dataStates.filter((_, i) => i !== index);
      handleDataStatesChange(newDataStates);
      if (activeDataStateIndex >= newDataStates.length) {
        setActiveDataStateIndex(newDataStates.length - 1);
      }
    },
    [dataStates, activeDataStateIndex, handleDataStatesChange],
  );

  const activeData = dataStates[activeDataStateIndex]?.data ?? {};

  useAgentContext({
    description: "The current data",
    value: activeData,
  });

  useAgentContext({
    description: "The current components",
    value: components,
  });

  // Tool for AI to edit the widget
  useFrontendTool({
    name: "editWidget",
    description:
      "Edit the widget by updating its data and/or components. Both parameters are optional - pass only what you want to change.",
    parameters: z.object({
      data: z
        .string()
        .optional()
        .describe("The new data object for the widget in JSON. Optional."),
      components: z
        .string()
        .optional()
        .describe("The new components array for the widget in JSON. Optional."),
    }),
    handler: async ({ data, components: newComponents }) => {
      if (data !== undefined) {
        handleUpdateDataState(activeDataStateIndex, JSON.parse(data));
      }
      if (newComponents !== undefined) {
        // Pretty-print the JSON for the editor
        const prettyJson = JSON.stringify(JSON.parse(newComponents), null, 2);
        handleComponentsChange(prettyJson);
      }
      return {
        success: true,
        updated: {
          data: data !== undefined,
          components: newComponents !== undefined,
        },
      };
    },
  });

  return (
    <div className="flex h-full gap-2">
      {/* Main editor area */}
      <div className="flex flex-1 flex-col bg-background rounded-lg overflow-hidden">
        <EditorHeader widget={widget} />

        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left: Code Editor + Data Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* Code Editor */}
              <ResizablePanel defaultSize={70} minSize={20}>
                <CodeEditor
                  value={componentsJson}
                  onChange={handleComponentsChange}
                />
              </ResizablePanel>

              <ResizableHandle />

              {/* Data Panel */}
              <ResizablePanel defaultSize={30} minSize={15}>
                <DataPanel
                  dataStates={dataStates}
                  activeIndex={activeDataStateIndex}
                  onActiveIndexChange={setActiveDataStateIndex}
                  onAddState={handleAddDataState}
                  onUpdateState={handleUpdateDataState}
                  onRenameState={handleRenameDataState}
                  onDeleteState={handleDeleteDataState}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle />

          {/* Middle: Preview Pane */}
          <ResizablePanel defaultSize={50} minSize={20}>
            <PreviewPane
              root={widget.root}
              components={components}
              data={activeData}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Right: Chat column - styled like left sidebar */}
      <div className="w-[400px] flex-shrink-0 border-2 border-white bg-white/50 rounded-lg overflow-hidden">
        <CopilotChat
          threadId={widget.id}
          className="h-full"
          feather={{ className: "right-0" }}
          inputProps={{
            className: "border border-white/80 shadow-sm bg-white/50",
            sendButton: {
              className:
                "enabled:bg-gradient-to-br enabled:from-violet-500 enabled:to-indigo-600 enabled:hover:from-violet-600 enabled:hover:to-indigo-700 enabled:border-0",
            },
          }}
          disclaimer={() => (
            <div className="text-center text-xs text-muted-foreground py-2">
              Powered by 🪁 CopilotKit
            </div>
          )}
        />
      </div>
    </div>
  );
}
