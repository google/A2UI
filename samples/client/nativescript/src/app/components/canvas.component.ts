import { Component, Input, signal, inject, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { Renderer } from '@a2ui/nativescript';
import { Types } from '../../a2ui-lit-types';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'a2ui-canvas',
  standalone: true,
  imports: [NativeScriptCommonModule, Renderer],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <StackLayout class="canvas-container" *ngIf="surface()">
      
      <GridLayout class="canvas-header" rows="auto" columns="auto, *, auto">
        <Label col="0" class="canvas-icon" text="🎨"></Label>
        <Label col="1" class="canvas-title" text="A2UI Surface"></Label>
        <Label col="2" class="canvas-close" text="✕" (tap)="onClose()"></Label>
      </GridLayout>
      
      <ScrollView class="canvas-content">
        <StackLayout class="surface-wrapper">
          <!-- Dynamic A2UI content rendered here -->
          <ng-container 
            *ngIf="surface()?.root"
            a2ui-renderer
            [surfaceId]="surface()!.surfaceId!"
            [component]="surface()!.root!">
          </ng-container>
        </StackLayout>
      </ScrollView>
      
    </StackLayout>
  `,
  styles: [`
    .canvas-container {
      background-color: #0f0f23;
      border-radius: 16;
      margin: 8;
      border-width: 1;
      border-color: #2a2a4a;
    }
    
    .canvas-header {
      padding: 12 16;
      border-bottom-width: 1;
      border-bottom-color: #2a2a4a;
    }
    
    .canvas-icon {
      font-size: 16;
      vertical-align: center;
    }
    
    .canvas-title {
      font-size: 14;
      font-weight: 600;
      color: #ffffff;
      margin-left: 8;
      vertical-align: center;
    }
    
    .canvas-close {
      font-size: 16;
      color: #6b7280;
      padding: 4 8;
    }
    
    .canvas-content {
      max-height: 300;
    }
    
    .surface-wrapper {
      padding: 16;
    }
  `]
})
export class CanvasComponent {
  private readonly chatService = inject(ChatService);
  
  readonly surface = this.chatService.currentSurface;
  
  onClose(): void {
    // Could add a method to clear surface in chat service
  }
}
