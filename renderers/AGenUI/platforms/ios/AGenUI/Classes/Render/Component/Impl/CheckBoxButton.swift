//
//  CheckBoxButton.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/1.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// CheckBoxButton control (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - label: Display text (String)
/// - value: Associated value for data binding (String)
/// - isSelected: Checkbox selected state (Boolean)
/// - isEnabled: Checkbox enabled state (Boolean)
///
/// Design notes:
/// - Custom UIControl with checkbox (left) and label (right) layout using FlexLayout
/// - Three visual states: selected (blue fill + white checkmark), unselected (transparent + border), disabled (gray)
/// - Used by CheckBoxComponent and ChoicePickerComponent as the base control
class CheckBoxButton: UIControl {
    
    // MARK: - Public Properties
    
    /// Label text
    var label: String = "" {
        didSet {
            labelView.text = label
            labelView.flex.markDirty()
            setNeedsLayout()
        }
    }
    
    /// Associated value (for data binding)
    var value: String = ""
    
    // MARK: - Style Configuration Properties
    
    /// Checkbox size
    var checkboxSize: CGFloat = 16 {
        didSet {
            updateLayout()
        }
    }
    
    /// Checkbox border width
    var checkboxBorderWidth: CGFloat = 1.5 {
        didSet {
            updateAppearance()
        }
    }
    
    /// Checkbox corner radius
    var checkboxBorderRadius: CGFloat = 6 {
        didSet {
            checkBoxView.layer.cornerRadius = checkboxBorderRadius
        }
    }
    
    /// Selected state background color
    var selectedBackgroundColor: UIColor = UIColor(red: 0x2E/255.0, green: 0x82/255.0, blue: 0xFF/255.0, alpha: 1.0) {
        didSet {
            updateAppearance()
        }
    }
    
    /// Selected state border color
    var selectedBorderColor: UIColor = UIColor(red: 0x2E/255.0, green: 0x82/255.0, blue: 0xFF/255.0, alpha: 1.0) {
        didSet {
            updateAppearance()
        }
    }
    
    /// Unselected state background color
    var unselectedBackgroundColor: UIColor = .clear {
        didSet {
            updateAppearance()
        }
    }
    
    /// Unselected state border color
    var unselectedBorderColor: UIColor = UIColor.black.withAlphaComponent(0.1) {
        didSet {
            updateAppearance()
        }
    }
    
    /// Disabled state background color
    var disabledBackgroundColor: UIColor = UIColor(red: 0xEB/255.0, green: 0xEB/255.0, blue: 0xEB/255.0, alpha: 1.0) {
        didSet {
            updateAppearance()
        }
    }
    
    /// Disabled state border color
    var disabledBorderColor: UIColor = UIColor.black.withAlphaComponent(0.1) {
        didSet {
            updateAppearance()
        }
    }
    
    /// Text to checkbox spacing
    var textMargin: CGFloat = 8 {
        didSet {
            updateLayout()
        }
    }
    
    /// Text color
    var textColor: UIColor = .black {
        didSet {
            updateAppearance()
        }
    }
    
    /// Disabled state text color
    var textColorDisabled: UIColor = UIColor.black.withAlphaComponent(0.4) {
        didSet {
            updateAppearance()
        }
    }
    
    /// Text size
    var textSize: CGFloat = 16 {
        didSet {
            labelView.font = UIFont.systemFont(ofSize: textSize, weight: .regular)
        }
    }
    
    // MARK: - UIControl Override
    
    override var isSelected: Bool {
        didSet {
            updateAppearance()
        }
    }
    
    override var isEnabled: Bool {
        didSet {
            updateAppearance()
        }
    }
    
    // MARK: - Private Properties
    
    private let labelView: UILabel = {
        let label = UILabel()
        label.font = UIFont.systemFont(ofSize: 16, weight: .regular)
        label.textColor = UIColor.black
        label.numberOfLines = 0
        return label
    }()
    
    private let checkBoxView: UIView = {
        let view = UIView()
        view.layer.cornerRadius = 6
        view.layer.borderWidth = 1.5
        return view
    }()
    
    private let checkMarkImageView: UIImageView = {
        let imageView = UIImageView()
        imageView.contentMode = .scaleAspectFit
        imageView.tintColor = .white
        return imageView
    }()
    
    // MARK: - Initialization
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupViews()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupViews()
    }
    
    // MARK: - Private Methods
    
    private func setupViews() {
        // Use FlexLayout for layout
        updateLayout()
        updateAppearance()
    }
    
    private func updateLayout() {
        // Clear old layout
        flex.markDirty()
        
        // Re-layout using configured properties
        flex.direction(.row).alignItems(.center).define { flex in
            // Add checkbox container (left, using configured size)
            checkBoxView.isUserInteractionEnabled = false
            if checkBoxView.superview == nil {
                checkBoxView.addSubview(checkMarkImageView)
            }
            
            // Set checkmark icon frame (centered, dynamically calculated based on checkbox size)
            let iconSize = checkboxSize * 0.75
            let iconOffset = (checkboxSize - iconSize) / 2
            checkMarkImageView.frame = CGRect(x: iconOffset, y: iconOffset, width: iconSize, height: iconSize)
            checkMarkImageView.isUserInteractionEnabled = false
            
            flex.addItem(checkBoxView).width(checkboxSize).height(checkboxSize).marginRight(textMargin)
            
            // Add label (right, fills remaining space)
            labelView.isUserInteractionEnabled = false
            flex.addItem(labelView).grow(1).shrink(1)
        }
    }
    
    private func updateAppearance() {
        if !isEnabled {
            // Disabled state: use disabled style
            checkBoxView.backgroundColor = disabledBackgroundColor
            checkBoxView.layer.borderColor = disabledBorderColor.cgColor
            checkBoxView.layer.borderWidth = checkboxBorderWidth
            labelView.textColor = textColorDisabled
            
            // If selected, show checkmark
            if isSelected {
                let iconSize = checkboxSize * 0.6
                let config = UIImage.SymbolConfiguration(pointSize: iconSize, weight: .semibold)
                checkMarkImageView.image = UIImage(systemName: "checkmark", withConfiguration: config)
                checkMarkImageView.isHidden = false
            } else {
                checkMarkImageView.image = nil
                checkMarkImageView.isHidden = true
            }
        } else if isSelected {
            // Selected state: use selected style
            checkBoxView.backgroundColor = selectedBackgroundColor
            checkBoxView.layer.borderColor = selectedBorderColor.cgColor
            checkBoxView.layer.borderWidth = 0
            labelView.textColor = textColor
            
            // Show checkmark
            let iconSize = checkboxSize * 0.6
            let config = UIImage.SymbolConfiguration(pointSize: iconSize, weight: .semibold)
            checkMarkImageView.image = UIImage(systemName: "checkmark", withConfiguration: config)
            checkMarkImageView.isHidden = false
        } else {
            // Unselected state: use unselected style
            checkBoxView.backgroundColor = unselectedBackgroundColor
            checkBoxView.layer.borderColor = unselectedBorderColor.cgColor
            checkBoxView.layer.borderWidth = checkboxBorderWidth
            labelView.textColor = textColor
            
            // Hide checkmark
            checkMarkImageView.image = nil
            checkMarkImageView.isHidden = true
        }
    }
}
