//
//  TextFieldComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// TextFieldComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - label: Label text (displayed as placeholder)
/// - value: Text value (supports literalString or path for data binding)
/// - variant: Input type (longText, number, shortText, obscured)
/// - checks: Validation result (for displaying error messages)
///
/// Style configuration (from localConfig.json):
/// - font-family: Font family name (String, default "PingFang SC")
/// - font-size: Font size (String, default 16)
/// - line-height: Line height (String, default 0 uses system)
/// - letter-spacing: Letter spacing (String, default 0)
/// - color: Text color (String, default black)
/// - placeholder.color: Placeholder color (String)
/// - placeholder.font-size: Placeholder font size (String)
///
/// Design notes:
/// - Uses UITextField for single-line input, UITextView for multi-line (longText variant)
/// - Supports two-way data binding, auto-syncs to C++ DataModel on user input
/// - Supports validation error display with red border and error label
/// - Dynamic input control switching when variant changes at runtime
class TextFieldComponent: Component {
    
    // MARK: - Properties
    
    private var textField: UITextField?
    private var textView: UITextView?
    private var errorLabel: UILabel?
    private var dataBindingPath: String?
    private var isUpdatingFromNative = false
    private var currentVariant: String = "shortText"
    
    // Style configuration properties
    private var fontFamily: String = "PingFang SC"
    private var fontSize: CGFloat = 16
    private var lineHeight: CGFloat = 0  // 0 means use default value
    private var letterSpacing: CGFloat = 0
    private var textColor: UIColor = .black
    
    // Placeholder style configuration
    private var placeholderText: String = ""
    private var placeholderColor: UIColor = UIColor(red: 0.6, green: 0.6, blue: 0.6, alpha: 1.0)
    private var placeholderFont: UIFont?
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        // Component itself is a UIView
        super.init(componentId: componentId, componentType: "TextField", properties: properties)
        
        // Load local style configuration (before creating UI)
        loadLocalStyleConfig()
        
        // Decide which input control to create based on initial properties
        let variant = properties["variant"] as? String ?? "shortText"
        currentVariant = variant
        
        if variant.lowercased() == "longtext" {
            createTextView()
        } else {
            createTextField()
        }
        
        // Create error label
        createErrorLabel()
        
        // Apply initial properties after view is created
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func updateProperties(_ properties: [String: Any]) {
        super.updateProperties(properties)
        
        // Check if input control type needs switching
        if let variant = properties["variant"] as? String {
            if variant != currentVariant {
                switchInputControl(to: variant)
            }
        }
        
        // 1. Update placeholder first
        if let label = properties["label"] {
            let labelText = CSSPropertyParser.extractStringValue(label)
            updatePlaceholder(labelText)
        }
        
        // Support independent placeholder property
//        if let placeholder = properties["placeholder"] {
//            let placeholderText = CSSPropertyParser.extractStringValue(placeholder)
//            updatePlaceholder(placeholderText)
//        }
        
        // 2. Then update text value (data update from C++)
        if let value = properties["value"] {
            // Extract data binding path
            if let valueDict = value as? [String: Any], let path = valueDict["path"] as? String {
                dataBindingPath = path
            }
            
            // Update text content
            isUpdatingFromNative = true
            let text = CSSPropertyParser.extractStringValue(value)
            updateTextValue(text)
            isUpdatingFromNative = false
        }
        
        // Update input type
        if let variant = properties["variant"] as? String {
            applyVariant(variant)
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
            
            // Control editability
            textField?.isEnabled = result
            textView?.isEditable = result
            
            // Visual feedback
            let alpha: CGFloat = result ? 1.0 : 0.5
            textField?.alpha = alpha
            textView?.alpha = alpha
        }
    }
    
    // MARK: - Private Methods - UI Creation
    
    /// Create single-line text input
    private func createTextField() {
        let field = UITextField()
        // Apply style configuration
        applyTextStyle(to: field)
        
        // Apply placeholder style
        applyPlaceholderStyle(to: field)
        
        // Add text change observer
        field.addTarget(self, action: #selector(textFieldDidChange(_:)), for: .editingChanged)
        
        self.textField = field
        
        // Add to Component
        flex.addItem(field)
    }
    
    /// Create multi-line text input
    private func createTextView() {
        let view = UITextView()
        // Apply style configuration
        applyTextStyle(to: view)
        
        // Initialize to placeholder state
        view.text = placeholderText
        view.textColor = placeholderColor
        
        // Use notification to observe text changes instead of delegate
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(textViewDidChange(_:)),
            name: UITextView.textDidChangeNotification,
            object: view
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(textViewDidBeginEditing(_:)),
            name: UITextView.textDidBeginEditingNotification,
            object: view
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(textViewDidEndEditing(_:)),
            name: UITextView.textDidEndEditingNotification,
            object: view
        )
        
        self.textView = view
        
        // Add to Component
        flex.addItem(view)
    }
    
