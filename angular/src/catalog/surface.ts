import { Component, input } from '@angular/core';
import { Renderer } from './rendering/renderer';
import { v0_8 } from '@a2ui/web-lib';

@Component({
  selector: 'a2ui-surface',
  imports: [Renderer],
  template: `
    @let surfaceId = this.surfaceId(); 
    @let surface = this.surface(); 
    
    @if (surfaceId && surface) {
      <a2ui-renderer [surfaceId]="surfaceId" [component]="surface.componentTree!" />
    }
  `,
})
export class Surface {
  readonly surfaceId = input.required<v0_8.Types.SurfaceID | null>();
  readonly surface = input.required<v0_8.Types.Surface | null>();
}
