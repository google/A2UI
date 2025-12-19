/**
 * A2UI Protocol Demo
 * Demonstrates the full A2UI protocol with simulated streaming messages
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  MessageProcessor,
  A2UISurface,
  useSurfaceIds,
  type A2UIServerMessage,
  type A2UIClientAction,
  type BeginRenderingMessage,
  type SurfaceUpdateMessage,
  type DataModelUpdateMessage,
  type DeleteSurfaceMessage,
} from '@a2ui/react';
import './demo.css';

// =============================================================================
// SCENARIO DEFINITIONS
// =============================================================================

interface Scenario {
  name: string;
  description: string;
  messages: A2UIServerMessage[];
}

// -----------------------------------------------------------------------------
// Scenario 1: Flashcard with Buffering
// Demonstrates: surfaceUpdate before beginRendering, data binding
// -----------------------------------------------------------------------------
const flashcardScenario: Scenario = {
  name: 'Flashcard (Buffering)',
  description: 'Components and data arrive BEFORE beginRendering - demonstrates buffering',
  messages: [
    // Components arrive first (get buffered)
    {
      type: 'surfaceUpdate',
      surfaceId: 'flashcard-1',
      components: [
        { id: 'root', component: { Column: { children: ['title', 'card', 'buttons'], alignment: 'center' } } },
        { id: 'title', component: { Text: { text: { path: '/card/word' }, usageHint: 'h2' } } },
        { id: 'card', component: { Card: { child: 'card-content' } } },
        { id: 'card-content', component: { Column: { children: ['reading', 'meaning'], alignment: 'center' } } },
        { id: 'reading', component: { Text: { text: { path: '/card/reading' }, usageHint: 'h3' } } },
        { id: 'meaning', component: { Text: { text: { path: '/card/meaning' }, usageHint: 'body' } } },
        { id: 'buttons', component: { Row: { children: ['btn-again', 'btn-hard', 'btn-good', 'btn-easy'], distribution: 'spaceEvenly' } } },
        { id: 'btn-again', component: { Button: { child: 'btn-again-text', action: { name: 'review', context: { quality: 0 } } } } },
        { id: 'btn-again-text', component: { Text: { text: 'Again' } } },
        { id: 'btn-hard', component: { Button: { child: 'btn-hard-text', action: { name: 'review', context: { quality: 2 } } } } },
        { id: 'btn-hard-text', component: { Text: { text: 'Hard' } } },
        { id: 'btn-good', component: { Button: { child: 'btn-good-text', action: { name: 'review', context: { quality: 3 } } } } },
        { id: 'btn-good-text', component: { Text: { text: 'Good' } } },
        { id: 'btn-easy', component: { Button: { child: 'btn-easy-text', action: { name: 'review', context: { quality: 5 } } } } },
        { id: 'btn-easy-text', component: { Text: { text: 'Easy' } } },
      ],
    } as SurfaceUpdateMessage,
    // Data arrives second (also buffered)
    {
      type: 'dataModelUpdate',
      surfaceId: 'flashcard-1',
      contents: [
        {
          key: 'card',
          valueMap: [
            { key: 'word', valueString: '日本語' },
            { key: 'reading', valueString: 'にほんご' },
            { key: 'meaning', valueString: 'Japanese language' },
          ],
        },
      ],
    } as DataModelUpdateMessage,
    // Finally beginRendering - surface becomes visible with all data
    {
      type: 'beginRendering',
      surfaceId: 'flashcard-1',
      root: 'root',
    } as BeginRenderingMessage,
  ],
};

// -----------------------------------------------------------------------------
// Scenario 2: Dashboard with Stats
// Demonstrates: Normal message order, multiple data bindings
// -----------------------------------------------------------------------------
const dashboardScenario: Scenario = {
  name: 'Dashboard',
  description: 'Stats dashboard with data-bound values from the data model',
  messages: [
    {
      type: 'beginRendering',
      surfaceId: 'dashboard-1',
      root: 'root',
    } as BeginRenderingMessage,
    {
      type: 'surfaceUpdate',
      surfaceId: 'dashboard-1',
      components: [
        { id: 'root', component: { Column: { children: ['header', 'stats', 'chart-placeholder'] } } },
        { id: 'header', component: { Text: { text: 'Learning Dashboard', usageHint: 'h1' } } },
        { id: 'stats', component: { Row: { children: ['stat1', 'stat2', 'stat3'], distribution: 'spaceEvenly' } } },
        { id: 'stat1', component: { Card: { child: 'stat1-content' } } },
        { id: 'stat1-content', component: { Column: { children: ['stat1-value', 'stat1-label'], alignment: 'center' } } },
        { id: 'stat1-value', component: { Text: { text: { path: '/stats/reviewed' }, usageHint: 'h2' } } },
        { id: 'stat1-label', component: { Text: { text: 'Reviewed Today', usageHint: 'caption' } } },
        { id: 'stat2', component: { Card: { child: 'stat2-content' } } },
        { id: 'stat2-content', component: { Column: { children: ['stat2-value', 'stat2-label'], alignment: 'center' } } },
        { id: 'stat2-value', component: { Text: { text: { path: '/stats/accuracy' }, usageHint: 'h2' } } },
        { id: 'stat2-label', component: { Text: { text: 'Accuracy', usageHint: 'caption' } } },
        { id: 'stat3', component: { Card: { child: 'stat3-content' } } },
        { id: 'stat3-content', component: { Column: { children: ['stat3-value', 'stat3-label'], alignment: 'center' } } },
        { id: 'stat3-value', component: { Text: { text: { path: '/stats/streak' }, usageHint: 'h2' } } },
        { id: 'stat3-label', component: { Text: { text: 'Day Streak', usageHint: 'caption' } } },
        { id: 'chart-placeholder', component: { Card: { child: 'chart-text' } } },
        { id: 'chart-text', component: { Text: { text: '📊 Progress chart would render here', usageHint: 'body' } } },
      ],
    } as SurfaceUpdateMessage,
    {
      type: 'dataModelUpdate',
      surfaceId: 'dashboard-1',
      contents: [
        {
          key: 'stats',
          valueMap: [
            { key: 'reviewed', valueString: '47' },
            { key: 'accuracy', valueString: '89%' },
            { key: 'streak', valueString: '12' },
          ],
        },
      ],
    } as DataModelUpdateMessage,
  ],
};

// -----------------------------------------------------------------------------
// Scenario 3: Live Counter
// Demonstrates: Data model updates over time (real-time data)
// -----------------------------------------------------------------------------
const liveCounterScenario: Scenario = {
  name: 'Live Counter',
  description: 'Data model updates in real-time - watch the counter increment!',
  messages: [
    {
      type: 'beginRendering',
      surfaceId: 'counter-1',
      root: 'root',
    } as BeginRenderingMessage,
    {
      type: 'surfaceUpdate',
      surfaceId: 'counter-1',
      components: [
        { id: 'root', component: { Column: { children: ['title', 'counter-card', 'status'], alignment: 'center' } } },
        { id: 'title', component: { Text: { text: 'Live Counter Demo', usageHint: 'h2' } } },
        { id: 'counter-card', component: { Card: { child: 'counter-value' } } },
        { id: 'counter-value', component: { Text: { text: { path: '/counter' }, usageHint: 'h1' } } },
        { id: 'status', component: { Text: { text: { path: '/status' }, usageHint: 'caption' } } },
      ],
    } as SurfaceUpdateMessage,
    { type: 'dataModelUpdate', surfaceId: 'counter-1', contents: [{ key: 'counter', valueString: '0' }, { key: 'status', valueString: 'Starting...' }] } as DataModelUpdateMessage,
    { type: 'dataModelUpdate', surfaceId: 'counter-1', contents: [{ key: 'counter', valueString: '1' }, { key: 'status', valueString: 'Counting...' }] } as DataModelUpdateMessage,
    { type: 'dataModelUpdate', surfaceId: 'counter-1', contents: [{ key: 'counter', valueString: '2' }] } as DataModelUpdateMessage,
    { type: 'dataModelUpdate', surfaceId: 'counter-1', contents: [{ key: 'counter', valueString: '3' }] } as DataModelUpdateMessage,
    { type: 'dataModelUpdate', surfaceId: 'counter-1', contents: [{ key: 'counter', valueString: '4' }] } as DataModelUpdateMessage,
    { type: 'dataModelUpdate', surfaceId: 'counter-1', contents: [{ key: 'counter', valueString: '5' }, { key: 'status', valueString: 'Done!' }] } as DataModelUpdateMessage,
  ],
};

// -----------------------------------------------------------------------------
// Scenario 4: Incremental Build
// Demonstrates: Components added one at a time
// -----------------------------------------------------------------------------
const incrementalBuildScenario: Scenario = {
  name: 'Incremental Build',
  description: 'Watch components appear one by one as messages arrive',
  messages: [
    {
      type: 'beginRendering',
      surfaceId: 'incremental-1',
      root: 'root',
    } as BeginRenderingMessage,
    // Start with just the container
    {
      type: 'surfaceUpdate',
      surfaceId: 'incremental-1',
      components: [
        { id: 'root', component: { Column: { children: ['title'], alignment: 'center' } } },
        { id: 'title', component: { Text: { text: 'Building UI...', usageHint: 'h2' } } },
      ],
    } as SurfaceUpdateMessage,
    // Add first card
    {
      type: 'surfaceUpdate',
      surfaceId: 'incremental-1',
      components: [
        { id: 'root', component: { Column: { children: ['title', 'card1'], alignment: 'center' } } },
        { id: 'card1', component: { Card: { child: 'card1-text' } } },
        { id: 'card1-text', component: { Text: { text: '✨ First component added!' } } },
      ],
    } as SurfaceUpdateMessage,
    // Add second card
    {
      type: 'surfaceUpdate',
      surfaceId: 'incremental-1',
      components: [
        { id: 'root', component: { Column: { children: ['title', 'card1', 'card2'], alignment: 'center' } } },
        { id: 'card2', component: { Card: { child: 'card2-text' } } },
        { id: 'card2-text', component: { Text: { text: '🎉 Second component added!' } } },
      ],
    } as SurfaceUpdateMessage,
    // Add buttons row
    {
      type: 'surfaceUpdate',
      surfaceId: 'incremental-1',
      components: [
        { id: 'root', component: { Column: { children: ['title', 'card1', 'card2', 'buttons'], alignment: 'center' } } },
        { id: 'title', component: { Text: { text: 'UI Complete!', usageHint: 'h2' } } },
        { id: 'buttons', component: { Row: { children: ['btn1', 'btn2'], distribution: 'center' } } },
        { id: 'btn1', component: { Button: { child: 'btn1-text', action: { name: 'action1' } } } },
        { id: 'btn1-text', component: { Text: { text: 'Action 1' } } },
        { id: 'btn2', component: { Button: { child: 'btn2-text', action: { name: 'action2' } } } },
        { id: 'btn2-text', component: { Text: { text: 'Action 2' } } },
      ],
    } as SurfaceUpdateMessage,
  ],
};

// -----------------------------------------------------------------------------
// Scenario 5: Surface Lifecycle
// Demonstrates: Creating and deleting surfaces
// -----------------------------------------------------------------------------
const lifecycleScenario: Scenario = {
  name: 'Surface Lifecycle',
  description: 'Watch surfaces appear and disappear (deleteSurface message)',
  messages: [
    // Create first surface
    { type: 'beginRendering', surfaceId: 'temp-1', root: 'root' } as BeginRenderingMessage,
    {
      type: 'surfaceUpdate',
      surfaceId: 'temp-1',
      components: [
        { id: 'root', component: { Card: { child: 'text' } } },
        { id: 'text', component: { Text: { text: '🟢 Surface 1 - I will be deleted soon...', usageHint: 'body' } } },
      ],
    } as SurfaceUpdateMessage,
    // Create second surface
    { type: 'beginRendering', surfaceId: 'temp-2', root: 'root' } as BeginRenderingMessage,
    {
      type: 'surfaceUpdate',
      surfaceId: 'temp-2',
      components: [
        { id: 'root', component: { Card: { child: 'text' } } },
        { id: 'text', component: { Text: { text: '🔵 Surface 2 - I will stay!', usageHint: 'body' } } },
      ],
    } as SurfaceUpdateMessage,
    // Create third surface
    { type: 'beginRendering', surfaceId: 'temp-3', root: 'root' } as BeginRenderingMessage,
    {
      type: 'surfaceUpdate',
      surfaceId: 'temp-3',
      components: [
        { id: 'root', component: { Card: { child: 'text' } } },
        { id: 'text', component: { Text: { text: '🟡 Surface 3 - I will also be deleted...', usageHint: 'body' } } },
      ],
    } as SurfaceUpdateMessage,
    // Delete first and third surfaces
    { type: 'deleteSurface', surfaceId: 'temp-1' } as DeleteSurfaceMessage,
    { type: 'deleteSurface', surfaceId: 'temp-3' } as DeleteSurfaceMessage,
  ],
};

// -----------------------------------------------------------------------------
// Scenario 6: Quiz Flow
// Demonstrates: Multi-step interaction with data updates
// -----------------------------------------------------------------------------
const quizScenario: Scenario = {
  name: 'Quiz Flow',
  description: 'Simulates a quiz with questions and progress updates',
  messages: [
    { type: 'beginRendering', surfaceId: 'quiz-1', root: 'root' } as BeginRenderingMessage,
    // Initial quiz structure
    {
      type: 'surfaceUpdate',
      surfaceId: 'quiz-1',
      components: [
        { id: 'root', component: { Column: { children: ['header', 'progress', 'question-card', 'options'], alignment: 'stretch' } } },
        { id: 'header', component: { Text: { text: { path: '/quiz/title' }, usageHint: 'h2' } } },
        { id: 'progress', component: { Text: { text: { path: '/quiz/progress' }, usageHint: 'caption' } } },
        { id: 'question-card', component: { Card: { child: 'question' } } },
        { id: 'question', component: { Text: { text: { path: '/quiz/question' }, usageHint: 'h3' } } },
        { id: 'options', component: { Column: { children: ['opt-a', 'opt-b', 'opt-c'], alignment: 'stretch' } } },
        { id: 'opt-a', component: { Button: { child: 'opt-a-text', action: { name: 'answer', context: { choice: 'A' } } } } },
        { id: 'opt-a-text', component: { Text: { text: { path: '/quiz/optionA' } } } },
        { id: 'opt-b', component: { Button: { child: 'opt-b-text', action: { name: 'answer', context: { choice: 'B' } } } } },
        { id: 'opt-b-text', component: { Text: { text: { path: '/quiz/optionB' } } } },
        { id: 'opt-c', component: { Button: { child: 'opt-c-text', action: { name: 'answer', context: { choice: 'C' } } } } },
        { id: 'opt-c-text', component: { Text: { text: { path: '/quiz/optionC' } } } },
      ],
    } as SurfaceUpdateMessage,
    // Question 1
    {
      type: 'dataModelUpdate',
      surfaceId: 'quiz-1',
      contents: [
        {
          key: 'quiz',
          valueMap: [
            { key: 'title', valueString: 'Japanese Quiz' },
            { key: 'progress', valueString: 'Question 1 of 3' },
            { key: 'question', valueString: 'What does "ありがとう" mean?' },
            { key: 'optionA', valueString: 'A) Hello' },
            { key: 'optionB', valueString: 'B) Thank you' },
            { key: 'optionC', valueString: 'C) Goodbye' },
          ],
        },
      ],
    } as DataModelUpdateMessage,
    // Question 2
    {
      type: 'dataModelUpdate',
      surfaceId: 'quiz-1',
      contents: [
        {
          key: 'quiz',
          valueMap: [
            { key: 'progress', valueString: 'Question 2 of 3' },
            { key: 'question', valueString: 'What does "さようなら" mean?' },
            { key: 'optionA', valueString: 'A) Goodbye' },
            { key: 'optionB', valueString: 'B) Good morning' },
            { key: 'optionC', valueString: 'C) Good night' },
          ],
        },
      ],
    } as DataModelUpdateMessage,
    // Question 3
    {
      type: 'dataModelUpdate',
      surfaceId: 'quiz-1',
      contents: [
        {
          key: 'quiz',
          valueMap: [
            { key: 'progress', valueString: 'Question 3 of 3' },
            { key: 'question', valueString: 'What does "おはよう" mean?' },
            { key: 'optionA', valueString: 'A) Good evening' },
            { key: 'optionB', valueString: 'B) Good morning' },
            { key: 'optionC', valueString: 'C) Good afternoon' },
          ],
        },
      ],
    } as DataModelUpdateMessage,
    // Complete
    {
      type: 'dataModelUpdate',
      surfaceId: 'quiz-1',
      contents: [
        {
          key: 'quiz',
          valueMap: [
            { key: 'progress', valueString: 'Quiz Complete! 🎉' },
            { key: 'question', valueString: 'Great job! You finished the quiz.' },
            { key: 'optionA', valueString: 'A) Try Again' },
            { key: 'optionB', valueString: 'B) View Results' },
            { key: 'optionC', valueString: 'C) Exit' },
          ],
        },
      ],
    } as DataModelUpdateMessage,
  ],
};

// -----------------------------------------------------------------------------
// Scenario 7: Form with Inputs
// Demonstrates: Interactive form components
// -----------------------------------------------------------------------------
const formScenario: Scenario = {
  name: 'Settings Form',
  description: 'Form with various input components and data binding',
  messages: [
    { type: 'beginRendering', surfaceId: 'form-1', root: 'root' } as BeginRenderingMessage,
    {
      type: 'surfaceUpdate',
      surfaceId: 'form-1',
      components: [
        { id: 'root', component: { Column: { children: ['title', 'form-card', 'actions'], alignment: 'stretch' } } },
        { id: 'title', component: { Text: { text: 'Settings', usageHint: 'h2' } } },
        { id: 'form-card', component: { Card: { child: 'form-content' } } },
        { id: 'form-content', component: { Column: { children: ['field1', 'field2', 'toggle-row'], alignment: 'stretch' } } },
        { id: 'field1', component: { TextField: { label: 'Display Name', text: { path: '/form/name' }, usageHint: 'shortText' } } },
        { id: 'field2', component: { TextField: { label: 'Bio', text: { path: '/form/bio' }, usageHint: 'longText' } } },
        { id: 'toggle-row', component: { Row: { children: ['checkbox1'], distribution: 'start' } } },
        { id: 'checkbox1', component: { CheckBox: { label: 'Enable notifications', value: { path: '/form/notifications' } } } },
        { id: 'actions', component: { Row: { children: ['save-btn', 'cancel-btn'], distribution: 'end' } } },
        { id: 'save-btn', component: { Button: { child: 'save-text', action: { name: 'save' } } } },
        { id: 'save-text', component: { Text: { text: 'Save Changes' } } },
        { id: 'cancel-btn', component: { Button: { child: 'cancel-text', primary: false, action: { name: 'cancel' } } } },
        { id: 'cancel-text', component: { Text: { text: 'Cancel' } } },
      ],
    } as SurfaceUpdateMessage,
    {
      type: 'dataModelUpdate',
      surfaceId: 'form-1',
      contents: [
        {
          key: 'form',
          valueMap: [
            { key: 'name', valueString: 'User123' },
            { key: 'bio', valueString: 'Learning Japanese!' },
            { key: 'notifications', valueBoolean: true },
          ],
        },
      ],
    } as DataModelUpdateMessage,
  ],
};

// -----------------------------------------------------------------------------
// Scenario 8: Multiple Surfaces
// Demonstrates: Running multiple independent surfaces
// -----------------------------------------------------------------------------
const multipleSurfacesScenario: Scenario = {
  name: 'Multiple Surfaces',
  description: 'Two independent surfaces rendered side by side',
  messages: [
    ...flashcardScenario.messages,
    ...dashboardScenario.messages,
  ],
};

// =============================================================================
// ALL SCENARIOS
// =============================================================================

const allScenarios: Record<string, Scenario> = {
  flashcard: flashcardScenario,
  dashboard: dashboardScenario,
  liveCounter: liveCounterScenario,
  incrementalBuild: incrementalBuildScenario,
  lifecycle: lifecycleScenario,
  quiz: quizScenario,
  form: formScenario,
  multiple: multipleSurfacesScenario,
};

// =============================================================================
// PROTOCOL DEMO COMPONENT
// =============================================================================

export function ProtocolDemo() {
  const [processor] = useState(() => new MessageProcessor());
  const [messageLog, setMessageLog] = useState<{ msg: A2UIServerMessage; timestamp: number }[]>([]);
  const [actionLog, setActionLog] = useState<A2UIClientAction[]>([]);
  const [scenario, setScenario] = useState<string>('flashcard');
  const [streamSpeed, setStreamSpeed] = useState<number>(500);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamAbort = useRef<AbortController | null>(null);

  const surfaceIds = useSurfaceIds(processor);

  // Stream messages with delay
  const streamMessages = useCallback(async (messages: A2UIServerMessage[]) => {
    streamAbort.current = new AbortController();
    setIsStreaming(true);

    for (const msg of messages) {
      if (streamAbort.current.signal.aborted) break;

      processor.processMessage(msg);
      setMessageLog((prev) => [...prev, { msg, timestamp: Date.now() }]);

      await new Promise((resolve) => setTimeout(resolve, streamSpeed));
    }

    setIsStreaming(false);
  }, [processor, streamSpeed]);

  // Handle scenario selection
  const runScenario = useCallback(() => {
    // Clear previous state
    processor.clear();
    setMessageLog([]);
    setActionLog([]);

    const selectedScenario = allScenarios[scenario];
    if (selectedScenario) {
      streamMessages(selectedScenario.messages);
    }
  }, [processor, scenario, streamMessages]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    streamAbort.current?.abort();
    setIsStreaming(false);
  }, []);

  // Handle actions from surfaces
  const handleAction = useCallback((action: A2UIClientAction) => {
    console.log('[Protocol Demo] Action:', action);
    setActionLog((prev) => [...prev.slice(-9), action]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamAbort.current?.abort();
    };
  }, []);

  const currentScenario = allScenarios[scenario];

  return (
    <div className="protocol-demo">
      {/* Controls */}
      <div className="protocol-controls">
        <h2>A2UI Protocol Demo</h2>
        <p className="protocol-description">
          {currentScenario?.description || 'Select a scenario to see how A2UI protocol works'}
        </p>

        <div className="protocol-options">
          <div className="protocol-option">
            <label>Scenario:</label>
            <select value={scenario} onChange={(e) => setScenario(e.target.value)}>
              {Object.entries(allScenarios).map(([key, s]) => (
                <option key={key} value={key}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="protocol-option">
            <label>Stream Speed: {streamSpeed}ms</label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={streamSpeed}
              onChange={(e) => setStreamSpeed(Number(e.target.value))}
            />
          </div>

          <div className="protocol-buttons">
            <button onClick={runScenario} disabled={isStreaming} className="protocol-btn primary">
              {isStreaming ? 'Streaming...' : 'Run Scenario'}
            </button>
            <button onClick={stopStreaming} disabled={!isStreaming} className="protocol-btn">
              Stop
            </button>
            <button onClick={() => { processor.clear(); setMessageLog([]); setActionLog([]); }} className="protocol-btn">
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="protocol-main">
        {/* Surfaces */}
        <div className="protocol-surfaces">
          <h3>Rendered Surfaces ({surfaceIds.length})</h3>
          {surfaceIds.length === 0 ? (
            <div className="protocol-empty">No surfaces yet. Run a scenario to start.</div>
          ) : (
            <div className="protocol-surface-container">
              {surfaceIds.map((id) => (
                <div key={id} className="protocol-surface-wrapper">
                  <div className="protocol-surface-label">Surface: {id}</div>
                  <A2UISurface
                    surfaceId={id}
                    processor={processor}
                    onAction={handleAction}
                    mode="light"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Log */}
        <div className="protocol-log">
          <h3>Message Stream</h3>
          <div className="protocol-log-content">
            {messageLog.length === 0 ? (
              <div className="protocol-empty">No messages yet</div>
            ) : (
              messageLog.map((entry, i) => (
                <div key={i} className={`protocol-message ${entry.msg.type}`}>
                  <span className="msg-type">{entry.msg.type}</span>
                  <span className="msg-surface">{entry.msg.surfaceId}</span>
                  {'components' in entry.msg && (
                    <span className="msg-detail">{entry.msg.components.length} components</span>
                  )}
                  {'contents' in entry.msg && (
                    <span className="msg-detail">{entry.msg.contents.length} entries</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Log */}
        <div className="protocol-actions">
          <h3>Actions (→ Server)</h3>
          <div className="protocol-log-content">
            {actionLog.length === 0 ? (
              <div className="protocol-empty">Interact with surfaces to trigger actions</div>
            ) : (
              actionLog.map((action, i) => (
                <div key={i} className="protocol-action">
                  <span className="action-surface">{action.surfaceId}</span>
                  <span className="action-name">{action.action.name}</span>
                  {action.action.context && (
                    <span className="action-context">{JSON.stringify(action.action.context)}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProtocolDemo;
