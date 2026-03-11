import { useState, useEffect, useSyncExternalStore, useCallback } from 'react';
import { MessageProcessor, SurfaceModel } from '@a2ui/web_core/v0_9';
import { minimalCatalog, A2uiSurface } from '@a2ui/react';

// Import JSON examples
import ex1 from "../../../../specification/v0_9/json/catalogs/minimal/examples/1_simple_text.json";
import ex2 from "../../../../specification/v0_9/json/catalogs/minimal/examples/2_row_layout.json";
import ex3 from "../../../../specification/v0_9/json/catalogs/minimal/examples/3_interactive_button.json";
import ex4 from "../../../../specification/v0_9/json/catalogs/minimal/examples/4_login_form.json";
import ex5 from "../../../../specification/v0_9/json/catalogs/minimal/examples/5_complex_layout.json";
import ex6 from "../../../../specification/v0_9/json/catalogs/minimal/examples/6_capitalized_text.json";
import ex7 from "../../../../specification/v0_9/json/catalogs/minimal/examples/7_incremental.json";

const exampleFiles = [
  { key: '1_simple_text', data: ex1 },
  { key: '2_row_layout', data: ex2 },
  { key: '3_interactive_button', data: ex3 },
  { key: '4_login_form', data: ex4 },
  { key: '5_complex_layout', data: ex5 },
  { key: '6_capitalized_text', data: ex6 },
  { key: '7_incremental', data: ex7 },
];

const DataModelViewer = ({ surface }: { surface: SurfaceModel<any> }) => {
  const subscribeHook = useCallback((callback: () => void) => {
    const bound = surface.dataModel.subscribe('/', callback);
    return () => bound.unsubscribe();
  }, [surface]);

  const getSnapshot = useCallback(() => {
    return JSON.stringify(surface.dataModel.get('/'), null, 2);
  }, [surface]);

  const dataString = useSyncExternalStore(subscribeHook, getSnapshot);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <strong>Surface: {surface.id}</strong>
      <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
        {dataString}
      </pre>
    </div>
  );
};

