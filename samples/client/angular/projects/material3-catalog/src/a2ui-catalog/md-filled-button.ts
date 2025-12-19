import { Component, Input, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'md-filled-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <button mat-flat-button 
      [disabled]="disabled" 
      [attr.type]="type"
      class="md-filled-button">
      
      <!-- Leading Icon (if trailingIcon is false and hasIcon is true) -->
      <ng-content select="[slot=icon]" *ngIf="hasIcon && !trailingIcon"></ng-content>
      
      <!-- Label -->
      {{ label }}
      <ng-content></ng-content>

      <!-- Trailing Icon (if trailingIcon is true) -->
      <ng-content select="[slot=icon]" *ngIf="hasIcon && trailingIcon"></ng-content>
    </button>
  `,
  styles: [`
    md-filled-button {
      display: inline-block;
    }
  `],
  encapsulation: ViewEncapsulation.None,
})
export class MdFilledButton {
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Input() softDisabled: boolean = false; // Not directly supported by MatButton, handled via disabled or custom styles
  @Input() href: string = '';
  @Input() target: string = '';
  @Input() trailingIcon: boolean = false;
  @Input() hasIcon: boolean = false;
  @Input() type: string = 'submit';

  @Input() component: any;
  @Input() surfaceId: string = '';
  @Input() weight: any;
}