    /// Create error label
    private func createErrorLabel() {
        let label = UILabel()
        label.font = UIFont.systemFont(ofSize: 12)
        label.textColor = .red
        label.numberOfLines = 0
        label.isHidden = true
        
        self.errorLabel = label
        
        // Add to Component
        flex.addItem(label)
    }
    
    // MARK: - Private Methods - Input Control Switching
    
    /// Switch input control type
    private func switchInputControl(to variant: String) {
        // Save current text
        let currentText = textField?.text ?? textView?.text ?? ""
        
        // Remove old control
        textField?.removeFromSuperview()
        textView?.removeFromSuperview()
        errorLabel?.removeFromSuperview()
        textField = nil
        textView = nil
        errorLabel = nil
        
        // Update current variant
        currentVariant = variant
        
        // Create new control
        if variant.lowercased() == "longtext" {
            createTextView()
            textView?.text = currentText
        } else {
            createTextField()
            textField?.text = currentText
        }
        
        // Recreate error label
        createErrorLabel()
        
        // Re-apply styles and variant
        if let field = textField {
            applyTextStyle(to: field)
        } else if let view = textView {
            applyTextStyle(to: view)
        }
        applyVariant(variant)
        
        // Notify layout changed
        notifyLayoutChanged()
    }
    
    // MARK: - Configuration Methods
    
    /// Load local style configuration
    private func loadLocalStyleConfig() {
        guard let config = ComponentStyleConfigManager.shared.getConfig(for: componentType) else {
            Logger.shared.debug("Using default configuration")
            return
        }
        
        Logger.shared.info("Loading local style configuration: \(config)")
        
        // Parse font configuration
        if let family = config["font-family"] as? String {
            self.fontFamily = family
        }
        
        // Use CSSPropertyParser to parse font size
        if let size = config["font-size"] as? String {
            let sizeValue = CSSPropertyParser.parseOffset(size)
            if case .number(let value) = sizeValue {
                self.fontSize = value
            }
        }
        
        // Use CSSPropertyParser to parse line height
        if let height = config["line-height"] as? String {
            // line-height may be "normal" or a numeric value
            if height.lowercased() != "normal" {
                let heightValue = CSSPropertyParser.parseOffset(height)
                if case .number(let value) = heightValue {
                    self.lineHeight = value
                }
            }
        }
        
        // Use CSSPropertyParser to parse letter spacing
        if let spacing = config["letter-spacing"] as? String {
            // letter-spacing may be "normal" or a numeric value
            if spacing.lowercased() != "normal" {
                let spacingValue = CSSPropertyParser.parseOffset(spacing)
                if case .number(let value) = spacingValue {
                    self.letterSpacing = value
                }
            }
        }
        
        // Use CSSPropertyParser to parse color
        if let color = config["color"] as? String {
            let colorValue = CSSPropertyParser.parseColor(color)
            if case .color(let value) = colorValue {
                self.textColor = value
            }
        }
        
        // Parse placeholder configuration
        if let placeholderConfig = config["placeholder"] as? [String: Any] {
            // Use CSSPropertyParser to parse placeholder color
            if let color = placeholderConfig["color"] as? String {
                let colorValue = CSSPropertyParser.parseColor(color)
                if case .color(let value) = colorValue {
                    self.placeholderColor = value
                }
            }
            
            // Use CSSPropertyParser to parse placeholder font size
            if let size = placeholderConfig["font-size"] as? String {
                let sizeValue = CSSPropertyParser.parseOffset(size)
                if case .number(let value) = sizeValue {
                    // Create placeholder-specific font
                    if let customFont = UIFont(name: fontFamily, size: value) {
                        self.placeholderFont = customFont
                    } else {
                        self.placeholderFont = UIFont.systemFont(ofSize: value)
                    }
                }
            }
        }
    }
    
    /// Apply text style to UITextField
    private func applyTextStyle(to textField: UITextField) {
        // Create font
        let font: UIFont
        if let customFont = UIFont(name: fontFamily, size: fontSize) {
            font = customFont
        } else {
            font = UIFont.systemFont(ofSize: fontSize)
        }
        textField.font = font
        textField.textColor = textColor
        
        // Apply letter spacing (if not 0)
        if letterSpacing != 0 {
            // Letter spacing needs to be set via NSAttributedString
            // Set default value here, will be applied when actual text is set
            textField.defaultTextAttributes[.kern] = letterSpacing
        }
    }
    
    /// Apply placeholder style to UITextField
    private func applyPlaceholderStyle(to textField: UITextField) {
        guard !placeholderText.isEmpty else { return }
        
        // Use NSAttributedString to set styled placeholder
        let font = placeholderFont ?? textField.font ?? UIFont.systemFont(ofSize: fontSize)
        
        var attributes: [NSAttributedString.Key: Any] = [
            .foregroundColor: placeholderColor,
            .font: font
        ]
        
        // Apply letter spacing
        if letterSpacing != 0 {
            attributes[.kern] = letterSpacing
        }
        
        textField.attributedPlaceholder = NSAttributedString(
            string: placeholderText,
            attributes: attributes
        )
    }
    