export default function App() {
  const [selectedExampleKey, setSelectedExampleKey] = useState(exampleFiles[0].key);
  const selectedExample = exampleFiles.find((e) => e.key === selectedExampleKey)?.data as any;

  const [logs, setLogs] = useState<any[]>([]);
  const [processor, setProcessor] = useState<MessageProcessor<any> | null>(null);
  const [surfaces, setSurfaces] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1);

  // Initialize or reset processor
  const resetProcessor = useCallback((advanceToEnd: boolean = false) => {
    setProcessor(prevProcessor => {
      if (prevProcessor) {
        prevProcessor.model.dispose();
      }
      const newProcessor = new MessageProcessor([minimalCatalog as any], async (action: any) => {
        setLogs((l) => [...l, { time: new Date().toLocaleTimeString(), action }]);
      });
      
      if (advanceToEnd && selectedExample?.messages) {
        newProcessor.processMessages(selectedExample.messages);
      }
      return newProcessor;
    });

    setLogs([]);
    setSurfaces([]);
    
    if (advanceToEnd && selectedExample?.messages) {
      setCurrentMessageIndex(selectedExample.messages.length - 1);
    } else {
      setCurrentMessageIndex(-1);
    }
  }, [selectedExample]);

  // Effect to handle example selection change
  useEffect(() => {
    resetProcessor(true);
    // Cleanup on unmount or when changing examples
    return () => {
      setProcessor(prev => {
        if (prev) prev.model.dispose();
        return null;
      });
    };
  }, [selectedExampleKey, resetProcessor]);

  // Handle surface subscriptions
  useEffect(() => {
    if (!processor) {
      setSurfaces([]);
      return;
    }

    const updateSurfaces = () => {
      setSurfaces(Array.from(processor.model.surfacesMap.values()).map((s: any) => s.id as string));
    };

    updateSurfaces();

    const unsub1 = processor.model.onSurfaceCreated.subscribe(updateSurfaces);
    const unsub2 = processor.model.onSurfaceDeleted.subscribe(updateSurfaces);

    return () => {
      unsub1.unsubscribe();
      unsub2.unsubscribe();
    };
  }, [processor]);

  const advanceToMessage = (index: number) => {
    if (!processor || !selectedExample || !selectedExample.messages) return;
    
    // Process messages from currentMessageIndex + 1 to index
    const messagesToProcess = selectedExample.messages.slice(currentMessageIndex + 1, index + 1);
    if (messagesToProcess.length > 0) {
      processor.processMessages(messagesToProcess);
      setCurrentMessageIndex(index);
    }
  };

  const handleReset = () => {
    resetProcessor(false);
  };

  const messages = selectedExample?.messages || [];

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem', height: '100vh', boxSizing: 'border-box', textAlign: 'left', backgroundColor: '#fff', color: '#000' }}>
      
      {/* Left Column: Sample List */}
      <div style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <h2>Samples</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, overflowY: 'auto' }}>
          {exampleFiles.map((ex) => (
            <li key={ex.key} style={{ marginBottom: '8px' }}>
              <button
                onClick={() => setSelectedExampleKey(ex.key)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  fontWeight: selectedExampleKey === ex.key ? 'bold' : 'normal',
                  background: selectedExampleKey === ex.key ? '#eee' : '#fafafa',
                  color: '#000',
                  border: '1px solid #ccc',
                  padding: '8px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {ex.data.name || ex.key}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Center Column: Preview & JSON Stepper */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '400px' }}>
        <div style={{ flex: 1, border: '1px dashed #ccc', padding: '1rem', overflowY: 'auto', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3>Preview</h3>
          {surfaces.length === 0 && <p style={{ color: '#888' }}>No surfaces loaded. Advance the stepper to create one.</p>}
          {surfaces.map((surfaceId) => {
            const surface = processor?.model.getSurface(surfaceId);
            if (!surface) return null;
            return (
              <div key={surfaceId} style={{ marginBottom: '2rem' }}>
                 <div style={{ border: '1px solid #007bff', padding: '1rem', borderRadius: '8px', background: '#fff' }}>
                   <A2uiSurface surface={surface} />
                 </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: '300px', border: '1px solid #ccc', padding: '1rem', overflowY: 'auto', background: '#fafafa', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Messages</h3>
            <button onClick={handleReset} style={{ padding: '4px 8px', cursor: 'pointer' }}>Reset</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {messages.map((msg: any, i: number) => {
              const isActive = i <= currentMessageIndex;
              return (
                <div key={i} style={{ 
                  border: '1px solid', 
                  borderColor: isActive ? '#007bff' : '#ddd',
                  opacity: isActive ? 1 : 0.6,
                  padding: '8px', 
                  borderRadius: '4px',
                  background: isActive ? '#f0f8ff' : '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>Message {i + 1}</strong>
                    {!isActive && (
                      <button onClick={() => advanceToMessage(i)} style={{ padding: '2px 8px', cursor: 'pointer' }}>
                        Advance
                      </button>
                    )}
                  </div>
                  <pre style={{ fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                    {JSON.stringify(msg, null, 2)}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Live DataModelViewer & Action Logs */}
      <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3>Data Model</h3>
          <div style={{ flex: 1, border: '1px solid #ccc', padding: '8px', overflowY: 'auto', background: '#f9f9f9', color: '#333', borderRadius: '4px' }}>
            {surfaces.length === 0 ? <p style={{ color: '#888', fontSize: '12px' }}>Empty Data Model</p> : null}
            {surfaces.map((surfaceId) => {
              const surface = processor?.model.getSurface(surfaceId);
              if (!surface) return null;
              return <DataModelViewer key={surfaceId} surface={surface} />;
            })}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3>Action Logs</h3>
          <div style={{ flex: 1, border: '1px solid #ccc', padding: '8px', overflowY: 'auto', background: '#f9f9f9', color: '#333', borderRadius: '4px' }}>
             {logs.length === 0 ? <p style={{ color: '#888', fontSize: '12px' }}>No actions logged yet.</p> : null}
             {logs.map((log, i) => (
              <div key={i} style={{ fontSize: '12px', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                <strong style={{ display: 'block', color: '#007bff' }}>{log.time}</strong>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{JSON.stringify(log.action, null, 2)}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
