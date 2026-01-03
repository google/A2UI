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
  
  // Demo mode status - synchronized with demoMode variable
  private readonly _demoModeActive = signal(true); // Must match demoMode initial value
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

    try {
      // Handle A2A JSON-RPC response format
      const result = response?.result;
      
      if (!result) {
        content = 'No response from agent.';
      } else {
        // Extract parts from the response
        let parts: any[] = [];
        
        if (result?.kind === 'task') {
          // Task response format - get message parts and artifact parts
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
        
        // Accumulate A2UI messages by surfaceId
        // The server sends separate beginRendering, surfaceUpdate, and dataModelUpdate parts
        // We need to combine them into a single surface with all messages
        const a2uiMessagesBySurface: Map<string, Types.A2uiMessage[]> = new Map();
        
        // Process parts
        for (const part of parts) {
          // Handle text parts
          if (part.kind === 'text' && part.text) {
            content += part.text;
          }
        
          // Handle data parts with A2UI content
          if (part.kind === 'data' && part.data && typeof part.data === 'object') {
            const data = part.data as Types.A2uiMessage;
          
            // Check for A2UI message types - these are the raw A2UI protocol messages
            if ('beginRendering' in data || 'surfaceUpdate' in data || 'dataModelUpdate' in data) {
              // Extract surfaceId from the message
              const surfaceId = 
                (data as any).beginRendering?.surfaceId ||
                (data as any).surfaceUpdate?.surfaceId ||
                (data as any).dataModelUpdate?.surfaceId ||
                'default';
              
              // Accumulate messages for this surface
              if (!a2uiMessagesBySurface.has(surfaceId)) {
                a2uiMessagesBySurface.set(surfaceId, []);
              }
              a2uiMessagesBySurface.get(surfaceId)!.push(data);
            }
          }
        
          // Legacy: check metadata for a2ui/surface
          if (part.metadata?.['a2ui/surface']) {
            const surface = part.metadata['a2ui/surface'] as Types.A2uiMessage;
            surfaces.push(surface);
          }
        }
        
        // Convert accumulated messages to surfaces
        // Only create a surface if we have a surfaceUpdate with components
        for (const [surfaceId, messages] of a2uiMessagesBySurface) {
          // Check if any message has actual components (surfaceUpdate)
          const hasSurfaceUpdate = messages.some(msg => 
            'surfaceUpdate' in msg && (msg as any).surfaceUpdate?.components?.length > 0
          );
          
          if (hasSurfaceUpdate) {
            // Create a surface that contains all the A2UI messages
            // Convert the A2UI protocol messages into a component tree
            const surface = this.buildSurfaceFromMessages(surfaceId, messages);
            if (surface) {
              surfaces.push(surface);
              this._currentSurface.set(surface);
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

  /**
   * Converts A2UI protocol messages (beginRendering, surfaceUpdate, dataModelUpdate)
   * into a component tree structure that the renderer can display.
   */
  private buildSurfaceFromMessages(surfaceId: string, messages: any[]): Types.A2uiMessage | null {
    let rootId: string | null = null;
    const componentsById: Map<string, any> = new Map();
    const dataModel: Map<string, any> = new Map();

    // Process each message
    for (const msg of messages) {
      if (msg.beginRendering) {
        rootId = msg.beginRendering.root;
      }
      
      if (msg.surfaceUpdate?.components) {
        for (const comp of msg.surfaceUpdate.components) {
          if (comp.id && comp.component) {
            // Also copy weight from the component definition level
            if (comp.weight !== undefined) {
              comp.component._weight = comp.weight;
            }
            componentsById.set(comp.id, comp.component);
          }
        }
      }
      
      if (msg.dataModelUpdate?.contents) {
        // Parse dataModelUpdate contents into our data model
        // Contents is an array like: [{ key: "title", valueString: "..." }, { key: "items", valueMap: [...] }]
        for (const item of msg.dataModelUpdate.contents) {
          const key = item.key;
          let value: any = null;
          
          if (item.valueString !== undefined) {
            value = item.valueString;
          } else if (item.valueNumber !== undefined) {
            value = item.valueNumber;
          } else if (item.valueBool !== undefined) {
            value = item.valueBool;
          } else if (item.valueMap !== undefined) {
            // valueMap is an array of items (could be empty or contain objects)
            value = this.parseValueMap(item.valueMap);
          } else if (item.valueList !== undefined) {
            value = item.valueList;
          }
          
          if (key) {
            dataModel.set(key, value);
          }
        }
      }
    }

    // If no components, don't create a surface
    if (componentsById.size === 0 || !rootId) {
      return null;
    }

    // Check if this surface has meaningful data to display
    // If items array exists and is empty, the agent is saying "no results"
    // In this case, don't show the UI surface - just show the text message
    const items = dataModel.get('items');
    if (items !== undefined && Array.isArray(items) && items.length === 0) {
      // No items to display - skip the surface
      return null;
    }

    // Check if the surface has any interactive or meaningful components
    // Skip surfaces that only contain Text components (just duplicates the chat message)
    if (!this.hasInteractiveComponents(componentsById)) {
      return null;
    }

    // Build the component tree starting from root, resolving data bindings
    const root = this.buildComponentTree(rootId, componentsById, dataModel);
    if (!root) {
      return null;
    }

    return {
      surfaceId,
      root,
      dataModels: dataModel.size > 0 ? dataModel : undefined,
    };
  }

  /**
   * Check if the surface has interactive or meaningful components worth displaying.
   * Skip surfaces that only have layout containers and Text (just duplicates chat message).
   */
  private hasInteractiveComponents(componentsById: Map<string, any>): boolean {
    // Components that are worth showing a surface for
    const interactiveTypes = new Set([
      'TextField', 'Button', 'Checkbox', 'Switch', 'Slider', 'Dropdown',
      'List', 'Card', 'Image', 'AudioPlayer', 'VideoPlayer', 'WebView',
      'Tabs', 'TabItem', 'Menu', 'DatePicker', 'TimePicker', 'Progress',
      'Rating', 'Chip', 'ChipGroup', 'Avatar', 'Badge', 'Carousel',
      'Accordion', 'Dialog', 'Snackbar', 'BottomSheet', 'Fab',
    ]);
    
    for (const compDef of componentsById.values()) {
      const componentType = Object.keys(compDef).filter(k => k !== '_weight')[0];
      if (componentType && interactiveTypes.has(componentType)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Parse a valueMap array into a JavaScript array/object structure
   */
  private parseValueMap(valueMap: any[]): any[] {
    if (!Array.isArray(valueMap)) {
      return [];
    }
    
    return valueMap.map(item => {
      if (typeof item !== 'object') {
        return item;
      }
      
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(item)) {
        if (typeof val === 'object' && val !== null) {
          const valObj = val as any;
          if (valObj.valueString !== undefined) {
            result[key] = valObj.valueString;
          } else if (valObj.valueNumber !== undefined) {
            result[key] = valObj.valueNumber;
          } else if (valObj.valueBool !== undefined) {
            result[key] = valObj.valueBool;
          } else {
            result[key] = val;
          }
        } else {
          result[key] = val;
        }
      }
      return result;
    });
  }

  /**
   * Recursively builds a component tree from the flat component map.
   */
  private buildComponentTree(
    componentId: string, 
    componentsById: Map<string, any>,
    dataModel: Map<string, any>
  ): Types.AnyComponentNode | null {
    const compDef = componentsById.get(componentId);
    if (!compDef) {
      return null;
    }

    // The component definition has the structure: { "Column": { children: {...} } }
    // Get the component type (e.g., "Column", "Text", "TextField")
    const componentType = Object.keys(compDef).filter(k => k !== '_weight')[0];
    if (!componentType) {
      return null;
    }

    const componentProps = compDef[componentType];
    
    // Build the node
    const node: any = {
      type: componentType,
      id: componentId,
    };

    // Copy weight if present
    if (compDef._weight !== undefined) {
      node.weight = compDef._weight;
    }

    // Copy over properties
    for (const [key, value] of Object.entries(componentProps || {})) {
      if (key === 'children') {
        // Handle children - can be explicitList or template
        const childrenDef = value as any;
        if (childrenDef?.explicitList) {
          node.children = childrenDef.explicitList
            .map((childId: string) => this.buildComponentTree(childId, componentsById, dataModel))
            .filter((c: any) => c !== null);
        } else if (childrenDef?.template) {
          // Template-based children (for lists) - store the template info
          node.template = {
            componentId: childrenDef.template.componentId,
            dataBinding: childrenDef.template.dataBinding,
          };
          // Build the template component
          const templateNode = this.buildComponentTree(childrenDef.template.componentId, componentsById, dataModel);
          if (templateNode) {
            node.templateComponent = templateNode;
          }
        }
      } else if (key === 'child') {
        // Single child reference
        const childId = value as string;
        const childNode = this.buildComponentTree(childId, componentsById, dataModel);
        if (childNode) {
          node.children = [childNode];
        }
      } else if (key === 'text' || key === 'label' || key === 'url') {
        // Handle text/label/url - can be literalString or path binding
        const textValue = value as any;
        if (textValue?.literalString !== undefined) {
          node[key] = textValue.literalString;
        } else if (textValue?.path !== undefined) {
          // Data-bound value - resolve from data model if possible
          const resolvedValue = dataModel.get(textValue.path);
          if (resolvedValue !== undefined && resolvedValue !== null) {
            node[key] = String(resolvedValue);
          } else {
            // Keep as binding placeholder for runtime resolution
            node[key] = `{{${textValue.path}}}`;
            node[`${key}Binding`] = textValue.path;
          }
        } else if (typeof textValue === 'string') {
          node[key] = textValue;
        }
      } else if (key === 'action') {
        // Handle action
        node.action = value;
      } else if (key === 'usageHint') {
        // Map usageHint to textStyle
        const hint = value as string;
        if (hint === 'h1') {
          node.textStyle = 'headline';
        } else if (hint === 'h2' || hint === 'h3') {
          node.textStyle = 'title';
        } else {
          node.textStyle = 'body';
        }
      } else {
        // Copy other properties directly
        node[key] = value;
      }
    }

    return node as Types.AnyComponentNode;
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
