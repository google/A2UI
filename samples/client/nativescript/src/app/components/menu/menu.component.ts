import { Component, NO_ERRORS_SCHEMA, ChangeDetectionStrategy, ElementRef, ViewChild, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { Types } from '../../../a2ui-lit-types';
import { DynamicComponent } from '@a2ui/nativescript';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { View, isIOS, isAndroid } from '@nativescript/core';
import { showMenu, MenuConfig, MenuItem } from './index';

// iOS-specific imports and setup
declare const UIButton: any;
declare const UIButtonType: any;
declare const UIMenu: any;
declare const UIAction: any;
declare const UIImage: any;
declare const UIMenuElementAttributes: any;
declare const CGRectMake: any;
declare const UIColor: any;
declare const UIViewAutoresizing: any;
declare const NSMutableArray: any;

/**
 * A2UI Menu Component
 * 
 * Displays a button that when tapped shows a native platform menu.
 * - iOS: Uses UIButton with showsMenuAsPrimaryAction for native dropdown
 * - Android: Uses PopupMenu for native dropdown appearance
 * 
 * The menu appears as a native dropdown from the button location,
 * not as a centered dialog.
 */
@Component({
  selector: 'a2ui-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <StackLayout #menuContainer class="a2ui-menu-container" (loaded)="onContainerLoaded()">
      <Label 
        class="a2ui-menu-label"
        [text]="buttonText"
        (tap)="onMenuTap($event)">
      </Label>
    </StackLayout>
  `,
  styles: [`
    .a2ui-menu-container {
      background-color: rgba(99, 102, 241, 0.1);
      border-radius: 8;
      height: 38;
    }
    .a2ui-menu-label {
      font-size: 16;
      color: #6366f1;
      padding: 8 12;
      text-align: center;
    }
  `],
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA]
})
export class MenuComponent extends DynamicComponent<any> implements AfterViewInit, OnDestroy {
  @ViewChild('menuContainer', { read: ElementRef, static: false }) 
  containerRef!: ElementRef;

  private iosMenuButton: any = null;
  private isMenuOpen = signal(false);
  private menuSetupComplete = false;

  ngAfterViewInit(): void {
    // Setup iOS menu after view is ready
    if (isIOS) {
      setTimeout(() => this.setupIOSMenu(), 100);
    }
  }

  ngOnDestroy(): void {
    // Cleanup iOS menu button
    if (this.iosMenuButton) {
      this.iosMenuButton.removeFromSuperview();
      this.iosMenuButton = null;
    }
  }

  onContainerLoaded(): void {
    if (isIOS && !this.menuSetupComplete) {
      setTimeout(() => this.setupIOSMenu(), 50);
    }
  }

  /**
   * Setup native iOS menu button with UIMenu
   */
  private setupIOSMenu(): void {
    if (!isIOS || this.menuSetupComplete) return;

    const container: View = this.containerRef?.nativeElement;
    if (!container?.nativeView) return;

    const nativeView = container.nativeView as any;
    const config = this.menuConfig;
    
    if (config.items.length === 0) return;

    try {
      // Build UIMenu actions
      const actions = NSMutableArray.alloc().init();

      for (const item of config.items) {
        const itemId = item.id;
        const itemTitle = item.title;

        // Create SF Symbol image if icon provided
        let image: any = null;
        if (item.icon) {
          image = UIImage.systemImageNamed(item.icon);
        }

        // Create action with handler
        const action = UIAction.actionWithTitleImageIdentifierHandler(
          item.title,
          image,
          item.id,
          () => {
            this.handleMenuSelection(itemId, itemTitle);
          }
        );

        // Set attributes
        let attributes = 0;
        if (item.destructive) {
          attributes = UIMenuElementAttributes.Destructive;
        }
        if (item.disabled) {
          attributes = attributes | UIMenuElementAttributes.Disabled;
        }
        if (attributes > 0) {
          action.attributes = attributes;
        }

        actions.addObject(action);
      }

      // Create UIMenu
      const menu = UIMenu.menuWithTitleImageIdentifierOptionsChildren(
        config.title || "",
        null,
        this.menuNode.id || "menu",
        0,
        actions
      );

      // Create transparent UIButton overlay
      const button = UIButton.buttonWithType(UIButtonType.System);
      button.frame = CGRectMake(0, 0, nativeView.bounds.size.width, nativeView.bounds.size.height);
      button.autoresizingMask = UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight;
      button.backgroundColor = UIColor.clearColor;
      button.setTitleForState("", 0); // UIControlState.Normal = 0

      // Attach menu - this makes the button show the menu on tap
      button.menu = menu;
      button.showsMenuAsPrimaryAction = true;

      // Add to native view
      nativeView.addSubview(button);
      this.iosMenuButton = button;
      this.menuSetupComplete = true;

    } catch (error) {
      console.error('Error setting up iOS menu:', error);
    }
  }

  /**
   * Handle menu item selection
   */
  private handleMenuSelection(itemId: string, itemTitle: string): void {
    const node = this.menuNode;
    const selectedItem = node?.items?.find(item => item.id === itemId);
    
    if (selectedItem?.action) {
      this.sendAction(selectedItem.action);
    } else {
      this.sendAction({
        name: itemId,
        id: itemId,
        label: itemTitle,
        payload: { itemId, title: itemTitle }
      });
    }
  }

  /**
   * Menu node interface with extended properties
   */
  private get menuNode(): MenuNode {
    return this.node as MenuNode;
  }

  /**
   * Get the button text/icon
   */
  get buttonText(): string {
    const node = this.menuNode;
    if (node?.icon === 'more_vert' || node?.icon === 'more') {
      return '⋮';
    }
    if (node?.icon === 'more_horiz') {
      return '⋯';
    }
    if (node?.icon === 'menu') {
      return '☰';
    }
    return node?.label || node?.icon || '⋮';
  }

  /**
   * Get menu configuration from node
   */
  get menuConfig(): MenuConfig {
    const node = this.menuNode;

    const items: MenuItem[] = (node?.items || []).map(item => ({
      id: item.id,
      title: item.title,
      icon: item.icon,
      destructive: item.destructive,
      disabled: item.disabled,
    }));

    return {
      title: node?.title,
      items,
    };
  }

  /**
   * Handle menu tap - used for Android
   */
  async onMenuTap(args: any): Promise<void> {
    // On iOS, the native UIButton handles the menu display
    if (isIOS) return;

    if (this.isMenuOpen()) return;
    this.isMenuOpen.set(true);

    try {
      const view: View = args.object;
      const config = this.menuConfig;
      
      if (config.items.length === 0) return;

      const result = await showMenu(view, config);

      if (result) {
        this.handleMenuSelection(result.itemId, result.title);
      }
    } catch (error) {
      console.error('Error showing menu:', error);
    } finally {
      this.isMenuOpen.set(false);
    }
  }
}

/**
 * Extended interface for Menu node
 */
interface MenuNode {
  type: string;
  id?: string;
  label?: string;
  icon?: string;
  title?: string;
  items?: MenuItemNode[];
}

interface MenuItemNode {
  id: string;
  title: string;
  icon?: string;
  destructive?: boolean;
  disabled?: boolean;
  action?: Types.Action;
}
