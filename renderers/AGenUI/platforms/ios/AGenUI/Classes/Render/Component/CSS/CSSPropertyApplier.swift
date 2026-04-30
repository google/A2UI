//
//  CSSPropertyApplier.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// CSS property applier
/// Responsible for applying parsed CSS properties to components and views
class CSSPropertyApplier {
    
    // MARK: - Main Application Methods
    
    /// Applies CSS properties to a UIView (Component as View mode)
    /// - Parameters:
    ///   - properties: Property dictionary
    ///   - view: Target view (Component itself is a UIView)
    static func apply(properties: [String: Any], to view: UIView) {
        // Preprocess multi-value properties (e.g., "padding": "10px 20px 30px 40px")
        let processedProperties = preprocessMultiValueProperties(properties)
        
        // Sort properties by priority
        let sortedProperties = sortByPriority(processedProperties)
        
        // Apply properties one by one
        for (key, value) in sortedProperties {
            // Convert value to string (supports Int, Double, etc.)
            let valueStr: String
            if let str = value as? String {
                valueStr = str
            } else {
                valueStr = "\(value)"
            }
            applyProperty(key: key, value: valueStr, to: view)
        }
    }
    
    /// Applies CSS properties to a component (BaseA2UIComponent mode)
    /// - Parameters:
    ///   - properties: Property dictionary
    ///   - component: Target component
    ///   - view: Target view
    static func apply(properties: [String: Any], to component: Component, view: UIView) {
        // Preprocess multi-value properties (e.g., "padding": "10px 20px 30px 40px")
        let processedProperties = preprocessMultiValueProperties(properties)
        
        // CSS standard: calculation rules for aspect-ratio, width, and height
        // Reference: https://drafts.csswg.org/css-sizing-4/#aspect-ratio
        //
        // 1. Only aspect-ratio set: width determined by container, height = width / aspect-ratio
        // 2. width + aspect-ratio set: uses specified width, height = width / aspect-ratio
        // 3. height + aspect-ratio set: uses specified height, width = height * aspect-ratio
        // 4. width + height + aspect-ratio set: width and height take precedence, aspect-ratio is ignored
        // 5. With min/max constraints: dimensions calculated first, then constraints applied, aspect-ratio may be broken
        //
        // Current implementation: FlexLayout automatically handles these property priorities, no extra processing needed
        // Note: If width + height + aspect-ratio are set together, FlexLayout behavior matches CSS standard

        // Sort properties by priority
        let sortedProperties = sortByPriority(processedProperties)
        
        // Apply properties one by one
        for (key, value) in sortedProperties {
            // Convert value to string (supports Int, Double, etc.)
            let valueStr: String
            if let str = value as? String {
                valueStr = str
            } else {
                valueStr = "\(value)"
            }
            applyProperty(key: key, value: valueStr, to: component, view: view)
        }
    }
    
    // MARK: - Property Sorting
    
    /// Sort properties by priority
    /// - Parameter properties: Property dictionary
    /// - Returns: Sorted property array
    private static func sortByPriority(_ properties: [String: Any]) -> [(String, Any)] {
        // Pre-compute priorities for all properties to avoid repeated lookups during sort comparison
        // Sort complexity O(n log n), before optimization each comparison calls config(for:) twice, totaling 2n log n calls
        // After optimization only n lookups needed, performance improved by approximately 2 log n times
        var priorityCache: [String: Int] = [:]
        priorityCache.reserveCapacity(properties.count)
        
        for key in properties.keys {
            let config = CSSPropertyRegistry.config(for: key)
            priorityCache[key] = config?.priority ?? 0
        }
        
        // Sort using cached priorities
        return properties.sorted { prop1, prop2 in
            let priority1 = priorityCache[prop1.key] ?? 0
            let priority2 = priorityCache[prop2.key] ?? 0
            return priority1 > priority2
        }
    }
    
    // MARK: - Single Property Application
    
    /// Applies a single property (Component as View mode)
    /// - Parameters:
    ///   - key: Property name
    ///   - value: Property value string
    ///   - view: Target view
    private static func applyProperty(key: String, value: String, to view: UIView) {
        // Get property configuration
        guard let config = CSSPropertyRegistry.config(for: key) else {
            #if DEBUG
            Logger.shared.debug("Unknown property: \(key)")
            #endif
            return
        }
        
        // Parse property value
        let parsedValue = CSSPropertyParser.parse(value: value, config: config)
        
        // Validate property value
        if !parsedValue.isValid {
            #if DEBUG
            Logger.shared.debug("Invalid value for property \(key): \(value)")
            #endif
            return
        }
        
        // Apply based on property name
        applyPropertyByKey(key, parsedValue: parsedValue, to: view)
    }
    
