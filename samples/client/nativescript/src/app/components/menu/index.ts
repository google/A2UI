/**
 * Native Menu Module
 * 
 * This module provides native platform menus for iOS and Android.
 * - iOS: Uses UIAlertController in action sheet style with popover support
 * - Android: Uses android.widget.PopupMenu for native popup menus
 * 
 * The correct platform-specific implementation is automatically selected
 * at build time based on the platform (menu.ios.ts or menu.android.ts).
 * 
 * Usage:
 * ```typescript
 * import { showMenu, MenuConfig } from './menu/menu';
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

export { showMenu, MenuItem, MenuConfig, MenuResult } from './menu.common';

// Note: The actual platform-specific exports are handled by NativeScript's
// build system which will include either menu.ios.ts or menu.android.ts
// based on the target platform.
