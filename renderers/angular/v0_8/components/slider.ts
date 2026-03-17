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

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import * as Primitives from '@a2ui/web_core/types/primitives';
import { DynamicComponent } from '../rendering/dynamic-component';

@Component({
  selector: '[a2ui-slider]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [class]="theme.components.Slider.container">
      <label [class]="theme.components.Slider.label" [for]="inputId">
        {{ label() }}
      </label>

      <input
        autocomplete="off"
        type="range"
        [value]="resolvedValue()"
        [min]="minValue()"
        [max]="maxValue()"
        [id]="inputId"
        (input)="handleInput($event)"
        [class]="theme.components.Slider.element"
        [style]="theme.additionalStyles?.Slider"
        [style.--slider-percent]="percentComplete() + '%'"
      />
    </section>
  `,
  styles: `
    :host {
      display: block;
      flex: var(--weight);
      width: 100%;
    }
  `,
})
export class Slider extends DynamicComponent {
  readonly value = input.required<Primitives.NumberValue | null>();
  readonly label = input('');
  readonly minValue = input.required<number | undefined>();
  readonly maxValue = input.required<number | undefined>();

  protected readonly inputId = super.getUniqueId('a2ui-slider');
  protected resolvedValue = computed(() => super.resolvePrimitive(this.value()) ?? 0);

  protected percentComplete = computed(() => {
    return this.computePercentage(this.resolvedValue() as number);
  });

  protected handleInput(event: Event) {
    const path = this.value()?.path;

    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    const newValue = event.target.valueAsNumber;
    const percent = this.computePercentage(newValue);

    // Inject CSS variable directly to avoid Angular change detection lag/snapback
    event.target.style.setProperty('--slider-percent', percent + '%');

    if (path) {
      this.processor.setData(this.component(), path, newValue, this.surfaceId());
    }
  }

  private computePercentage(value: number): number {
    const min = this.minValue() ?? 0;
    const max = this.maxValue() ?? 100;
    const range = max - min;
    return range > 0 ? Math.max(0, Math.min(100, ((value - min) / range) * 100)) : 0;
  }
}
