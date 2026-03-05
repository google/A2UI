import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  signal,
  effect,
  inject,
  NO_ERRORS_SCHEMA,
} from "@angular/core";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { ScrollView } from "@nativescript/core";
import { ChatService, UiMessage } from "../services/chat.service";
import { MessageBubbleComponent } from "./message-bubble.component";

@Component({
  selector: "a2ui-chat-history",
  imports: [NativeScriptCommonModule, MessageBubbleComponent],
  template: `
    <GridLayout>
      <ScrollView #scrollView class="chat-history">
        <GridLayout rows="*" class="messages-container">
          <!-- Empty state -->
          @if (!hasMessages()) {
          <StackLayout class="empty-state">
            <Label class="empty-icon" text="💬"></Label>
            <Label class="empty-title" text="Start a Conversation"></Label>
            <Label
              class="empty-subtitle"
              text="Send a message to interact with the A2UI agent"
              textWrap="true"
            >
            </Label>
          </StackLayout>
          }

          <!-- Messages -->
          <StackLayout>
            <a2ui-message-bubble
              *ngFor="let msg of messages()"
              [messageData]="msg"
            >
            </a2ui-message-bubble>
            <!-- Spacer for scroll -->
            <StackLayout height="20"></StackLayout>
          </StackLayout>
        </GridLayout>
      </ScrollView>
    </GridLayout>
  `,
  styles: [
    `
      .chat-history {
        background-color: transparent;
      }

      .messages-container {
        padding: 16 0 0 0;
      }

      .empty-state {
        padding: 60 40;
        horizontal-align: center;
      }

      .empty-icon {
        font-size: 48;
        text-align: center;
        margin-bottom: 16;
      }

      .empty-title {
        font-size: 20;
        font-weight: bold;
        color: #ffffff;
        text-align: center;
        margin-bottom: 8;
      }

      .empty-subtitle {
        font-size: 14;
        color: #9ca3af;
        text-align: center;
      }
    `,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ChatHistoryComponent {
  @ViewChild("scrollView") scrollViewRef!: ElementRef<ScrollView>;

  private readonly chatService = inject(ChatService);

  readonly messages = this.chatService.messages;
  readonly hasMessages = this.chatService.hasMessages;

  constructor() {
    // Auto-scroll to bottom when new messages arrive
    effect(() => {
      const msgs = this.messages();
      if (msgs.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  private scrollToBottom(): void {
    const scrollView = this.scrollViewRef?.nativeElement;
    if (scrollView) {
      scrollView.scrollToVerticalOffset(scrollView.scrollableHeight, true);
    }
  }
}
