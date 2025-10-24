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
import { v0_8 } from '@a2ui/web-lib';
import { DynamicComponent } from './rendering/dynamic-component';
import { Renderer } from './rendering/renderer';

@Component({
  selector: 'a2ui-column',
  imports: [Renderer],
  host: {
    '[attr.alignment]': 'alignment()',
    '[attr.distribution]': 'distribution()',
  },
  styles: `
    :host {
      display: flex;
      flex: var(--weight);
      min-height: 0;
      overflow: auto;
    }

    section {
      display: grid;
      grid-auto-rows: auto;
      min-height: 0;
      overflow: auto;
      width: 100%;
    }

    :host[alignment="start"] section {
      align-items: start;
    }

    :host[alignment="center"] section {
      align-items: center;
    }

    :host[alignment="end"] section {
      align-items: end;
    }

    :host[alignment="stretch"] section {
      align-items: stretch;
    }

    :host[distribution="start"] section {
      justify-content: start;
    }

    :host[distribution="center"] section {
      justify-content: center;
    }

    :host[distribution="end"] section {
      justify-content: end;
    }

    :host[distribution="spaceBetween"] section {
      justify-content: space-between;
    }

    :host[distribution="spaceAround"] section {
      justify-content: space-around;
    }

    :host[distribution="spaceEvenly"] section {
      justify-content: space-evenly;
    }
  `,
  template: `
    <!-- TODO: implement theme -->
    <section>
      @for (child of component().properties.children; track child) {
        <ng-container a2ui-renderer [surfaceId]="surfaceId()!" [component]="child" />
      }
    </section>
  `,
})
export class Column extends DynamicComponent<v0_8.Types.ColumnNode> {
  readonly alignment = input<v0_8.Types.ResolvedColumn['alignment']>('stretch');
  readonly distribution = input<v0_8.Types.ResolvedColumn['distribution']>('start');

  // TODO: theme?
}
