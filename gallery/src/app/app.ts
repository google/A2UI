import { Component, signal } from '@angular/core';
import { Dialog } from './dialog/dialog';
import { NgStyle } from '@angular/common';

export interface Cmp {
  name: string;
  id: number;
  src: string;
  color: string;
}
@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [Dialog, NgStyle],
})
export class App {
  protected readonly title = signal('gallery');
  protected readonly components = signal<Cmp[]>([
    { name: 'Component 0', id: 0, src: 'Component 0 src', color: '' },
    { name: 'Component 1', id: 1, src: 'Component 1 src', color: '' },
    { name: 'Component 2', id: 2, src: 'Component 2 src', color: '' },
    { name: 'Component 3', id: 3, src: 'Component 3 src', color: '' },
    { name: 'Component 4', id: 4, src: 'Component 4 src', color: '' },
    { name: 'Component 5', id: 5, src: 'Component 5 src', color: '' },
    { name: 'Component 6', id: 6, src: 'Component 6 src', color: '' },
    { name: 'Component 7', id: 7, src: 'Component 7 src', color: '' },
    { name: 'Component 8', id: 8, src: 'Component 8 src', color: '' },
    { name: 'Component 9', id: 9, src: 'Component 9 src', color: '' },
    { name: 'Component 10', id: 10, src: 'Component 10 src', color: '' },
    { name: 'Component 11', id: 11, src: 'Component 11 src', color: '' },
    { name: 'Component 12', id: 12, src: 'Component 12 src', color: '' },
    { name: 'Component 13', id: 13, src: 'Component 13 src', color: '' },
    { name: 'Component 14', id: 14, src: 'Component 14 src', color: '' },
    { name: 'Component 15', id: 15, src: 'Component 15 src', color: '' },
    { name: 'Component 16', id: 16, src: 'Component 16 src', color: '' },
    { name: 'Component 17', id: 17, src: 'Component 17 src', color: '' },
    { name: 'Component 18', id: 18, src: 'Component 18 src', color: '' },
    { name: 'Component 19', id: 19, src: 'Component 19 src', color: '' },
  ]);

  protected showDialog = signal(false);
  protected selectedComponent = signal<Cmp | null>(null);

  previewComponent(component: Cmp) {
    this.selectedComponent.set(component);
    this.showDialog.set(true);
  }

  closeDialog() {
    this.showDialog.set(false);
  }
}
