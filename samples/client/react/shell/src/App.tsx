/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { useState, useEffect, useCallback, useMemo, useRef, FormEvent } from 'react';
import {
  A2UIProvider,
  A2UIRenderer,
  useA2UIActions,
} from '@a2ui/react';
import type { Types } from '@a2ui/react';
import { A2UIClient } from './client';
import { AppConfig, restaurantConfig } from './configs';
import {
  createRestaurantListMessages,
  createBookingFormMessages,
  createConfirmationMessages,
} from './mock';
import { theme as defaultTheme } from './theme/default-theme';
import './App.css';

// Available app configs
const configs: Record<string, AppConfig> = {
  restaurant: restaurantConfig,
};

// Check if mock mode is enabled via URL parameter
const urlParams = new URLSearchParams(window.location.search);
const isMockMode = urlParams.get('mock') === 'true';

export function App() {
  // Load config from URL parameter
  const config = useMemo(() => {
    const appKey = urlParams.get('app') || 'restaurant';
    return configs[appKey] || configs.restaurant;
  }, []);

  // Create client instance
  const client = useMemo(
    () => new A2UIClient(config.serverUrl),
    [config.serverUrl]
  );

  // Set document title and background on mount
  useEffect(() => {
    document.title = config.title;
    if (config.background) {
      document.documentElement.style.setProperty(
        '--background',
        config.background
      );
    }
  }, [config]);

  // Use the config theme if provided, otherwise use default theme (matches Lit shell)
  const theme = config.theme || defaultTheme;

  // We need to lift state up to pass onAction to provider
  // Use a ref to hold the sendAndProcess function that will be set by ShellContent
  const sendAndProcessRef = useRef<
    ((message: Types.A2UIClientEventMessage | string) => Promise<void>) | null
  >(null);

  // Handle user actions from A2UI components
  const handleAction = useCallback(
    (actionMessage: Types.A2UIClientEventMessage) => {
      console.log('User action:', actionMessage);
      if (sendAndProcessRef.current) {
        sendAndProcessRef.current(actionMessage);
      }
    },
    []
  );

  return (
    <A2UIProvider theme={theme} onAction={handleAction}>
      <ShellContent
        config={config}
        client={client}
        sendAndProcessRef={sendAndProcessRef}
      />
    </A2UIProvider>
  );
}

interface ShellContentProps {
  config: AppConfig;
  client: A2UIClient;
  sendAndProcessRef: React.MutableRefObject<
    ((message: Types.A2UIClientEventMessage | string) => Promise<void>) | null
  >;
}

function ShellContent({ config, client, sendAndProcessRef }: ShellContentProps) {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Types.ServerToClientMessage[]>([]);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Get actions from the A2UI context
  const { processMessages, clearSurfaces, getSurfaces } = useA2UIActions();

  // Loading text rotation
  useEffect(() => {
    if (!requesting) return;
    if (!Array.isArray(config.loadingText) || config.loadingText.length <= 1)
      return;

    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % config.loadingText!.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [requesting, config.loadingText]);

  // Generate mock response based on message/action
  const getMockResponse = useCallback(
    (message: Types.A2UIClientEventMessage | string): Types.ServerToClientMessage[] => {
      // Handle user actions
      if (typeof message === 'object' && message.userAction) {
        const action = message.userAction;
        const context = action.context || {};

        if (action.name === 'book_restaurant') {
          // User clicked "Book Now" - show booking form
          return createBookingFormMessages(
            String(context.restaurantName || 'Restaurant'),
            String(context.imageUrl || ''),
            String(context.address || '')
          );
        }

        if (action.name === 'submit_booking') {
          // User submitted booking - show confirmation
          return createConfirmationMessages(
            String(context.restaurantName || 'Restaurant'),
            String(context.partySize || '2'),
            String(context.reservationTime || ''),
            String(context.dietary || ''),
            String(context.imageUrl || '')
          );
        }
      }

      // Default: show restaurant list
      return createRestaurantListMessages();
    },
    []
  );

  // Send message to agent and process response
  const sendAndProcess = useCallback(
    async (message: Types.A2UIClientEventMessage | string) => {
      try {
        setRequesting(true);
        setError(null);
        setLoadingTextIndex(0);

        let response: Types.ServerToClientMessage[];

        if (isMockMode) {
          // Simulate network delay in mock mode
          await new Promise((resolve) => setTimeout(resolve, 800));
          response = getMockResponse(message);
          console.log('Mock response:', response);
        } else {
          response = await client.send(message);
          console.log('Agent response:', response);
        }

        clearSurfaces();
        processMessages(response);
        setMessages(response);
      } catch (err) {
        console.error('Error sending message:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setRequesting(false);
      }
    },
    [client, clearSurfaces, processMessages, getMockResponse]
  );

  // Expose sendAndProcess to parent via ref for action handling
  useEffect(() => {
    sendAndProcessRef.current = sendAndProcess;
  }, [sendAndProcess, sendAndProcessRef]);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const body = formData.get('body') as string;
      if (!body) return;

      sendAndProcess(body);
    },
    [sendAndProcess]
  );

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      if (newValue) {
        document.body.classList.add('dark');
        document.body.classList.remove('light');
      } else {
        document.body.classList.add('light');
        document.body.classList.remove('dark');
      }
      return newValue;
    });
  }, []);

  // Get current loading text
  const loadingText = useMemo(() => {
    if (!config.loadingText) return 'Awaiting an answer...';
    if (Array.isArray(config.loadingText)) {
      return config.loadingText[loadingTextIndex];
    }
    return config.loadingText;
  }, [config.loadingText, loadingTextIndex]);

  // Get surfaces to render
  const surfaces = getSurfaces();
  const surfaceEntries = Array.from(surfaces.entries());
  const hasSurfaces = surfaceEntries.length > 0;
  const showForm = !requesting && messages.length === 0;

  return (
    <div className="shell">
      {/* Mock mode indicator */}
      {isMockMode && <div className="mock-badge">Mock Mode</div>}

      {/* Theme toggle button */}
      <button className="theme-toggle" onClick={toggleDarkMode}>
        <span className="g-icon filled-heavy">
          {isDarkMode ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      {/* Search form - only shown when no messages */}
      {showForm && (
        <form className="search-form" onSubmit={handleSubmit}>
          {config.heroImage && (
            <div
              className="hero-img"
              style={
                {
                  '--background-image-light': `url(${config.heroImage})`,
                  '--background-image-dark': `url(${config.heroImageDark || config.heroImage})`,
                } as React.CSSProperties
              }
            />
          )}
          <h1 className="app-title">{config.title}</h1>
          <div className="input-row">
            <input
              required
              defaultValue={config.placeholder}
              autoComplete="off"
              id="body"
              name="body"
              type="text"
              disabled={requesting}
            />
            <button type="submit" disabled={requesting}>
              <span className="g-icon filled-heavy">send</span>
            </button>
          </div>
        </form>
      )}

      {/* Loading state */}
      {requesting && (
        <div className="pending">
          <div className="spinner" />
          <div className="loading-text">{loadingText}</div>
        </div>
      )}

      {/* Error display */}
      {error && <div className="error">{error}</div>}

      {/* Render all surfaces */}
      {!requesting && hasSurfaces && (
        <section className="surfaces">
          {surfaceEntries.map(([surfaceId]) => (
            <A2UIRenderer key={surfaceId} surfaceId={surfaceId} />
          ))}
        </section>
      )}
    </div>
  );
}
