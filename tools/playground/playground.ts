/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { classMap } from "lit/directives/class-map.js";
import { A2UIClient, ServerToClientMessage, MixedContentResponse } from "./client.js";
import { Skill, getAllSkills, getSkillById, getDefaultSkill } from "./skills.js";
import { Template, TemplateCategory, CATEGORIES, getAllTemplates, getTemplatesByCategory, getTemplateById } from "./templates.js";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  a2uiMessages?: ServerToClientMessage[];
}

type ViewMode = 'chat' | 'create';

@customElement("a2ui-playground")
export class A2UIPlayground extends LitElement {
  @state() private accessor messages: ChatMessage[] = [];
  @state() private accessor isLoading = false;
  @state() private accessor error: string | null = null;
  @state() private accessor currentInput = "";
  @state() private accessor activeTab: "preview" | "code" = "preview";
  @state() private accessor isMobileView = false;
  @state() private accessor lastA2UIMessages: ServerToClientMessage[] = [];

  // New state for features
  @state() private accessor attachments: string[] = []; // Base64 data URIs
  @state() private accessor isListening = false;
  @state() private accessor selectedSkillId: string = 'default';
  @state() private accessor showSkillDropdown = false;

  // View and Template state
  @state() private accessor currentView: ViewMode = 'chat';
  @state() private accessor selectedCategory: TemplateCategory = 'all';

  // Skills registry
  private skills: Skill[] = getAllSkills();

  private client: A2UIClient | null = null;
  private recognition: any = null; // SpeechRecognition

