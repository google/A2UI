//
//  SliderComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// SliderComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - min: Minimum value (Number, default 0)
/// - max: Maximum value (Number, default 100)
/// - value: Current value (supports literalNumber or path for data binding)
///
/// Style configuration (from localConfig.json):
/// - slider-height: Slider control height (String, default 48)
/// - track-height: Track bar height (String, default 4)
/// - track-corner-radius: Track corner radius (String, default 2)
/// - minimum-track-color: Filled track color (String, default blue)
/// - maximum-track-color: Unfilled track color (String, default light gray)
/// - thumb-outer-diameter: Thumb outer circle diameter (String, default 48)
/// - thumb-outer-color: Thumb outer circle color (String, default white)
/// - thumb-inner-diameter: Thumb inner circle diameter (String, default 16)
/// - thumb-inner-color: Thumb inner circle color (String, default blue)
///
/// Design notes:
/// - Uses UISlider as base control with custom track and thumb images
/// - Supports two-way data binding, user sliding auto-syncs to C++ DataModel
/// - Track images use rounded rectangles with configurable height and corner radius
/// - Thumb image uses concentric circles (outer + inner) design
class SliderComponent: Component {
    
    // MARK: - Properties
    
    private var slider: UISlider?
    private var dataBindingPath: String?
    private var isUpdatingFromNative = false
    private var minValue: Float = 0.0
    private var maxValue: Float = 100.0
    
    // Style configuration properties (configurable via localConfig.json)
    private var sliderHeight: CGFloat = 48
    private var trackHeight: CGFloat = 4
    private var trackCornerRadius: CGFloat = 2
    private var minimumTrackColor: UIColor = UIColor(red: 0x1A/255.0, green: 0x66/255.0, blue: 0xFF/255.0, alpha: 1.0)
    private var maximumTrackColor: UIColor = UIColor(red: 0xEE/255.0, green: 0xF0/255.0, blue: 0xF4/255.0, alpha: 1.0)
    private var thumbOuterDiameter: CGFloat = 48
    private var thumbOuterColor: UIColor = .white
    private var thumbInnerDiameter: CGFloat = 16
    private var thumbInnerColor: UIColor = UIColor(red: 0x1A/255.0, green: 0x66/255.0, blue: 0xFF/255.0, alpha: 1.0)
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Slider", properties: properties)
        
        // Load local style config
        loadLocalStyleConfig()
        
        // Create slider and add to self
        createSlider()
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        super.updateProperties(properties)
        
        // Update minimum value
        if let min = properties["min"] {
            minValue = Float(CSSPropertyParser.extractNumberValue(min) ?? 0)
            slider?.minimumValue = minValue
        }
        
        // Update maximum value
        if let max = properties["max"] {
            maxValue = Float(CSSPropertyParser.extractNumberValue(max) ?? 0)
            slider?.maximumValue = maxValue
        }
        
