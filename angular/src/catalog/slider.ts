import { Directive, computed, input } from '@angular/core';
import { DynamicComponent } from './rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

@Directive({
  selector: 'input[a2ui-slider]',
  host: {
    autocomplete: 'off',
    type: 'range',
    '[value]': 'resolvedValue()',
    '[min]': 'minValue()',
    '[max]': 'maxValue()',
    '(input)': 'handleInput($event)',
  },
})
export class Slider extends DynamicComponent {
  readonly value = input.required<v0_8.Primitives.NumberValue | null>();
  readonly minValue = input.required<number | undefined>();
  readonly maxValue = input.required<number | undefined>();

  protected resolvedValue = computed(() => super.resolvePrimitive(this.value()) ?? 0);

  protected handleInput(event: Event) {
    const path = this.value()?.path;

    if (!(event.target instanceof HTMLInputElement) || !path) {
      return;
    }

    this.processor.setData(this.component(), path, event.target.valueAsNumber, this.surfaceId());
  }
}
