import React from 'react';
import ReactDOM from 'react-dom/client';
import {injectStyles} from '@a2ui/react/styles';
import {App} from './App';
import './App.css';

injectStyles();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