        // Update current value (data update from C++)
        if let value = properties["value"] {
            // Extract data binding path
            if let valueDict = value as? [String: Any], let path = valueDict["path"] as? String {
                dataBindingPath = path
            }
            
            // Update slider value
            isUpdatingFromNative = true
            let numericValue = Float(CSSPropertyParser.extractNumberValue(value) ?? 0)
            
            // Ensure value is within range
            let clampedValue = max(minValue, min(maxValue, numericValue))
            if let slider = slider, slider.value != clampedValue {
                slider.value = clampedValue
            }
            isUpdatingFromNative = false
        }
    }
    
    // MARK: - Configuration Methods
    
    /// Load local style configuration
    private func loadLocalStyleConfig() {
        guard let config = ComponentStyleConfigManager.shared.getConfig(for: componentType) else {
            return
        }
        
        // Parse slider height
        if let height = config["slider-height"] as? String,
           let value = ComponentStyleConfigManager.parseSize(height) {
            self.sliderHeight = value
        }
        
        // Parse track height
        if let height = config["track-height"] as? String,
           let value = ComponentStyleConfigManager.parseSize(height) {
            self.trackHeight = value
        }
        
        // Parse track corner radius
        if let radius = config["track-corner-radius"] as? String,
           let value = ComponentStyleConfigManager.parseSize(radius) {
            self.trackCornerRadius = value
        }
        
        // Parse track colors
        if let color = config["minimum-track-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.minimumTrackColor = value
        }
        
        if let color = config["maximum-track-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.maximumTrackColor = value
        }
        
        // Parse thumb styles
        if let diameter = config["thumb-outer-diameter"] as? String,
           let value = ComponentStyleConfigManager.parseSize(diameter) {
            self.thumbOuterDiameter = value
        }
        
        if let color = config["thumb-outer-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.thumbOuterColor = value
        }
        
        if let diameter = config["thumb-inner-diameter"] as? String,
           let value = ComponentStyleConfigManager.parseSize(diameter) {
            self.thumbInnerDiameter = value
        }
        
        if let color = config["thumb-inner-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.thumbInnerColor = value
        }
    }
    
    // MARK: - Private Methods - UI Creation
    
    /// Create slider
    private func createSlider() {
        let sliderControl = UISlider()
        sliderControl.minimumValue = minValue
        sliderControl.maximumValue = maxValue
        sliderControl.value = minValue
        sliderControl.isContinuous = true
        
        // Apply track colors
        sliderControl.minimumTrackTintColor = minimumTrackColor
        sliderControl.maximumTrackTintColor = maximumTrackColor
        
        // Create custom track images (control height and corner radius)
        let minTrackImage = createTrackImage(color: minimumTrackColor)
        let maxTrackImage = createTrackImage(color: maximumTrackColor)
        sliderControl.setMinimumTrackImage(minTrackImage, for: .normal)
        sliderControl.setMaximumTrackImage(maxTrackImage, for: .normal)
        
        // Create custom thumb image (outer circle with inner circle)
        let thumbImage = createCustomThumbImage()
        sliderControl.setThumbImage(thumbImage, for: .normal)
        sliderControl.setThumbImage(thumbImage, for: .highlighted)
        
        // Add value change listener
        sliderControl.addTarget(self, action: #selector(sliderValueChanged(_:)), for: .valueChanged)
        
        self.slider = sliderControl
        
        // Add to self using FlexLayout
        flex.addItem(sliderControl).height(sliderHeight)
    }
    
    /// Create track image (control height and corner radius)
    private func createTrackImage(color: UIColor) -> UIImage? {
        let size = CGSize(width: trackHeight, height: trackHeight)
        
        UIGraphicsBeginImageContextWithOptions(size, false, 0)
        guard let context = UIGraphicsGetCurrentContext() else { return nil }
        
        // Draw rounded rectangle
        let rect = CGRect(origin: .zero, size: size)
        let path = UIBezierPath(roundedRect: rect, cornerRadius: trackCornerRadius)
        
        context.setFillColor(color.cgColor)
        context.addPath(path.cgPath)
        context.fillPath()
        
        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        return image?.resizableImage(withCapInsets: UIEdgeInsets(top: 0, left: trackCornerRadius, bottom: 0, right: trackCornerRadius))
    }
    
    /// Create custom thumb image (outer circle with inner circle)
    private func createCustomThumbImage() -> UIImage? {
        let size = CGSize(width: thumbOuterDiameter, height: thumbOuterDiameter)
        
        UIGraphicsBeginImageContextWithOptions(size, false, 0)
        guard let context = UIGraphicsGetCurrentContext() else { return nil }
        
        // Draw outer circle
        let outerRect = CGRect(origin: .zero, size: size)
        context.setFillColor(thumbOuterColor.cgColor)
        context.fillEllipse(in: outerRect)
        
        // Draw inner circle (centered)
        let innerOrigin = CGPoint(
            x: (thumbOuterDiameter - thumbInnerDiameter) / 2,
            y: (thumbOuterDiameter - thumbInnerDiameter) / 2
        )
        let innerRect = CGRect(origin: innerOrigin, size: CGSize(width: thumbInnerDiameter, height: thumbInnerDiameter))
        context.setFillColor(thumbInnerColor.cgColor)
        context.fillEllipse(in: innerRect)
        
        let image = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        return image
    }
        
    // MARK: - Event Handlers
    
    /// Slider value changed handler
    @objc private func sliderValueChanged(_ slider: UISlider) {
        guard !isUpdatingFromNative else { return }
        
        let newValue = slider.value
        syncState(["value": newValue])
    }
}
