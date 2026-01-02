import { Component, NO_ERRORS_SCHEMA, ChangeDetectionStrategy, ElementRef, ViewChild, signal } from '@angular/core';
import { Types } from '../../../a2ui-lit-types';
import { DynamicComponent } from '@a2ui/nativescript';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { View } from '@nativescript/core';
import { showMenu, MenuConfig, MenuItem } from './menu.common';

/**
 * A2UI Menu Component
 * 
 * Displays a button that when tapped shows a native platform menu.
 * - iOS: Uses UIAlertController as action sheet with popover presentation
 * - Android: Uses PopupMenu for native dropdown appearance
 * 
 * Example A2UI node structure:
 * {
 *   "type": "Menu",
 *   "id": "options-menu",
 *   "label": "Options",
 *   "icon": "more_vert",
 *   "items": [
 *     { "id": "edit", "title": "Edit", "icon": "pencil" },
 *     { "id": "share", "title": "Share" },
 *     { "id": "delete", "title": "Delete", "destructive": true }
 *   ]
 * }
 */
@Component({
  selector: 'a2ui-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <Button
      #menuButton
      class="a2ui-menu-button"
      [text]="buttonText"
      (tap)="onMenuTap()">
    </Button>
  `,
  styles: [`
    .a2ui-menu-button {
      font-size: 20;
      background-color: transparent;
      color: #6366f1;
      padding: 8;
      margin: 0;
      min-width: 44;
      min-height: 44;
    }
  `],
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA]
})
export class MenuComponent extends DynamicComponent<any> {
  @ViewChild('menuButton', { read: ElementRef, static: false }) 
  menuButtonRef!: ElementRef;

  private isMenuOpen = signal(false);

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
    // Support common menu icons
    if (node?.icon === 'more_vert' || node?.icon === 'more') {
      return '⋮';  // Vertical ellipsis
    }
    if (node?.icon === 'more_horiz') {
      return '⋯';  // Horizontal ellipsis
    }
    if (node?.icon === 'menu') {
      return '☰';  // Hamburger menu
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
   * Handle menu button tap
   */
  async onMenuTap(): Promise<void> {
    if (this.isMenuOpen()) return;

    this.isMenuOpen.set(true);

    try {
      // Get the native view from the button
      const buttonView: View = this.menuButtonRef?.nativeElement;
      
      if (!buttonView) {
        console.warn('Menu button view not available');
        return;
      }

      const config = this.menuConfig;
      
      if (config.items.length === 0) {
        console.warn('Menu has no items');
        return;
      }

      // Show the native menu
      const result = await showMenu(buttonView, config);

      if (result) {
        // Find the selected item and trigger its action
        const node = this.menuNode;
        const selectedItem = node?.items?.find(item => item.id === result.itemId);
        
        if (selectedItem?.action) {
          this.sendAction(selectedItem.action);
        } else {
          // Create a default action with the item id
          this.sendAction({
            name: result.itemId,
            id: result.itemId,
            label: result.title,
            payload: { itemId: result.itemId, title: result.title }
          });
        }
      }
    } catch (error) {
      console.error('Error showing menu:', error);
    } finally {
      this.isMenuOpen.set(false);
    }
  }
}

/**
 * Extended interface for Menu node with menu-specific properties
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
