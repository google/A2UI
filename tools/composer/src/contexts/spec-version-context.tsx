/**
 * Global A2UI spec version context.
 *
 * Controls which version (v0.8 or v0.9) the entire composer uses for
 * rendering, gallery samples, component docs, and new widget creation.
 * Persisted to localStorage.
 */
'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { SpecVersion } from '@/types/widget';

const STORAGE_KEY = 'a2ui-spec-version';
const DEFAULT_VERSION: SpecVersion = '0.8';

interface SpecVersionContextValue {
  specVersion: SpecVersion;
  setSpecVersion: (version: SpecVersion) => void;
}

const SpecVersionContext = createContext<SpecVersionContextValue | null>(null);

export function SpecVersionProvider({ children }: { children: ReactNode }) {
  const [specVersion, setSpecVersionState] = useState<SpecVersion>(DEFAULT_VERSION);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === '0.8' || stored === '0.9') {
      setSpecVersionState(stored);
    }
  }, []);

  const setSpecVersion = useCallback((version: SpecVersion) => {
    setSpecVersionState(version);
    localStorage.setItem(STORAGE_KEY, version);
  }, []);

  return (
    <SpecVersionContext.Provider value={{ specVersion, setSpecVersion }}>
      {children}
    </SpecVersionContext.Provider>
  );
}

export function useSpecVersion() {
  const context = useContext(SpecVersionContext);
  if (!context) {
    throw new Error('useSpecVersion must be used within a SpecVersionProvider');
  }
  return context;
}
