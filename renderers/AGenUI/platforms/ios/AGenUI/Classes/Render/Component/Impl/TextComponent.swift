//
//  TextComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/27.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

// MARK: - Text Decoration Configuration (W3C Standard)

/// Text decoration line position (W3C text-decoration-line)
enum TextDecorationLine: String {
    case none = "none"
    case underline = "underline"
    case overline = "overline"
    case lineThrough = "line-through"
}

/// Text decoration line style (W3C text-decoration-style)
enum TextDecorationStyle: String {
    case solid = "solid"
    case double = "double"
    case dotted = "dotted"
    case dashed = "dashed"
    case wavy = "wavy"
}

/// Text decoration configuration (W3C compliant)
struct TextDecorationConfig {
    /// Decoration line position
    var line: TextDecorationLine = .underline
    /// Decoration line style
    var style: TextDecorationStyle = .solid
    /// Decoration line color
    var color: UIColor = .black
    /// Decoration line thickness (W3C text-decoration-thickness)
    var thickness: CGFloat = 1.0
    
    /// Parse from CSS style dictionary
    static func from(styles: [String: Any]) -> TextDecorationConfig? {
        var config = TextDecorationConfig()
        var hasDecoration = false
        
        // Parse text-decoration-line
        if let lineValue = styles["text-decoration-line"] as? String {
            if let line = TextDecorationLine(rawValue: lineValue.lowercased()) {
                config.line = line
                hasDecoration = true
            }
        }
        
        // Parse text-decoration-style
        if let styleValue = styles["text-decoration-style"] as? String {
            if let style = TextDecorationStyle(rawValue: styleValue.lowercased()) {
                config.style = style
                hasDecoration = true
            }
        }
        
        // Parse text-decoration-color
        if let colorValue = styles["text-decoration-color"] as? String {
            let parsedColor = CSSPropertyParser.parseColor(colorValue)
            if case .color(let value) = parsedColor {
                config.color = value
                hasDecoration = true
            }
        }
        
        // Parse text-decoration-thickness
        if let thicknessValue = styles["text-decoration-thickness"] as? String {
            if let thickness = parseLength(thicknessValue) {
                config.thickness = thickness
                hasDecoration = true
            }
        } else if let thicknessValue = styles["text-decoration-thickness"] as? CGFloat {
            config.thickness = thicknessValue
            hasDecoration = true
        }
        
        // Parse shorthand property text-decoration
        if let decoration = styles["text-decoration"] as? String {
            parseTextDecoration(decoration, into: &config)
            hasDecoration = true
        }
        
        return hasDecoration ? config : nil
    }
    
    /// Parse text-decoration shorthand property
    private static func parseTextDecoration(_ value: String, into config: inout TextDecorationConfig) {
        let parts = value.lowercased().split(separator: " ").map { String($0) }
        
        for part in parts {
            // Try parsing as line
            if let line = TextDecorationLine(rawValue: part) {
                config.line = line
            }
            // Try parsing as style
            else if let style = TextDecorationStyle(rawValue: part) {
                config.style = style
            }
            // Try parsing as color
            else if part.hasPrefix("#") || part.hasPrefix("rgb") {
                let parsedColor = CSSPropertyParser.parseColor(part)
                if case .color(let value) = parsedColor {
                    config.color = value
                }
            }
        }
    }
    
    /// Parse length value (supports px, em, etc.)
    private static func parseLength(_ value: String) -> CGFloat? {
        let cleanValue = value.replacingOccurrences(of: "px", with: "")
            .replacingOccurrences(of: "em", with: "")
            .trimmingCharacters(in: .whitespaces)
        
        if let number = Double(cleanValue) {
            return CGFloat(number)
        }
        return nil
    }
}

// MARK: - Text Decoration Label

/// UILabel subclass supporting W3C standard text decorations
class TextDecorationLabel: UILabel {
    
    /// Text decoration configuration
    var decorationConfig: TextDecorationConfig? {
        didSet {
            updateTextDecoration()
        }
    }
    
    override var text: String? {
        didSet {
            updateTextDecoration()
        }
    }
    
    override var attributedText: NSAttributedString? {
        didSet {
            if decorationConfig != nil {
                updateTextDecoration()
            }
        }
    }
    
