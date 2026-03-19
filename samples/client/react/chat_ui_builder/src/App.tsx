import {FormEvent, useCallback, useMemo, useRef, useState} from 'react';
import {A2UIProvider, A2UIRenderer, useA2UIActions} from '@a2ui/react';
import type {Types} from '@a2ui/react';

const DEFAULT_API_BASE = 'http://localhost:8010';

const EXAMPLES = [
  'Create a customer summary card with name Alice, tier VIP, recent orders, and a follow-up button.',
  'Build a bug triage panel with title Production Incident, severity high, owner Platform Team, and a mitigation checklist.',
  'Create a meeting preparation form with attendee name, meeting time, agenda, and a submit button.',
];

function Shell() {
  const {processMessages, clearSurfaces} = useA2UIActions();
  const [input, setInput] = useState(EXAMPLES[0]);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [apiBase, setApiBase] = useState(DEFAULT_API_BASE);
  const [history, setHistory] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(
    async (message: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      clearSurfaces();
      setStatus('streaming');
      setError(null);
      setHistory((prev) => [...prev, `> ${message}`]);

      try {
        const response = await fetch(`${apiBase}/api/chat/stream`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({message}),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const {done, value} = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, {stream: true});
          let newlineIndex = buffer.indexOf('\n');
          while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (line) {
              const frame = JSON.parse(line) as Types.ServerToClientMessage;
              processMessages([frame]);
            }
            newlineIndex = buffer.indexOf('\n');
          }
        }

        const tail = buffer.trim();
        if (tail) {
          const frame = JSON.parse(tail) as Types.ServerToClientMessage;
          processMessages([frame]);
        }

        setStatus('idle');
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setStatus('idle');
          return;
        }
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Streaming request failed');
      }
    },
    [apiBase, clearSurfaces, processMessages]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;
      await submit(trimmed);
    },
    [input, submit]
  );

  const exampleButtons = useMemo(
    () =>
      EXAMPLES.map((example) => (
        <button key={example} type="button" className="example-chip" onClick={() => setInput(example)}>
          {example}
        </button>
      )),
    []
  );

  return (
    <div className="page-shell">
      <aside className="control-panel">
        <div>
          <p className="eyebrow">Demo</p>
          <h1>Chat UI Builder</h1>
          <p className="description">
            Describe data in natural language. The backend streams NDJSON deltas from a local model,
            compiles them into strict A2UI frames, and this client renders those frames incrementally.
          </p>
        </div>

        <label className="field-group">
          <span>Backend URL</span>
          <input value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
        </label>

        <form className="composer" onSubmit={handleSubmit}>
          <label className="field-group">
            <span>Prompt</span>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10} />
          </label>
          <div className="button-row">
            <button type="submit" disabled={status === 'streaming'}>
              {status === 'streaming' ? 'Streaming…' : 'Generate UI'}
            </button>
            <button type="button" className="secondary" onClick={() => clearSurfaces()}>
              Clear surface
            </button>
          </div>
        </form>

        <div>
          <p className="section-title">Example prompts</p>
          <div className="example-list">{exampleButtons}</div>
        </div>

        <div className="status-panel">
          <p className="section-title">Status</p>
          <p className={`status-badge ${status}`}>{status}</p>
          {error ? <p className="error-text">{error}</p> : null}
        </div>

        <div>
          <p className="section-title">Request history</p>
          <ul className="history-list">
            {history.slice().reverse().map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="preview-panel">
        <div className="preview-card">
          <A2UIRenderer surfaceId="main" />
        </div>
      </main>
    </div>
  );
}

export function App() {
  return (
    <A2UIProvider>
      <Shell />
    </A2UIProvider>
  );
}
