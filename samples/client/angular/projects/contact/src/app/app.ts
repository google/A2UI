/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { SurfaceComponent, A2uiRendererService } from '@a2ui/angular/v0_9';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Client } from './client';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: 'app.css',
  imports: [SurfaceComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected client = inject(Client);
  protected renderer = inject(A2uiRendererService);

  protected hasData = signal(false);
  protected userInput = signal('Casey Smith');
  protected surfaces = signal<[string, any][]>([]);

  constructor() {
    this.updateSurfaces();
    this.renderer.surfaceGroup.onSurfaceCreated.subscribe(() => this.updateSurfaces());
    this.renderer.surfaceGroup.onSurfaceDeleted.subscribe(() => this.updateSurfaces());
  }

  private updateSurfaces() {
    const entries = Array.from(this.renderer.surfaceGroup.surfacesMap.entries());
    console.log('updateSurfaces entries:', entries);
    for (const [id, surface] of entries) {
      const components = Array.from(surface.componentsModel.entries).map(([cid, c]: [string, any]) => ({
        id: cid,
        type: c.type,
        props: Object.keys(c.properties)
      }));
      console.log(`Surface ${id} components:`, components);
    }
    this.surfaces.set(entries);
  }

  protected statusText = computed(() => {
    if (!this.client.isLoading()) return null;
    return this.surfaces().length === 0 ? 'Awaiting an answer...' : 'Rendering UI...';
  });

  protected async handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    const message = this.userInput().trim();
    if (!message) return;

    this.hasData.set(true);
    // Clear the input after submission
    this.userInput.set('');

    try {
      await this.client.makeRequest(message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}