    /// Update text decoration
    private func updateTextDecoration() {
        guard let config = decorationConfig,
              config.line != .none,
              let currentText = text,
              !currentText.isEmpty else {
            return
        }
        
        // Create attributed string
        let attributes = createDecorationAttributes(config: config)
        let attributedString = NSMutableAttributedString(string: currentText)
        
        // Use NSString length to ensure correct NSRange for Unicode characters like emoji
        let fullRange = NSRange(location: 0, length: (currentText as NSString).length)
        
        // Preserve existing font and color attributes
        if let existingFont = font {
            attributedString.addAttribute(.font, value: existingFont, range: fullRange)
        }
        if let existingColor = textColor {
            attributedString.addAttribute(.foregroundColor, value: existingColor, range: fullRange)
        }
        
        // Preserve existing paragraph style (e.g., line-height and alignment)
        let paragraphStyle: NSMutableParagraphStyle
        if let existingAttributedText = super.attributedText,
           existingAttributedText.length > 0,
           let existingStyle = existingAttributedText.attribute(.paragraphStyle, at: 0, effectiveRange: nil) as? NSParagraphStyle {
            paragraphStyle = existingStyle.mutableCopy() as! NSMutableParagraphStyle
        } else {
            paragraphStyle = NSMutableParagraphStyle()
            // Keep current alignment
            paragraphStyle.alignment = textAlignment
        }
        
        attributedString.addAttribute(.paragraphStyle, value: paragraphStyle, range: fullRange)
        
        // Add decoration attributes
        for (key, value) in attributes {
            attributedString.addAttribute(key, value: value, range: fullRange)
        }
        
        super.attributedText = attributedString
    }
    
    /// Create decoration attributes
    private func createDecorationAttributes(config: TextDecorationConfig) -> [NSAttributedString.Key: Any] {
        var attributes: [NSAttributedString.Key: Any] = [:]
        
        // Set decoration line style
        var underlineStyle: NSUnderlineStyle = []
        
        switch config.style {
        case .solid:
            underlineStyle = .single
        case .double:
            underlineStyle = .double
        case .dotted:
            underlineStyle = [.single, .patternDot]
        case .dashed:
            underlineStyle = [.single, .patternDash]
        case .wavy:
            // iOS does not directly support wavy lines, use dashed instead
            underlineStyle = [.single, .patternDashDot]
        }
        
        // Adjust style based on thickness
        if config.thickness > 1.5 {
            underlineStyle.insert(.thick)
        }
        
        // Set decoration line position
        switch config.line {
        case .underline:
            attributes[.underlineStyle] = underlineStyle.rawValue
            attributes[.underlineColor] = config.color
        case .overline:
            // iOS does not natively support overline, use custom drawing
            // Use underline as placeholder here, can be implemented with custom drawing later
            attributes[.underlineStyle] = underlineStyle.rawValue
            attributes[.underlineColor] = config.color
        case .lineThrough:
            attributes[.strikethroughStyle] = underlineStyle.rawValue
            attributes[.strikethroughColor] = config.color
        case .none:
            break
        }
        
        return attributes
    }
}

/// Line height type
enum LineHeightType {
    case multiplier(CGFloat)  // Numeric multiplier, e.g., 1.5
    case absolute(CGFloat)    // Absolute line height (px), e.g., 10.0
}

enum TextAlignment: Int {
    case leftTop = 0       /// Left top
    case leftCenter = 1    /// Left center
    case leftBottom = 2    /// Left bottom
    case centerTop = 3     /// Center top
    case center = 4        /// Center (horizontal + vertical)
    case centerBottom = 5  /// Center bottom
    case rightTop = 6      /// Right top
    case rightCenter = 7   /// Right center
    case rightBottom = 8   /// Right bottom
}

extension TextAlignment {
    
    init?(normalizedString: String) {
        // Normalize input
        let key = normalizedString
            .lowercased()
            .replacingOccurrences(of: " ", with: "")
            .replacingOccurrences(of: "-", with: "")
            .trimmingCharacters(in: .whitespaces)
        
        // Predefined mapping dictionary (static, avoid repeated creation)
        let mapping: [String: TextAlignment] = [
            "left": .leftCenter,
            "lefttop": .leftTop,
            "leftcenter": .leftCenter,
            "leftbottom": .leftBottom,
            "centertop": .centerTop,
            "center": .center,          // Note: standalone "center" maps to .center
            "centercenter": .center,
            "centerbottom": .centerBottom,
            "right": .rightCenter,
            "righttop": .rightTop,
            "rightcenter": .rightCenter,
            "rightbottom": .rightBottom
        ]
        
        guard let value = mapping[key] else {
            return nil // Invalid input: initialization failed
        }
        self = value // Safe assignment of non-optional value
    }
    
}

/// TextComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - text: Text content string (String)
/// - textChunk: Content to append to existing text (String)
/// - variant: Text style hint (String: h1, h2, h3, h4, h5, caption, body)
/// - styles: CSS style dictionary containing:
///   - font-size: Font size with optional px unit (String)
///   - font-weight: Font weight (String: bold, normal, light, thin or numeric 100-700)
///   - font-family: Font family name (String)
///   - color: Text color in hex or named format (String)
///   - text-align: Text alignment (String: left, center, right)
///   - line-height: Line height as multiplier or px value (String/Double/Int)
///   - line-clamp: Maximum number of lines (Int/String)
///   - text-overflow: Overflow behavior (String: ellipsis, clip, head, middle)
///   - text-decoration: Text decoration shorthand (String)
///   - text-decoration-line: Decoration line (String: none, underline, overline, line-through)
///   - text-decoration-style: Decoration style (String: solid, double, dotted, dashed, wavy)
///   - text-decoration-color: Decoration color (String)
///   - text-decoration-thickness: Decoration thickness (String/CGFloat)
///
/// Design notes:
/// - Uses TextDecorationLabel (custom UILabel subclass) for W3C-compliant text decorations
/// - Applies a "collect, synthesize, then apply" architecture to avoid property overwriting
/// - Converts px units using BS_POINT_SCALE factor (0.5) for font-size and line-height
/// - Supports Unicode/emoji text via NSString-based NSRange calculations
class TextComponent: Component {
    
    // MARK: - Constants
    
    /// Base point scale factor (for px unit conversion)
    private static let BS_POINT_SCALE: CGFloat = 0.5
    
    // MARK: - Properties
    
    private var label: TextDecorationLabel?
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        // Component itself is a UIView
        super.init(componentId: componentId, componentType: "Text", properties: properties)
        
        // Create label
        let label = TextDecorationLabel(frame: CGRectMake(0, 0, 20, 20));
        label.numberOfLines = 0
        label.lineBreakMode = .byWordWrapping
        label.font = UIFont.systemFont(ofSize: 16)
        label.textColor = .black
        
        // Add subview using FlexLayout
        flex.addItem(label).grow(1)
        self.label = label
        
        // Apply initial properties after label is created
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
        
    override var frame: CGRect {
        get { return super.frame }
        set {
            // Check if height is abnormal
            if newValue.height > 1000 {
                Logger.shared.warning("[TextDecorationLabel] Abnormal height detected: \(newValue.height), frame: \(newValue))")
            }
            super.frame = newValue
        }
    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        // Call parent method to apply CSS properties to self (padding, background-color, etc.)
        super.updateProperties(properties)
        
        guard let label = label else { return }
        
        // Update text content
        if let textValue = properties["text"] {
            let text = textValue as? String ?? ""
            label.text = text.count == 0 ? " " : text
            label.flex.markDirty()
        }
        // Handle textChunk field (content append)
        else if let textChunkValue = properties["textChunk"] {
            let textChunk = textChunkValue as? String ?? ""
            if !textChunk.isEmpty {
                let currentText = label.text ?? ""
                label.text = currentText + textChunk
                label.flex.markDirty()                
            }
        }
        
        // Update style properties
        if let styles = properties["styles"] as? [String: Any] {
            applyStyles(styles)
        }
    }
    
    // MARK: - Private Methods
    
