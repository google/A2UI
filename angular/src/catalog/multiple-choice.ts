import { Component, computed, input } from '@angular/core';
import { DynamicComponent } from './rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

@Component({
  selector: 'a2ui-multiple-choice',
  template: `
    <select (change)="handleChange($event)" [value]="selectValue()">
      @for (option of options(); track option.value) {
      <option [value]="option.value">{{ resolvePrimitive(option.label) }}</option>
      }
    </select>
  `,
})
export class MultipleChoice extends DynamicComponent {
  readonly options = input.required<{ label: v0_8.Primitives.StringValue; value: string }[]>();
  readonly value = input.required<v0_8.Primitives.StringValue | null>();
  protected selectValue = computed(() => super.resolvePrimitive(this.value()));

  protected handleChange(event: Event) {
    const path = this.value()?.path;

    if (!(event.target instanceof HTMLSelectElement) || !event.target.value || !path) {
      return;
    }

    this.processor.setData(
      this.component(),
      this.processor.resolvePath(path, this.component().dataContextPath),
      event.target.value
    );
  }
}
