import { Component, NO_ERRORS_SCHEMA, OnInit, inject } from "@angular/core";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { isIOS, Screen, Dialogs } from "@nativescript/core";
import { Types } from "../a2ui-lit-types";
import { ChatService } from "./services/chat.service";
import { ChatInputComponent } from "./components/chat-input.component";
import { ChatHistoryComponent } from "./components/chat-history.component";
import { CanvasComponent } from "./components/canvas.component";

@Component({
  selector: "ns-app",
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    ChatInputComponent,
    ChatHistoryComponent,
    CanvasComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <GridLayout
      class="app-container"
      rows="auto, *, auto, auto"
      [class.ios]="isIOS"
    >
      <!-- Header -->
      <GridLayout
        row="0"
        class="app-header"
        rows="auto"
        columns="auto, *, auto"
      >
        <StackLayout col="0" class="header-avatar">
          <Label class="avatar-text" text="✨"></Label>
        </StackLayout>

        <StackLayout col="1" class="header-content">
          <Label class="header-title" [text]="chatService.agentName()"></Label>
          <Label
            class="header-status"
            [class.connected]="chatService.connected()"
            [class.demo-mode]="chatService.demoModeActive()"
            [text]="getStatusText()"
          >
          </Label>
        </StackLayout>

        <StackLayout col="2" class="header-actions">
          <Label class="header-action-btn" text="⋯" (tap)="onMenuTap()">
          </Label>
        </StackLayout>
      </GridLayout>

      <!-- Chat History -->
      <GridLayout row="1">
        <a2ui-chat-history></a2ui-chat-history>
      </GridLayout>

      <!-- Canvas (when surface is available) -->
      @if (chatService.currentSurface()) {
      <a2ui-canvas row="1" class="floating-canvas"> </a2ui-canvas>
      }

      <!-- Loading indicator -->
      <StackLayout
        row="2"
        class="loading-container"
        *ngIf="chatService.loading()"
      >
        <ActivityIndicator
          busy="true"
          width="24"
          height="24"
        ></ActivityIndicator>
        <Label class="loading-text" text="Agent is thinking..."></Label>
      </StackLayout>

      <!-- Chat Input -->
      <a2ui-chat-input row="3" (send)="onSendMessage($event)">
      </a2ui-chat-input>
    </GridLayout>
  `,
  styles: [
    `
      .app-container {
        background: linear-gradient(
          180deg,
          #0a0a1f 0%,
          #12122e 50%,
          #1a1a3e 100%
        );
        background-color: #0f0f23;
      }

      .app-container.ios {
        padding-top: 5;
      }

      .app-header {
        padding: 16;
        border-bottom-width: 1;
        border-bottom-color: #2a2a4a;
      }

      .header-avatar {
        width: 44;
        height: 44;
        background-color: #6366f1;
        border-radius: 22;
        vertical-align: center;
      }

      .avatar-text {
        font-size: 20;
        text-align: center;
        vertical-align: center;
        height: 44;
      }

      .header-content {
        margin-left: 12;
        vertical-align: center;
      }

      .header-title {
        font-size: 18;
        font-weight: 600;
        color: #ffffff;
      }

      .header-status {
        font-size: 12;
        color: #9ca3af;
        margin-top: 2;
      }

      .header-status.connected {
        color: #22c55e;
      }

      .header-status.demo-mode {
        color: #f59e0b;
      }

      .header-actions {
        vertical-align: center;
      }

      .header-action-btn {
        font-size: 24;
        color: #a5b4fc;
        padding: 8;
        background-color: #1e1b4b;
        border-radius: 8;
      }

      .loading-container {
        padding: 8 16;
        horizontal-align: center;
        orientation: horizontal;
      }

      .loading-text {
        font-size: 13;
        color: #9ca3af;
        margin-left: 8;
        vertical-align: center;
      }

      .floating-canvas {
        vertical-align: bottom;
        margin-bottom: 8;
      }
    `,
  ],
})
export class App implements OnInit {
  readonly chatService = inject(ChatService);
  readonly isIOS = isIOS;

  ngOnInit(): void {
    // Try to connect to the A2A server
    this.chatService.connect().then((connected) => {
      if (!connected) {
        console.log("Could not connect to A2A server, running in demo mode");
      }
    });
  }

  getStatusText(): string {
    if (this.chatService.demoModeActive()) {
      if (this.chatService.isServerAvailable()) {
        return "Demo Mode (Server Available)";
      }
      return "Demo Mode";
    } else if (this.chatService.connected()) {
      return "Connected to Server";
    }
    return "Connecting...";
  }

  onSendMessage(message: string): void {
    this.chatService.sendMessage(message);
  }

  async onMenuTap(): Promise<void> {
    const isDemo = this.chatService.demoModeActive();
    const serverAvailable = this.chatService.isServerAvailable();

    const actions = [
      "Clear Chat",
      isDemo ? "🔴 Switch to Live Mode" : "🟢 Switch to Demo Mode",
      "Show All Demo Surfaces",
      "Cancel",
    ];

    // Only show live mode option if server is available
    if (!serverAvailable && isDemo) {
      actions[1] = "⚠️ Live Mode (Server Unavailable)";
    }

    const result = await Dialogs.action({
      title: "A2UI Demo Options",
      message: `Current Mode: ${isDemo ? "Demo" : "Live"}\nServer: ${
        serverAvailable ? "Available" : "Unavailable"
      }`,
      actions: actions,
      cancelButtonText: "Cancel",
    });

    switch (result) {
      case "Clear Chat":
        this.chatService.clearMessages();
        break;

      case "🔴 Switch to Live Mode":
        if (serverAvailable) {
          this.chatService.setDemoMode(false);
          await Dialogs.alert({
            title: "Live Mode Enabled",
            message: "Messages will now be sent to the A2A server.",
            okButtonText: "OK",
          });
        }
        break;

      case "🟢 Switch to Demo Mode":
        this.chatService.setDemoMode(true);
        break;

      case "⚠️ Live Mode (Server Unavailable)":
        await Dialogs.alert({
          title: "Server Unavailable",
          message:
            "The A2A server is not reachable. Make sure it's running on localhost:10002 and restart the app.",
          okButtonText: "OK",
        });
        break;

      case "Show All Demo Surfaces":
        // Send a showcase message to display all components
        this.chatService.sendMessage("showcase");
        break;
    }
  }
}