    /// Apply style properties
    ///
    /// Uses a 'collect, synthesize, then apply' architecture to avoid property overwriting:
    /// - Phase 1: Parse all styles to intermediate variables, do not touch label
    /// - Phase 2: Synthesize UIFont with family + weight + size in one pass
    /// - Phase 3: Synthesize NSAttributedString with font + color + lineHeight + align + decoration in one pass
    /// - Phase 4: Apply non-text properties (lineClamp, textOverflow)
    private func applyStyles(_ styles: [String: Any]) {
        guard let label = label else { return }
        
        // ========================
        // Phase 1: Collect - parse all styles to intermediate variables
        // ========================
        
        // Font related
        var resolvedFontSize: CGFloat?
        var resolvedFontWeight: UIFont.Weight?
        var resolvedFontFamily: String?
        
        // Text style related
        var resolvedColor: UIColor?
        var resolvedTextAlign: NSTextAlignment?
        var resolvedLineHeight: LineHeightType?
        var resolvedDecorationConfig: TextDecorationConfig?
        
        // Label property related
        var resolvedLineClamp: Int?
        var resolvedTextOverflow: String?
        
        // Parse font-size
        if let fontSizeValue = styles["font-size"] as? String {
            resolvedFontSize = extractFontSize(from: fontSizeValue)
        }
        
        // Parse font-weight
        if let fontWeightValue = styles["font-weight"] as? String {
            resolvedFontWeight = parseFontWeight(fontWeightValue)
        }
        
        // Parse font-family
        if let fontFamilyValue = styles["font-family"] as? String {
            resolvedFontFamily = fontFamilyValue
        }
        
        // Parse color
        if let colorValue = styles["color"] as? String {
            let parsedColor = CSSPropertyParser.parseColor(colorValue)
            if case .color(let value) = parsedColor {
                resolvedColor = value
            }
        }
        
        // Parse text-align
        if let textAlignValue = styles["text-align"] as? String {
            resolvedTextAlign = parseTextAlign(textAlignValue)
        }
        
        // Parse line-height (compatible with string and number)
        if let lineHeightValue = styles["line-height"] {
            resolvedLineHeight = extractLineHeight(from: lineHeightValue)
        }
        
        // Parse line-clamp (compatible with string and number)
        if let lineClampValue = styles["line-clamp"] {
            if let intValue = lineClampValue as? Int {
                resolvedLineClamp = intValue
            } else if let stringValue = lineClampValue as? String, let parsed = Int(stringValue) {
                resolvedLineClamp = parsed
            }
        }
        
        // Parse text-overflow
        if let textOverflowValue = styles["text-overflow"] as? String {
            resolvedTextOverflow = textOverflowValue
        }
        
        // Parse text-decoration
        resolvedDecorationConfig = TextDecorationConfig.from(styles: styles)
        
        // ========================
        // Phase 2: Synthesize UIFont - family + weight + size one-time build
        // ========================
        
        let currentFont = label.font ?? UIFont.systemFont(ofSize: 16)
        let finalSize = resolvedFontSize ?? currentFont.pointSize
        let finalWeight = resolvedFontWeight ?? currentFontWeight(from: currentFont)
        
        let finalFont: UIFont
        if let family = resolvedFontFamily {
            finalFont = buildFont(family: family, weight: finalWeight, size: finalSize)
        } else if resolvedFontSize != nil || resolvedFontWeight != nil {
            // size or weight changed, but family not specified, keep current family
            let currentFamily = currentFont.familyName
            finalFont = buildFont(family: currentFamily, weight: finalWeight, size: finalSize)
        } else {
            finalFont = currentFont
        }
        
        label.font = finalFont
        
        // ========================
        // Phase 3: Synthesize NSAttributedString - build all text attributes in one pass
        // ========================
        
        let finalColor = resolvedColor ?? label.textColor ?? .black
        label.textColor = finalColor
        
        // text-align set directly on label (consistent with original behavior, does not trigger attributedText creation)
        if let textAlign = resolvedTextAlign {
            label.textAlignment = textAlign
        }

        label.numberOfLines = resolvedLineClamp ?? 0
        
        // Only create attributedText when lineHeight or decoration exists
        let needsAttributedText = resolvedLineHeight != nil
            || resolvedDecorationConfig != nil
        
        if needsAttributedText {
            let currentText = label.text ?? ""
            guard !currentText.isEmpty else { return }
            
            let attributedString = NSMutableAttributedString(string: currentText)
            // Use NSString length instead of Swift String.count to ensure correct NSRange for Unicode characters like emoji
            // Swift String.count returns grapheme cluster count, but NSRange requires UTF-16 code unit length
            let fullRange = NSRange(location: 0, length: (currentText as NSString).length)
            
            // Set font
            attributedString.addAttribute(.font, value: finalFont, range: fullRange)
            
            // Set color
            attributedString.addAttribute(.foregroundColor, value: finalColor, range: fullRange)
            
            // Synthesize paragraph style
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = label.textAlignment
            
            if let lineHeight = resolvedLineHeight {
                let lineClamp = resolvedLineClamp ?? 0
                let isSingleLine = lineClamp == 1
                
                // Get font default line height for baseline offset calculation
                let defaultLineHeight = finalFont.lineHeight
                var targetLineHeight: CGFloat?
                
                switch lineHeight {
                case .multiplier(let value):
                    if isSingleLine {
                        // Single-line text: calculate target line height = fontSize * multiplier
                        targetLineHeight = finalFont.pointSize * value
                    } else {
                        // Multi-line text: use lineSpacing
                        paragraphStyle.lineSpacing = (value - 1) * finalFont.pointSize
                    }
                case .absolute(let value):
                    if isSingleLine {
                        // Single-line text: use user-specified absolute line height
                        targetLineHeight = value
                    } else {
                        // Multi-line text: use lineSpacing
                        paragraphStyle.lineSpacing = value - finalFont.pointSize
                    }
                }
                
                // Single-line text: set line height and calculate baseline offset for vertical centering
                if let targetLineHeight = targetLineHeight {
                    paragraphStyle.minimumLineHeight = targetLineHeight
                    paragraphStyle.maximumLineHeight = targetLineHeight
                    
                    // Calculate baseline offset to center text vertically within line height area
                    // baselineOffset = (target line height - default line height) / 2
                    let baselineOffset = (targetLineHeight - defaultLineHeight) / 2
                    attributedString.addAttribute(.baselineOffset, value: baselineOffset, range: fullRange)
                }
            }
            
            attributedString.addAttribute(.paragraphStyle, value: paragraphStyle, range: fullRange)
            
            // Set text decoration
            if let config = resolvedDecorationConfig, config.line != .none {
                let decorationAttrs = buildDecorationAttributes(config: config)
                for (key, value) in decorationAttrs {
                    attributedString.addAttribute(key, value: value, range: fullRange)
                }
            }
            
            label.attributedText = attributedString
        }
        
        if let textOverflow = resolvedTextOverflow {
            applyTextOverflow(to: label, overflow: textOverflow)
        }
    }
    
