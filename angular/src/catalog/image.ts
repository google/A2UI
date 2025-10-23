import { Component, computed, input } from '@angular/core';
import { DynamicComponent } from './rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

@Component({
  selector: 'a2ui-image',
  styles: `
    img {
      display: block;
      width: 100%;
      height: 100%;

      max-width: 200px; /* TODO: temporary */
    }
  `,
  template: `
    @let resolvedUrl = this.resolvedUrl(); 
    
    @if (resolvedUrl) {
      <img [src]="resolvedUrl" />
    }
  `,
})
export class Image extends DynamicComponent {
  readonly url = input.required<v0_8.Primitives.StringValue | null>();
  protected readonly resolvedUrl = computed(() => this.resolvePrimitive(this.url()));
}
