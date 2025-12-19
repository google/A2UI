import { Component, computed, input, Output, EventEmitter, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicComponent } from '@a2ui/angular';
import { Primitives } from '@a2ui/lit/0.8';

@Component({
  selector: 'catalog-md-checkbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <label style="display: flex; align-items: center; gap: 8px;">
      <md-checkbox
        [checked]="resolvedChecked()"
        [indeterminate]="resolvedIndeterminate()"
        [required]="resolvedRequired()"
        [value]="resolvedValue()"
        [disabled]="resolvedDisabled()"
        (change)="onChange($event)"
        (input)="onChange($event)">
      </md-checkbox>
      <span>
        {{ resolvedLabel() }}
        <ng-content></ng-content>
      </span>
    </label>
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
})
export class MdCheckbox extends DynamicComponent {
  readonly label = input<Primitives.StringValue | string | null>(null);
  readonly checked = input<Primitives.BooleanValue | boolean | null>(null);
  readonly indeterminate = input<Primitives.BooleanValue | boolean | null>(null);
  readonly required = input<Primitives.BooleanValue | boolean | null>(null);
  readonly value = input<Primitives.StringValue | string | null>(null);
  readonly disabled = input<Primitives.BooleanValue | boolean | null>(null);

  protected resolvedLabel = computed(() => {
    const v = this.label();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.StringValue) : (v as string)) ?? '';
  });
  protected resolvedChecked = computed(() => {
    const v = this.checked();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.BooleanValue) : (v as boolean)) ?? false;
  });
  protected resolvedIndeterminate = computed(() => {
    const v = this.indeterminate();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.BooleanValue) : (v as boolean)) ?? false;
  });
  protected resolvedRequired = computed(() => {
    const v = this.required();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.BooleanValue) : (v as boolean)) ?? false;
  });
  protected resolvedValue = computed(() => {
    const v = this.value();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.StringValue) : (v as string)) ?? 'on';
  });
  protected resolvedDisabled = computed(() => {
    const v = this.disabled();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.BooleanValue) : (v as boolean)) ?? false;
  });

  @Output() checkedChange = new EventEmitter<boolean>();
  @Output() indeterminateChange = new EventEmitter<boolean>();

  onChange(event: Event) {
    const target = event.target as any;
    // We are extending DynamicComponent, but we initially just want to support local state changes or emit events?
    // If the catalog doesn't bind an action, we might just emit the event for Angular consumers.
    // Since this is likely used in a renderer, the `checked` input is driven by the model.
    // If the user interacts, we probably should update the model via an action if bound?
    // But for now, let's keep the emit logic.
    if (this.checked() !== target.checked) {
      this.checkedChange.emit(target.checked);
    }
    if (this.indeterminate() !== target.indeterminate) {
      this.indeterminateChange.emit(target.indeterminate);
    }
  }
}
