import { Component, ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DynamicComponent, Renderer } from '@a2ui/nativescript';
import { Types, SimpleNode } from '../../a2ui-lit-types';

@Component({
  selector: 'a2ui-list',
  imports: [NativeScriptCommonModule, Renderer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ScrollView class="a2ui-list" [orientation]="scrollOrientation">
      <StackLayout 
        [orientation]="stackOrientation"
        class="list-container">
        <ng-container *ngFor="let child of children">
          <ng-container 
            a2ui-renderer
            [surfaceId]="surfaceId()"
            [component]="child">
          </ng-container>
        </ng-container>
      </StackLayout>
    </ScrollView>
  `,
  styles: [`
    .a2ui-list {
      background-color: transparent;
    }
    
    .list-container {
      padding: 4;
    }
  `],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ListComponent extends DynamicComponent<any> {
  get children(): SimpleNode[] {
    const node = this.node as SimpleNode;
    return node?.children || node?.items || [];
  }
  
  get scrollOrientation(): 'vertical' | 'horizontal' {
    const node = this.node as SimpleNode;
    return node?.direction === 'horizontal' ? 'horizontal' : 'vertical';
  }
  
  get stackOrientation(): 'vertical' | 'horizontal' {
    const node = this.node as SimpleNode;
    return node?.direction === 'horizontal' ? 'horizontal' : 'vertical';
  }
}
