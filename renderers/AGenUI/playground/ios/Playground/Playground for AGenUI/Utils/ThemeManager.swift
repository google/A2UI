//
//  ThemeManager.swift
//  Playground
//
//  Created by acoder-ai-infra on 2026/3/22.
//

import UIKit
import AGenUI

/// Theme mode enumeration
enum ThemeMode: Int {
    case light = 0      // Light mode
    case dark = 1       // Dark mode
    case system = 2     // Follow system
    
    var displayName: String {
        switch self {
        case .light:
            return "Light Mode"
        case .dark:
            return "Dark Mode"
        case .system:
            return "Follow System"
        }
    }
}

/// Theme manager
class ThemeManager {
    
    /// Surface Manager instance (weak reference, set externally)
    weak var surfaceManager: SurfaceManager?
    
    private let themeKey = "app_theme_mode"
    
    /// Current theme mode
    var currentTheme: ThemeMode {
        get {
            let rawValue = UserDefaults.standard.integer(forKey: themeKey)
            return ThemeMode(rawValue: rawValue) ?? .system
        }
        set {
            UserDefaults.standard.set(newValue.rawValue, forKey: themeKey)
            applyTheme(newValue)
        }
    }
    
    init() {
        // Apply saved theme
        applyTheme(currentTheme)
    }
    
    /// Apply theme
    private func applyTheme(_ theme: ThemeMode) {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first(where: { $0.isKeyWindow }) else {
            return
        }
        
        switch theme {
        case .light:
            window.overrideUserInterfaceStyle = .light
            AGenUISDK.setDayNightMode("light")
        case .dark:
            window.overrideUserInterfaceStyle = .dark
            AGenUISDK.setDayNightMode("dark")
        case .system:
            window.overrideUserInterfaceStyle = .unspecified
            // Call different modes based on current system state
            let isDarkMode = window.traitCollection.userInterfaceStyle == .dark
            AGenUISDK.setDayNightMode(isDarkMode ? "dark" : "light")
        }
    }
    
    /// Show theme selector menu
    func showThemeSelector(from viewController: UIViewController) {
        let alertController = UIAlertController(
            title: "Select Theme",
            message: nil,
            preferredStyle: .actionSheet
        )
        
        // Light mode
        let lightAction = UIAlertAction(title: ThemeMode.light.displayName, style: .default) { [weak self] _ in
            self?.currentTheme = .light
        }
        if currentTheme == .light {
            lightAction.setValue(true, forKey: "checked")
        }
        alertController.addAction(lightAction)
        
        // Dark mode
        let darkAction = UIAlertAction(title: ThemeMode.dark.displayName, style: .default) { [weak self] _ in
            self?.currentTheme = .dark
        }
        if currentTheme == .dark {
            darkAction.setValue(true, forKey: "checked")
        }
        alertController.addAction(darkAction)
        
        // Follow system
        let systemAction = UIAlertAction(title: ThemeMode.system.displayName, style: .default) { [weak self] _ in
            self?.currentTheme = .system
        }
        if currentTheme == .system {
            systemAction.setValue(true, forKey: "checked")
        }
        alertController.addAction(systemAction)
        
        // Cancel
        alertController.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        
        // iPad support
        if let popoverController = alertController.popoverPresentationController {
            popoverController.sourceView = viewController.view
            popoverController.sourceRect = CGRect(
                x: viewController.view.bounds.midX,
                y: viewController.view.bounds.midY,
                width: 0,
                height: 0
            )
            popoverController.permittedArrowDirections = []
        }
        
        viewController.present(alertController, animated: true)
    }
}
