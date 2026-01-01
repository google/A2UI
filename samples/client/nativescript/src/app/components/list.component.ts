import { Component, ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DynamicComponent, Renderer } from '@a2ui/nativescript';
import { Types, SimpleNode } from '../../a2ui-lit-types';

@Component({
  selector: 'a2ui-list',
  standalone: true,
  imports: [NativeScriptCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ListView 
      class="a2ui-list"
      [items]="items"
      (itemTap)="onItemTap($event)">
      <ng-template let-item="item" let-i="index">
        <GridLayout 
          class="list-item"
          rows="auto" 
          columns="auto, *, auto">
          
          <!-- Leading icon/image -->
          <StackLayout 
            col="0" 
            class="list-item-leading"
            *ngIf="item.leading">
            <ng-container [a2uiRenderer]="item.leading"></ng-container>
          </StackLayout>
          
          <!-- Content -->
          <StackLayout col="1" class="list-item-content">
            <Label 
              *ngIf="item.title"
              class="list-item-title"
              [text]="item.title"
              textWrap="true">
            </Label>
            <Label 
              *ngIf="item.subtitle"
              class="list-item-subtitle"
              [text]="item.subtitle"
              textWrap="true">
            </Label>
          </StackLayout>
          
          <!-- Trailing -->
          <StackLayout 
            col="2" 
            class="list-item-trailing"
            *ngIf="item.trailing">
            <ng-container [a2uiRenderer]="item.trailing"></ng-container>
          </StackLayout>
          
        </GridLayout>
      </ng-template>
    </ListView>
  `,
  styles: [`
    .a2ui-list {
      background-color: transparent;
    }
    
    .list-item {
      padding: 12 16;
      background-color: #1e1e3f;
      margin: 4 0;
      border-radius: 8;
    }
    
    .list-item-leading {
      margin-right: 12;
      vertical-align: center;
    }
    
    .list-item-content {
      vertical-align: center;
    }
    
    .list-item-title {
      font-size: 16;
      font-weight: 500;
      color: #ffffff;
    }
    
    .list-item-subtitle {
      font-size: 13;
      color: #9ca3af;
      margin-top: 2;
    }
    
    .list-item-trailing {
      margin-left: 12;
      vertical-align: center;
    }
  `],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ListComponent extends DynamicComponent<any> {
  get items(): any[] {
    const node = this.node as SimpleNode;
    return node?.items || node?.children || [];
  }
  
  onItemTap(event: any): void {
    const item = this.items[event.index];
    const action = item?.actions?.[0];
    if (action) {
      this.sendAction(action);
    }
  }
}
