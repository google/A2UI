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

import { ChangeDetectorRef, Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A2uiRendererService, A2UI_RENDERER_CONFIG } from '@a2ui/angular/v0_9';
import { AgentStubService } from './agent-stub.service';
import { SurfaceComponent } from '@a2ui/angular/v0_9';
import { AngularCatalog } from '@a2ui/angular/v0_9';
import { DemoCatalog } from './demo-catalog';
import { A2uiClientAction, CreateSurfaceMessage } from '@a2ui/web_core/v0_9';
import { EXAMPLES } from './examples-bundle';
import { Example } from './types';
import { ActionDispatcher } from './action-dispatcher.service';

/**
 * Main dashboard component for A2UI v0.9 Angular Renderer.
 * It provides a sidebar of examples, a canvas for rendering,
 * and inspector tools for state auditing.
 */
@Component({
  selector: 'a2ui-v0-9-demo',
  standalone: true,
  imports: [CommonModule, SurfaceComponent],
  template: `
    <div class="dashboard">
      <!-- Sidebar Navigation -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>A2UI Examples</h3>
        </div>
        <ul class="example-list">
          <li
            *ngFor="let ex of examples"
            (click)="selectExample(ex)"
            [class.active]="ex === selectedExample"
          >
            <div class="ex-name">{{ ex.name }}</div>
            <div class="ex-desc">{{ ex.description }}</div>
          </li>
        </ul>
      </div>

      <!-- Main Canvas Area -->
      <div class="canvas-area">
        <div class="canvas-header" *ngIf="selectedExample">
          <h2>{{ selectedExample.name }}</h2>
          <p class="subtitle">{{ selectedExample.description }}</p>
        </div>
        <div class="canvas-frame">
          <div *ngIf="surfaceId" class="rendered-content">
            <a2ui-v09-surface [surfaceId]="surfaceId"> </a2ui-v09-surface>
          </div>
          <div *ngIf="!surfaceId" class="empty-canvas">
            Select an example from the sidebar to view.
          </div>
        </div>
      </div>

      <!-- Inspect Panel -->
      <div class="inspect-area">
        <div class="inspect-section data-section">
          <div class="section-header">
            <h4>Data Model</h4>
            <span class="badge">Live</span>
          </div>
          <div class="section-content">
            <pre>{{ currentDataModel | json }}</pre>
            <div *ngIf="!currentDataModel" class="empty-state">No data model loaded.</div>
          </div>
        </div>

        <div class="inspect-section events-section">
          <div class="section-header">
            <h4>Events Log</h4>
            <button class="clear-btn" (click)="eventsLog = []">Clear</button>
          </div>
          <div class="section-content">
            <div *ngFor="let ev of eventsLog" class="log-item">
              <div class="log-header">
                <span class="log-time">{{ ev.timestamp | date: 'HH:mm:ss.SSS' }}</span>
                <span class="log-type">{{ getActionType(ev.action) }}</span>
              </div>
              <pre class="log-details">{{ ev.action | json }}</pre>
            </div>
            <div *ngIf="eventsLog.length === 0" class="empty-state">No events recorded.</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard {
        display: flex;
        height: 100vh;
        font-family: 'Inter', system-ui, sans-serif;
        background-color: #121212;
        color: #e0e0e0;
        overflow: hidden;
      }

      /* Sidebar */
      .sidebar {
        width: 260px;
        background-color: #1e1e1e;
        border-right: 1px solid #333;
        display: flex;
        flex-direction: column;
      }
      .sidebar-header {
        padding: 16px;
        border-bottom: 1px solid #333;
        background-color: #1a1a1a;
      }
      .sidebar-header h3 {
        margin: 0;
        color: #4dabf7;
        font-size: 1.1rem;
      }
      .example-list {
        list-style: none;
        padding: 0;
        margin: 0;
        flex: 1;
        overflow-y: auto;
      }
      .example-list li {
        padding: 12px 16px;
        border-bottom: 1px solid #2a2a2a;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .example-list li:hover {
        background-color: #2c2c2c;
      }
      .example-list li.active {
        background-color: #334155;
        border-left: 4px solid #3b82f6;
        padding-left: 12px;
      }
      .ex-name {
        font-weight: 500;
        color: #f8fafc;
        font-size: 0.95rem;
      }
      .ex-desc {
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 4px;
      }

      /* Canvas Area */
      .canvas-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        background-color: #0f172a;
        overflow: hidden;
      }
      .canvas-header {
        padding: 16px;
        background-color: #1e293b;
        border-bottom: 1px solid #334155;
      }
      .canvas-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #f8fafc;
      }
      .subtitle {
        margin: 4px 0 0;
        font-size: 0.85rem;
        color: #94a3b8;
      }
      .canvas-frame {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }
      .rendered-content {
        width: 100%;
        max-width: 800px;
        background-color: #ffffff;
        color: #333;
        border-radius: 8px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
        padding: 24px;
      }
      .empty-canvas {
        align-self: center;
        margin: 0 auto;
        color: #64748b;
        font-style: italic;
      }

      /* Inspect Panel */
      .inspect-area {
        width: 380px;
        background-color: #0f172a;
        border-left: 1px solid #1e293b;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      .inspect-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
      }
      .data-section {
        border-bottom: 1px solid #1e293b;
        height: 50%;
      }
      .events-section {
        height: 50%;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
        background-color: #1e293b;
        border-bottom: 1px solid #334155;
      }
      .section-header h4 {
        margin: 0;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
      }
      .section-content {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 0.75rem;
      }

      .badge {
        background-color: #064e3b;
        color: #34d399;
        font-size: 0.65rem;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        text-transform: uppercase;
      }
      .clear-btn {
        background: none;
        border: 1px solid #334155;
        color: #94a3b8;
        font-size: 0.7rem;
        padding: 2px 8px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .clear-btn:hover {
        background-color: #334155;
        color: #f8fafc;
      }

      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
        color: #a7f3d0;
        background-color: #0c111b;
        padding: 12px;
        border-radius: 4px;
        border: 1px solid #1e293b;
        line-height: 1.4;
      }
      .log-item {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #1e293b;
      }
      .log-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.7rem;
        color: #64748b;
        margin-bottom: 6px;
      }
      .log-time {
        color: #3b82f6;
        font-weight: 500;
      }
      .log-type {
        padding: 1px 4px;
        background-color: #064e3b;
        color: #6ee7b7;
        border-radius: 2px;
      }
      .log-details {
        background-color: #020617;
        border-color: #1e293b;
        color: #94a3b8;
        font-size: 0.7rem;
      }
      .empty-state {
        text-align: center;
        color: #475569;
        margin-top: 40px;
        font-style: italic;
      }
    `,
  ],
  providers: [
    A2uiRendererService,
    { provide: AngularCatalog, useClass: DemoCatalog },
    ActionDispatcher,
    AgentStubService,
    {
      provide: A2UI_RENDERER_CONFIG,
      useFactory: (catalog: AngularCatalog, dispatcher: ActionDispatcher) => ({
        catalogs: [catalog],
        actionHandler: (action: A2uiClientAction) => dispatcher.dispatch(action),
      }),
      deps: [AngularCatalog, ActionDispatcher],
    },
  ],
})
export class DemoComponent implements OnInit, OnDestroy {
  private rendererService = inject(A2uiRendererService);
  private agentStub = inject(AgentStubService);
  private cdr = inject(ChangeDetectorRef);

