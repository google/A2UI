//
//  IconComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/27.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// IconComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - name: Icon name (custom SVG name or A2UI standard icon name)
/// - color: Icon color (String, supports hex color values)
/// - styles.width: Icon width (via styles field)
/// - styles.height: Icon height (via styles field)
///
/// Design notes:
/// - Icon loading priority: custom SVG icons from Resource/icons directory > SF Symbol fallback
/// - Maps A2UI standard icon names to Lucide Icons filenames (consistent with Android StyleHelper)
/// - Available custom icons: arrow-left/right, bell, calendar, camera, check, heart, star, etc.
/// - Icon reloads on layoutSubviews to match current view size
class IconComponent: Component {
    
    // MARK: - Properties
    
    private var iconImageView: UIImageView?
    private var currentIconName: String?
    private var currentIconSize: CGSize = .zero
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Icon", properties: properties)
        
        // Create icon image view
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFit
        imageView.tintColor = .label
        
        flex.addItem(imageView).grow(1).shrink(1)
        
        self.iconImageView = imageView
        
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        // Call parent method to apply CSS properties (e.g., padding, background-color)
        super.updateProperties(properties)
        
        guard let imageView = iconImageView else { return }
        
        // Update icon name (A2UI v0.9 protocol: name)
        if let nameValue = properties["name"] {
            let iconName = CSSPropertyParser.extractStringValue(nameValue)
            currentIconName = iconName
            loadIcon(iconName, for: imageView)
        }
        
        // Update icon color (A2UI v0.9 protocol: color)
        if let colorValue = properties["color"] {
            if let colorString = colorValue as? String {
                imageView.tintColor = parseColor(colorString)
            }
        }
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        
        // Reload icon to match current size when layout is complete and size is valid
        let currentSize = bounds.size
        guard currentSize.width > 0, currentSize.height > 0,
              currentSize != currentIconSize else { return }
        
        currentIconSize = currentSize
        
        if let iconName = currentIconName, !iconName.isEmpty {
            let mappedName = mapIconNameToLucide(iconName)
            iconImageView?.image = ComponentStyleConfigManager.loadIcon(named: mappedName, size: currentSize)
        }
    }
    
    // MARK: - Private Methods
    
    /// Load icon
    private func loadIcon(_ iconName: String, for imageView: UIImageView) {
        if iconName.isEmpty {
            imageView.image = nil
            return
        }
        
        let mappedName = mapIconNameToLucide(iconName)
        let size = imageView.bounds.size
        if size.width > 0, size.height > 0 {
            imageView.image = ComponentStyleConfigManager.loadIcon(named: mappedName, size: size)
        } else {
            imageView.image = ComponentStyleConfigManager.loadIcon(named: mappedName)
        }
    }
    
    /// Map A2UI standard icon names to Lucide Icons filenames
    /// Mapping is consistent with Android StyleHelper.getIconResourceId()
    private func mapIconNameToLucide(_ iconName: String) -> String {
        switch iconName.lowercased() {
        case "accountcircle":
            return "circle-user"
        case "add":
            return "plus"
        case "arrowback":
            return "arrow-left"
        case "arrowforward":
            return "arrow-right"
        case "attachfile":
            return "paperclip"
        case "calendartoday", "event":
            return "calendar"
        case "call", "phone":
            return "phone"
        case "camera":
            return "camera"
        case "check":
            return "check"
        case "close":
            return "x"
        case "delete":
            return "trash"
        case "download":
            return "download"
        case "edit":
            return "pencil"
        case "error":
            return "circle-alert"
        case "favorite":
            return "heart"
        case "favoriteoff":
            return "heart-off"
        case "folder":
            return "folder"
        case "help":
            return "circle-question-mark"
        case "home":
            return "house"
        case "info":
            return "info"
        case "locationon":
            return "map-pin"
        case "lock":
            return "lock"
        case "lockopen":
            return "lock-open"
        case "mail":
            return "mail"
        case "menu":
            return "menu"
        case "morevert":
            return "ellipsis-vertical"
        case "morehoriz":
            return "ellipsis"
        case "notificationsoff":
            return "bell-off"
        case "notifications":
            return "bell"
        case "payment":
            return "credit-card"
        case "person":
            return "user"
        case "photo":
            return "image"
        case "print":
            return "printer"
        case "refresh":
            return "refresh-cw"
        case "search":
            return "search"
        case "send":
            return "send"
        case "settings":
            return "settings"
        case "share":
            return "share"
        case "shoppingcart":
            return "shopping-cart"
        case "star":
            return "star"
        case "starhalf":
            return "star-half"
        case "staroff":
            return "star-off"
        case "upload":
            return "upload"
        case "visibility":
            return "eye"
        case "visibilityoff":
            return "eye-off"
        case "warning":
            return "triangle-alert"
        default:
            // If no mapping exists, return original name
            return iconName
        }
    }
    
    /// Parse color string
    private func parseColor(_ colorString: String) -> UIColor {
        return UIColor.from(hexString: colorString)
    }
}