    // MARK: - Phase 1 Helpers: Pure parsing, no view state modification
    
    /// Parse font-weight string to UIFont.Weight
    private func parseFontWeight(_ fontWeight: String) -> UIFont.Weight {
        switch fontWeight.lowercased() {
        case "bold", "700":
            return .bold
        case "normal", "400":
            return .regular
        case "light", "300":
            return .light
        case "thin", "100":
            return .thin
        default:
            return .regular
        }
    }
    
    /// Parse text-align string to NSTextAlignment
    private func parseTextAlign(_ alignment: String) -> NSTextAlignment? {
        guard let textAlignment = TextAlignment(normalizedString: alignment) else { return nil }
        
        switch textAlignment {
        case .leftTop, .leftCenter, .leftBottom:
            return .left
        case .centerTop, .center, .centerBottom:
            return .center
        case .rightTop, .rightCenter, .rightBottom:
            return .right
        }
    }
    
    // MARK: - Phase 2 Helpers: UIFont synthesis
    
    /// Extract UIFont.Weight from current UIFont
    private func currentFontWeight(from font: UIFont) -> UIFont.Weight {
        let traits = font.fontDescriptor.object(forKey: .traits) as? [UIFontDescriptor.TraitKey: Any]
        if let weightValue = traits?[.weight] as? CGFloat {
            return UIFont.Weight(rawValue: weightValue)
        }
        return .regular
    }
    
    /// Build UIFont with family + weight + size in one pass
    private func buildFont(family: String, weight: UIFont.Weight, size: CGFloat) -> UIFont {
        // Use systemFont directly for system font families
        let normalizedFamily = family.lowercased()
        
        switch normalizedFamily {
        case "monospace", "monospacefont", "menlo", "courier":
            return UIFont.monospacedSystemFont(ofSize: size, weight: weight)
        case "sans-serif":
            return UIFont.systemFont(ofSize: size, weight: weight)
        default:
            break
        }
        
        // Custom font family: specify family and weight via UIFontDescriptor
        let descriptor = UIFontDescriptor(fontAttributes: [
            .family: family,
            .traits: [UIFontDescriptor.TraitKey.weight: weight.rawValue]
        ])
        
        let font = UIFont(descriptor: descriptor, size: size)
        
        // Verify font loaded successfully (family match)
        // If requested font family does not exist, iOS falls back to system font
        if font.familyName.lowercased() != family.lowercased() {
            // Font not found, try exact font name
            if let exactFont = UIFont(name: family, size: size) {
                return exactFont
            }
            // Fallback to system font, preserve weight
            return UIFont.systemFont(ofSize: size, weight: weight)
        }
        
        return font
    }
    
