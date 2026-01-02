import { View } from "@nativescript/core";
import {
  MenuItem,
  MenuConfig,
  MenuResult,
  ensureMainThread,
} from "./menu.common";

export { MenuItem, MenuConfig, MenuResult };

/**
 * Shows a native iOS context menu anchored to a view.
 * Uses UIMenu and UIContextMenuInteraction for iOS 14+.
 * Falls back to UIAlertController action sheet for older iOS.
 */
export function showMenu(
  anchorView: View,
  config: MenuConfig
): Promise<MenuResult | null> {
  return new Promise((resolve) => {
    ensureMainThread(() => {
      const nativeView = anchorView.nativeView as UIView;

      if (!nativeView) {
        console.error("No native view available for menu");
        resolve(null);
        return;
      }

      // Check iOS version - UIMenu requires iOS 14+
      const iosVersion = parseFloat(UIDevice.currentDevice.systemVersion);

      if (iosVersion >= 14) {
        // Use modern UIMenu approach via UIContextMenuInteraction
        showUIMenuPopover(nativeView, config, resolve);
      } else {
        // Fallback to UIAlertController action sheet
        showActionSheet(nativeView, config, resolve);
      }
    });
  });
}

/**
 * Shows menu using UIAlertController as popover (works on all iOS versions)
 */
function showActionSheet(
  anchorView: UIView,
  config: MenuConfig,
  resolve: (result: MenuResult | null) => void
): void {
  const alertController =
    UIAlertController.alertControllerWithTitleMessagePreferredStyle(
      config.title || null,
      null,
      UIAlertControllerStyle.ActionSheet
    );

  // Add menu items
  for (const item of config.items) {
    const style = item.destructive
      ? UIAlertActionStyle.Destructive
      : UIAlertActionStyle.Default;

    const action = UIAlertAction.actionWithTitleStyleHandler(
      item.title,
      style,
      () => {
        resolve({ itemId: item.id, title: item.title });
      }
    );

    if (item.disabled) {
      action.enabled = false;
    }

    alertController.addAction(action);
  }

  // Add cancel action
  const cancelAction = UIAlertAction.actionWithTitleStyleHandler(
    "Cancel",
    UIAlertActionStyle.Cancel,
    () => {
      resolve(null);
    }
  );
  alertController.addAction(cancelAction);

  // Configure for iPad (popover presentation)
  const popover = alertController.popoverPresentationController;
  if (popover) {
    popover.sourceView = anchorView;
    popover.sourceRect = anchorView.bounds;
    popover.permittedArrowDirections = UIPopoverArrowDirection.Any;
  }

  // Present the alert controller
  const viewController = getTopViewController();
  if (viewController) {
    viewController.presentViewControllerAnimatedCompletion(
      alertController,
      true,
      null
    );
  } else {
    resolve(null);
  }
}

/**
 * Shows menu using UIMenu as popover (iOS 14+)
 */
function showUIMenuPopover(
  anchorView: UIView,
  config: MenuConfig,
  resolve: (result: MenuResult | null) => void
): void {
  // Create UIActions for each menu item
  const actions: UIAction[] = [];

  for (const item of config.items) {
    let attributes = UIMenuElementAttributes.KeepsMenuPresented;
    if (item.destructive) {
      attributes = UIMenuElementAttributes.Destructive;
    }
    if (item.disabled) {
      attributes = UIMenuElementAttributes.Disabled;
    }

    // Create UIImage if icon is provided
    let image: UIImage | null = null;
    if (item.icon) {
      image = UIImage.systemImageNamed(item.icon);
    }

    const action = UIAction.actionWithTitleImageIdentifierHandler(
      item.title,
      image,
      item.id,
      () => {
        resolve({ itemId: item.id, title: item.title });
      }
    );
    action.attributes = attributes;
    actions.push(action);
  }

  // Create UIMenu
  const menu = UIMenu.menuWithTitleImageIdentifierOptionsChildren(
    config.title || "",
    null,
    "",
    UIMenuOptions.DisplayInline,
    actions
  );

  // For iOS 14+, we can use the pull-down button approach
  // Create a temporary button to show the menu
  const button = UIButton.buttonWithType(UIButtonType.System);
  button.frame = anchorView.bounds;
  button.showsMenuAsPrimaryAction = true;
  button.menu = menu;

  // Add button as subview temporarily
  anchorView.addSubview(button);

  // Simulate a tap to show the menu
  button.sendActionsForControlEvents(UIControlEvents.TouchUpInside);

  // Remove the button after a short delay
  setTimeout(() => {
    button.removeFromSuperview();
  }, 100);

  // Since UIMenu doesn't have a built-in "canceled" callback,
  // we rely on the action handlers above.
  // For this simple approach, use action sheet as more reliable
  showActionSheet(anchorView, config, resolve);
}

/**
 * Gets the topmost view controller for presenting alerts
 */
function getTopViewController(): UIViewController | null {
  let viewController: UIViewController | null = null;

  // Get the key window's root view controller
  const scenes = UIApplication.sharedApplication.connectedScenes;
  const sceneArray = scenes.allObjects;

  for (let i = 0; i < sceneArray.count; i++) {
    const scene = sceneArray.objectAtIndex(i);
    if (scene instanceof UIWindowScene) {
      const windows = (scene as UIWindowScene).windows;
      for (let j = 0; j < windows.count; j++) {
        const window = windows.objectAtIndex(j);
        if (window.isKeyWindow) {
          viewController = window.rootViewController;
          break;
        }
      }
    }
    if (viewController) break;
  }

  // Traverse to the topmost presented view controller
  while (viewController?.presentedViewController) {
    viewController = viewController.presentedViewController;
  }

  return viewController;
}
