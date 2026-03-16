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

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentHostComponent } from '../../core/component-host.component';

/**
 * Angular implementation of the A2UI Column component (v0.9).
 */
@Component({
  selector: 'a2ui-v09-column',
  standalone: true,
  imports: [CommonModule, ComponentHostComponent],
  template: `
    <div
      class="a2ui-column"
      [style.justify-content]="props.justify?.value()"
      [style.align-items]="props.align?.value()"
      style="display: flex; flex-direction: column; width: 100%;"
    >
      <ng-container *ngIf="!isRepeating()">
        <ng-container *ngFor="let childId of children()">
          <a2ui-v09-component-host
            [componentId]="childId"
            [surfaceId]="surfaceId"
            [dataContextPath]="dataContextPath"
          >
          </a2ui-v09-component-host>
        </ng-container>
      </ng-container>

      <ng-container *ngIf="isRepeating()">
        <ng-container *ngFor="let item of children(); let i = index">
          <a2ui-v09-component-host
            [componentId]="getTemplateId()"
            [surfaceId]="surfaceId"
            [dataContextPath]="getNormalizedPath(i)"
          >
          </a2ui-v09-component-host>
        </ng-container>
      </ng-container>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColumnComponent {
  /**
   * Bound properties.
   */
  @Input() props: any = {};
  @Input() surfaceId!: string;
  @Input() dataContextPath: string = '/';

  protected children() {
    const raw = this.props.children?.value() || [];
    return Array.isArray(raw) ? raw : [];
  }

  protected isRepeating() {
    return !!this.props.children?.raw?.componentId;
  }

  protected getTemplateId() {
    return this.props.children?.raw?.componentId;
  }

  protected getNormalizedPath(index: number) {
    let path = this.props.children?.raw?.path || '';
    if (!path.startsWith('/')) {
      const base = this.dataContextPath === '/' ? '' : this.dataContextPath;
      path = `${base}/${path}`;
    }
    if (path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return `${path}/${index}`;
  }
}
