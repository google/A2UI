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

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Widget } from '@/types/widget';
import { getWidgets, saveWidget, deleteWidget, clearAllWidgets, didMigrationWipe } from '@/lib/storage';

// Module-level cache - persists outside React tree
let cachedWidgets: Widget[] | null = null;
let initPromise: Promise<void> | null = null;

async function initializeStore(
  setWidgets: (w: Widget[]) => void,
  setLoading: (l: boolean) => void
): Promise<boolean> {
  // If already cached, use immediately
  if (cachedWidgets !== null) {
    setWidgets(cachedWidgets);
    setLoading(false);
    return false;
  }

  // If fetch in progress, wait for it
  if (initPromise) {
    await initPromise;
    if (cachedWidgets) {
      setWidgets(cachedWidgets);
      setLoading(false);
    }
    return false;
  }

  // First time - fetch and cache
  initPromise = getWidgets().then(w => {
    cachedWidgets = w;
  });
  await initPromise;
  setWidgets(cachedWidgets!);
  setLoading(false);
  return didMigrationWipe();
}

interface WidgetsContextType {
  widgets: Widget[];
  loading: boolean;
  migrationNotice: boolean;
  dismissMigrationNotice: () => void;
  addWidget: (widget: Widget) => Promise<void>;
  updateWidget: (id: string, updates: Partial<Widget>) => Promise<void>;
  removeWidget: (id: string) => Promise<void>;
  removeAllWidgets: () => Promise<void>;
  getWidget: (id: string) => Widget | undefined;
}

const WidgetsContext = createContext<WidgetsContextType | null>(null);

export function WidgetsProvider({ children }: { children: ReactNode }) {
  // Initialize from cache if available
  const [widgets, setWidgets] = useState<Widget[]>(cachedWidgets ?? []);
  const [loading, setLoading] = useState(cachedWidgets === null);
  const [migrationNotice, setMigrationNotice] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-dismiss save error after 5 seconds
  useEffect(() => {
    if (saveError) {
      const timer = setTimeout(() => setSaveError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveError]);

  useEffect(() => {
    initializeStore(setWidgets, setLoading).then(wiped => {
      if (wiped) setMigrationNotice(true);
    });
  }, []);

  const addWidget = useCallback(async (widget: Widget) => {
    try {
      await saveWidget(widget);
    } catch (err) {
      console.error('Failed to save widget:', err);
      setSaveError('Failed to save widget. Please try again.');
    }
    setWidgets(prev => {
      const updated = [...prev, widget];
      cachedWidgets = updated;
      return updated;
    });
  }, []);

  const updateWidget = useCallback(async (id: string, updates: Partial<Widget>) => {
    let widgetToSave: Widget | null = null;
    setWidgets(prev => {
      const widget = prev.find(w => w.id === id);
      if (widget) {
        const updated = { ...widget, ...updates, updatedAt: new Date() };
        widgetToSave = updated;
        const newWidgets = prev.map(w => w.id === id ? updated : w);
        cachedWidgets = newWidgets;
        return newWidgets;
      }
      return prev;
    });
    if (widgetToSave) {
      await saveWidget(widgetToSave).catch(err => {
        console.error('Failed to persist widget:', err);
        setSaveError('Failed to save changes. Please try again.');
      });
    }
  }, []);

  const removeWidget = useCallback(async (id: string) => {
    try {
      await deleteWidget(id);
    } catch (err) {
      console.error('Failed to delete widget:', err);
      setSaveError('Failed to delete widget. Please try again.');
    }
    setWidgets(prev => {
      const updated = prev.filter(w => w.id !== id);
      cachedWidgets = updated;
      return updated;
    });
  }, []);

  const removeAllWidgets = useCallback(async () => {
    try {
      await clearAllWidgets();
    } catch (err) {
      console.error('Failed to clear widgets:', err);
      setSaveError('Failed to clear widgets. Please try again.');
    }
    cachedWidgets = [];
    setWidgets([]);
  }, []);

  const getWidget = useCallback((id: string) => {
    return widgets.find(w => w.id === id);
  }, [widgets]);

  const dismissMigrationNotice = useCallback(() => setMigrationNotice(false), []);

  return (
    <WidgetsContext.Provider value={{ widgets, loading, migrationNotice, dismissMigrationNotice, addWidget, updateWidget, removeWidget, removeAllWidgets, getWidget }}>
      {children}
      {saveError && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>{saveError}</span>
          <button
            onClick={() => setSaveError(null)}
            className="ml-2 font-bold hover:opacity-80"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      )}
    </WidgetsContext.Provider>
  );
}

export function useWidgets() {
  const context = useContext(WidgetsContext);
  if (!context) {
    throw new Error('useWidgets must be used within a WidgetsProvider');
  }
  return context;
}
