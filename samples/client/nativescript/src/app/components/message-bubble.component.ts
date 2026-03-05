import { Component, Input, signal, computed, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { UiMessage } from '../services/chat.service';

@Component({
  selector: 'a2ui-message-bubble',
  imports: [NativeScriptCommonModule],
  template: `
    <StackLayout 
      class="message-container"
      [class.user]="message().role === 'user'"
      [class.agent]="message().role === 'agent'">
      
      <!-- Avatar for agent messages -->
      <GridLayout 
        *ngIf="message().role === 'agent'"
        class="avatar"
        rows="auto" 
        columns="auto, *">
        <Label 
          col="0"
          class="avatar-icon" 
          text="✨"
          width="32" 
          height="32">
        </Label>
        <Label 
          col="1" 
          class="avatar-name" 
          text="A2UI Agent">
        </Label>
      </GridLayout>
      
      <!-- Message bubble -->
      <StackLayout 
        class="bubble"
        [class.user-bubble]="message().role === 'user'"
        [class.agent-bubble]="message().role === 'agent'"
        [class.sending]="message().status === 'sending'"
        [class.error]="message().status === 'error'">
        
        <!-- Loading indicator -->
        <ActivityIndicator 
          *ngIf="message().status === 'sending'" 
          busy="true"
          width="20" 
          height="20"
          class="loading">
        </ActivityIndicator>
        
        <!-- Message content -->
        <Label 
          *ngIf="message().status !== 'sending'"
          class="message-text"
          [text]="message().content"
          textWrap="true">
        </Label>
        
      </StackLayout>
      
      <!-- Timestamp -->
      <Label 
        class="timestamp"
        [class.user-timestamp]="message().role === 'user'"
        [text]="formattedTime()">
      </Label>
      
    </StackLayout>
  `,
  styles: [`
    .message-container {
      margin: 8 16;
    }
    
    .message-container.user {
      horizontal-align: right;
    }
    
    .message-container.agent {
      horizontal-align: left;
    }
    
    .avatar {
      margin-bottom: 4;
    }
    
    .avatar-icon {
      font-size: 16;
      background-color: #6366f1;
      border-radius: 16;
      color: white;
      text-align: center;
      vertical-align: center;
    }
    
    .avatar-name {
      font-size: 12;
      color: #9ca3af;
      margin-left: 8;
      vertical-align: center;
    }
    
    .bubble {
      padding: 12 16;
      border-radius: 20;
      max-width: 280;
    }
    
    .user-bubble {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      background-color: #6366f1;
      border-bottom-right-radius: 4;
    }
    
    .agent-bubble {
      background-color: #1e1e3f;
      border-bottom-left-radius: 4;
    }
    
    .bubble.sending {
      opacity: 0.7;
    }
    
    .bubble.error {
      background-color: #ef4444;
    }
    
    .message-text {
      font-size: 15;
      color: #ffffff;
      line-height: 6;
    }
    
    .loading {
      color: #6366f1;
    }
    
    .timestamp {
      font-size: 10;
      color: #6b7280;
      margin-top: 4;
    }
    
    .user-timestamp {
      text-align: right;
    }
  `],
  schemas: [NO_ERRORS_SCHEMA],
})
export class MessageBubbleComponent {
  @Input() set messageData(value: UiMessage) {
    this._message.set(value);
  }
  
  private readonly _message = signal<UiMessage>({
    id: '',
    role: 'user',
    content: '',
    timestamp: new Date(),
    status: 'sent',
  });
  
  readonly message = this._message.asReadonly();
  
  readonly formattedTime = computed(() => {
    const date = this._message().timestamp;
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  });
}