  static styles = css`
    :host {
      --bg-app: #f8f9fa;
      --bg-panel: #ffffff;
      --border-color: #e0e0e0;
      --primary: #1a73e8;
      --text-main: #202124;
      --text-sub: #5f6368;
      --font-family: 'Google Sans', 'Inter', system-ui, sans-serif;
      --radius-lg: 16px;
      --radius-md: 8px;
      
      display: block; 
    }

    /* Sidebar Styles */
    .app-container {
      display: flex;
      width: 100%;
      height: 100vh;
      background: var(--bg-app);
    }
    
    aside {
      width: 72px; /* Collapsed width */
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 0;
      background: var(--bg-panel);
      border-right: 1px solid var(--border-color);
      gap: 24px;
      z-index: 10;
    }
    
    .nav-item {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-sub);
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .nav-item:hover {
      background: #f1f3f4;
      color: var(--text-main);
    }
    
    .nav-item.active {
      background: #e8f0fe;
      color: var(--primary);
    }
    
    .nav-item.brand-icon {
      color: transparent;
      background: linear-gradient(45deg, #4285f4, #9b72cb, #d96570);
      -webkit-background-clip: text;
      background-clip: text;
      font-size: 28px;
    }

    .spacer { flex: 1; }

    .user-profile {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e0e0e0;
      overflow: hidden;
      cursor: pointer;
    }
    
    .user-profile img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Main Content Wrapper */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    /* Header adjustments */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 64px;
      background: transparent;
      border-bottom: 1px solid var(--border-color);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500;
      font-size: 20px;
      color: var(--text-main);
    }
    
    .logo-icon {
      color: var(--primary);
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    /* Skill Selector */
    .skill-selector {
      position: relative;
    }

    .skill-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      color: var(--text-main);
      transition: all 0.2s;
    }

    .skill-btn:hover {
      background: #f1f3f4;
      border-color: var(--primary);
    }

    .skill-btn .g-icon {
      font-size: 18px;
      color: var(--primary);
    }

    .skill-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      min-width: 240px;
      z-index: 100;
      overflow: hidden;
    }

    .skill-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .skill-option:hover {
      background: #f1f3f4;
    }

    .skill-option.active {
      background: #e8f0fe;
    }

    .skill-option .g-icon {
      font-size: 20px;
      color: var(--text-sub);
    }

    .skill-option.active .g-icon {
      color: var(--primary);
    }

    .skill-option-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .skill-option-name {
      font-weight: 500;
      font-size: 14px;
    }

    .skill-option-desc {
      font-size: 12px;
      color: var(--text-sub);
      line-height: 1.3;
    }

    /* ============ GALLERY VIEW ============ */
    .gallery-view {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 40px;
      overflow-y: auto;
    }

    .gallery-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .gallery-title {
      font-size: 32px;
      font-weight: 600;
      color: var(--text-main);
      margin: 0 0 24px 0;
    }

    .category-pills {
      display: flex;
      gap: 8px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .category-pill {
      padding: 8px 20px;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      background: var(--bg-panel);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--text-main);
    }

    .category-pill:hover {
      background: #f1f3f4;
      border-color: var(--primary);
    }

    .category-pill.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 24px;
      margin-top: 32px;
    }

    .template-card {
      border-radius: 12px;
      overflow: hidden;
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: all 0.2s;
    }

    .template-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      border-color: var(--primary);
    }

    .template-thumb {
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .template-thumb .g-icon {
      font-size: 48px;
      color: white;
      opacity: 0.9;
    }

    .template-info {
      padding: 16px;
    }

    .template-name {
      font-weight: 600;
      font-size: 16px;
      margin: 0 0 4px 0;
      color: var(--text-main);
    }

    .template-desc {
      font-size: 13px;
      color: var(--text-sub);
      margin: 0;
      line-height: 1.4;
    }

    /* Main Layout - 2 Panes */
    main {
      display: flex;
      flex: 1;
      padding: 16px;
      gap: 16px;
      overflow: hidden;
    }

    /* Left Pane: Prompt/Chat */
    .pane-left {
      width: 400px;
      display: flex;
      flex-direction: column;
      background: var(--bg-panel);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .chat-header {
      padding: 16px;
      font-weight: 500;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .sparkle-icon {
      color: var(--primary);
      font-variation-settings: 'FILL' 1;
    }


    .g-icon {
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-style: normal;
      font-size: 24px;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
      font-feature-settings: 'liga';
    }

    .g-icon.filled, .g-icon.filled-heavy {
      font-variation-settings: 'FILL' 1;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .message {
      line-height: 1.6;
      font-size: 15px;
    }
    
    .message.user {
      align-self: flex-end;
      background: #e8f0fe;
      color: var(--primary);
      padding: 12px 16px;
      border-radius: 12px 12px 2px 12px;
      max-width: 85%;
    }

    .message.assistant {
      color: var(--text-sub);
    }

    .inline-preview {
      margin-top: 8px;
      padding: 8px;
      background: #f8f9fa;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .inline-preview:hover {
      background: #e8f0fe;
      border-color: var(--primary);
    }
    
    .preview-thumb {
      max-height: 120px;
      overflow: hidden;
      transform: scale(0.5);
      transform-origin: top left;
      width: 200%;
      pointer-events: none;
    }
    
    .preview-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--primary);
      margin-top: 4px;
    }

    .input-area {
      padding: 20px;
      border-top: 1px solid var(--border-color);
    }

    .input-box {
      display: flex;
      flex-direction: column;
      background: #f1f3f4;
      border-radius: var(--radius-lg);
      padding: 8px 16px 8px 16px;
      transition: background 0.2s;
    }

    .input-box:focus-within {
      background: #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }

    textarea {
      width: 100%;
      border: none;
      background: transparent;
      resize: none;
      font-family: inherit;
      font-size: 15px;
      padding: 8px 0;
      outline: none;
      height: 60px;
    }

    .input-actions {
      display: flex;
      justify-content: space-between; /* Changed to spread out left/right actions */
      align-items: center;
      padding-top: 8px;
    }

    .action-group {
      display: flex;
      gap: 4px;
    }

    .send-btn {
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0.9;
      transition: opacity 0.2s;
    }
    
    .send-btn:hover { opacity: 1; }
    .send-btn:disabled { background: #dadce0; cursor: default; }

    /* New styles for attachments and mic */
    .icon-btn.listening {
      color: #ea4335;
      background: #fce8e6;
      animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(234, 67, 53, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(234, 67, 53, 0); }
      100% { box-shadow: 0 0 0 0 rgba(234, 67, 53, 0); }
    }

    .attachment-preview {
      display: flex;
      gap: 8px;
      padding-bottom: 8px;
      overflow-x: auto;
    }

    .attachment-thumb {
      position: relative;
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border-color);
    }

    .attachment-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .remove-attachment {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 16px;
      height: 16px;
      background: rgba(0,0,0,0.6);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      border: none;
    }

    /* Right Pane: Preview */
    .pane-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-panel);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .pane-toolbar {
      padding: 8px 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }

    .tabs {
      display: flex;
      gap: 4px;
      background: #f1f3f4;
      padding: 4px;
      border-radius: 8px;
    }

    .tab {
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      color: var(--text-sub);
      user-select: none;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tab:hover { background: rgba(0,0,0,0.04); }
    .tab.active { background: #ffffff; color: var(--text-main); box-shadow: 0 1px 2px rgba(0,0,0,0.1); }

    .device-toggles {
      display: flex;
      gap: 8px;
    }

    .icon-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-sub);
      width: 32px;
      height: 32px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .icon-btn:hover { background: #f1f3f4; }
    .icon-btn.active { color: var(--primary); background: #e8f0fe; }

    .content-area {
      flex: 1;
      background: #f8f9fa; /* Preview background */
      display: flex;
      justify-content: center;
      overflow: auto;
      padding: 24px;
    }

    .preview-canvas {
      width: 100%;
      height: 100%;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border-radius: 8px;
      overflow: auto;
      transition: width 0.3s ease;
    }

    .preview-canvas.mobile {
      width: 375px;
      border: 8px solid #202124;
      border-radius: 24px;
    }

    .code-viewer {
      width: 100%;
      height: 100%;
      padding: 0;
      overflow: auto;
      background: #1e1e1e; /* VS Code dark theme bg */
      color: #d4d4d4;
    }
    
    .json-block {
      margin: 0;
      padding: 4px 16px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-sub);
      gap: 16px;
    }

    /* A2UI Renderer Styles */
    .a2ui-component { box-sizing: border-box; }
    .a2ui-column { display: flex; flex-direction: column; gap: 16px; width: 100%; padding: 16px; }
    .a2ui-row { display: flex; gap: 16px; align-items: center; width: 100%; padding: 8px 0; flex-wrap: wrap; }
    .a2ui-card {
      background: white; border: 1px solid #e0e0e0; border-radius: 8px; 
      padding: 0; overflow: hidden; height: 100%; display: flex; flex-direction: column;
      flex: 1; /* Allow cards to grow in rows */
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .a2ui-heading { margin: 0; color: var(--text-main); }
    h1.a2ui-heading { font-size: 32px; font-weight: 700; letter-spacing: -0.5px; }
    h2.a2ui-heading { font-size: 24px; font-weight: 600; }
    h3.a2ui-heading { font-size: 18px; font-weight: 600; }
    .a2ui-text { margin: 0; line-height: 1.6; color: var(--text-sub); }
    .a2ui-button {
      background: var(--primary); color: white; border: none; padding: 10px 24px;
      border-radius: 20px; font-weight: 500; font-size: 14px; cursor: pointer;
      transition: background 0.2s; white-space: nowrap;
    }
    .a2ui-button:hover { box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
    .a2ui-image { width: 100%; height: auto; display: block; object-fit: cover; }
    
    /* Utility for Alignment */
    .align-center { align-items: center; text-align: center; }
    .align-start { align-items: flex-start; text-align: left; }
    .dist-space-between { justify-content: space-between; }
    .dist-space-evenly { justify-content: space-evenly; }
    .dist-center { justify-content: center; }

  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      this.client = new A2UIClient();
      this.error = null;
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to initialize client";
    }
  }

  private async handleSend(): Promise<void> {
    if ((!this.currentInput.trim() && this.attachments.length === 0) || !this.client || this.isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: this.currentInput.trim() || (this.attachments.length > 0 ? "[Attached Images]" : ""),
      timestamp: new Date(),
    };

    this.messages = [...this.messages, userMessage];

    // Build prompt with existing A2UI context if we have a template loaded
    let prompt = this.currentInput;
    if (this.lastA2UIMessages.length > 0) {
      const existingA2UI = this.lastA2UIMessages
        .map(msg => JSON.stringify(msg))
        .join('\n');
      prompt = `The user has the following A2UI template already loaded:\n\`\`\`jsonl\n${existingA2UI}\n\`\`\`\n\nUser request: ${this.currentInput}\n\nPlease modify the existing template based on the user's request. Output the COMPLETE updated A2UI with all components (including unchanged ones).`;
    }

    const images = [...this.attachments];

    this.currentInput = "";
    this.attachments = []; // Clear attachments after sending
    this.isLoading = true;
    this.error = null;

    try {
      // Send multimodal request and get mixed content response
      const response = await this.client.sendMixed(prompt, images);

      // Check if we got valid surface updates (components)
      const hasValidUpdate = response.a2uiMessages.some(msg =>
        msg.surfaceUpdate && msg.surfaceUpdate.components && msg.surfaceUpdate.components.length > 0
      );

      // Only update lastA2UIMessages if we got a valid update
      if (hasValidUpdate) {
        this.lastA2UIMessages = response.a2uiMessages;
      } else if (response.a2uiMessages.length > 0) {
        console.warn("Received incomplete A2UI (no surfaceUpdate), preserving previous state.", response.a2uiMessages);
      }

      this.messages = [...this.messages, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.text || (hasValidUpdate ? "Here's what I created:" : "I couldn't generate the UI update correctly, but here is my response."),
        timestamp: new Date(),
        a2uiMessages: hasValidUpdate ? response.a2uiMessages : this.lastA2UIMessages
      }];
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Failed to generate response";
    } finally {
      this.isLoading = false;
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.handleSend();
    }
  }

  // --- Skill Selection Logic ---
  private getSelectedSkill(): Skill {
    return getSkillById(this.selectedSkillId) || getDefaultSkill();
  }

  private selectSkill(skillId: string): void {
    this.selectedSkillId = skillId;
    this.showSkillDropdown = false;

    // Apply skill to client
    const skill = this.getSelectedSkill();
    if (this.client) {
      this.client.setSkill(skill.systemPromptAddendum);
      // Clear messages when skill changes
      this.messages = [];
      this.lastA2UIMessages = [];
    }
  }

  private toggleSkillDropdown(): void {
    this.showSkillDropdown = !this.showSkillDropdown;
  }

  // --- Template Selection Logic ---
  private switchToCreateView(): void {
    this.currentView = 'create';
    this.selectedCategory = 'all';
  }

  private switchToChatView(): void {
    this.currentView = 'chat';
  }

  private setCategory(category: TemplateCategory): void {
    this.selectedCategory = category;
  }

  private selectTemplate(template: Template): void {
    // Load template's A2UI messages
    this.lastA2UIMessages = [...template.a2uiMessages];

    // Add system message about template
    this.messages = [{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `I've loaded the "${template.name}" template. How would you like to customize it?`,
      timestamp: new Date(),
      a2uiMessages: template.a2uiMessages
    }];

    // Switch to chat view
    this.currentView = 'chat';
  }

  private renderGalleryView() {
    const templates = getTemplatesByCategory(this.selectedCategory);

    return html`
      <div class="gallery-view">
        <div class="gallery-header">
          <h1 class="gallery-title">What do you want to create?</h1>
          <div class="category-pills">
            ${CATEGORIES.map(cat => html`
              <button 
                class="category-pill ${classMap({ active: cat.id === this.selectedCategory })}"
                @click=${() => this.setCategory(cat.id)}
              >
                ${cat.name}
              </button>
            `)}
          </div>
        </div>
        
        <div class="template-grid">
          ${templates.map(template => html`
            <div class="template-card" @click=${() => this.selectTemplate(template)}>
              <div class="template-thumb" style="background: linear-gradient(135deg, ${template.gradientColors[0]}, ${template.gradientColors[1]})">
                <span class="g-icon">${template.icon}</span>
              </div>
              <div class="template-info">
                <h3 class="template-name">${template.name}</h3>
                <p class="template-desc">${template.description}</p>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  // --- Voice Input Logic ---
  private toggleVoiceInput(): void {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  private startListening(): void {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.onError = (event: any) => {
      console.error("Speech recognition error", event.error);
      this.isListening = false;
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        this.currentInput = (this.currentInput ? this.currentInput + ' ' : '') + finalTranscript;
      }
    };

    this.recognition.start();
  }

  private stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // --- Attachment Logic ---
  private triggerFileSelect(): void {
    const fileInput = this.shadowRoot?.getElementById('file-input') as HTMLInputElement;
    fileInput?.click();
  }

  private async handleFileSelect(e: Event): Promise<void> {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        if (file.type.startsWith('image/')) {
          const base64 = await this.readFileAsBase64(file);
          this.attachments = [...this.attachments, base64];
        } else {
          alert('Only image files are supported');
        }
      }
      input.value = ''; // Reset input
    }
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private removeAttachment(index: number): void {
    this.attachments = this.attachments.filter((_, i) => i !== index);
  }

  // --- Rendering Logic ---

  // Enhanced A2UI Renderer with Layout Props
  private renderA2UIComponent(component: any, components: Map<string, any>): any {
    if (!component || !component.component) return nothing;

    const comp = component.component;
    const type = Object.keys(comp)[0];
    const props = comp[type];

    switch (type) {
      case "Column":
        // Handle alignment props if suggested by system prompt
        const alignClass = props.alignment === "center" ? "align-center" : "align-start";

        // Handle general style props if present
        const colStyle: string[] = [];
        if (props.style) {
          if (props.style.background) colStyle.push(`background: ${props.style.background}`);
          if (props.style.padding) colStyle.push(`padding: ${props.style.padding}`);
          if (props.style.textAlign) colStyle.push(`text-align: ${props.style.textAlign}`);
          if (props.style.color) colStyle.push(`color: ${props.style.color}`);
        }

        return html`
          <div class="a2ui-column a2ui-component ${alignClass}" style="${colStyle.join(';')}">
            ${this.renderChildren(props.children, components)}
          </div>
        `;
      case "Row":
        // Handle distribution props
        const distClass = props.distribution === "spaceBetween" ? "dist-space-between" :
          props.distribution === "spaceEvenly" ? "dist-space-evenly" :
            props.distribution === "center" ? "dist-center" : "";
        return html`
          <div class="a2ui-row a2ui-component ${distClass}">
            ${this.renderChildren(props.children, components)}
          </div>
        `;
      case "List":
        // Handle list like Column
        return html`
          <div class="a2ui-column a2ui-component">
            ${this.renderChildren(props.children, components)}
          </div>
        `;
      case "Card":
        const cardChild = components.get(props.child);
        return html`
          <div class="a2ui-card a2ui-component">
            ${cardChild ? this.renderA2UIComponent(cardChild, components) : nothing}
          </div>
        `;
      case "Text":
      case "Paragraph": // Alias for Text
        const text = props.text?.literalString || props.text?.path || props.content || "";
        return html`<p class="a2ui-text a2ui-component">${text}</p>`;
      case "Heading":
        const heading = props.text?.literalString || props.text?.path || "";
        // Support usageHint for h1/h2/h3
        const level = props.usageHint || "h2";
        if (level === "h1") return html`<h1 class="a2ui-heading a2ui-component">${heading}</h1>`;
        if (level === "h3") return html`<h3 class="a2ui-heading a2ui-component">${heading}</h3>`;
        if (level === "h4") return html`<h4 class="a2ui-heading a2ui-component" style="font-size: 16px;">${heading}</h4>`;
        return html`<h2 class="a2ui-heading a2ui-component">${heading}</h2>`;
      case "Button":
        const btnLabel = props.label?.literalString || props.text?.literalString || "Button";
        return html`<button class="a2ui-button a2ui-component">${btnLabel}</button>`;
      case "Image":
        let url = props.url?.literalString || props.src || "";
        // Fallback for common AI hallucinations or invalid URLs
        if (!url || url.includes('example_image') || url.includes('githubusercontent')) {
          url = "https://placehold.co/600x400?text=Image";
        }
        return html`<img class="a2ui-image a2ui-component" src="${url}" alt="Image" onError="this.src='https://placehold.co/600x400?text=Error'"/>`;
      case "TextField":
        const tfLabel = props.label?.literalString || props.label || "";
        const tfPlaceholder = props.placeholder?.literalString || props.placeholder || "";
        return html`
          <div class="a2ui-textfield a2ui-component" style="display: flex; flex-direction: column; gap: 4px;">
            ${tfLabel ? html`<label style="font-weight: 500; font-size: 14px;">${tfLabel}</label>` : nothing}
            <input type="text" placeholder="${tfPlaceholder}" style="padding: 10px 12px; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 14px;">
          </div>
        `;
      case "CheckBox":
        const cbLabel = props.label?.literalString || "";
        const cbChecked = props.value || false;
        return html`
          <label class="a2ui-checkbox a2ui-component" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" ?checked=${cbChecked}>
            <span>${cbLabel}</span>
          </label>
        `;
      case "Divider":
        return html`<hr class="a2ui-divider a2ui-component" style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;">`;
      default:
        return html`<div class="a2ui-component" style="color:red">[Unknown: ${type}]</div>`;
    }
  }

  private renderChildren(children: any, components: Map<string, any>): any {
    if (!children) return nothing;
    const childIds = children.explicitList || [];
    return childIds.map((id: string) => {
      const child = components.get(id);
      return child ? this.renderA2UIComponent(child, components) : nothing;
    });
  }

  // Render inline A2UI preview from message's a2uiMessages
  private renderInlineA2UI(a2uiMessages: ServerToClientMessage[]): any {
    const components = new Map<string, any>();
    let rootId: string | null = null;

    for (const msg of a2uiMessages) {
      if (msg.surfaceUpdate?.components) {
        for (const comp of msg.surfaceUpdate.components) {
          components.set(comp.id, comp);
        }
      }
      if (msg.beginRendering?.root) {
        rootId = msg.beginRendering.root;
      }
    }

    if (!rootId || components.size === 0) {
      return html`<span style="color: var(--text-sub);">Preview available</span>`;
    }

    return this.renderA2UIComponent(components.get(rootId), components);
  }

  render() {
    return html`
      <div class="app-container">
        <!-- SIDEBAR -->
        <aside>
           <div class="nav-item brand-icon" title="A2UI">
              <span class="g-icon filled">auto_awesome</span>
           </div>
           
           <div class="nav-item" title="Search">
              <span class="g-icon">search</span>
           </div>
           
           <div class="nav-item ${classMap({ active: this.currentView === 'chat' })}" 
                title="Chat" 
                @click=${this.switchToChatView}>
              <span class="g-icon ${this.currentView === 'chat' ? 'filled' : ''}">chat_bubble</span>
           </div>
           
           <div class="nav-item" title="Notebooks">
              <span class="g-icon">book</span>
           </div>
           
           <div class="nav-item ${classMap({ active: this.currentView === 'create' })}" 
                title="Create" 
                @click=${this.switchToCreateView}>
              <span class="g-icon ${this.currentView === 'create' ? 'filled' : ''}">edit_square</span>
           </div>
           
           <div class="nav-item" title="Apps">
              <span class="g-icon">grid_view</span>
           </div>

           <div class="spacer"></div>
           
           <div class="nav-item" title="Help">
              <span class="g-icon">help</span>
           </div>
           
           <div class="user-profile" title="Profile">
              <img src="https://lh3.googleusercontent.com/a/default-user=s96-c" alt="Profile" />
           </div>
        </aside>

        <!-- MAIN CONTENT -->
        <div class="main-content">
            <header>
              <div class="logo">
                A2UI Studio
              </div>
              <div class="header-actions">
                 <!-- Skill Selector -->
                 <div class="skill-selector">
                    <button class="skill-btn" @click=${this.toggleSkillDropdown}>
                       <span class="g-icon">${this.getSelectedSkill().icon}</span>
                       <span>${this.getSelectedSkill().name}</span>
                       <span class="g-icon" style="font-size: 16px;">expand_more</span>
                    </button>
                    ${this.showSkillDropdown ? html`
                       <div class="skill-dropdown">
                          ${this.skills.map(skill => html`
                             <div class="skill-option ${classMap({ active: skill.id === this.selectedSkillId })}"
                                  @click=${() => this.selectSkill(skill.id)}>
                                <span class="g-icon">${skill.icon}</span>
                                <div class="skill-option-info">
                                   <span class="skill-option-name">${skill.name}</span>
                                   <span class="skill-option-desc">${skill.description}</span>
                                </div>
                             </div>
                          `)}
                       </div>
                    ` : nothing}
                 </div>
              </div>
            </header>

            ${this.currentView === 'create' ? this.renderGalleryView() : html`
            <main>
              <!-- LEFT PANE: Chat -->
              <div class="pane-left">
                <div class="chat-header">
                  <span>Code Assistant</span>
                  <span class="g-icon sparkle-icon">sparkle</span>
                </div>
                <div class="chat-messages">
                   ${this.messages.length === 0 ? html`
                      <div style="text-align: center; color: var(--text-sub); margin-top: 40px;">
                          <span class="g-icon" style="font-size: 48px; opacity: 0.5;">web</span>
                          <p>Describe a website to build.</p>
                      </div>
                   ` : repeat(this.messages, m => m.id, m => html`
                      <div class="message ${m.role}">
                        <p style="margin: 0 0 8px 0;">${m.content}</p>
                        ${m.role === 'assistant' && m.a2uiMessages && m.a2uiMessages.length > 0
        ? html`
                            <div class="inline-preview" @click=${() => this.activeTab = 'preview'}>
                               <div class="preview-thumb">
                                  ${this.renderInlineA2UI(m.a2uiMessages)}
                               </div>
                               <span class="preview-label"><span class="g-icon" style="font-size: 16px;">visibility</span> View in Preview</span>
                            </div>
                          ` : nothing}
                      </div>
                   `)}
                   ${this.isLoading ? html`<div class="message assistant">Generating...</div>` : nothing}
                </div>
                
                <div class="input-area">
                  <div class="input-box">
                    ${this.attachments.length > 0 ? html`
                       <div class="attachment-preview">
                         ${this.attachments.map((src, idx) => html`
                            <div class="attachment-thumb">
                               <img src="${src}" />
                               <button class="remove-attachment" @click=${() => this.removeAttachment(idx)}>×</button>
                            </div>
                         `)}
                       </div>
                    ` : nothing}
                    <textarea 
                      placeholder="Ask to create a landing page, dashboard, or form..."
                      .value=${this.currentInput}
                      @input=${(e: any) => this.currentInput = e.target.value}
                      @keydown=${this.handleKeyDown}
                      ?disabled=${this.isLoading}
                    ></textarea>
                    <div class="input-actions">
                      <input type="file" id="file-input" hidden accept="image/*" multiple @change=${this.handleFileSelect} />
                      <div class="action-group">
                         <button class="icon-btn" title="Add image" @click=${this.triggerFileSelect}>
                            <span class="g-icon">add_circle</span>
                         </button>
                         <button class="icon-btn ${classMap({ listening: this.isListening })}" title="Use microphone" @click=${this.toggleVoiceInput}>
                            <span class="g-icon">mic</span>
                         </button>
                      </div>
                      <button class="send-btn" ?disabled=${(!this.currentInput.trim() && this.attachments.length === 0) || this.isLoading} @click=${this.handleSend}>
                        <span class="g-icon filled">arrow_upward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- RIGHT PANE: Preview/Code -->
              <div class="pane-right">
                <div class="pane-toolbar">
                  <div class="tabs">
                    <div class="tab ${classMap({ active: this.activeTab === 'preview' })}" @click=${() => this.activeTab = 'preview'}>
                      <span class="g-icon filled">visibility</span> Preview
                    </div>
                    <div class="tab ${classMap({ active: this.activeTab === 'code' })}" @click=${() => this.activeTab = 'code'}>
                      <span class="g-icon">code</span> Code
                    </div>
                  </div>
                  
                  <div class="device-toggles" ?hidden=${this.activeTab !== 'preview'}>
                     <button class="icon-btn ${classMap({ active: !this.isMobileView })}" @click=${() => this.isMobileView = false} title="Desktop">
                       <span class="g-icon">desktop_windows</span>
                     </button>
                     <button class="icon-btn ${classMap({ active: this.isMobileView })}" @click=${() => this.isMobileView = true} title="Mobile">
                       <span class="g-icon">smartphone</span>
                     </button>
                  </div>
                </div>

                <div class="content-area">
                  ${this.activeTab === 'preview' ? this.renderPreviewContent() : this.renderCodeContent()}
                </div>
              </div>
            </main>
            `}
        </div>
      </div>
    `;
  }

  private renderPreviewContent() {
    const components = new Map<string, any>();
    let rootId: string | null = null;
    for (const msg of this.lastA2UIMessages) {
      if (msg.surfaceUpdate?.components) {
        for (const comp of msg.surfaceUpdate.components) components.set(comp.id, comp);
      }
      if (msg.beginRendering?.root) rootId = msg.beginRendering.root;
    }

    if (!rootId || components.size === 0) {
      return html`<div class="empty-state"><p>No preview available</p></div>`;
    }

    return html`
      <div class="preview-canvas ${this.isMobileView ? 'mobile' : ''}">
         ${this.renderA2UIComponent(components.get(rootId), components)}
      </div>
    `;
  }

  private renderCodeContent() {
    if (this.lastA2UIMessages.length === 0) {
      return html`<div class="empty-state" style="color: #666"><p>No code generated</p></div>`;
    }
    return html`
      <div class="code-viewer">
        ${this.lastA2UIMessages.map(msg => html`<div class="json-block">${JSON.stringify(msg, null, 2)}</div>`)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "a2ui-playground": A2UIPlayground;
  }
}