    // MARK: - Phase 3 Helpers: NSAttributedString synthesis
    
    /// Build text decoration attribute dictionary (does not modify label)
    private func buildDecorationAttributes(config: TextDecorationConfig) -> [NSAttributedString.Key: Any] {
        var attributes: [NSAttributedString.Key: Any] = [:]
        
        var underlineStyle: NSUnderlineStyle = []
        
        switch config.style {
        case .solid:
            underlineStyle = .single
        case .double:
            underlineStyle = .double
        case .dotted:
            underlineStyle = [.single, .patternDot]
        case .dashed:
            underlineStyle = [.single, .patternDash]
        case .wavy:
            underlineStyle = [.single, .patternDashDot]
        }
        
        if config.thickness > 1.5 {
            underlineStyle.insert(.thick)
        }
        
        switch config.line {
        case .underline, .overline:
            attributes[.underlineStyle] = underlineStyle.rawValue
            attributes[.underlineColor] = config.color
        case .lineThrough:
            attributes[.strikethroughStyle] = underlineStyle.rawValue
            attributes[.strikethroughColor] = config.color
        case .none:
            break
        }
        
        return attributes
    }
    
    /// Extract font size from string
    private func extractFontSize(from fontSizeString: String) -> CGFloat? {
        if fontSizeString.hasSuffix("px") {
            // px unit: apply BS_POINT_SCALE scaling
            // Formula: xpx * BS_POINT_SCALE
            // Example: "32px" = 32 * 0.5 = 16.0
            let cleanString = fontSizeString.replacingOccurrences(of: "px", with: "")
            if let size = Double(cleanString) {
                return CGFloat(size) * TextComponent.BS_POINT_SCALE
            }
        } else {
            // No unit or other unit: use value directly
            if let size = Double(fontSizeString) {
                return CGFloat(size)
            }
        }
        return nil
    }
    
    /// Extract line height value from multiple types (compatible with String, Double, Int)
    /// Supports two formats:
    /// - Numeric multiplier (Double/Int/no-unit string): returns .multiplier, e.g., 0.5, 1.5
    /// - px value (with px unit string): returns .absolute, applies BS_POINT_SCALE scaling, e.g., "10px" = 10 * 0.5 = 5.0
    private func extractLineHeight(from value: Any?) -> LineHeightType? {
        guard let value = value else { return nil }
        
        if let doubleValue = value as? Double {
            // Numeric multiplier
            return .multiplier(CGFloat(doubleValue))
        } else if let intValue = value as? Int {
            // Numeric multiplier
            return .multiplier(CGFloat(intValue))
        } else if let stringValue = value as? String {
            if stringValue.hasSuffix("px") {
                // px unit: apply BS_POINT_SCALE scaling to absolute line height
                let cleanValue = stringValue.replacingOccurrences(of: "px", with: "")
                    .trimmingCharacters(in: .whitespaces)
                if let parsed = Double(cleanValue) {
                    return .absolute(CGFloat(parsed) * TextComponent.BS_POINT_SCALE)
                }
            } else {
                // No-unit string: numeric multiplier
                if let parsed = Double(stringValue) {
                    return .multiplier(CGFloat(parsed))
                }
            }
        }
        return nil
    }
    
    /// Apply text overflow handling
    private func applyTextOverflow(to label: UILabel, overflow: String) {
        switch overflow.lowercased() {
        case "ellipsis":
            label.lineBreakMode = .byTruncatingTail
        case "clip":
            label.lineBreakMode = .byClipping
        case "head":
            label.lineBreakMode = .byTruncatingHead
        case "middle":
            label.lineBreakMode = .byTruncatingMiddle
        default:
            break
        }
    }
}

