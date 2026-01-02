import { View, Application } from '@nativescript/core';
import { MenuItem, MenuConfig, MenuResult, ensureMainThread } from './menu.common';

export { MenuItem, MenuConfig, MenuResult };

/**
 * Shows a native Android popup menu anchored to a view.
 * Uses android.widget.PopupMenu for native Android look and feel.
 */
export function showMenu(
  anchorView: View,
  config: MenuConfig
): Promise<MenuResult | null> {
  return new Promise((resolve) => {
    ensureMainThread(() => {
      const nativeView = anchorView.nativeView as android.view.View;

      if (!nativeView) {
        console.error('No native view available for menu');
        resolve(null);
        return;
      }

      // Get the context
      const context = nativeView.getContext();
      if (!context) {
        console.error('No context available for popup menu');
        resolve(null);
        return;
      }

      // Create PopupMenu
      const popupMenu = new android.widget.PopupMenu(context, nativeView);
      const menu = popupMenu.getMenu();

      // Add menu items
      config.items.forEach((item, index) => {
        const menuItem = menu.add(
          android.view.Menu.NONE,
          index,
          index,
          item.title
        );

        // Set icon if provided
        if (item.icon) {
          try {
            // Try to load icon from resources
            const resources = context.getResources();
            const packageName = context.getPackageName();
            const iconId = resources.getIdentifier(
              item.icon,
              'drawable',
              packageName
            );
            if (iconId > 0) {
              const drawable = context.getDrawable(iconId);
              menuItem.setIcon(drawable);
            }
          } catch (e) {
            console.warn(`Could not load icon: ${item.icon}`);
          }
        }

        // Set enabled state
        menuItem.setEnabled(!item.disabled);
      });

      // Force icons to show (requires reflection on Android)
      try {
        const menuHelper = new (<any>org).appcompat.widget.MenuPopupHelper(
          context,
          (<any>popupMenu).getMenu()
        );
        menuHelper.setForceShowIcon(true);
        // Note: Using this approach requires careful setup
      } catch (e) {
        // Icons may not show, but menu will still work
      }

      // Set up click listener
      popupMenu.setOnMenuItemClickListener(
        new android.widget.PopupMenu.OnMenuItemClickListener({
          onMenuItemClick: (menuItem: android.view.MenuItem): boolean => {
            const itemIndex = menuItem.getItemId();
            const selectedItem = config.items[itemIndex];
            if (selectedItem) {
              resolve({
                itemId: selectedItem.id,
                title: selectedItem.title,
              });
            }
            return true;
          },
        })
      );

      // Set up dismiss listener
      popupMenu.setOnDismissListener(
        new android.widget.PopupMenu.OnDismissListener({
          onDismiss: (popupMenu: android.widget.PopupMenu): void => {
            // Resolve with null if dismissed without selection
            // Note: This fires after onMenuItemClick, so we need to handle carefully
          },
        })
      );

      // Show the popup menu
      popupMenu.show();
    });
  });
}
