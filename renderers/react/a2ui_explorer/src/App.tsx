/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {useState, useEffect, useSyncExternalStore, useCallback} from 'react';
import {MessageProcessor, SurfaceModel, type A2uiMessage} from '@a2ui/web_core/v0_9';
import {minimalCatalog, basicCatalog, A2uiSurface, type ReactComponentImplementation} from '@a2ui/react/v0_9';

// Import Minimal examples
import min1 from '../../../../specification/v0_9/json/catalogs/minimal/examples/1_simple_text.json';
import min2 from '../../../../specification/v0_9/json/catalogs/minimal/examples/2_row_layout.json';
import min3 from '../../../../specification/v0_9/json/catalogs/minimal/examples/3_interactive_button.json';
import min4 from '../../../../specification/v0_9/json/catalogs/minimal/examples/4_login_form.json';
import min5 from '../../../../specification/v0_9/json/catalogs/minimal/examples/5_complex_layout.json';
import min6 from '../../../../specification/v0_9/json/catalogs/minimal/examples/6_capitalized_text.json';
import min7 from '../../../../specification/v0_9/json/catalogs/minimal/examples/7_incremental.json';

// Import Basic examples
import b01 from "../../../../specification/v0_9/json/catalogs/basic/examples/01_flight-status.json";
import b02 from "../../../../specification/v0_9/json/catalogs/basic/examples/02_email-compose.json";
import b03 from "../../../../specification/v0_9/json/catalogs/basic/examples/03_calendar-day.json";
import b04 from "../../../../specification/v0_9/json/catalogs/basic/examples/04_weather-current.json";
import b05 from "../../../../specification/v0_9/json/catalogs/basic/examples/05_product-card.json";
import b06 from "../../../../specification/v0_9/json/catalogs/basic/examples/06_music-player.json";
import b07 from "../../../../specification/v0_9/json/catalogs/basic/examples/07_task-card.json";
import b08 from "../../../../specification/v0_9/json/catalogs/basic/examples/08_user-profile.json";
import b09 from "../../../../specification/v0_9/json/catalogs/basic/examples/09_login-form.json";
import b10 from "../../../../specification/v0_9/json/catalogs/basic/examples/10_notification-permission.json";
import b11 from "../../../../specification/v0_9/json/catalogs/basic/examples/11_purchase-complete.json";
import b12 from "../../../../specification/v0_9/json/catalogs/basic/examples/12_chat-message.json";
import b13 from "../../../../specification/v0_9/json/catalogs/basic/examples/13_coffee-order.json";
import b14 from "../../../../specification/v0_9/json/catalogs/basic/examples/14_sports-player.json";
import b15 from "../../../../specification/v0_9/json/catalogs/basic/examples/15_account-balance.json";
import b16 from "../../../../specification/v0_9/json/catalogs/basic/examples/16_workout-summary.json";
import b17 from "../../../../specification/v0_9/json/catalogs/basic/examples/17_event-detail.json";
import b18 from "../../../../specification/v0_9/json/catalogs/basic/examples/18_track-list.json";
import b19 from "../../../../specification/v0_9/json/catalogs/basic/examples/19_software-purchase.json";
import b20 from "../../../../specification/v0_9/json/catalogs/basic/examples/20_restaurant-card.json";
import b21 from "../../../../specification/v0_9/json/catalogs/basic/examples/21_shipping-status.json";
import b22 from "../../../../specification/v0_9/json/catalogs/basic/examples/22_credit-card.json";
import b23 from "../../../../specification/v0_9/json/catalogs/basic/examples/23_step-counter.json";
import b24 from "../../../../specification/v0_9/json/catalogs/basic/examples/24_recipe-card.json";
import b25 from "../../../../specification/v0_9/json/catalogs/basic/examples/25_contact-card.json";
import b26 from "../../../../specification/v0_9/json/catalogs/basic/examples/26_podcast-episode.json";
import b27 from "../../../../specification/v0_9/json/catalogs/basic/examples/27_stats-card.json";
import b28 from "../../../../specification/v0_9/json/catalogs/basic/examples/28_countdown-timer.json";
import b29 from "../../../../specification/v0_9/json/catalogs/basic/examples/29_movie-card.json";

