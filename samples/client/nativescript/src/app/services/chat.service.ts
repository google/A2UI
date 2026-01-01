import { Injectable, signal, computed, inject } from '@angular/core';
import { A2aService, ChatMessage, MessagePart, AgentCard } from './a2a.service';
import { Types } from '../../a2ui-lit-types';
import { getDemoResponse } from '../demo-surfaces';

export type MessageStatus = 'idle' | 'sending' | 'streaming' | 'error';

export interface UiMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  surfaces?: Types.A2uiMessage[];
  status: 'sending' | 'sent' | 'error';
  actions?: Types.Action[];
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly a2aService = inject(A2aService);
  private demoMode = true; // Start in demo mode
  
  private readonly _messages = signal<UiMessage[]>([]);
  private readonly _status = signal<MessageStatus>('idle');
  private readonly _currentSurface = signal<Types.A2uiMessage | null>(null);

  readonly messages = this._messages.asReadonly();
  readonly status = this._status.asReadonly();
  readonly currentSurface = this._currentSurface.asReadonly();
  readonly loading = this.a2aService.loading;
  readonly agentCard = this.a2aService.agentCard;
  readonly agentName = this.a2aService.agentName;
  readonly connected = this.a2aService.connected;

  readonly hasMessages = computed(() => this._messages().length > 0);
  readonly lastMessage = computed(() => {
    const msgs = this._messages();
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  });

  async connect(): Promise<boolean> {
    const connected = await this.a2aService.connect();
    this.demoMode = !connected;
    return connected;
  }

  async sendMessage(text: string): Promise<void> {
    if (!text.trim()) return;

    const userMessage: UiMessage = {
      id: this.generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      status: 'sent',
    };

    this._messages.update(msgs => [...msgs, userMessage]);
    this._status.set('sending');

    // Create placeholder agent message
    const agentMessageId = this.generateId();
    const agentMessage: UiMessage = {
      id: agentMessageId,
      role: 'agent',
      content: '',
      timestamp: new Date(),
      status: 'sending',
    };
    
    this._messages.update(msgs => [...msgs, agentMessage]);

    // Use demo mode if no server connection
    if (this.demoMode) {
      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 800));
      this.processDemoResponse(agentMessageId, text);
      this._status.set('idle');
      return;
    }

    try {
      const response = await this.a2aService.sendMessage([{ type: 'text', text }]);
      
      this.processResponse(agentMessageId, response);
      this._status.set('idle');
    } catch (error) {
      // Fallback to demo mode on error
      this.processDemoResponse(agentMessageId, text);
      this._status.set('idle');
    }
  }

  private processDemoResponse(messageId: string, query: string): void {
    const demoResponse = getDemoResponse(query);
    const surfaces: Types.A2uiMessage[] = [];
    
    if (demoResponse.surface) {
      surfaces.push(demoResponse.surface);
      this._currentSurface.set(demoResponse.surface);
    }

    this._messages.update(msgs =>
      msgs.map(m =>
        m.id === messageId
          ? { 
              ...m, 
              content: demoResponse.text, 
              status: 'sent' as const,
              surfaces,
            }
          : m
      )
    );
  }

  private processResponse(messageId: string, response: any): void {
    let content = '';
    let surfaces: Types.A2uiMessage[] = [];
    let actions: Types.Action[] = [];

    try {
      // Handle A2A response format
      const result = response?.result;
      
      if (result?.status?.message?.parts) {
        for (const part of result.status.message.parts) {
          if (part.type === 'text' && part.text) {
            content += part.text;
          }
          
          // Check for A2UI content
          if (part.metadata?.['a2ui/surface']) {
            const surface = part.metadata['a2ui/surface'] as Types.A2uiMessage;
            surfaces.push(surface);
            this._currentSurface.set(surface);
          }
        }
      }

      // Also check for artifacts
      if (result?.artifacts) {
        for (const artifact of result.artifacts) {
          if (artifact.parts) {
            for (const part of artifact.parts) {
              if (part.metadata?.['a2ui/surface']) {
                const surface = part.metadata['a2ui/surface'] as Types.A2uiMessage;
                surfaces.push(surface);
                this._currentSurface.set(surface);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error processing response:', e);
      content = 'Received a response but could not parse it.';
    }

    this._messages.update(msgs =>
      msgs.map(m =>
        m.id === messageId
          ? { 
              ...m, 
              content: content || 'Response received.', 
              status: 'sent' as const,
              surfaces,
              actions,
            }
          : m
      )
    );
  }

  handleAction(action: Types.Action): void {
    console.log('Action triggered:', action);
    // Send action back to agent if needed
    const actionId = action.id || action.name;
    if (actionId) {
      this.sendMessage(`[Action: ${actionId}]`);
    }
  }

  clearMessages(): void {
    this._messages.set([]);
    this._currentSurface.set(null);
    this._status.set('idle');
  }

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
