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
import { EXAMPLES } from './generated/examples-bundle';
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
        <div class="inspect-section surface-section" [class.folded]="isSurfaceMessageFolded">
          <div class="section-header" 
               (click)="toggleSurfaceMessage()" 
               (keydown.enter)="toggleSurfaceMessage()"
               (keydown.space)="toggleSurfaceMessage(); $event.preventDefault()"
               style="cursor: pointer;"
               role="button"
               tabindex="0"
               [attr.aria-expanded]="!isSurfaceMessageFolded">
            <div class="header-left">
              <span class="toggle-icon" [class.expanded]="!isSurfaceMessageFolded">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
              <h4>Create Surface Message</h4>
            </div>
            <div>
              <span class="badge" *ngIf="!messageError">Live</span>
              <span class="badge error-badge" *ngIf="messageError">Invalid</span>
            </div>
          </div>
          <div class="section-content" *ngIf="!isSurfaceMessageFolded">
            <div *ngIf="messageError" class="error-message">
              <span class="error-icon">⚠️</span>
              <span>{{ messageError }}</span>
            </div>
            <textarea
              [value]="currentCreateSurfaceMessageJson"
              (input)="onSurfaceMessageChange($event)"
              (blur)="onSurfaceMessageBlur()"
            ></textarea>
          </div>
        </div>

        <div class="inspect-section data-section" [class.folded]="isDataModelFolded">
          <div class="section-header" 
               (click)="toggleDataModel()" 
               (keydown.enter)="toggleDataModel()"
               (keydown.space)="toggleDataModel(); $event.preventDefault()"
               style="cursor: pointer;"
               role="button"
               tabindex="0"
               [attr.aria-expanded]="!isDataModelFolded">
            <div class="header-left">
              <span class="toggle-icon" [class.expanded]="!isDataModelFolded">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
              <h4>Data Model</h4>
            </div>
            <div>
              <span class="badge" *ngIf="!dataModelError">Live</span>
              <span class="badge error-badge" *ngIf="dataModelError">Invalid</span>
            </div>
          </div>
          <div class="section-content" *ngIf="!isDataModelFolded">
            <div *ngIf="dataModelError" class="error-message">
              <span class="error-icon">⚠️</span>
              <span>{{ dataModelError }}</span>
            </div>
            <textarea
              [value]="currentDataModelJson"
              (input)="onDataModelChange($event)"
              (blur)="onDataModelBlur()"
            ></textarea>
          </div>
        </div>

        <div class="inspect-section events-section" [class.folded]="isEventsLogFolded">
          <div class="section-header" 
               (click)="toggleEventsLog()" 
               (keydown.enter)="toggleEventsLog()"
               (keydown.space)="toggleEventsLog(); $event.preventDefault()"
               style="cursor: pointer;"
               role="button"
               tabindex="0"
               [attr.aria-expanded]="!isEventsLogFolded">
            <div class="header-left">
              <span class="toggle-icon" [class.expanded]="!isEventsLogFolded">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
              <h4>Events Log</h4>
            </div>
            <div>
              <button class="clear-btn" (click)="eventsLog = []; $event.stopPropagation()">Clear</button>
            </div>
          </div>
          <div class="section-content" *ngIf="!isEventsLogFolded">
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
        background-color: var(--a2ui-color-surface, #ffffff);
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
        flex: 0 1 auto;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
      }
      .inspect-section.folded {
        flex: 0 0 auto;
      }
      .data-section,
      .surface-section {
        border-bottom: 1px solid #1e293b;
        flex: 0 0 auto;
        max-height: 800px;
        display: flex;
        flex-direction: column;
      }
      textarea {
        width: 100%;
        height: 150px;
        min-height: 100px;
        box-sizing: border-box;
        background-color: #0c111b;
        color: #a7f3d0;
        border: 1px solid #1e293b;
        border-radius: 4px;
        font-family: inherit;
        font-size: inherit;
        padding: 8px;
        resize: vertical;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 16px;
        background-color: #1e293b;
        border-bottom: 1px solid #334155;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .toggle-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #94a3b8;
        transition: transform 0.2s ease;
      }
      .toggle-icon.expanded {
        transform: rotate(90deg);
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
      .error-badge {
        background-color: #7f1d1d;
        color: #fca5a5;
      }
      .error-message {
        color: #fca5a5;
        font-size: 0.75rem;
        margin: 0 0 8px 0;
        font-family: inherit;
        background-color: #7f1d1d;
        border: 1px solid #b91c1c;
        border-radius: 6px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        box-sizing: border-box;
      }
      .error-icon {
        font-size: 0.9rem;
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
  currentCreateSurfaceMessageJson: string = '';
  messageError: string | null = null;
  currentDataModelJson: string = '';
  dataModelError: string | null = null;

  isDataModelFolded = false;
  isSurfaceMessageFolded = false;
  isEventsLogFolded = false;

  toggleDataModel() {
    this.isDataModelFolded = !this.isDataModelFolded;
    localStorage.setItem('isDataModelFolded', String(this.isDataModelFolded));
  }

  toggleSurfaceMessage() {
    this.isSurfaceMessageFolded = !this.isSurfaceMessageFolded;
    localStorage.setItem('isSurfaceMessageFolded', String(this.isSurfaceMessageFolded));
  }

  toggleEventsLog() {
    this.isEventsLogFolded = !this.isEventsLogFolded;
    localStorage.setItem('isEventsLogFolded', String(this.isEventsLogFolded));
  }

  private actionSub?: { unsubscribe: () => void };
  private dataModelSub?: { unsubscribe: () => void };

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isDataModelFolded = localStorage.getItem('isDataModelFolded') === 'true';
      this.isSurfaceMessageFolded = localStorage.getItem('isSurfaceMessageFolded') === 'true';
      this.isEventsLogFolded = localStorage.getItem('isEventsLogFolded') === 'true';
    }
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
    this.currentCreateSurfaceMessageJson = createMsg ? JSON.stringify(createMsg, null, 2) : '';

    this.cdr.detectChanges();

    // Set initial surface and  data model
    if (this.surfaceId) {
      const surface = this.rendererService.surfaceGroup?.getSurface(this.surfaceId);
      if (surface) {
        this.currentDataModel = surface.dataModel.get('/');
        this.currentDataModelJson = JSON.stringify(this.currentDataModel, null, 2);
      }
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

  /**
   * Handles user input in the message editor.
   * Reloads the UI live on every valid input.
   */
  onSurfaceMessageChange(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const newValue = textarea.value;
    this.currentCreateSurfaceMessageJson = newValue;

    try {
      const parsed = JSON.parse(newValue);
      this.messageError = null;

      if (!('createSurface' in parsed) || !this.selectedExample) return;

      const updatedMessages = this.selectedExample.messages.map(m =>
        'createSurface' in m ? parsed : m
      );

      // Re-initialize the demo with the updated messages
      this.agentStub.initializeDemo(updatedMessages);

      const newSurfaceId = parsed.createSurface.surfaceId;

      if (this.dataModelSub) {
        this.dataModelSub.unsubscribe();
      }

      // Force recreation of the surface component by nulling the ID temporarily
      this.surfaceId = null;
      this.cdr.detectChanges();

      this.surfaceId = newSurfaceId;
      const surface = this.rendererService.surfaceGroup?.getSurface(this.surfaceId!);
      if (surface) {
        this.dataModelSub = surface.dataModel.subscribe('/', (data) => {
          this.currentDataModel = data as Record<string, unknown>;
          this.currentDataModelJson = JSON.stringify(data, null, 2);
          this.cdr.detectChanges();
        });
        this.currentDataModel = surface.dataModel.get('/');
        this.currentDataModelJson = JSON.stringify(this.currentDataModel, null, 2);
      }

      this.cdr.detectChanges();
    } catch (e) {
      this.messageError = e instanceof Error ? e.message : 'Invalid JSON';
      console.error(e);
    }
  }

  onSurfaceMessageBlur() {
    try {
      const parsed = JSON.parse(this.currentCreateSurfaceMessageJson);
      this.currentCreateSurfaceMessageJson = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Ignore if invalid, don't format
    }
  }

  /**
   * Handles user input in the data model editor.
   * Updates the surface data model live.
   */
  onDataModelChange(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const newValue = textarea.value;
    this.currentDataModelJson = newValue;

    try {
      const parsed = JSON.parse(newValue);
      this.dataModelError = null;
      const surface = this.rendererService.surfaceGroup?.getSurface(this.surfaceId!);
      surface?.dataModel.set('/', parsed);
    } catch (e) {
      this.dataModelError = e instanceof Error ? e.message : 'Invalid JSON';
      console.error(e);
    }
  }

  onDataModelBlur() {
    try {
      const parsed = JSON.parse(this.currentDataModelJson);
      this.currentDataModelJson = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Ignore if invalid, don't format
    }
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
