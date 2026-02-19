import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from "@angular/core";
import { NativeScriptCommonModule } from "@nativescript/angular";
import {
  isIOS,
  Screen,
  Dialogs,
  View,
  ScrollView,
  Page,
  EventData,
  GridLayout,
} from "@nativescript/core";
import { Types } from "@a2ui/nativescript";
import { A2uiMessage } from "../a2ui-types";
import { ChatService } from "./services/chat.service";
import { ChatInputComponent } from "./components/chat-input.component";
import { ChatHistoryComponent } from "./components/chat-history.component";
import { CanvasComponent } from "./components/canvas.component";
import { showMenu, MenuConfig } from "./components/menu";

@Component({
  selector: "ns-app",
  imports: [
    NativeScriptCommonModule,
    ChatInputComponent,
    ChatHistoryComponent,
    CanvasComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: "./app.html",
  styleUrls: ["./app-root.css"],
})
export class App implements OnInit, AfterViewInit, OnDestroy {
  readonly chatService = inject(ChatService);
  page = inject(Page);
  readonly isIOS = isIOS;

  @ViewChild("menuButtonContainer", { read: ElementRef, static: false })
  menuButtonContainerRef!: ElementRef;

  private iosMenuButton: any = null;
  private menuSetupComplete = false;

  constructor() {
    if (__APPLE__) {
      const keyboardManager = IQKeyboardManager.sharedManager();
      keyboardManager.enable = true;
      keyboardManager.enableAutoToolbar = false;
      keyboardManager.overrideKeyboardAppearance = true;
      keyboardManager.keyboardAppearance = UIKeyboardAppearance.Dark;
      keyboardManager.shouldResignOnTouchOutside = true;
      keyboardManager.keyboardDistanceFromTextField = 0;
      // const vc = this.page.ios as UIViewController;
      // keyboardManager.disabledDistanceHandlingClasses.addObject(vc.class());
    }
  }

  ngOnInit(): void {
    // Try to connect to the A2A server
    this.chatService.connect().then((connected) => {
      if (!connected) {
        console.log("Could not connect to A2A server, running in demo mode");
      }
    });
  }

  ngAfterViewInit(): void {
    if (isIOS) {
      setTimeout(() => this.setupIOSHeaderMenu(), 100);
    }
  }

  ngOnDestroy(): void {
    if (this.iosMenuButton) {
      this.iosMenuButton.removeFromSuperview();
      this.iosMenuButton = null;
    }
  }

  onMenuContainerLoaded(): void {
    if (isIOS && !this.menuSetupComplete) {
      setTimeout(() => this.setupIOSHeaderMenu(), 50);
    }
  }

  /**
   * Setup native iOS dropdown menu for the header
   */
  private setupIOSHeaderMenu(): void {
    if (!isIOS || this.menuSetupComplete) return;

    const container: View = this.menuButtonContainerRef?.nativeElement;
    if (!container?.nativeView) return;

    const nativeView = container.nativeView as any;

    try {
      // Build menu actions
      const actions = NSMutableArray.alloc().init();

      // Clear Chat action
      const clearAction = UIAction.actionWithTitleImageIdentifierHandler(
        "Clear Chat",
        UIImage.systemImageNamed("trash"),
        "clear-chat",
        () => this.handleHeaderMenuAction("clear-chat")
      );
      actions.addObject(clearAction);

      // Toggle Mode action
      const isDemo = this.chatService.demoModeActive();
      const toggleAction = UIAction.actionWithTitleImageIdentifierHandler(
        isDemo ? "Switch to Live Mode" : "Switch to Demo Mode",
        UIImage.systemImageNamed(
          isDemo ? "antenna.radiowaves.left.and.right" : "play.circle"
        ),
        "toggle-mode",
        () => this.handleHeaderMenuAction("toggle-mode")
      );
      actions.addObject(toggleAction);

      // Show All Demo Surfaces action
      const showcaseAction = UIAction.actionWithTitleImageIdentifierHandler(
        "Show All Demo Surfaces",
        UIImage.systemImageNamed("square.stack.3d.up"),
        "showcase",
        () => this.handleHeaderMenuAction("showcase")
      );
      actions.addObject(showcaseAction);

      // Create menu
      const menu = UIMenu.menuWithTitleImageIdentifierOptionsChildren(
        "",
        null,
        "header-menu",
        UIMenuOptions.DisplayInline,
        actions
      );

      // Create transparent button overlay
      const button = UIButton.buttonWithType(UIButtonType.System);
      button.frame = CGRectMake(
        0,
        0,
        nativeView.bounds.size.width || 44,
        nativeView.bounds.size.height || 44
      );
      button.autoresizingMask =
        UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
      button.backgroundColor = UIColor.clearColor;
      button.setTitleForState("", 0);

      // Attach menu
      button.menu = menu;
      button.showsMenuAsPrimaryAction = true;

      // Add to view
      nativeView.addSubview(button);
      this.iosMenuButton = button;
      this.menuSetupComplete = true;
    } catch (error) {
      console.error("Error setting up iOS header menu:", error);
    }
  }

  /**
   * Handle header menu action selection
   */
  private async handleHeaderMenuAction(actionId: string): Promise<void> {
    const isDemo = this.chatService.demoModeActive();
    const serverAvailable = this.chatService.isServerAvailable();

    switch (actionId) {
      case "clear-chat":
        this.chatService.clearMessages();
        break;

      case "toggle-mode":
        if (isDemo) {
          if (serverAvailable) {
            this.chatService.setDemoMode(false);
            await Dialogs.alert({
              title: "Live Mode Enabled",
              message: "Messages will now be sent to the A2A server.",
              okButtonText: "OK",
            });
          } else {
            await Dialogs.alert({
              title: "Server Unavailable",
              message:
                "The A2A server is not reachable. Make sure it's running on localhost:10002 and restart the app.",
              okButtonText: "OK",
            });
          }
        } else {
          this.chatService.setDemoMode(true);
        }
        // Rebuild menu to reflect new state
        this.menuSetupComplete = false;
        if (this.iosMenuButton) {
          this.iosMenuButton.removeFromSuperview();
          this.iosMenuButton = null;
        }
        setTimeout(() => this.setupIOSHeaderMenu(), 100);
        break;

      case "showcase":
        this.chatService.sendMessage("showcase");
        break;
    }
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

  /**
   * Handle menu tap - Android fallback (iOS uses native UIButton menu)
   */
  async onMenuTap(): Promise<void> {
    // On iOS, the native UIButton handles the menu display
    if (isIOS) return;

    const isDemo = this.chatService.demoModeActive();
    const serverAvailable = this.chatService.isServerAvailable();

    // Build menu items for Android
    const menuConfig: MenuConfig = {
      title: "A2UI Demo Options",
      items: [
        {
          id: "clear-chat",
          title: "Clear Chat",
        },
        {
          id: "toggle-mode",
          title: isDemo ? "Switch to Live Mode" : "Switch to Demo Mode",
          disabled: isDemo && !serverAvailable,
        },
        {
          id: "showcase",
          title: "Show All Demo Surfaces",
        },
      ],
    };

    // Get the anchor view for the menu
    const container: View = this.menuButtonContainerRef?.nativeElement;

    if (!container) {
      console.warn("Menu button container not available");
      return;
    }

    // Show native menu
    const result = await showMenu(container, menuConfig);

    if (result) {
      await this.handleHeaderMenuAction(result.itemId);
    }
  }
}
