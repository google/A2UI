/**
 * A2UI React Demo Application
 * Toggle between spec-based and protocol-based rendering modes
 */

import { useState } from 'react';
import { Demo } from './Demo';
import { ProtocolDemo } from './ProtocolDemo';

type DemoMode = 'spec' | 'protocol';

function App() {
  const [mode, setMode] = useState<DemoMode>('spec');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Mode Toggle */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px 16px',
        background: '#0a0a0f',
        borderBottom: '1px solid #333',
      }}>
        <button
          onClick={() => setMode('spec')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            background: mode === 'spec' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: mode === 'spec' ? 600 : 400,
          }}
        >
          📋 Spec-Based Demo
        </button>
        <button
          onClick={() => setMode('protocol')}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '6px',
            background: mode === 'protocol' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: mode === 'protocol' ? 600 : 400,
          }}
        >
          🔌 Protocol Demo (Streaming)
        </button>
        <span style={{
          marginLeft: 'auto',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '12px',
          alignSelf: 'center',
        }}>
          A2UI React v0.9
        </span>
      </div>

      {/* Demo Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {mode === 'spec' ? <Demo /> : <ProtocolDemo />}
      </div>
    </div>
  );
}

export default App;
