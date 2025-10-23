import { Component, input } from '@angular/core';
import { v0_8 } from '@a2ui/web-lib';
import { DynamicComponent } from './rendering/dynamic-component';

@Component({
  selector: 'a2ui-row',
  styles: `
    :host {
      display: block;
      outline: solid 1px blue;
      padding: 20px;
    }
  `,
  template: `
    <!-- TODO: implement theme -->
    <ng-content></ng-content>
  `,
})
export class Row extends DynamicComponent {
  readonly alignment = input<v0_8.Types.ResolvedRow['alignment']>('stretch');
  readonly distribution = input<v0_8.Types.ResolvedRow['distribution']>('start');

  // TODO: theme?
}
