import { Component, computed, input, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicComponent } from '@a2ui/angular';
import { Primitives } from '@a2ui/lit/0.8';

@Component({
  selector: 'catalog-md-icon',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <md-icon [style.font-family]="resolvedFontSet()">
      {{ resolvedFontIcon() }}
      <ng-content></ng-content>
    </md-icon>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `],
  encapsulation: ViewEncapsulation.None,
})
export class MdIcon extends DynamicComponent {
  readonly fontSet = input<Primitives.StringValue | string | null>(null);
  readonly fontIcon = input<Primitives.StringValue | string | null>(null);

  protected resolvedFontSet = computed(() => {
    const v = this.fontSet();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.StringValue) : (v as string)) ?? '';
  });
  protected resolvedFontIcon = computed(() => {
    const v = this.fontIcon();
    return ((v && typeof v === 'object') ? this.resolvePrimitive(v as Primitives.StringValue) : (v as string)) ?? '';
  });
}
