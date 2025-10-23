import { Component, computed, input } from '@angular/core';
import { DynamicComponent } from './rendering/dynamic-component';
import { v0_8 } from '@a2ui/web-lib';

@Component({
  selector: 'a2ui-audio',
  template: `
    @let resolvedUrl = this.resolvedUrl(); @if (resolvedUrl) {
    <audio controls [src]="resolvedUrl"></audio>
    }
  `,
})
export class Audio extends DynamicComponent {
  readonly url = input.required<v0_8.Primitives.StringValue | null>();
  protected readonly resolvedUrl = computed(() => this.resolvePrimitive(this.url()));
}
