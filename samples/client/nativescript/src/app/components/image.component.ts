import { Component, ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DynamicComponent } from '@a2ui/nativescript';
import { Types, SimpleNode } from '../../a2ui-lit-types';

@Component({
  selector: 'a2ui-image',
  imports: [NativeScriptCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <Image 
      class="a2ui-image"
      [src]="imageSrc"
      [stretch]="stretch"
      (tap)="onTap()">
    </Image>
  `,
  styles: [`
    .a2ui-image {
      border-radius: 8;
    }
  `],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ImageComponent extends DynamicComponent<any> {
  get imageSrc(): string {
    const node = this.node as SimpleNode;
    return node?.url || node?.src || '';
  }
  
  get stretch(): 'none' | 'fill' | 'aspectFit' | 'aspectFill' {
    const node = this.node as SimpleNode;
    switch (node?.fit) {
      case 'cover': return 'aspectFill';
      case 'contain': return 'aspectFit';
      case 'fill': return 'fill';
      default: return 'aspectFit';
    }
  }
  
  onTap(): void {
    const node = this.node as SimpleNode;
    const action = node?.actions?.[0];
    if (action) {
      this.sendAction(action);
    }
  }
}