const exampleFiles = [
  {key: 'min1', data: min1, catalog: 'Minimal'},
  {key: 'min2', data: min2, catalog: 'Minimal'},
  {key: 'min3', data: min3, catalog: 'Minimal'},
  {key: 'min4', data: min4, catalog: 'Minimal'},
  {key: 'min5', data: min5, catalog: 'Minimal'},
  {key: 'min6', data: min6, catalog: 'Minimal'},
  {key: 'min7', data: min7, catalog: 'Minimal'},
  { key: 'b01', data: b01, catalog: 'Basic' },
  { key: 'b02', data: b02, catalog: 'Basic' },
  { key: 'b03', data: b03, catalog: 'Basic' },
  { key: 'b04', data: b04, catalog: 'Basic' },
  { key: 'b05', data: b05, catalog: 'Basic' },
  { key: 'b06', data: b06, catalog: 'Basic' },
  { key: 'b07', data: b07, catalog: 'Basic' },
  { key: 'b08', data: b08, catalog: 'Basic' },
  { key: 'b09', data: b09, catalog: 'Basic' },
  { key: 'b10', data: b10, catalog: 'Basic' },
  { key: 'b11', data: b11, catalog: 'Basic' },
  { key: 'b12', data: b12, catalog: 'Basic' },
  { key: 'b13', data: b13, catalog: 'Basic' },
  { key: 'b14', data: b14, catalog: 'Basic' },
  { key: 'b15', data: b15, catalog: 'Basic' },
  { key: 'b16', data: b16, catalog: 'Basic' },
  { key: 'b17', data: b17, catalog: 'Basic' },
  { key: 'b18', data: b18, catalog: 'Basic' },
  { key: 'b19', data: b19, catalog: 'Basic' },
  { key: 'b20', data: b20, catalog: 'Basic' },
  { key: 'b21', data: b21, catalog: 'Basic' },
  { key: 'b22', data: b22, catalog: 'Basic' },
  { key: 'b23', data: b23, catalog: 'Basic' },
  { key: 'b24', data: b24, catalog: 'Basic' },
  { key: 'b25', data: b25, catalog: 'Basic' },
  { key: 'b26', data: b26, catalog: 'Basic' },
  { key: 'b27', data: b27, catalog: 'Basic' },
  { key: 'b28', data: b28, catalog: 'Basic' },
  { key: 'b29', data: b29, catalog: 'Basic' },
];

const getMessages = (ex: { messages: A2uiMessage[] } | A2uiMessage[] | undefined) => (Array.isArray(ex) ? ex : ex?.messages);

