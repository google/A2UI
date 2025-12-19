import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'md-checkbox',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, FormsModule],
  template: `
    <mat-checkbox
      [checked]="checked"
      [indeterminate]="indeterminate"
      [required]="required"
      [value]="value"
      [disabled]="disabled"
      (change)="onChange($event)"
      (indeterminateChange)="onIndeterminateChange($event)"
    >
      {{ label }}
      <ng-content></ng-content>
    </mat-checkbox>
  `,
  styles: [],
  encapsulation: ViewEncapsulation.None,
})
export class MdCheckbox {
  @Input() label: string = '';
  @Input() checked: boolean = false;
  @Input() indeterminate: boolean = false;
  @Input() required: boolean = false;
  @Input() value: string = 'on';
  @Input() disabled: boolean = false;

  @Input() component: any;
  @Input() surfaceId: string = '';
  @Input() weight: any;

  @Output() checkedChange = new EventEmitter<boolean>();
  @Output() indeterminateChange = new EventEmitter<boolean>();

  onChange(event: any) {
    this.checked = event.checked;
    this.checkedChange.emit(this.checked);
  }

  onIndeterminateChange(val: boolean) {
    this.indeterminate = val;
    this.indeterminateChange.emit(this.indeterminate);
  }
}
