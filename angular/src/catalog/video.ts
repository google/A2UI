import { Component, computed, input } from '@angular/core';
import { DynamicComponent } from './rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

@Component({
  selector: 'a2ui-video',
  template: `
    @let resolvedUrl = this.resolvedUrl(); 
    
    @if (resolvedUrl) {
      <video controls [src]="resolvedUrl"></video>
    }
  `,
})
export class Video extends DynamicComponent {
  readonly url = input.required<v0_8.Primitives.StringValue | null>();
  protected readonly resolvedUrl = computed(() => this.resolvePrimitive(this.url()));
}
