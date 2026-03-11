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

import { ChangeDetectionStrategy, Component, computed, input, signal, effect, untracked } from '@angular/core';
import { SurfaceModel } from '@a2ui/web_core/v0_9';
import { Renderer } from '../rendering/renderer';

@Component({
  selector: 'a2ui-surface',
  imports: [Renderer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // v0.9 uses "root" as the conventional ID for the root component.
  // We check if it exists in the components model before rendering.
  // We use the non-null assertion operator (!) on componentTree because we check for existence in the @if block.
  template: `
    @let root = rootComponent();

    @if (surface() && root) {
      <ng-container a2ui-renderer [surfaceId]="surface().id" [component]="root" />
    }
  `,
  styles: `
    :host {
      display: flex;
      min-height: 0;
      max-height: 100%;
      flex-direction: column;
      gap: 16px;
    }
  `,
  host: {
    '[style]': 'styles()',
  },
})
export class Surface {
  readonly surfaceId = input.required<string>();
  readonly surface = input.required<SurfaceModel<any>>();
  readonly rootComponent = signal<any>(undefined);

  constructor() {
    effect((onCleanup) => {
      const surface = this.surface();
      if (!surface) return;

      untracked(() => {
        this.rootComponent.set(surface.componentsModel.get('root'));
      });

      const createSub = surface.componentsModel.onCreated.subscribe((comp) => {
        if (comp.id === 'root') {
          this.rootComponent.set(comp);
        }
      });
      const deleteSub = surface.componentsModel.onDeleted.subscribe((id) => {
        if (id === 'root') {
          this.rootComponent.set(undefined);
        }
      });

      onCleanup(() => {
        createSub.unsubscribe();
        deleteSub.unsubscribe();
      });
    });
  }

  protected readonly styles = computed(() => {
    const surface = this.surface();
    const styles: Record<string, string> = {};

    if (surface?.theme) {
      // Adapt v0.9 theme to CSS variables.
      const theme = surface.theme;
      if (theme.primaryColor) {
        const value = theme.primaryColor;
        styles['--p-100'] = '#ffffff';
        styles['--p-99'] = `color-mix(in srgb, ${value} 2%, white 98%)`;
        styles['--p-98'] = `color-mix(in srgb, ${value} 4%, white 96%)`;
        styles['--p-95'] = `color-mix(in srgb, ${value} 10%, white 90%)`;
        styles['--p-90'] = `color-mix(in srgb, ${value} 20%, white 80%)`;
        styles['--p-80'] = `color-mix(in srgb, ${value} 40%, white 60%)`;
        styles['--p-70'] = `color-mix(in srgb, ${value} 60%, white 40%)`;
        styles['--p-60'] = `color-mix(in srgb, ${value} 80%, white 20%)`;
        styles['--p-50'] = value;
        styles['--p-40'] = `color-mix(in srgb, ${value} 80%, black 20%)`;
        styles['--p-35'] = `color-mix(in srgb, ${value} 70%, black 30%)`;
        styles['--p-30'] = `color-mix(in srgb, ${value} 60%, black 40%)`;
        styles['--p-25'] = `color-mix(in srgb, ${value} 50%, black 50%)`;
        styles['--p-20'] = `color-mix(in srgb, ${value} 40%, black 60%)`;
        styles['--p-15'] = `color-mix(in srgb, ${value} 30%, black 70%)`;
        styles['--p-10'] = `color-mix(in srgb, ${value} 20%, black 80%)`;
        styles['--p-5'] = `color-mix(in srgb, ${value} 10%, black 90%)`;
        styles['--p-0'] = '#000000';
      }
      if (theme.fontFamily) {
        styles['--font-family'] = theme.fontFamily;
        styles['--font-family-flex'] = theme.fontFamily;
      }
    }

    return styles;
  });
}
