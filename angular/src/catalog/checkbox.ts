import { Component, computed, input } from '@angular/core';
import { DynamicComponent } from './rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

let idCounter = 0;

@Component({
  selector: 'a2ui-checkbox',
  template: `
    <input
      autocomplete="off"
      type="checkbox"
      [id]="inputId"
      [checked]="inputChecked()"
      (change)="handleChange($event)"
    />

    <label [htmlFor]="inputId">{{ resolvedLabel() }}</label>
  `,
})
export class Checkbox extends DynamicComponent {
  readonly value = input.required<v0_8.Primitives.BooleanValue | null>();
  readonly label = input.required<v0_8.Primitives.StringValue | null>();

  protected inputChecked = computed(() => super.resolvePrimitive(this.value()) ?? false);
  protected resolvedLabel = computed(() => super.resolvePrimitive(this.label()));
  protected inputId = `a2ui-checkbox-${idCounter++}`;

  protected handleChange(event: Event) {
    const path = this.value()?.path;

    if (!(event.target instanceof HTMLInputElement) || !path) {
      return;
    }

    this.processor.setDataByPath(path, event.target.checked, this.surfaceId());
  }
}
