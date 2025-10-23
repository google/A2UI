import { Component, input } from '@angular/core';
import { DynamicComponent } from './rendering/dynamic-component';

@Component({
  selector: 'a2ui-list',
  styles: `
    :host {
      display: block;
      outline: solid 1px green;
      padding: 20px;
    }
  `,
  template: `
    <!-- TODO: implement theme -->
    <ng-content></ng-content>
  `,
})
export class List extends DynamicComponent {
  readonly direction = input<'vertical' | 'horizontal'>('vertical');

  // TODO: theme?
}
