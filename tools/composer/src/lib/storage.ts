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

import localforage from 'localforage';
import { Widget } from '@/types/widget';

const WIDGETS_KEY = 'widgets';
const STORAGE_VERSION_KEY = 'storage_version';
// Bump this to clear all stored widgets on next load (e.g. after breaking changes)
const CURRENT_STORAGE_VERSION = 2;

localforage.config({
  name: 'widget-builder',
  storeName: 'widgets',
});

let migrated = false;
let lastMigrationWiped = false;

async function migrateIfNeeded(): Promise<void> {
  if (migrated) return;
  const version = await localforage.getItem<number>(STORAGE_VERSION_KEY);
  if (version !== CURRENT_STORAGE_VERSION) {
    await localforage.setItem(WIDGETS_KEY, []);
    await localforage.setItem(STORAGE_VERSION_KEY, CURRENT_STORAGE_VERSION);
    lastMigrationWiped = version !== null; // only notify if upgrading, not first visit
  }
  migrated = true;
}

export function didMigrationWipe(): boolean {
  return lastMigrationWiped;
}

export async function getWidgets(): Promise<Widget[]> {
  await migrateIfNeeded();
  const widgets = await localforage.getItem<Widget[]>(WIDGETS_KEY);
  return widgets || [];
}

export async function saveWidget(widget: Widget): Promise<void> {
  const widgets = await getWidgets();
  const index = widgets.findIndex(w => w.id === widget.id);
  if (index >= 0) {
    widgets[index] = widget;
  } else {
    widgets.push(widget);
  }
  await localforage.setItem(WIDGETS_KEY, widgets);
}

export async function deleteWidget(id: string): Promise<void> {
  const widgets = await getWidgets();
  await localforage.setItem(WIDGETS_KEY, widgets.filter(w => w.id !== id));
}

export async function clearAllWidgets(): Promise<void> {
  await localforage.setItem(WIDGETS_KEY, []);
}