const DataModelViewer = ({surface}: {surface: SurfaceModel<any>}) => {
  const subscribeHook = useCallback(
    (callback: () => void) => {
      const bound = surface.dataModel.subscribe('/', callback);
      return () => bound.unsubscribe();
    },
    [surface]
  );

  const getSnapshot = useCallback(() => {
    return JSON.stringify(surface.dataModel.get('/'), null, 2);
  }, [surface]);

  const dataString = useSyncExternalStore(subscribeHook, getSnapshot);

  return (
    <div style={{marginBottom: '1rem'}}>
      <strong>Surface: {surface.id}</strong>
      <pre style={{fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap'}}>{dataString}</pre>
    </div>
  );
};

export default function App() {
  const [selectedExampleKey, setSelectedExampleKey] = useState(exampleFiles[0].key);
  const selectedExample = exampleFiles.find((e) => e.key === selectedExampleKey)?.data as any;

  const [logs, setLogs] = useState<any[]>([]);
  const [processor, setProcessor] = useState<MessageProcessor<ReactComponentImplementation> | null>(null);
  const [surfaces, setSurfaces] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(-1);

  // Initialize or reset processor
  const resetProcessor = useCallback(
    (advanceToEnd: boolean = false) => {
      setProcessor((prevProcessor) => {
        if (prevProcessor) {
          prevProcessor.model.dispose();
        }
        const newProcessor = new MessageProcessor<ReactComponentImplementation>([minimalCatalog, basicCatalog], async (action: any) => {
          setLogs((l) => [...l, {time: new Date().toISOString(), action}]);
        });

        const msgs = getMessages(selectedExample);
        if (advanceToEnd && msgs) {
          newProcessor.processMessages(msgs);
        }
        return newProcessor;
      });

      setLogs([]);
      setSurfaces([]);

      const msgs = getMessages(selectedExample);
      if (advanceToEnd && msgs) {
        setCurrentMessageIndex(msgs.length - 1);
      } else {
        setCurrentMessageIndex(-1);
      }
    },
    [selectedExample]
  );

  // Effect to handle example selection change
  useEffect(() => {
    resetProcessor(true);
    // Cleanup on unmount or when changing examples
    return () => {
      setProcessor((prev) => {
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
    const msgs = getMessages(selectedExample);
    if (!processor || !msgs) return;

    // Process messages from currentMessageIndex + 1 to index
    const messagesToProcess = msgs.slice(currentMessageIndex + 1, index + 1);
    if (messagesToProcess.length > 0) {
      processor.processMessages(messagesToProcess);
      setCurrentMessageIndex(index);
    }
  };

  const handleReset = () => {
    resetProcessor(false);
  };

  const messages = getMessages(selectedExample) || [];

  return (
    <div
      style={{
        display: 'flex',
        gap: '2rem',
        padding: '2rem',
        height: '100vh',
        boxSizing: 'border-box',
        textAlign: 'left',
        backgroundColor: '#fff',
        color: '#000',
      }}
    >
      {/* Left Column: Sample List */}
      <div style={{width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column'}}>
        <h2>Samples</h2>
        <ul style={{listStyle: 'none', padding: 0, margin: 0, overflowY: 'auto'}}>
          {exampleFiles.map((ex) => (
            <li key={ex.key} style={{marginBottom: '8px'}}>
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
                  cursor: 'pointer',
                }}
              >
                <div style={{fontSize: '10px', color: '#666'}}>{ex.catalog}</div>
                {(ex.data as any).name || ex.key}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Center Column: Preview & JSON Stepper */}
      <div
        style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '400px'}}
      >
        <div
          style={{
            flex: 1,
            border: '1px dashed #ccc',
            padding: '1rem',
            overflowY: 'auto',
            background: '#f9f9f9',
            borderRadius: '8px',
          }}
        >
          <h3>Preview</h3>
          {surfaces.length === 0 && (
            <p style={{color: '#888'}}>No surfaces loaded. Advance the stepper to create one.</p>
          )}
          {surfaces.map((surfaceId) => {
            const surface = processor?.model.getSurface(surfaceId);
            if (!surface) return null;
            return (
              <div key={surfaceId} style={{marginBottom: '2rem'}}>
                <div
                  style={{
                    border: '1px solid #007bff',
                    padding: '1rem',
                    borderRadius: '8px',
                    background: '#fff',
                  }}
                >
                  <A2uiSurface surface={surface} />
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            height: '300px',
            border: '1px solid #ccc',
            padding: '1rem',
            overflowY: 'auto',
            background: '#fafafa',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h3 style={{margin: 0}}>Messages</h3>
            <button onClick={handleReset} style={{padding: '4px 8px', cursor: 'pointer'}}>
              Reset
            </button>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
            {messages.map((msg: any, i: number) => {
              const isActive = i <= currentMessageIndex;
              return (
                <div
                  key={i}
                  style={{
                    border: '1px solid',
                    borderColor: isActive ? '#007bff' : '#ddd',
                    opacity: isActive ? 1 : 0.6,
                    padding: '8px',
                    borderRadius: '4px',
                    background: isActive ? '#f0f8ff' : '#fff',
                  }}
                >
                  <div
                    style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}
                  >
                    <strong>Message {i + 1}</strong>
                    {!isActive && (
                      <button
                        onClick={() => advanceToMessage(i)}
                        style={{padding: '2px 8px', cursor: 'pointer'}}
                      >
                        Advance
                      </button>
                    )}
                  </div>
                  <pre
                    style={{
                      fontSize: '11px',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      maxHeight: '100px',
                      overflowY: 'auto',
                    }}
                  >
                    {JSON.stringify(msg, null, 2)}
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Live DataModelViewer & Action Logs */}
      <div
        style={{
          width: '300px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
          <h3>Data Model</h3>
          <div
            style={{
              flex: 1,
              border: '1px solid #ccc',
              padding: '8px',
              overflowY: 'auto',
              background: '#f9f9f9',
              color: '#333',
              borderRadius: '4px',
            }}
          >
            {surfaces.length === 0 ? (
              <p style={{color: '#888', fontSize: '12px'}}>Empty Data Model</p>
            ) : null}
            {surfaces.map((surfaceId) => {
              const surface = processor?.model.getSurface(surfaceId);
              if (!surface) return null;
              return <DataModelViewer key={surfaceId} surface={surface} />;
            })}
          </div>
        </div>

        <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
          <h3>Action Logs</h3>
          <div
            style={{
              flex: 1,
              border: '1px solid #ccc',
              padding: '8px',
              overflowY: 'auto',
              background: '#f9f9f9',
              color: '#333',
              borderRadius: '4px',
            }}
          >
            {logs.length === 0 ? (
              <p style={{color: '#888', fontSize: '12px'}}>No actions logged yet.</p>
            ) : null}
            {logs.map((log, i) => (
              <div
                key={i}
                style={{
                  fontSize: '12px',
                  marginBottom: '8px',
                  borderBottom: '1px solid #eee',
                  paddingBottom: '4px',
                }}
              >
                <strong style={{display: 'block', color: '#007bff'}}>{log.time}</strong>
                <pre style={{margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>
                  {JSON.stringify(log.action, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
