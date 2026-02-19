/**
 * Native Menu Module
 * 
 * This module provides native platform menus for iOS and Android.
 * - iOS: Uses UIButton with UIMenu for native dropdown menus
 * - Android: Uses android.widget.PopupMenu for native popup menus
 * 
 * Usage:
 * ```typescript
 * import { showMenu, MenuConfig } from './menu';
 * 
 * const config: MenuConfig = {
 *   title: 'Options',
 *   items: [
 *     { id: 'edit', title: 'Edit', icon: 'pencil' },
 *     { id: 'share', title: 'Share', icon: 'square.and.arrow.up' },
 *     { id: 'delete', title: 'Delete', destructive: true },
 *   ]
 * };
 * 
 * const result = await showMenu(buttonView, config);
 * if (result) {
 *   console.log('Selected:', result.itemId);
 * }
 * ```
 */

// Re-export types from common
export { MenuItem, MenuConfig, MenuResult } from './menu.common';

import { isAndroid, isIOS, View } from '@nativescript/core';
import { MenuConfig as MenuConfigType, MenuResult as MenuResultType } from './menu.common';

// Import platform-specific implementations
let platformShowMenu: (anchorView: View, config: MenuConfigType) => Promise<MenuResultType | null>;

if (isAndroid) {
  // Android implementation
  platformShowMenu = require('./menu.android').showMenu;
} else if (isIOS) {
  // iOS implementation
  platformShowMenu = require('./menu.ios').showMenu;
} else {
  // Fallback
  platformShowMenu = require('./menu.common').showMenu;
}

/**
 * Shows a native platform menu anchored to the given view.
 * On iOS, uses UIMenu with UIButton for native dropdown appearance.
 * On Android, uses PopupMenu for native popup appearance.
 */
export function showMenu(
  anchorView: View,
  config: MenuConfigType
): Promise<MenuResultType | null> {
  return platformShowMenu(anchorView, config);
}
