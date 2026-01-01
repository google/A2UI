import { Component, ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DynamicComponent, Renderer } from '@a2ui/nativescript';
import { Types, SimpleNode } from '../../a2ui-lit-types';

@Component({
  selector: 'a2ui-row',
  standalone: true,
  imports: [NativeScriptCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <FlexboxLayout 
      class="a2ui-row"
      flexDirection="row"
      [alignItems]="alignItems"
      [justifyContent]="justifyContent">
      <ng-container *ngFor="let child of children">
        <ng-container [a2uiRenderer]="child"></ng-container>
      </ng-container>
    </FlexboxLayout>
  `,
  styles: [`
    .a2ui-row {
      flex-wrap: wrap;
    }
  `],
  schemas: [NO_ERRORS_SCHEMA],
})
export class RowComponent extends DynamicComponent<any> {
  get children(): SimpleNode[] {
    const node = this.node as SimpleNode;
    return node?.children || [];
  }
  
  get alignItems(): string {
    const node = this.node as SimpleNode;
    switch (node?.verticalAlignment) {
      case 'top': return 'flex-start';
      case 'bottom': return 'flex-end';
      case 'center': return 'center';
      default: return 'flex-start';
    }
  }
  
  get justifyContent(): string {
    const node = this.node as SimpleNode;
    switch (node?.horizontalAlignment) {
      case 'start': return 'flex-start';
      case 'end': return 'flex-end';
      case 'center': return 'center';
      case 'spaceBetween': return 'space-between';
      case 'spaceAround': return 'space-around';
      default: return 'flex-start';
    }
  }
}
