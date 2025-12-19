import React from 'react';

// Sample A2UI Data
const SAMPLE_DATA = [
  { type: 'text', content: 'Hello from the React Renderer!' },
  { type: 'button', content: 'Click Me' }
];

function App() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>A2UI React Sample</h1>
      <div style={{ border: '1px solid #ddd', padding: '10px' }}>
        {SAMPLE_DATA.map((item, index) => {
          if (item.type === 'text') return <p key={index}>{item.content}</p>;
          if (item.type === 'button') return <button key={index}>{item.content}</button>;
          return null;
        })}
      </div>
    </div>
  );
}

export default App;