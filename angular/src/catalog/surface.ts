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

import { Component, input } from '@angular/core';
import { Renderer } from './rendering/renderer';
import { v0_8 } from '@a2ui/web-lib';

@Component({
  selector: 'a2ui-surface',
  imports: [Renderer],
  template: `
    @let surfaceId = this.surfaceId(); 
    @let surface = this.surface(); 
    
    @if (surfaceId && surface) {
      <ng-container a2ui-renderer [surfaceId]="surfaceId" [component]="surface.componentTree!" />
    }
  `,
  styles: `
    :host {
      display: flex;
      min-height: 0;
      overflow: auto;
      max-height: 100%;
      flex-direction: column;
      gap: 16px;
    }
  `
})
export class Surface {
  readonly surfaceId = input.required<v0_8.Types.SurfaceID | null>();
  readonly surface = input.required<v0_8.Types.Surface | null>();
}
