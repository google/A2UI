import { Component, ChangeDetectionStrategy, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { DynamicComponent, Renderer } from '@a2ui/nativescript';
import { Types, SimpleNode, Action } from '../../a2ui-lit-types';

@Component({
  selector: 'a2ui-card',
  imports: [NativeScriptCommonModule, Renderer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <StackLayout class="a2ui-card" (tap)="onTap()">
      
      <!-- Card Header -->
      <GridLayout 
        *ngIf="cardTitle || cardSubtitle"
        class="card-header"
        rows="auto, auto" 
        columns="*, auto">
        
        <Label 
          row="0" col="0"
          *ngIf="cardTitle"
          class="card-title"
          [text]="cardTitle"
          textWrap="true">
        </Label>
        
        <Label 
          row="1" col="0"
          *ngIf="cardSubtitle"
          class="card-subtitle"
          [text]="cardSubtitle"
          textWrap="true">
        </Label>
        
      </GridLayout>
      
      <!-- Card Content -->
      <StackLayout class="card-content" *ngIf="children.length > 0">
        <ng-container *ngFor="let child of children">
          <ng-container 
            a2ui-renderer
            [surfaceId]="surfaceId()"
            [component]="child">
          </ng-container>
        </ng-container>
      </StackLayout>
      
      <!-- Card Actions -->
      <FlexboxLayout 
        *ngIf="actions.length > 0"
        class="card-actions"
        flexDirection="row"
        justifyContent="flex-end">
        <Button 
          *ngFor="let action of actions"
          class="card-action-btn"
          [text]="action.label || action.id || 'Action'"
          (tap)="handleAction(action)">
        </Button>
      </FlexboxLayout>
      
    </StackLayout>
  `,
  styles: [`
    .a2ui-card {
      background-color: #1e1e3f;
      border-radius: 12;
      margin: 8;
      border-width: 1;
      border-color: #2a2a4a;
    }
    
    .card-header {
      padding: 16;
      border-bottom-width: 1;
      border-bottom-color: #2a2a4a;
    }
    
    .card-title {
      font-size: 18;
      font-weight: 600;
      color: #ffffff;
    }
    
    .card-subtitle {
      font-size: 14;
      color: #9ca3af;
      margin-top: 4;
    }
    
    .card-content {
      padding: 16;
    }
    
    .card-actions {
      padding: 8 16 16 16;
    }
    
    .card-action-btn {
      background-color: #6366f1;
      color: #ffffff;
      font-size: 14;
      font-weight: 500;
      border-radius: 8;
      padding: 8 16;
      margin-left: 8;
      text-transform: none;
    }
  `],
  schemas: [NO_ERRORS_SCHEMA],
})
export class CardComponent extends DynamicComponent<any> {
  get cardTitle(): string {
    const node = this.node as SimpleNode;
    return node?.title || '';
  }
  
  get cardSubtitle(): string {
    const node = this.node as SimpleNode;
    return node?.subtitle || '';
  }
  
  get children(): SimpleNode[] {
    const node = this.node as SimpleNode;
    return node?.children || [];
  }
  
  get actions(): Action[] {
    const node = this.node as SimpleNode;
    return node?.actions || [];
  }
  
  onTap(): void {
    const action = this.actions[0];
    if (action) {
      this.handleAction(action);
    }
  }
  
  handleAction(action: Action): void {
    this.sendAction(action);
  }
}
