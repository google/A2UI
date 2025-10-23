import { computed, Directive, input } from '@angular/core';
import { DynamicComponent } from './rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

@Directive({
  selector: 'input[a2ui-datetime-input]',
  host: {
    autocomplete: 'off',
    type: 'datetime-local',
    placeholder: 'Date & Time',
    '(input)': 'handleInput($event)',
    '[value]': 'inputValue()',
  },
})
export class DatetimeInput extends DynamicComponent {
  readonly value = input.required<v0_8.Primitives.StringValue | null>();
  protected inputValue = computed(() => super.resolvePrimitive(this.value()) || '');

  protected handleInput(event: Event) {
    const path = this.value()?.path;

    if (!(event.target instanceof HTMLInputElement) || !path) {
      return;
    }

    this.processor.setDataByPath(path, event.target.value, this.surfaceId());
  }
}
