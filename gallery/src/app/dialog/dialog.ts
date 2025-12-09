import { Component, HostListener, input, output } from '@angular/core';
import type { Cmp } from '../app';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.html',
  styleUrls: ['./dialog.css'],
  imports: [JsonPipe]
})
export class Dialog {
  readonly component = input.required<Cmp>();
  readonly close = output();

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close.emit();
  }
}
