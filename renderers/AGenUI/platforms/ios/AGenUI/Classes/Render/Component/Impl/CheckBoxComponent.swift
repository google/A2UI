//
//  CheckBoxComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// CheckBox component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - label: Checkbox label text (String)
/// - value: Checkbox state, supports literalBoolean or path for two-way data binding (Boolean)
/// - checks: Validation result for displaying error messages (Dictionary)
///
/// Design notes:
/// - Uses CheckBoxButton as the base control with unified checkbox style
/// - Supports two-way data binding, automatically syncs to C++ DataModel when toggled
/// - Supports validation error display with error label
class CheckBoxComponent: Component {
    
    // MARK: - Properties
    
    private var checkBoxButton: CheckBoxButton?
    private var errorLabel: UILabel?
    private var dataBindingPath: String?
    private var isUpdatingFromNative = false
    
    // MARK: - Style Configuration Properties
    
    private var checkboxSize: CGFloat = 16
    private var checkboxBorderWidth: CGFloat = 1.5
    private var checkboxBorderRadius: CGFloat = 6
    private var selectedBackgroundColor: UIColor = UIColor(red: 0x2E/255.0, green: 0x82/255.0, blue: 0xFF/255.0, alpha: 1.0)
    private var selectedBorderColor: UIColor = UIColor(red: 0x2E/255.0, green: 0x82/255.0, blue: 0xFF/255.0, alpha: 1.0)
    private var unselectedBackgroundColor: UIColor = .clear
    private var unselectedBorderColor: UIColor = UIColor.black.withAlphaComponent(0.1)
    private var disabledBackgroundColor: UIColor = UIColor(red: 0xEB/255.0, green: 0xEB/255.0, blue: 0xEB/255.0, alpha: 1.0)
    private var disabledBorderColor: UIColor = UIColor.black.withAlphaComponent(0.1)
    private var textMargin: CGFloat = 8
    private var textColor: UIColor = .black
    private var textColorDisabled: UIColor = UIColor.black.withAlphaComponent(0.4)
    private var textSize: CGFloat = 16
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "CheckBox", properties: properties)
        
        // Configure self (Component itself is a UIView)
        backgroundColor = .clear
        
        // Load local style configuration
        loadLocalStyleConfig()
        
            // Create CheckBoxButton
        createCheckBoxButton(flex: flex)
        
        // Create error label
        createErrorLabel(flex: flex)
        
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
        
        // Update label text
        if let label = properties["label"] {
            let labelText = extractTextValue(label)
            checkBoxButton?.label = labelText
        }
        
        // Update checkbox state (from C++ data update)
        if let value = properties["value"] {
            // Extract data binding path
            if let valueDict = value as? [String: Any], let path = valueDict["path"] as? String {
                dataBindingPath = path
            }
            
            // Update checkbox state
            isUpdatingFromNative = true
            let checked = CSSPropertyParser.extractBooleanValue(value)
            
            if let checkBoxButton = checkBoxButton, checkBoxButton.isSelected != checked {
                checkBoxButton.isSelected = checked
            }
            isUpdatingFromNative = false
        }
        
        // checks adaptation - display validation errors
        if let checks = properties["checks"] as? [String: Any] {
            let result = checks["result"] as? Bool ?? true
            let message = checks["message"] as? String ?? ""
            
            if !result && !message.isEmpty {
                showError(message)
            } else {
                hideError()
            }
            
            // Control editability and visual feedback
            checkBoxButton?.isEnabled = result
            let alpha: CGFloat = result ? 1.0 : 0.5
            checkBoxButton?.alpha = alpha
        }
    }
    
    // MARK: - Configuration Methods
    
    /// Load local style configuration
    private func loadLocalStyleConfig() {
        guard let config = ComponentStyleConfigManager.shared.getConfig(for: componentType) else {
            Logger.shared.debug("Using default configuration")
            return
        }
        
        Logger.shared.info("Loading local style configuration")
        
        // Parse checkbox size
        if let size = config["checkbox-size"] as? String,
           let value = ComponentStyleConfigManager.parseSize(size) {
            self.checkboxSize = value
        }
        
        // Parse border width
        if let width = config["checkbox-border-width"] as? String,
           let value = ComponentStyleConfigManager.parseSize(width) {
            self.checkboxBorderWidth = value
        }
        
        // Parse border radius
        if let radius = config["checkbox-border-radius"] as? String,
           let value = ComponentStyleConfigManager.parseSize(radius) {
            self.checkboxBorderRadius = value
        }
        
        // Parse selected state colors
        if let color = config["checkbox-background-color-selected"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.selectedBackgroundColor = value
        }
        
        if let color = config["checkbox-border-color-selected"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.selectedBorderColor = value
        }
        
        // Parse unselected state colors
        if let color = config["checkbox-background-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.unselectedBackgroundColor = value
        }
        
        if let color = config["checkbox-border-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.unselectedBorderColor = value
        }
        
        // Parse disabled state colors
        if let color = config["checkbox-background-color-disabled"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.disabledBackgroundColor = value
        }
        
        if let color = config["checkbox-border-color-disabled"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.disabledBorderColor = value
        }
        
        // Parse text styles
        if let margin = config["text-margin"] as? String,
           let value = ComponentStyleConfigManager.parseSize(margin) {
            self.textMargin = value
        }
        
        if let color = config["text-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.textColor = value
        }
        
        if let color = config["text-color-disabled"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.textColorDisabled = value
        }
        
        if let size = config["text-size"] as? String,
           let value = ComponentStyleConfigManager.parseSize(size) {
            self.textSize = value
        }
    }
    
    // MARK: - Private Methods - UI Creation
    
    /// Create CheckBoxButton
    private func createCheckBoxButton(flex: Flex) {
        let button = CheckBoxButton()
        button.addTarget(self, action: #selector(checkBoxButtonTapped(_:)), for: .touchUpInside)
        
        // Apply configuration to CheckBoxButton
        button.checkboxSize = checkboxSize
        button.checkboxBorderWidth = checkboxBorderWidth
        button.checkboxBorderRadius = checkboxBorderRadius
        button.selectedBackgroundColor = selectedBackgroundColor
        button.selectedBorderColor = selectedBorderColor
        button.unselectedBackgroundColor = unselectedBackgroundColor
        button.unselectedBorderColor = unselectedBorderColor
        button.disabledBackgroundColor = disabledBackgroundColor
        button.disabledBorderColor = disabledBorderColor
        button.textMargin = textMargin
        button.textColor = textColor
        button.textColorDisabled = textColorDisabled
        button.textSize = textSize
        
        self.checkBoxButton = button
        flex.addItem(button).minHeight(44)
    }
    
    /// Create error label
    private func createErrorLabel(flex: Flex) {
        let label = UILabel()
        label.font = UIFont.systemFont(ofSize: 12)
        label.textColor = .red
        label.numberOfLines = 0
        label.isHidden = true
        
        self.errorLabel = label
        flex.addItem(label).marginHorizontal(8).marginTop(4).marginBottom(8)
    }
    
    // MARK: - Private Methods - Value Extraction
    
    /// Extract text value (supports literalString or path)
    private func extractTextValue(_ value: Any) -> String {
        if let valueDict = value as? [String: Any] {
            // Support literalString
            if let literalString = valueDict["literalString"] as? String {
                return literalString
            }
            
            // Support path (data binding)
            if valueDict["path"] != nil {
                // Logic to get value from DataModel is handled by C++
                // Return empty string here, waiting for C++ update
                return ""
            }
        }
        
        // Direct string
        return String(describing: value)
    }
    
    // MARK: - Private Methods - Error Display
    
    /// Show error message
    private func showError(_ message: String) {
        errorLabel?.text = message
        errorLabel?.isHidden = false
        notifyLayoutChanged()
    }
    
    /// Hide error message
    private func hideError() {
        errorLabel?.text = nil
        errorLabel?.isHidden = true
        notifyLayoutChanged()
    }
    
    // MARK: - Private Methods - Data Binding
    
    /// Send data change to C++ DataBinding Module
    private func sendDataChangeToNative(_ value: Bool) {
        Logger.shared.debug("Syncing data to native: value=\(value)")
        syncState(["checked": value])
    }
    
    // MARK: - Event Handlers
    
    /// CheckBoxButton tap handler
    @objc private func checkBoxButtonTapped(_ sender: CheckBoxButton) {
        guard !isUpdatingFromNative else { return }
        
        // Toggle selected state
        sender.isSelected = !sender.isSelected
        
        // Send data change
        syncState(["checked": sender.isSelected])
    }
}
