import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { CustomComponentDemo } from './custom-components/test/CustomComponentDemo';
import './index.css';

// Check if we're in demo mode
const urlParams = new URLSearchParams(window.location.search);
const demoMode = urlParams.get('demo');

// Render the appropriate component based on URL params
const RootComponent = demoMode === 'custom' ? CustomComponentDemo : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>
);
