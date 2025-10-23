import { Component } from '@angular/core';
import { DynamicComponent } from './rendering/dynamic-component';

@Component({
  selector: 'a2ui-card',
  styles: `
    :host {
      display: block;
      outline: solid 1px orange;
      padding: 20px;
    }
  `,
  template: `
    <!-- TODO: implement theme -->
    <ng-content></ng-content>
  `,
})
export class Card extends DynamicComponent {
  // TODO: theme?
}
