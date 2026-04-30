//
//  CSSPropertyValue.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import UIKit

/// CSS property value type
/// Represents parsed CSS property values, supports multiple data types
public enum CSSPropertyValue: Equatable {
    /// Numeric type, e.g., "100" -> 100.0
    case number(CGFloat)
    
    /// Percentage type, e.g., "50%" -> 0.5
    case percentage(CGFloat)
    
    /// Color type, e.g., "#FF0000" -> UIColor.red
    case color(UIColor)
    
    /// Keyword type, e.g., "center", "start", "transparent"
    case keyword(String)
    
    /// Shadow type, used for filter and box-shadow
    case shadow(CSSShadow)
        
    /// URL type, stores parsed URL string
    /// url("https://example.com/image.png") -> .url("https://example.com/image.png")
    case url(String)
    
    /// Invalid value, indicates parsing failure
    case invalid
    
    // MARK: - Convenience Properties
    
    /// Checks if the value is valid
    var isValid: Bool {
        if case .invalid = self {
            return false
        }
        return true
    }
    
    /// Gets numeric value (if number type)
    var numberValue: CGFloat? {
        if case .number(let value) = self {
            return value
        }
        return nil
    }
    
    /// Gets percentage value (if percentage type)
    var percentageValue: CGFloat? {
        if case .percentage(let value) = self {
            return value
        }
        return nil
    }
    
    /// Gets color value (if color type)
    var colorValue: UIColor? {
        if case .color(let value) = self {
            return value
        }
        return nil
    }
    
    /// Gets keyword value (if keyword type)
    var keywordValue: String? {
        if case .keyword(let value) = self {
            return value
        }
        return nil
    }
    
    /// Gets shadow value (if shadow type)
    var shadowValue: CSSShadow? {
        if case .shadow(let value) = self {
            return value
        }
        return nil
    }
    
    /// Gets URL value (if url type)
    var urlValue: String? {
        if case .url(let value) = self {
            return value
        }
        return nil
    }
    
    // MARK: - Equatable
    
    public static func == (lhs: CSSPropertyValue, rhs: CSSPropertyValue) -> Bool {
        switch (lhs, rhs) {
        case (.number(let lValue), .number(let rValue)):
            return lValue == rValue
        case (.percentage(let lValue), .percentage(let rValue)):
            return lValue == rValue
        case (.color(let lColor), .color(let rColor)):
            return lColor == rColor
        case (.keyword(let lKeyword), .keyword(let rKeyword)):
            return lKeyword == rKeyword
        case (.shadow(let lShadow), .shadow(let rShadow)):
            return lShadow == rShadow
        case (.url(let lUrl), .url(let rUrl)):
            return lUrl == rUrl
        case (.invalid, .invalid):
            return true
        default:
            return false
        }
    }
}

// MARK: - CSSShadow

/// CSS shadow value
/// Used for filter (drop-shadow) and box-shadow properties
public struct CSSShadow: Equatable {
    /// Horizontal offset (positive = right, negative = left)
    let offsetX: CGFloat
    
    /// Vertical offset (positive = down, negative = up)
    let offsetY: CGFloat
    
    /// Blur radius (larger value = more blur)
    let blur: CGFloat
    
    /// Spread radius (optional, only used by box-shadow)
    /// Positive value expands shadow, negative value shrinks shadow
    let spread: CGFloat?
    
    /// Shadow color
    let color: UIColor
    
    /// Creates from filter drop-shadow
    /// - Parameters:
    ///   - offsetX: Horizontal offset
    ///   - offsetY: Vertical offset
    ///   - blur: Blur radius
    ///   - color: Shadow color
    init(offsetX: CGFloat, offsetY: CGFloat, blur: CGFloat, color: UIColor) {
        self.offsetX = offsetX
        self.offsetY = offsetY
        self.blur = blur
        self.spread = nil
        self.color = color
    }
    
    /// Creates from box-shadow
    /// - Parameters:
    ///   - offsetX: Horizontal offset
    ///   - offsetY: Vertical offset
    ///   - blur: Blur radius
    ///   - spread: Spread radius
    ///   - color: Shadow color
    init(offsetX: CGFloat, offsetY: CGFloat, blur: CGFloat, spread: CGFloat, color: UIColor) {
        self.offsetX = offsetX
        self.offsetY = offsetY
        self.blur = blur
        self.spread = spread
        self.color = color
    }
    
    // MARK: - Equatable
    
    public static func == (lhs: CSSShadow, rhs: CSSShadow) -> Bool {
        return lhs.offsetX == rhs.offsetX &&
               lhs.offsetY == rhs.offsetY &&
               lhs.blur == rhs.blur &&
               lhs.spread == rhs.spread &&
               lhs.color == rhs.color
    }
}
