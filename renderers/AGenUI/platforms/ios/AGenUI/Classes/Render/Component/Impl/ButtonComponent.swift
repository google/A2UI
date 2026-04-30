  //
//  ButtonComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/27.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// Button component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - child: Child component ID (usually Text or Icon component) - required
/// - variant: Button style (primary, borderless)
/// - action: Tap action definition - required
/// - value: Optional boolean value (inherited from Checkable)
/// - disable: Whether to disable button (true: not clickable, false: clickable)
/// - background-color-disabled: Background color when button is disabled
/// - disabled-opacity: Disabled state opacity (0-1), example: 0.5
///
/// Design notes:
/// - Button is a container component that can hold one child component (Text or Icon)
/// - Button itself is a UIView, child components are added via Component.addChild()
class ButtonComponent: Component {
    
    // MARK: - Properties
    
    private var isDisabled: Bool = false
    private var disabledBackgroundColor: UIColor?
    private var normalBackgroundColor: UIColor?
    private var disabledOpacity: CGFloat = 0.4  // Default disabled opacity
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Button", properties: properties)
        
        // Configure FlexLayout - default horizontal direction, children vertically centered
        flex.direction(.row)
            .justifyContent(.center)
            .alignItems(.center)
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        
        // Call parent method to apply CSS properties to self
        super.updateProperties(properties)
        
        // Read background-color-disabled and disabled-opacity properties from styles field
        if let styles = properties["styles"] as? [String: Any] {
            if let disabledColorStr = styles["background-color-disabled"] as? String {
                self.disabledBackgroundColor = UIColor(hexString: disabledColorStr)
            }
        }
        
        // Handle disable property
        if let disable = properties["disable"] as? Bool {
            self.isDisabled = disable
        }
        
        // Parse disabled-opacity property, range 0-1
        let localStyleConfig = ComponentStyleConfigManager.shared.getConfig(for: componentType)
        // In JSON, disabled-opacity is string type "0.8", need to check String first
        if let opacityStr = localStyleConfig?["disabled-opacity"] as? String {
            if let opacity = Double(opacityStr) {
                self.disabledOpacity = max(0.0, min(1.0, CGFloat(opacity)))
            }
        } else if let opacity = localStyleConfig?["disabled-opacity"] as? Double {
            self.disabledOpacity = max(0.0, min(1.0, CGFloat(opacity)))
        } else if let opacity = localStyleConfig?["disabled-opacity"] as? NSNumber {
            self.disabledOpacity = max(0.0, min(1.0, CGFloat(truncating: opacity)))
        }
        
        // Apply disabled state
        applyDisabledState()
        
        // checks adaptation
        if let checks = properties["checks"] as? [String: Any] {
            let result = checks["result"] as? Bool ?? true
            
            // Control clickability and enabled state
            isUserInteractionEnabled = result
            
            // Visual feedback - button grays out on validation failure
            alpha = result ? 1.0 : 0.5
        }
    }
    
    // MARK: - Private Methods
    
    /// Apply disabled state
    private func applyDisabledState() {
        if isDisabled {
            // Disabled state
            isUserInteractionEnabled = false
            
            // If disabled background color specified, use it; otherwise use default gray
            if let disabledColor = disabledBackgroundColor {
                backgroundColor = disabledColor
            } else {
                // Default disabled background color is light gray
                backgroundColor = UIColor(hexString: "#CCCCCC")
            }
            
            // Use configured disabled opacity
            alpha = disabledOpacity
        } else {
            // Enabled state
            isUserInteractionEnabled = true
            
            // Restore normal background color
            if let normalColor = normalBackgroundColor {
                backgroundColor = normalColor
            }
            
            // Restore normal transparency
            alpha = 1.0
        }
    }
    
    // MARK: - Event Handling
    
    override func handleTap() {
        // If button is disabled, do not handle tap events
        if isDisabled {
            Logger.shared.debug("ButtonComponent: Button is disabled, ignoring click: \(componentId)")
            return
        }
        
        super.handleTap()
    }
}