  examples = EXAMPLES;
  selectedExample: Example | undefined = undefined;
  surfaceId: string | null = null;
  inspectTab: 'data' | 'events' = 'data';

  currentDataModel: Record<string, unknown> = {};
  eventsLog: Array<{ timestamp: Date; action: A2uiClientAction }> = [];

  private actionSub?: { unsubscribe: () => void };
  private dataModelSub?: { unsubscribe: () => void };

  ngOnInit(): void {
    if (this.examples.length > 0) {
      this.selectExample(this.examples[0]);
    }
  }

  /**
   * Loads a selected example configuration into the dashboard canvas dashboard workspace.
   * - Resets surface identifiers and data payloads triggers.
   * - Re-initializes incremental playback state sequence into `AgentStubService`.
   * - Subscribes to path `/` enabling live model inspection updates.
   */
  selectExample(example: Example) {
    this.selectedExample = example;
    this.surfaceId = null;
    this.currentDataModel = {};
    this.eventsLog = [];
    this.cdr.detectChanges();

    // Clean up previous subscriptions
    if (this.dataModelSub) {
      this.dataModelSub.unsubscribe();
    }

    this.agentStub.initializeDemo(example.messages);

    // Look for the surfaceId in the first message or use default
    const createMsg = example.messages.find((m): m is CreateSurfaceMessage => 'createSurface' in m);
    this.surfaceId = createMsg ? createMsg.createSurface.surfaceId : 'demo-surface';

    this.cdr.detectChanges();

    // Subscribe to DataModel updates
    const surface = this.rendererService.surfaceGroup?.getSurface(this.surfaceId!);
    if (surface) {
      // Subscribe to root changes
      this.dataModelSub = surface.dataModel.subscribe('/', (data) => {
        this.currentDataModel = data as Record<string, unknown>;
        this.cdr.detectChanges();
      });
      // Set initial data model
      this.currentDataModel = surface.dataModel.get('/');
    }

    // Subscribe to Actions for Events log
    if (this.rendererService.surfaceGroup) {
      if (this.actionSub) {
        this.actionSub.unsubscribe();
      }
      this.actionSub = this.rendererService.surfaceGroup.onAction.subscribe((action) => {
        this.eventsLog.unshift({ timestamp: new Date(), action });
        this.cdr.detectChanges();
      });
    }
  }

  /** Gets a display string for the action type. */
  getActionType(action: A2uiClientAction): string {
    return action.name || 'Action';
  }

  ngOnDestroy(): void {
    if (this.dataModelSub) {
      this.dataModelSub.unsubscribe();
    }
    if (this.actionSub) {
      this.actionSub.unsubscribe();
    }
  }
}
