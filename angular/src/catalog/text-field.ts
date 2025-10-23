import { computed, Directive, input } from '@angular/core';
import { DynamicComponent } from './rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

@Directive({
  selector: 'input[a2ui-text-field]',
  host: {
    autocomplete: 'off',
    '(input)': 'handleInput($event)',
    '[value]': 'inputValue()',
    '[attr.placeholder]': 'placeholder()',
    '[type]': 'inputType() === "number" ? "number" : "text"',
  },
})
export class TextField extends DynamicComponent {
  readonly text = input.required<v0_8.Primitives.StringValue | null>();
  readonly label = input.required<v0_8.Primitives.StringValue | null>();
  readonly inputType = input.required<v0_8.Types.ResolvedTextField['type'] | null>();

  protected inputValue = computed(() => super.resolvePrimitive(this.text()) || '');
  protected placeholder = computed(() => super.resolvePrimitive(this.label()));

  protected handleInput(event: Event) {
    const path = this.text()?.path;

    if (!(event.target instanceof HTMLInputElement) || !path) {
      return;
    }

    this.processor.setData(this.component(), path, event.target.value, this.surfaceId());
  }
}
