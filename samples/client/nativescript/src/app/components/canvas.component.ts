import {
  Component,
  Input,
  signal,
  inject,
  NO_ERRORS_SCHEMA,
} from "@angular/core";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { Renderer, Types } from "@a2ui/nativescript";
import { A2uiMessage } from "../../a2ui-types";
import { ChatService } from "../services/chat.service";

@Component({
  selector: "a2ui-canvas",
  imports: [NativeScriptCommonModule, Renderer],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    @if (surface()) {
    <GridLayout rows="auto,*" class="canvas-container">
      <GridLayout class="canvas-header" rows="auto" columns="auto, *, auto">
        <Label col="0" class="canvas-icon" text="🎨"></Label>
        <Label col="1" class="canvas-title" text="A2UI Surface"></Label>
        <Label col="2" class="canvas-close" text="✕" (tap)="onClose()"></Label>
      </GridLayout>

      <ScrollView row="1" class="canvas-content">
        <StackLayout class="surface-wrapper">
          <!-- Dynamic A2UI content rendered here -->
          @if (surface()?.root) {
            <ng-container
              
              a2ui-renderer
              [surfaceId]="surface()!.surfaceId!"
              [component]="surface()!.root!"
            >
            </ng-container>
          }
        </StackLayout>
      </ScrollView>
    </GridLayout>
    }
  `,
  styleUrls: ["./canvas.component.css"],
})
export class CanvasComponent {
  private readonly chatService = inject(ChatService);

  readonly surface = this.chatService.currentSurface;

  onClose(): void {
    this.chatService.clearMessages();
  }
}
