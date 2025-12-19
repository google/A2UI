import { Component, Input } from '@angular/core';

@Component({
  selector: 'a2ui-hello',
  template: `
    <span style="font-size: 24px; font-weight: bold; color: var(--mat-sys-primary);">Hello</span>
  `,
  standalone: true,
  styles: [`
    :host {
      display: block;
      padding: 16px;
    }
  `],
})
export class Hello {
  @Input() component: any;
  @Input() surfaceId: string = '';
  @Input() weight: any;
}
