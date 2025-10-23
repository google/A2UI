import { Component, input } from '@angular/core';
import { v0_8 } from '@a2ui/web-lib';
import { DynamicComponent } from './rendering/dynamic-component';

@Component({
  selector: 'a2ui-column',
  styles: `
    :host {
      display: block;
      outline: solid 1px red;
      padding: 20px;
    }
  `,
  template: `
    <!-- TODO: implement theme -->
    <ng-content></ng-content>
  `,
})
export class Column extends DynamicComponent {
  readonly alignment = input<v0_8.Types.ResolvedColumn['alignment']>('stretch');
  readonly distribution = input<v0_8.Types.ResolvedColumn['distribution']>('start');

  // TODO: theme?
}
