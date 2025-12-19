import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Button, Input, Spin, Toast } from '@douyinfe/semi-ui';
import { IconSun, IconMoon, IconSend } from '@douyinfe/semi-icons';
import { A2UIProvider, ThemeProvider, Surface, MessageProcessor, useA2UIContext } from '@a2ui/react';
import { A2UIClient } from './client';
import { AppConfig, restaurantConfig, contactsConfig } from './configs';
import { registerCustomComponents } from './custom-components';
import { applyThemeMode, getInitialThemeMode, saveThemeMode, ThemeMode } from './theme';
import './App.css';

// Register custom components once at startup
registerCustomComponents();

const configs: Record<string, AppConfig> = {
  restaurant: restaurantConfig,
  contacts: contactsConfig,
};

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const loadingIntervalRef = useRef<number | null>(null);

  // Derive isDark from themeMode for UI display
  const isDark = useMemo(() => {
    if (themeMode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return themeMode === 'dark';
  }, [themeMode]);

  // Load config from URL
  const config = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const appKey = urlParams.get('app') || 'restaurant';
    return configs[appKey] || configs.restaurant;
  }, []);

  const processor = useMemo(() => new MessageProcessor(), []);
  const client = useMemo(() => new A2UIClient(config.serverUrl), [config.serverUrl]);

  // Set initial input and title
  useEffect(() => {
    setInput(config.placeholder);
    document.title = config.title;
    if (config.background) {
      document.documentElement.style.setProperty('--background', config.background);
    }
  }, [config]);

  // Apply theme mode when it changes
  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  // Handle loading text rotation
  const startLoadingAnimation = useCallback(() => {
    if (Array.isArray(config.loadingText) && config.loadingText.length > 1) {
      setLoadingTextIndex(0);
      loadingIntervalRef.current = window.setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % (config.loadingText as string[]).length);
      }, 2000);
    }
  }, [config.loadingText]);

  const stopLoadingAnimation = useCallback(() => {
    if (loadingIntervalRef.current !== null) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  }, []);

  // Get current loading text
  const loadingText = useMemo(() => {
    if (!config.loadingText) return 'Awaiting an answer...';
    if (Array.isArray(config.loadingText)) {
      return config.loadingText[loadingTextIndex];
    }
    return config.loadingText;
  }, [config.loadingText, loadingTextIndex]);

  // Subscribe to user action events
  useEffect(() => {
    const unsubscribe = processor.subscribe(async (event) => {
      try {
        setLoading(true);
        startLoadingAnimation();
        const messages = await client.send(event.message);
        processor.clearSurfaces();
        processor.processMessages(messages);
        event.resolve(messages);
      } catch (err) {
        Toast.error({ content: String(err) });
        event.reject(err as Error);
      } finally {
        setLoading(false);
        stopLoadingAnimation();
      }
    });

    return unsubscribe;
  }, [processor, client, startLoadingAnimation, stopLoadingAnimation]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      try {
        setLoading(true);
        startLoadingAnimation();
        const messages = await client.send(input);
        console.log(messages);
        processor.clearSurfaces();
        processor.processMessages(messages);
        setHasData(true);
      } catch (err) {
        console.error('Error:', err);
        Toast.error({ content: String(err) });
      } finally {
        setLoading(false);
        stopLoadingAnimation();
      }
    },
    [input, client, processor, startLoadingAnimation, stopLoadingAnimation]
  );

  const toggleTheme = useCallback(() => {
    setThemeMode((prev: ThemeMode) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      saveThemeMode(next);
      return next;
    });
  }, []);

  // Render form (only when not loading and no data)
  const renderForm = () => {
    if (loading) return null;
    if (hasData) return null;

    return (
      <form className="input-form" onSubmit={handleSubmit}>
        {config.heroImage && (
          <div
            className="hero-img"
            style={{
              '--background-image-light': `url(${config.heroImage})`,
              '--background-image-dark': `url(${config.heroImageDark ?? config.heroImage})`,
            } as React.CSSProperties}
          />
        )}
        <h1 className="app-title">{config.title}</h1>
        <div className="input-row">
          <Input
            value={input}
            onChange={setInput}
            placeholder={config.placeholder}
            disabled={loading}
            size="large"
            className="message-input"
          />
          <Button
            theme="solid"
            disabled={loading}
            icon={<IconSend />}
            size="large"
            htmlType="submit"
          />
        </div>
      </form>
    );
  };

  // Render loading state
  const renderLoading = () => {
    if (!loading) return null;
    if (hasData) return null;

    return (
      <div className="pending">
        <Spin size="large" />
        <div className="loading-text">{loadingText}</div>
      </div>
    );
  };

  // Render surfaces - now handled by SurfaceRenderer component

  return (
    <ThemeProvider mode={themeMode}>
      <A2UIProvider processor={processor}>
        <div className="shell">
          <Button
            className="theme-toggle"
            theme="borderless"
            icon={isDark ? <IconSun size="large" /> : <IconMoon size="large" />}
            onClick={toggleTheme}
          />
          {renderForm()}
          {renderLoading()}
          {hasData && <SurfaceRenderer />}
        </div>
      </A2UIProvider>
    </ThemeProvider>
  );
}

/**
 * Component that renders all active surfaces.
 * Must be inside A2UIProvider to access surfaces context.
 */
function SurfaceRenderer() {
  const { surfaces } = useA2UIContext();
  const surfaceIds = Array.from(surfaces.keys());

  if (surfaceIds.length === 0) {
    return null;
  }

  return (
    <section className="surfaces">
      {surfaceIds.map((surfaceId) => (
        <Surface key={surfaceId} surfaceId={surfaceId} />
      ))}
    </section>
  );
}

export default App;
