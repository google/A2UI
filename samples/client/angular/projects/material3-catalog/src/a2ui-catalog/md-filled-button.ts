import { Component, computed, input, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicComponent } from '@a2ui/angular';
import { Primitives } from '@a2ui/lit/0.8';

@Component({
  selector: 'catalog-md-filled-button',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <md-filled-button
      [disabled]="resolvedDisabled()"
      [href]="resolvedHref()"
      [target]="resolvedTarget()"
      [trailingIcon]="resolvedTrailingIcon()"
      [type]="resolvedType()">
      <ng-content select="[slot=icon]"></ng-content>
      {{ resolvedLabel() }}
      <ng-content></ng-content>
    </md-filled-button>
  `,
  styles: [`
    catalog-md-filled-button {
      display: inline-block;
      flex: var(--weight);
    }
  `],
  encapsulation: ViewEncapsulation.None,
})
export class MdFilledButton extends DynamicComponent {
  readonly label = input<Primitives.StringValue | string | null>(null);
  readonly disabled = input<Primitives.BooleanValue | boolean | null>(null);
  readonly softDisabled = input<Primitives.BooleanValue | boolean | null>(null);
  readonly href = input<Primitives.StringValue | string | null>(null);
  readonly target = input<Primitives.StringValue | string | null>(null);
  readonly trailingIcon = input<Primitives.BooleanValue | boolean | null>(null);
  readonly hasIcon = input<Primitives.BooleanValue | boolean | null>(null);
  readonly type = input<Primitives.StringValue | string | null>(null);

  protected resolvedLabel = computed(() => {
    const v = this.label();
    return (v && typeof v === 'object') ? this.resolvePrimitive(v) : (v as string);
  });
  protected resolvedDisabled = computed(() => {
    const v = this.disabled();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.BooleanValue) : (v as boolean)) ?? false;
  });
  protected resolvedSoftDisabled = computed(() => {
    const v = this.softDisabled();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.BooleanValue) : (v as boolean)) ?? false;
  });
  protected resolvedHref = computed(() => {
    const v = this.href();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.StringValue) : (v as string)) ?? '';
  });
  protected resolvedTarget = computed(() => {
    const v = this.target();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.StringValue) : (v as string)) ?? '';
  });
  protected resolvedTrailingIcon = computed(() => {
    const v = this.trailingIcon();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.BooleanValue) : (v as boolean)) ?? false;
  });
  protected resolvedHasIcon = computed(() => {
    const v = this.hasIcon();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.BooleanValue) : (v as boolean)) ?? false;
  });
  protected resolvedType = computed(() => {
    const v = this.type();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.StringValue) : (v as string)) ?? 'submit';
  });
}
