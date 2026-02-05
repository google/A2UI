import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeDefaultCatalog } from '@a2ui/react';
import { injectStyles } from '@a2ui/react/styles';
import { App } from './App';

// Initialize the default component catalog
initializeDefaultCatalog();

// Inject A2UI structural CSS (required for theme utility classes)
injectStyles();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
