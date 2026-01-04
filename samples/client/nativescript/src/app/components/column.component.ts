import { Component, ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DynamicComponent, Renderer, Types } from '@a2ui/nativescript';
import { SimpleNode } from '../../a2ui-types';

@Component({
  selector: 'a2ui-column',
  imports: [NativeScriptCommonModule, Renderer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <StackLayout 
      class="a2ui-column"
      [horizontalAlignment]="horizontalAlign">
      <ng-container *ngFor="let child of children">
        <ng-container 
          a2ui-renderer
          [surfaceId]="surfaceId()"
          [component]="child">
        </ng-container>
      </ng-container>
    </StackLayout>
  `,
  styles: [`
    .a2ui-column {
      /* default styles */
    }
  `],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ColumnComponent extends DynamicComponent<any> {
  get children(): SimpleNode[] {
    const node = this.node as SimpleNode;
    return node?.children || [];
  }
  
  get horizontalAlign(): 'left' | 'center' | 'right' | 'stretch' {
    const node = this.node as SimpleNode;
    switch (node?.horizontalAlignment) {
      case 'start': return 'left';
      case 'end': return 'right';
      case 'center': return 'center';
      default: return 'stretch';
    }
  }
}