    /// Applies a single property (BaseA2UIComponent mode)
    /// - Parameters:
    ///   - key: Property name
    ///   - value: Property value string
    ///   - component: Target component
    ///   - view: Target view
    private static func applyProperty(key: String, value: String, to component: Component, view: UIView) {
        // Get property configuration
        guard let config = CSSPropertyRegistry.config(for: key) else {
            #if DEBUG
            Logger.shared.debug("Unknown property: \(key)")
            #endif
            return
        }
        
        // Parse property value
        let parsedValue = CSSPropertyParser.parse(value: value, config: config)
        
        // Validate property value
        if !parsedValue.isValid {
            #if DEBUG
            Logger.shared.debug("Invalid value for property \(key): \(value)")
            #endif
            return
        }
        
        // Apply based on property name
        applyPropertyByKey(key, parsedValue: parsedValue, to: view)
    }
    
    /// Applies property value based on property name
    /// - Parameters:
    ///   - key: Property name
    ///   - parsedValue: Parsed property value
    ///   - view: Target view
    private static func applyPropertyByKey(_ key: String, parsedValue: CSSPropertyValue, to view: UIView) {
        switch key {
        // Position properties
        case "position":
            applyPosition(parsedValue, to: view)
        case "top":
            applyTop(parsedValue, to: view)
        case "left":
            applyLeft(parsedValue, to: view)
        case "bottom":
            applyBottom(parsedValue, to: view)
        case "right":
            applyRight(parsedValue, to: view)
        case "z-index":
            applyZIndex(parsedValue, to: view)
            
        // RTL Position properties
        case "inset-inline-start":
            applyInsetInlineStart(parsedValue, to: view)
        case "inset-inline-end":
            applyInsetInlineEnd(parsedValue, to: view)
        case "inset-block-start":
            applyInsetBlockStart(parsedValue, to: view)
        case "inset-block-end":
            applyInsetBlockEnd(parsedValue, to: view)
            
        // Size control
        case "width":
            applyWidth(parsedValue, to: view)
        case "height":
            applyHeight(parsedValue, to: view)
        case "max-width":
            applyMaxWidth(parsedValue, to: view)
        case "max-height":
            applyMaxHeight(parsedValue, to: view)
        case "min-width":
            applyMinWidth(parsedValue, to: view)
        case "min-height":
            applyMinHeight(parsedValue, to: view)
            
        // Spacing control
        case "margin":
            applyMargin(parsedValue, to: view)
        case "padding":
            applyPadding(parsedValue, to: view)
        case "margin-inline-start":
            applyMarginInlineStart(parsedValue, to: view)
        case "margin-inline-end":
            applyMarginInlineEnd(parsedValue, to: view)
            
        // Layout alignment
        case "justify-content":
            applyJustifyContent(parsedValue, to: view)
        case "align-items":
            applyAlignItems(parsedValue, to: view)
        case "align-self":
            applyAlignSelf(parsedValue, to: view)
        case "flex-grow":
            applyFlexGrow(parsedValue, to: view)
        case "flex-shrink":
            applyFlexShrink(parsedValue, to: view)
        case "aspect-ratio":
            applyFlexAspect(parsedValue, to: view)
            
        // Style properties
        case "background":
            applyBackgroundColor(parsedValue, to: view)
        case "background-color":
            applyBackgroundColor(parsedValue, to: view)
        case "background-image":
            applyBackgroundImage(parsedValue, to: view)
        case "color":
            applyTextColor(parsedValue, to: view)
        case "border-radius":
            applyBorderRadius(parsedValue, to: view)
        case "opacity":
            applyOpacity(parsedValue, to: view)
            
        // P1: Directional spacing properties
        case "margin-block-start":
            applyMarginBlockStart(parsedValue, to: view)
        case "margin-block-end":
            applyMarginBlockEnd(parsedValue, to: view)
        case "padding-inline-start":
            applyPaddingInlineStart(parsedValue, to: view)
        case "padding-inline-end":
            applyPaddingInlineEnd(parsedValue, to: view)
        case "padding-block-start":
            applyPaddingBlockStart(parsedValue, to: view)
        case "padding-block-end":
            applyPaddingBlockEnd(parsedValue, to: view)
            
        // P1: Border properties
        case "border-color":
            applyBorderColor(parsedValue, to: view)
        case "border-width":
            applyBorderWidth(parsedValue, to: view)
            
        // Physical directional margin properties
        case "margin-top":
            applyMarginTop(parsedValue, to: view)
        case "margin-right":
            applyMarginRight(parsedValue, to: view)
        case "margin-bottom":
            applyMarginBottom(parsedValue, to: view)
        case "margin-left":
            applyMarginLeft(parsedValue, to: view)
            
        // Physical directional padding properties
        case "padding-top":
            applyPaddingTop(parsedValue, to: view)
        case "padding-right":
            applyPaddingRight(parsedValue, to: view)
        case "padding-bottom":
            applyPaddingBottom(parsedValue, to: view)
        case "padding-left":
            applyPaddingLeft(parsedValue, to: view)
            
        // Flex layout extension properties
        case "flex-wrap":
            applyFlexWrap(parsedValue, to: view)
        case "align-content":
            applyAlignContent(parsedValue, to: view)
        case "flex-basis":
            applyFlexBasis(parsedValue, to: view)
            
        // Requirement 9: Display control and visual effects properties
        case "border-style":
            applyBorderStyle(parsedValue, to: view)
        case "overflow":
            applyOverflow(parsedValue, to: view)
        case "display":
            applyDisplay(parsedValue, to: view)
        case "visibility":
            applyVisibility(parsedValue, to: view)
        case "filter":
            applyFilter(parsedValue, to: view)
        case "box-shadow":
            applyBoxShadow(parsedValue, to: view)
            
        default:
            #if DEBUG
            Logger.shared.debug("Unhandled property: \(key)")
            #endif
        }
    }
    