    /// Apply text style to UITextView
    private func applyTextStyle(to textView: UITextView) {
        // Create font
        let font: UIFont
        if let customFont = UIFont(name: fontFamily, size: fontSize) {
            font = customFont
        } else {
            font = UIFont.systemFont(ofSize: fontSize)
        }
        textView.font = font
        textView.textColor = textColor
        
        // Apply letter spacing and line height (if not 0)
        if letterSpacing != 0 || lineHeight != 0 {
            let paragraphStyle = NSMutableParagraphStyle()
            if lineHeight != 0 {
                paragraphStyle.lineSpacing = lineHeight - font.lineHeight
                paragraphStyle.minimumLineHeight = lineHeight
                paragraphStyle.maximumLineHeight = lineHeight
            }
            
            textView.typingAttributes = [
                .font: font,
                .foregroundColor: textColor,
                .kern: letterSpacing,
                .paragraphStyle: paragraphStyle
            ]
        }
    }
    
    // MARK: - Private Methods - Variant Handling
    
    /// Apply input type variant
    /// A2UI v0.9 protocol values: longText, number, shortText, obscured
    private func applyVariant(_ variant: String) {
        switch variant.lowercased() {
        case "number":
            textField?.keyboardType = .decimalPad
            
        case "longtext":
            // Multi-line text already handled in createTextView
            break
            
        case "obscured":
            textField?.isSecureTextEntry = true
            
        case "shorttext":
            fallthrough
        default:
            textField?.keyboardType = .default
            textField?.isSecureTextEntry = false
        }
        
    }
    
    // MARK: - Private Methods - Placeholder Management
    
    /// Update placeholder text
    private func updatePlaceholder(_ text: String) {
        placeholderText = text
        
        if let textField = textField {
            // UITextField uses native placeholder
            applyPlaceholderStyle(to: textField)
        } else if let textView = textView {
            // UITextView uses simulated placeholder
            if isTextViewShowingPlaceholder() {
                textView.text = text
                textView.textColor = placeholderColor
            }
        }
    }
    
    /// Update text value
    private func updateTextValue(_ text: String) {
        if let textField = textField {
            // UITextField: show placeholder when empty string
            textField.text = text.isEmpty ? "" : text
        } else if let textView = textView {
            // UITextView: needs to handle placeholder state
            if text.isEmpty {
                // Show placeholder
                textView.text = placeholderText
                textView.textColor = placeholderColor
            } else {
                // Show actual text
                textView.text = text
                textView.textColor = textColor
            }
        }
    }
    
    /// Check if TextView is showing placeholder
    private func isTextViewShowingPlaceholder() -> Bool {
        guard let textView = textView else { return false }
        return textView.textColor == placeholderColor && textView.text == placeholderText
    }
    
    // MARK: - Private Methods - Error Display
    
    /// Show error message
    private func showError(_ message: String) {
        errorLabel?.text = message
        errorLabel?.isHidden = false
        
        // Add red border
        textField?.layer.borderColor = UIColor.red.cgColor
        textField?.layer.borderWidth = 1.0
        textView?.layer.borderColor = UIColor.red.cgColor
        textView?.layer.borderWidth = 1.0
    }
    
    /// Hide error message
    private func hideError() {
        errorLabel?.text = nil
        errorLabel?.isHidden = true
        
        // Restore default border
        textField?.layer.borderWidth = 0
        textView?.layer.borderColor = UIColor.lightGray.cgColor
        textView?.layer.borderWidth = 1.0
    }
    
    // MARK: - Private Methods - Data Binding
    
    // MARK: - Event Handlers
    
    /// TextField text change handler
    @objc private func textFieldDidChange(_ textField: UITextField) {
        guard !isUpdatingFromNative else { return }
        
        let newValue = textField.text ?? ""
        syncState(["value": newValue])
    }
    
    /// TextView begin editing handler
    @objc private func textViewDidBeginEditing(_ notification: Notification) {
        guard let textView = notification.object as? UITextView else { return }
        
        // Clear placeholder effect
        if isTextViewShowingPlaceholder() {
            textView.text = ""
            textView.textColor = textColor
        }
    }
    
    /// TextView end editing handler
    @objc private func textViewDidEndEditing(_ notification: Notification) {
        guard let textView = notification.object as? UITextView else { return }
        
        // If empty, show placeholder
        if textView.text.isEmpty {
            textView.text = placeholderText
            textView.textColor = placeholderColor
        }
    }
    
    /// TextView text change handler
    @objc private func textViewDidChange(_ notification: Notification) {
        guard let textView = notification.object as? UITextView else { return }
        guard !isUpdatingFromNative else { return }
        
        // Ignore text in placeholder state
        if isTextViewShowingPlaceholder() {
            return
        }
        
        let newValue = textView.text ?? ""
        syncState(["value" : newValue])
    }
    
    deinit {
        // Remove notification observer
        NotificationCenter.default.removeObserver(self)
    }
}
