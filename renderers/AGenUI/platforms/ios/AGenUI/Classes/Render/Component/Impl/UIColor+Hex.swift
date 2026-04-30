//
//  UIColor+Hex.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/27.
//

import UIKit

/// UIColor hexadecimal color extension
///
/// Provides a convenient method to create UIColor from hex strings
extension UIColor {
    /// Creates a color from a hex string
    ///
    /// Supported formats:
    /// - #RGB (3 digits)
    /// - #RRGGBB (6 digits)
    /// - #RRGGBBAA (8 digits)
    ///
    /// - Parameter hexString: Hex color string
    /// - Returns: UIColor instance, or nil if parsing fails
    public convenience init?(hexString: String) {
        var hexSanitized = hexString.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        var rgb: UInt64 = 0
        
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else {
            return nil
        }
        
        let length = hexSanitized.count
        let r, g, b, a: CGFloat
        
        if length == 6 {
            // #RRGGBB
            r = CGFloat((rgb & 0xFF0000) >> 16) / 255.0
            g = CGFloat((rgb & 0x00FF00) >> 8) / 255.0
            b = CGFloat(rgb & 0x0000FF) / 255.0
            a = 1.0
        } else if length == 8 {
            // #RRGGBBAA
            r = CGFloat((rgb & 0xFF000000) >> 24) / 255.0
            g = CGFloat((rgb & 0x00FF0000) >> 16) / 255.0
            b = CGFloat((rgb & 0x0000FF00) >> 8) / 255.0
            a = CGFloat(rgb & 0x000000FF) / 255.0
        } else {
            return nil
        }
        
        self.init(red: r, green: g, blue: b, alpha: a)
    }
    
    /// Creates a color from a hex string (non-optional version)
    ///
    /// Returns default color if parsing fails
    ///
    /// - Parameters:
    ///   - hexString: Hex color string
    ///   - defaultColor: Default color when parsing fails, defaults to .label
    /// - Returns: UIColor instance
    static func from(hexString: String, defaultColor: UIColor = .label) -> UIColor {
        return UIColor(hexString: hexString) ?? defaultColor
    }
}
