import { Component, Input, ViewEncapsulation } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'md-icon',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <mat-icon
      [fontSet]="fontSet"
      [fontIcon]="fontIcon"
      class="md-icon"
    >
      <ng-content></ng-content>
    </mat-icon>
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
export class MdIcon {
  // MatIcon properties we might want to map if they existed in catalog
  @Input() fontSet: string = 'material-icons';
  @Input() fontIcon: string = '';

  // Since catalog defined no properties, we rely on ng-content for the icon name
  // usage: <md-icon>settings</md-icon>

  // Properties injected by renderer or potentially inherited
  @Input() component: any;
  @Input() weight: any;
  @Input() surfaceId: string = '';
}
