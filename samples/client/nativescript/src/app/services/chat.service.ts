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
  private serverAvailable = false; // Track if server was reachable
  
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
  
  // Demo mode status - can be toggled even when server is available
  private readonly _demoModeActive = signal(true); // Start in demo mode by default
  readonly demoModeActive = this._demoModeActive.asReadonly();

  /**
   * Toggle between demo mode and live mode.
   * Returns the new demo mode state.
   */
  toggleDemoMode(): boolean {
    // Only allow toggling if server was reachable at some point
    if (!this.serverAvailable) {
      console.log('Cannot toggle to live mode - server not available');
      return true; // Stay in demo mode
    }
    
    this.demoMode = !this.demoMode;
    this._demoModeActive.set(this.demoMode);
    console.log(`Demo mode: ${this.demoMode ? 'ON' : 'OFF'}`);
    return this.demoMode;
  }

  /**
   * Force demo mode on/off
   */
  setDemoMode(enabled: boolean): void {
    this.demoMode = enabled;
    this._demoModeActive.set(enabled);
    console.log(`Demo mode set to: ${enabled ? 'ON' : 'OFF'}`);
  }

  /**
   * Check if server is available for live mode
   */
  isServerAvailable(): boolean {
    return this.serverAvailable;
  }

  readonly hasMessages = computed(() => this._messages().length > 0);
  readonly lastMessage = computed(() => {
    const msgs = this._messages();
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  });

  async connect(): Promise<boolean> {
    const connected = await this.a2aService.connect();
    this.serverAvailable = connected;
    
    // Stay in demo mode by default, but user can toggle if server is available
    if (connected) {
      console.log('Server connected! You can toggle to live mode via the menu.');
    }
    
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

    // Debug: log the response structure
    console.log('Processing A2A response:', JSON.stringify(response).substring(0, 500));

    try {
      // Handle A2A JSON-RPC response format
      const result = response?.result;
      
      if (!result) {
        console.log('No result in response');
        content = 'No response from agent.';
      } else {
        console.log('Response result kind:', result?.kind);
        
        // Extract parts from the response
        let parts: any[] = [];
        
        if (result?.kind === 'task') {
          // Task response format - get message parts and artifact parts
          console.log('Task state:', result?.status?.state);
          parts = [
            ...(result.status?.message?.parts ?? []),
            ...(result.artifacts ?? []).flatMap((artifact: any) => artifact.parts ?? []),
          ];
        } else if (result?.kind === 'message') {
          // Message response format
          parts = result.parts ?? [];
        } else if (result?.status?.message?.parts) {
          // Alternative format
          parts = result.status.message.parts;
        }
        
        console.log('Extracted', parts.length, 'parts');
        
        // Process parts
        for (const part of parts) {
          console.log('Part:', part.kind, part.text?.substring(0, 50));
          
          // Handle text parts
          if (part.kind === 'text' && part.text) {
            content += part.text;
          }
        
          // Handle data parts with A2UI content
          if (part.kind === 'data' && part.data && typeof part.data === 'object') {
            const data = part.data;
          
            // Check for A2UI message types
            if ('beginRendering' in data || 'surfaceUpdate' in data) {
              const surfaceData = data.beginRendering || data.surfaceUpdate;
              if (surfaceData) {
                console.log('Found A2UI surface:', surfaceData.surfaceId);
                const surface: Types.A2uiMessage = {
                  surfaceId: surfaceData.surfaceId,
                  root: surfaceData.root,
                  dataModels: surfaceData.dataModels,
                };
                surfaces.push(surface);
                this._currentSurface.set(surface);
              }
            }
          }
        
          // Legacy: check metadata for a2ui/surface
          if (part.metadata?.['a2ui/surface']) {
            const surface = part.metadata['a2ui/surface'] as Types.A2uiMessage;
            surfaces.push(surface);
            this._currentSurface.set(surface);
          }
        }
      }

      // Log for debugging
      console.log('Processed response - content:', content, 'surfaces:', surfaces.length);
      
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
