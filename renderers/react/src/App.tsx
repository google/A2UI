import { useState, useEffect, useSyncExternalStore, useCallback } from 'react';
import { MessageProcessor, SurfaceModel } from '@a2ui/web_core/v0_9';
import { minimalCatalog } from './catalog';
import { A2uiSurface } from './A2uiSurface';

const DataModelViewer = ({ surface }: { surface: SurfaceModel<any> }) => {
  const subscribe = useCallback((callback: () => void) => {
    const bound = surface.dataModel.addListener('/', callback);
    return () => bound.removeListener();
  }, [surface]);

  const getSnapshot = useCallback(() => {
    return JSON.stringify(surface.dataModel.get('/'), null, 2);
  }, [surface]);

  const dataString = useSyncExternalStore(subscribe, getSnapshot);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <strong>{surface.id}</strong>
      <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
        {dataString}
      </pre>
    </div>
  );
};

import ex1 from '../../../specification/v0_9/json/catalogs/minimal/examples/1_simple_text.json';
import ex2 from '../../../specification/v0_9/json/catalogs/minimal/examples/2_row_layout.json';
import ex3 from '../../../specification/v0_9/json/catalogs/minimal/examples/3_interactive_button.json';
import ex4 from '../../../specification/v0_9/json/catalogs/minimal/examples/4_login_form.json';
import ex5 from '../../../specification/v0_9/json/catalogs/minimal/examples/5_complex_layout.json';
import ex6 from '../../../specification/v0_9/json/catalogs/minimal/examples/6_capitalized_text.json';

const examples: Record<string, any[]> = {
  '1_simple_text': ex1 as any[],
  '2_row_layout': ex2 as any[],
  '3_interactive_button': ex3 as any[],
  '4_login_form': ex4 as any[],
  '5_complex_layout': ex5 as any[],
  '6_capitalized_text': ex6 as any[],
};

export default function App() {
  const [selectedExample, setSelectedExample] = useState('1_simple_text');
  const [delayedData, setDelayedData] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [processor, setProcessor] = useState<MessageProcessor<any> | null>(null);

  useEffect(() => {
    // We clear logs when switching examples or remounting
    setLogs([]);
    
    const p = new MessageProcessor([minimalCatalog as any], async (action: any) => {
      setLogs((l) => [...l, { time: new Date().toLocaleTimeString(), action }]);
    });
    setProcessor(p);
    
    const msgs = examples[selectedExample];
    if (msgs) {
      p.processMessages(msgs as any[]);
    }
    
    let timerId: ReturnType<typeof setTimeout>;
    if (delayedData) {
      timerId = setTimeout(() => {
        const createSurfaceMsg: any = msgs?.find(m => (m as any).createSurface);
        if (createSurfaceMsg) {
          p.processMessages([
            {
              version: 'v0.9',
              updateDataModel: {
                surfaceId: createSurfaceMsg.createSurface.surfaceId,
                path: '/',
                value: {
                  username: 'testuser',
                  titleText: 'Loaded Title Data!',
                  company: 'Acme Corp',
                  employees: [{ name: 'Alice' }, { name: 'Bob' }]
                }
              }
            } as any
          ]);
        }
      }, 2000);
    }

    return () => {
      clearTimeout(timerId);
      p.model.dispose();
    };
  }, [selectedExample, delayedData]);

  const [surfaces, setSurfaces] = useState<string[]>([]);
  useEffect(() => {
    if (!processor) {
      setSurfaces([]);
      return;
    }
    
    const s = Array.from(processor.model.surfacesMap.values()).map((s: any) => s.id as string);
    setSurfaces(s);
    
    const unsub1 = processor.addSurfaceCreatedListener((_s: SurfaceModel<any>) => {
      setSurfaces(Array.from(processor.model.surfacesMap.values()).map((s: any) => s.id as string));
    });
    const unsub2 = processor.addSurfaceDeletedListener((_id: string) => {
      setSurfaces(Array.from(processor.model.surfacesMap.values()).map((s: any) => s.id as string));
    });

    return () => { unsub1(); unsub2(); };
  }, [processor]);

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem', height: '100vh', boxSizing: 'border-box', textAlign: 'left', backgroundColor: '#fff', color: '#000' }}>
      <div style={{ width: '300px', flexShrink: 0 }}>
        <h2>A2UI React Renderer</h2>
        <h3>Examples</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {Object.keys(examples).map((key) => (
            <li key={key} style={{ marginBottom: '8px' }}>
              <button
                onClick={() => setSelectedExample(key)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  fontWeight: selectedExample === key ? 'bold' : 'normal',
                  background: selectedExample === key ? '#eee' : '#fafafa',
                  color: '#000',
                  border: '1px solid #ccc',
                  padding: '8px',
                  borderRadius: '4px'
                }}
              >
                {key}
              </button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: '1rem' }}>
          <label>
            <input type="checkbox" checked={delayedData} onChange={e => setDelayedData(e.target.checked)} />
            Simulate delayed updateDataModel (2s)
          </label>
        </div>
        
        <h3>Action Logs</h3>
        <div style={{ border: '1px solid #ccc', padding: '8px', height: '200px', overflowY: 'auto', background: '#f9f9f9', color: '#333' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ fontSize: '12px', marginBottom: '4px', borderBottom: '1px solid #eee' }}>
              <strong>{log.time}</strong>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(log.action, null, 2)}</pre>
            </div>
          ))}
        </div>

        <h3>Data Model</h3>
        <div style={{ border: '1px solid #ccc', padding: '8px', height: '300px', overflowY: 'auto', background: '#f9f9f9', color: '#333' }}>
          {surfaces.map((surfaceId) => {
            const surface = processor?.model.getSurface(surfaceId);
            if (!surface) return null;
            return <DataModelViewer key={surfaceId} surface={surface} />;
          })}
        </div>
      </div>

      <div style={{ flex: 1, border: '1px dashed #ccc', padding: '1rem', overflowY: 'auto' }}>
        {surfaces.length === 0 && <p>Loading surface...</p>}
        {surfaces.map((surfaceId) => {
          const surface = processor?.model.getSurface(surfaceId);
          if (!surface) return null;
          return (
            <div key={surfaceId} style={{ marginBottom: '2rem' }}>
               <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Surface: {surfaceId}</h4>
               <div style={{ border: '1px solid #007bff', padding: '1rem', borderRadius: '8px', background: '#fff' }}>
                 <A2uiSurface surface={surface} />
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