    // MARK: - Size Control Properties
    
    /// Applies width
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyWidth(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let width):
            view.flex.width(width)
        case .percentage(let percent):
            // FlexLayout percentage method: percent is 0.0-1.0, needs to be converted to 0-100
            view.flex.width(CGFloat(percent * 100)%)
        case .keyword:
            // auto keyword: do not set explicit width, let FlexLayout auto-calculate based on content
            view.flex.width(nil)
            break
        default:
            break
        }
    }
    
    /// Applies height
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyHeight(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let height):
            view.flex.height(height)
        case .percentage(let percent):
            // FlexLayout percentage method: percent is 0.0-1.0, needs to be converted to 0-100
            view.flex.height(CGFloat(percent * 100)%)
        case .keyword:
            // auto keyword: do not set explicit height, let FlexLayout auto-calculate based on content
            view.flex.height(nil)
            break
        default:
            break
        }
    }
    
    /// Applies max width
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMaxWidth(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let maxWidth):
            view.flex.maxWidth(maxWidth)
        case .percentage(let percent):
            view.flex.maxWidth(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies max height
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMaxHeight(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let maxHeight):
            view.flex.maxHeight(maxHeight)
        case .percentage(let percent):
            view.flex.maxHeight(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies min width
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMinWidth(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let minWidth):
            view.flex.minWidth(minWidth)
        case .percentage(let percent):
            view.flex.minWidth(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies min height
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMinHeight(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let minHeight):
            view.flex.minHeight(minHeight)
        case .percentage(let percent):
            view.flex.minHeight(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    // MARK: - Spacing Control Properties
    
    /// Applies uniform margin
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMargin(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let margin):
            view.flex.margin(margin)
        case .percentage(let percent):
            view.flex.margin(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies uniform padding
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyPadding(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let padding):
            view.flex.padding(padding)
        case .percentage(let percent):
            view.flex.padding(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies inline-start margin (RTL support)
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMarginInlineStart(_ value: CSSPropertyValue, to view: UIView) {
        let isRTL = RTLHelper.isRTL(for: view)
        
        switch value {
        case .number(let margin):
            if isRTL {
                view.flex.marginRight(margin)
            } else {
                view.flex.marginLeft(margin)
            }
        case .percentage(let percent):
            if isRTL {
                view.flex.marginRight(CGFloat(percent * 100)%)
            } else {
                view.flex.marginLeft(CGFloat(percent * 100)%)
            }
        default:
            break
        }
    }
    
    /// Applies inline-end margin (RTL support)
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMarginInlineEnd(_ value: CSSPropertyValue, to view: UIView) {
        let isRTL = RTLHelper.isRTL(for: view)
        
        switch value {
        case .number(let margin):
            if isRTL {
                view.flex.marginLeft(margin)
            } else {
                view.flex.marginRight(margin)
            }
        case .percentage(let percent):
            if isRTL {
                view.flex.marginLeft(CGFloat(percent * 100)%)
            } else {
                view.flex.marginRight(CGFloat(percent * 100)%)
            }
        default:
            break
        }
    }
    
    // MARK: - Layout Alignment Properties
    
    /// Applies main-axis alignment
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyJustifyContent(_ value: CSSPropertyValue, to view: UIView) {
        guard case .keyword(let alignment) = value else { return }
        
        switch alignment {
        case "start", "flex-start":
            view.flex.justifyContent(.start)
        case "center":
            view.flex.justifyContent(.center)
        case "end", "flex-end":
            view.flex.justifyContent(.end)
        case "space-between":
            view.flex.justifyContent(.spaceBetween)
        case "space-around":
            view.flex.justifyContent(.spaceAround)
        case "space-evenly":
            view.flex.justifyContent(.spaceEvenly)
        default:
            #if DEBUG
            Logger.shared.debug("Unknown justify-content value: \(alignment)")
            #endif
        }
    }
    
    /// Applies cross-axis alignment
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyAlignItems(_ value: CSSPropertyValue, to view: UIView) {
        guard case .keyword(let alignment) = value else { return }
        
        switch alignment {
        case "start", "flex-start":
            view.flex.alignItems(.start)
        case "center":
            view.flex.alignItems(.center)
        case "end", "flex-end":
            view.flex.alignItems(.end)
        case "stretch":
            view.flex.alignItems(.stretch)
        case "baseline":
            view.flex.alignItems(.baseline)
        default:
            #if DEBUG
            Logger.shared.debug("Unknown align-items value: \(alignment)")
            #endif
        }
    }
    
    /// Applies self-alignment
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyAlignSelf(_ value: CSSPropertyValue, to view: UIView) {
        guard case .keyword(let alignment) = value else { return }
        
        switch alignment {
        case "auto":
            view.flex.alignSelf(.auto)
        case "start", "flex-start":
            view.flex.alignSelf(.start)
        case "center":
            view.flex.alignSelf(.center)
        case "end", "flex-end":
            view.flex.alignSelf(.end)
        case "stretch":
            view.flex.alignSelf(.stretch)
        case "baseline":
            view.flex.alignSelf(.baseline)
        default:
            #if DEBUG
            Logger.shared.debug("Unknown align-self value: \(alignment)")
            #endif
        }
    }
    
    /// Applies flex grow factor
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyFlexGrow(_ value: CSSPropertyValue, to view: UIView) {
        guard case .number(let grow) = value else { return }
        view.flex.grow(grow)
    }
    
    /// Applies flex shrink factor
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyFlexShrink(_ value: CSSPropertyValue, to view: UIView) {
        guard case .number(let shrink) = value else { return }
        view.flex.shrink(shrink)
    }
    
    /// Applies aspect ratio
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyFlexAspect(_ value: CSSPropertyValue, to view: UIView) {
        guard case .number(let ratio) = value else { return }
        view.flex.aspectRatio(ratio)
    }
    
    // MARK: - Style Properties
    
    /// Applies background color
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyBackgroundColor(_ value: CSSPropertyValue, to view: UIView) {
        guard case .color(let color) = value else { return }
        view.backgroundColor = color
    }
    
    /// Applies background image
    /// Supports URL formats:
    /// - Network URL: url("https://example.com/image.png")
    /// - Local resource: url("res://icon") or url(paper.gif)
    /// - Local file: url("file:///path/to/image.png")
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyBackgroundImage(_ value: CSSPropertyValue, to view: UIView) {
        guard case .url(let urlString) = value else { return }
        
        if urlString.isEmpty {
            // Clear background image
            view.layer.contents = nil
            return
        }
        
        // Determine URL type and load
        if urlString.hasPrefix("http://") || urlString.hasPrefix("https://") {
            // Network image - async load
            loadBackgroundImage(from: urlString, for: view)
        } else if urlString.hasPrefix("res://") {
            // Local resource
            let resName = String(urlString.dropFirst(6))
            if let image = UIImage(named: resName) {
                setBackgroundImage(image, for: view)
            }
        } else if urlString.hasPrefix("file://") {
            // Local file
            let filePath = String(urlString.dropFirst(7))
            if let image = UIImage(contentsOfFile: filePath) {
                setBackgroundImage(image, for: view)
            }
        } else {
            // Load as resource name
            if let image = UIImage(named: urlString) {
                setBackgroundImage(image, for: view)
            }
        }
    }
    
    /// Sets background image to view layer
    /// - Parameters:
    ///   - image: Image
    ///   - view: Target view
    private static func setBackgroundImage(_ image: UIImage, for view: UIView) {
        view.layer.contents = image.cgImage
        view.layer.contentsGravity = .resizeAspectFill
    }
    
    /// Asynchronously loads network background image
    /// - Parameters:
    ///   - urlString: Image URL
    ///   - view: Target view
    private static func loadBackgroundImage(from urlString: String, for view: UIView) {
        guard let url = URL(string: urlString) else { return }
        
        URLSession.shared.dataTask(with: url) { data, _, error in
            guard let data = data,
                  let image = UIImage(data: data),
                  error == nil else {
                return
            }
            DispatchQueue.main.async {
                setBackgroundImage(image, for: view)
            }
        }.resume()
    }
    
    /// Applies border radius
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyBorderRadius(_ value: CSSPropertyValue, to view: UIView) {
        guard case .number(let radius) = value else { return }
        view.layer.cornerRadius = radius
        view.layer.masksToBounds = value.numberValue != 0
    }
    
    /// Applies opacity
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyOpacity(_ value: CSSPropertyValue, to view: UIView) {
        guard case .number(let opacity) = value else { return }
        // Ensure opacity is between 0.0 and 1.0
        view.alpha = max(0.0, min(1.0, opacity))
    }
    
    // MARK: - P1 Directional Spacing Properties
    
    /// Applies block-start margin (maps to margin-top)
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMarginBlockStart(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let margin):
            view.flex.marginTop(margin)
        case .percentage(let percent):
            view.flex.marginTop(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies block-end margin (maps to margin-bottom)
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMarginBlockEnd(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let margin):
            view.flex.marginBottom(margin)
        case .percentage(let percent):
            view.flex.marginBottom(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies inline-start padding (RTL support)
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyPaddingInlineStart(_ value: CSSPropertyValue, to view: UIView) {
        let isRTL = RTLHelper.isRTL(for: view)
        
        switch value {
        case .number(let padding):
            if isRTL {
                view.flex.paddingRight(padding)
            } else {
                view.flex.paddingLeft(padding)
            }
        case .percentage(let percent):
            if isRTL {
                view.flex.paddingRight(CGFloat(percent * 100)%)
            } else {
                view.flex.paddingLeft(CGFloat(percent * 100)%)
            }
        default:
            break
        }
    }
    
    /// Applies inline-end padding (RTL support)
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyPaddingInlineEnd(_ value: CSSPropertyValue, to view: UIView) {
        let isRTL = RTLHelper.isRTL(for: view)
        
        switch value {
        case .number(let padding):
            if isRTL {
                view.flex.paddingLeft(padding)
            } else {
                view.flex.paddingRight(padding)
            }
        case .percentage(let percent):
            if isRTL {
                view.flex.paddingLeft(CGFloat(percent * 100)%)
            } else {
                view.flex.paddingRight(CGFloat(percent * 100)%)
            }
        default:
            break
        }
    }
    
    /// Applies block-start padding (maps to padding-top)
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyPaddingBlockStart(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let padding):
            view.flex.paddingTop(padding)
        case .percentage(let percent):
            view.flex.paddingTop(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies block-end padding (maps to padding-bottom)
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyPaddingBlockEnd(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let padding):
            view.flex.paddingBottom(padding)
        case .percentage(let percent):
            view.flex.paddingBottom(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    // MARK: - P1 Border Properties
    
    /// Applies border color
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyBorderColor(_ value: CSSPropertyValue, to view: UIView) {
        guard case .color(let color) = value else { return }
        view.layer.borderColor = color.cgColor
    }
    
    /// Applies border width
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyBorderWidth(_ value: CSSPropertyValue, to view: UIView) {
        guard case .number(let width) = value else { return }
        view.layer.borderWidth = width
    }
    
    // MARK: - Physical Directional Margin Properties
    
    /// Applies top margin
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMarginTop(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let margin):
            view.flex.marginTop(margin)
        case .percentage(let percent):
            view.flex.marginTop(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies right margin
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMarginRight(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let margin):
            view.flex.marginRight(margin)
        case .percentage(let percent):
            view.flex.marginRight(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies bottom margin
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMarginBottom(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let margin):
            view.flex.marginBottom(margin)
        case .percentage(let percent):
            view.flex.marginBottom(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies left margin
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyMarginLeft(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let margin):
            view.flex.marginLeft(margin)
        case .percentage(let percent):
            view.flex.marginLeft(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    // MARK: - Physical Directional Padding Properties
    
    /// Applies top padding
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyPaddingTop(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let padding):
            view.flex.paddingTop(padding)
        case .percentage(let percent):
            view.flex.paddingTop(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies right padding
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyPaddingRight(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let padding):
            view.flex.paddingRight(padding)
        case .percentage(let percent):
            view.flex.paddingRight(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies bottom padding
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyPaddingBottom(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let padding):
            view.flex.paddingBottom(padding)
        case .percentage(let percent):
            view.flex.paddingBottom(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    /// Applies left padding
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyPaddingLeft(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let padding):
            view.flex.paddingLeft(padding)
        case .percentage(let percent):
            view.flex.paddingLeft(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    // MARK: - Flex Layout Extension Properties
    
    /// Applies flex-wrap property
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyFlexWrap(_ value: CSSPropertyValue, to view: UIView) {
        guard case .keyword(let wrap) = value else { return }
        
        switch wrap {
        case "wrap":
            view.flex.wrap(.wrap)
        case "wrap-reverse":
            view.flex.wrap(.wrapReverse)
        case "nowrap":
            view.flex.wrap(.noWrap)
        default:
            #if DEBUG
            Logger.shared.debug("Unknown flex-wrap value: \(wrap)")
            #endif
        }
    }
    
    /// Applies align-content property
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyAlignContent(_ value: CSSPropertyValue, to view: UIView) {
        guard case .keyword(let alignment) = value else { return }
        
        switch alignment {
        case "start", "flex-start":
            view.flex.alignContent(.start)
        case "center":
            view.flex.alignContent(.center)
        case "end", "flex-end":
            view.flex.alignContent(.end)
        case "stretch":
            view.flex.alignContent(.stretch)
        case "space-between":
            view.flex.alignContent(.spaceBetween)
        case "space-around":
            view.flex.alignContent(.spaceAround)
        default:
            #if DEBUG
            Logger.shared.debug("Unknown align-content value: \(alignment)")
            #endif
        }
    }
    
    /// Applies flex-basis property
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyFlexBasis(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let basis):
            view.flex.basis(basis)
        case .percentage(let percent):
            view.flex.basis(CGFloat(percent * 100)%)
        default:
            break
        }
    }
    
    // MARK: - Requirement 9: Display Control and Visual Effects Properties
    
    /// Applies border style (iOS only supports solid)
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyBorderStyle(_ value: CSSPropertyValue, to view: UIView) {
        guard case .keyword(let style) = value else {
            // Parsing failed, reset border width
            view.layer.borderWidth = 0
            return
        }
        
        // iOS only supports solid border style
        if style != "solid" {
            // Invalid border-style value, reset border width
            view.layer.borderWidth = 0
            #if DEBUG
            Logger.shared.debug("Warning: border-style '\(style)' not supported, only 'solid' is supported on iOS")
            #endif
        }
        // If solid, no additional action needed (iOS default is solid)
    }
    
    /// Applies overflow control
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyOverflow(_ value: CSSPropertyValue, to view: UIView) {
        guard case .keyword(let overflow) = value else { return }
        
        switch overflow {
        case "hidden":
            view.clipsToBounds = true
        case "visible":
            view.clipsToBounds = false
        default:
            #if DEBUG
            Logger.shared.debug("Unknown overflow value: \(overflow)")
            #endif
        }
    }
    
    /// Applies display control
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyDisplay(_ value: CSSPropertyValue, to view: UIView) {
        guard case .keyword(let display) = value else { return }
        
        switch display {
        case "none":
            view.isHidden = true
            // display:none takes no space, implemented via FlexLayout
            view.flex.display(.none)
        default:
            view.isHidden = false
            view.flex.display(.flex)
        }
    }
    
    /// Applies visibility control
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyVisibility(_ value: CSSPropertyValue, to view: UIView) {
        guard case .keyword(let visibility) = value else { return }
        
        switch visibility {
        case "hidden":
            view.isHidden = true
            // visibility:hidden still takes space, does not affect FlexLayout
        case "visible":
            view.isHidden = false
        default:
            #if DEBUG
            Logger.shared.debug("Unknown visibility value: \(visibility)")
            #endif
        }
    }
    
    /// Applies filter property (only supports drop-shadow)
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyFilter(_ value: CSSPropertyValue, to view: UIView) {
        guard case .shadow(let shadow) = value else { return }
        applyShadow(shadow, to: view, includeSpread: false)
    }
    
    /// Applies box-shadow property
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyBoxShadow(_ value: CSSPropertyValue, to view: UIView) {
        guard case .shadow(let shadow) = value else { return }
        applyShadow(shadow, to: view, includeSpread: true)
    }
    
    /// Applies shadow effect
    /// - Parameters:
    ///   - shadow: Shadow configuration
    ///   - view: Target view
    ///   - includeSpread: Whether to include spread parameter (used by box-shadow)
    private static func applyShadow(_ shadow: CSSShadow, to view: UIView, includeSpread: Bool) {
        // Set shadow offset
        // CSS coordinate system: Y-axis positive direction is downward
        // iOS shadowOffset: Y-axis positive direction is also downward (consistent with UIKit coordinate system)
        // Therefore use original value directly, no need to negate
        view.layer.shadowOffset = CGSize(width: shadow.offsetX, height: shadow.offsetY)
        
        // Set shadow blur radius
        // iOS shadowRadius is blur radius, CSS blur is diameter, so divide by 2
        view.layer.shadowRadius = shadow.blur / 2.0
        
        // Set shadow color
        view.layer.shadowColor = shadow.color.cgColor
        
        // Set shadow opacity
        // Extract alpha value from color
        var red: CGFloat = 0, green: CGFloat = 0, blue: CGFloat = 0, alpha: CGFloat = 0
        if shadow.color.getRed(&red, green: &green, blue: &blue, alpha: &alpha) {
            view.layer.shadowOpacity = Float(alpha)
        } else {
            // If unable to extract RGBA, try to get white and alpha (for grayscale colors)
            var white: CGFloat = 0
            if shadow.color.getWhite(&white, alpha: &alpha) {
                view.layer.shadowOpacity = Float(alpha)
            } else {
                // Default fully opaque
                view.layer.shadowOpacity = 1.0
            }
        }
        
        // Handle spread parameter (only used by box-shadow)
        if includeSpread, let spread = shadow.spread {
            // Implement spread effect via shadowPath (including spread = 0 case)
            let rect = view.bounds.insetBy(dx: -spread, dy: -spread)
            view.layer.shadowPath = UIBezierPath(
                roundedRect: rect,
                cornerRadius: view.layer.cornerRadius
            ).cgPath
        } else {
            view.layer.shadowPath = nil
        }
        
        // Performance optimization: enable rasterization
        view.layer.shouldRasterize = true
        view.layer.rasterizationScale = UIScreen.main.scale
    }
    
    /// Clears shadow effect
    /// - Parameter view: Target view
    private static func clearShadow(from view: UIView) {
        view.layer.shadowOpacity = 0
        view.layer.shadowPath = nil
        view.layer.shouldRasterize = false
    }
    
    /// Applies text color
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyTextColor(_ value: CSSPropertyValue, to view: UIView) {
        guard case .color(let color) = value else { return }
        
        // If UILabel, set textColor
        if let label = view as? UILabel {
            label.textColor = color
        }
        // If UIButton, set title color
        else if let button = view as? UIButton {
            button.setTitleColor(color, for: .normal)
        }
        // If UITextField, set text color
        else if let textField = view as? UITextField {
            textField.textColor = color
        }
        // If UITextView, set text color
        else if let textView = view as? UITextView {
            textView.textColor = color
        }
    }
    
    // MARK: - Multi-Value Property Preprocessing
    
    /// Preprocesses multi-value properties (padding and margin)
    /// Splits "padding: 10px 20px 30px 40px" into individual padding-top, padding-right, etc.
    /// - Parameter properties: Original property dictionary
    /// - Returns: Processed property dictionary
    private static func preprocessMultiValueProperties(_ properties: [String: Any]) -> [String: Any] {
        var result = properties
        
        // Process padding multi-values
        if let padding = properties["padding"] as? String, padding.contains(" ") {
            let expanded = expandShorthandProperty(padding, prefix: "padding")
            if !expanded.isEmpty {
                result.removeValue(forKey: "padding")
                result.merge(expanded) { _, new in new }
            }
        }
        
        // Process margin multi-values
        if let margin = properties["margin"] as? String, margin.contains(" ") {
            let expanded = expandShorthandProperty(margin, prefix: "margin")
            if !expanded.isEmpty {
                result.removeValue(forKey: "margin")
                result.merge(expanded) { _, new in new }
            }
        }
        
        return result
    }
    
    /// Checks if a string is a unitless number
    /// - Parameter value: String to check
    /// - Returns: true if pure number, false otherwise
    private static func isUnitlessNumber(_ value: String) -> Bool {
        // Check if empty
        guard !value.isEmpty else { return false }
        
        // Try to convert to Double
        if Double(value) != nil {
            // Ensure no unit suffix (px, %, em, rem, etc.)
            let hasUnit = value.hasSuffix("px") || 
                         value.hasSuffix("%") || 
                         value.hasSuffix("em") || 
                         value.hasSuffix("rem") ||
                         value.hasSuffix("vw") ||
                         value.hasSuffix("vh")
            return !hasUnit
        }
        
        return false
    }
    
    /// Adds px suffix to unitless numbers
    /// - Parameter value: Original value
    /// - Returns: Processed value (unitless numbers get "px" suffix)
    private static func normalizeValue(_ value: String) -> String {
        if isUnitlessNumber(value) {
            return value + "px"
        }
        return value
    }
    
    /// Splits shorthand properties into individual properties
    /// Supports CSS standard 1-4 value syntax:
    /// - 1 value: all (keep as-is, no splitting)
    /// - 2 values: vertical horizontal
    /// - 3 values: top horizontal bottom
    /// - 4 values: top right bottom left
    /// - Parameter value: Property value string, e.g., "10px 20px 30px 40px" or "0 20 0 0"
    /// - Parameter prefix: Property prefix, e.g., "padding" or "margin"
    /// - Returns: Split property dictionary (unitless numbers automatically get "px" suffix)
    private static func expandShorthandProperty(_ value: String, prefix: String) -> [String: String] {
        // Split values by space
        let values = value.split(separator: " ").map { String($0).trimmingCharacters(in: .whitespaces) }
        var result: [String: String] = [:]
        
        switch values.count {
        case 1:
            // Single value: no splitting needed, keep original logic
            return [:]
            
        case 2:
            // Two values: vertical horizontal
            // Example: "10px 20px" → top=10px, right=20px, bottom=10px, left=20px
            // Example: "0 20" → top=0px, right=20px, bottom=0px, left=20px
            result["\(prefix)-top"] = normalizeValue(values[0])
            result["\(prefix)-right"] = normalizeValue(values[1])
            result["\(prefix)-bottom"] = normalizeValue(values[0])
            result["\(prefix)-left"] = normalizeValue(values[1])
            
        case 3:
            // Three values: top horizontal bottom
            // Example: "10px 20px 30px" → top=10px, right=20px, bottom=30px, left=20px
            // Example: "10 20 30" → top=10px, right=20px, bottom=30px, left=20px
            result["\(prefix)-top"] = normalizeValue(values[0])
            result["\(prefix)-right"] = normalizeValue(values[1])
            result["\(prefix)-bottom"] = normalizeValue(values[2])
            result["\(prefix)-left"] = normalizeValue(values[1])
            
        case 4:
            // Four values: top right bottom left
            // Example: "10px 20px 30px 40px" → top=10px, right=20px, bottom=30px, left=40px
            // Example: "0 20 0 0" → top=0px, right=20px, bottom=0px, left=0px
            result["\(prefix)-top"] = normalizeValue(values[0])
            result["\(prefix)-right"] = normalizeValue(values[1])
            result["\(prefix)-bottom"] = normalizeValue(values[2])
            result["\(prefix)-left"] = normalizeValue(values[3])
            
        default:
            // Invalid format (more than 4 values), ignore
            #if DEBUG
            Logger.shared.debug("Invalid \(prefix) value format: \(value) (expected 1-4 values)")
            #endif
            return [:]
        }
        
        return result
    }
    
    // MARK: - Position Property Application Methods
    
    /// Applies position property
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyPosition(_ value: CSSPropertyValue, to view: UIView) {
        guard case .keyword(let position) = value else {
            #if DEBUG
            Logger.shared.debug("Warning: Invalid position value type")
            #endif
            return
        }
        
        switch position {
        case "static":
            view.flex.position(.static)
        case "relative":
            view.flex.position(.relative)
        case "absolute":
            view.flex.position(.absolute)
        default:
            #if DEBUG
            Logger.shared.debug("Warning: Unsupported position value: \(position)")
            #endif
        }
    }
    
    /// Applies top offset
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyTop(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let pixels):
            view.flex.top(CGFloat(pixels))
        case .percentage(let percent):
            view.flex.top(CGFloat(percent)%)
        case .keyword("auto"):
            // Auto is default, no action needed
            break
        default:
            #if DEBUG
            Logger.shared.debug("Warning: Invalid top value type")
            #endif
        }
    }
    
    /// Applies left offset
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyLeft(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let pixels):
            view.flex.left(CGFloat(pixels))
        case .percentage(let percent):
            view.flex.left(CGFloat(percent)%)
        case .keyword("auto"):
            // Auto is default, no action needed
            break
        default:
            #if DEBUG
            Logger.shared.debug("Warning: Invalid left value type")
            #endif
        }
    }
    
    /// Applies bottom offset
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyBottom(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let pixels):
            view.flex.bottom(CGFloat(pixels))
        case .percentage(let percent):
            view.flex.bottom(CGFloat(percent)%)
        case .keyword("auto"):
            // Auto is default, no action needed
            break
        default:
            #if DEBUG
            Logger.shared.debug("Warning: Invalid bottom value type")
            #endif
        }
    }
    
    /// Applies right offset
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyRight(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let pixels):
            view.flex.right(CGFloat(pixels))
        case .percentage(let percent):
            view.flex.right(CGFloat(percent)%)
        case .keyword("auto"):
            // Auto is default, no action needed
            break
        default:
            #if DEBUG
            Logger.shared.debug("Warning: Invalid right value type")
            #endif
        }
    }
    
    /// Applies z-index property
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyZIndex(_ value: CSSPropertyValue, to view: UIView) {
        switch value {
        case .number(let zIndex):
            // Use UIView.layer.zPosition to control stacking order
            view.layer.zPosition = CGFloat(zIndex)
        case .keyword("auto"):
            // auto means z-index: 0
            view.layer.zPosition = 0
        default:
            #if DEBUG
            Logger.shared.debug("Warning: Invalid z-index value type")
            #endif
        }
    }
    
    // MARK: - RTL Position Property Application Methods
    
    /// Applies inset-inline-start offset (RTL support)
    /// LTR mode: maps to left
    /// RTL mode: maps to right
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyInsetInlineStart(_ value: CSSPropertyValue, to view: UIView) {
        if RTLHelper.isRTL(for: view) {
            applyRight(value, to: view)
        } else {
            applyLeft(value, to: view)
        }
    }
    
    /// Applies inset-inline-end offset (RTL support)
    /// LTR mode: maps to right
    /// RTL mode: maps to left
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyInsetInlineEnd(_ value: CSSPropertyValue, to view: UIView) {
        if RTLHelper.isRTL(for: view) {
            applyLeft(value, to: view)
        } else {
            applyRight(value, to: view)
        }
    }
    
    /// Applies inset-block-start offset (always maps to top)
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyInsetBlockStart(_ value: CSSPropertyValue, to view: UIView) {
        applyTop(value, to: view)
    }
    
    /// Applies inset-block-end offset (always maps to bottom)
    /// - Parameters:
    ///   - value: CSS property value
    ///   - view: Target view
    private static func applyInsetBlockEnd(_ value: CSSPropertyValue, to view: UIView) {
        applyBottom(value, to: view)
    }
}
