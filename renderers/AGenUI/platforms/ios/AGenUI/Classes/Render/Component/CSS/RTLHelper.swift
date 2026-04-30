//
//  RTLHelper.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import UIKit

/// RTL (Right-to-Left) helper class
/// Used for RTL mode detection and mapping logical properties to physical properties
class RTLHelper {
    
    // MARK: - RTL Mode Detection
    
    /// Detects whether a view is in RTL mode
    /// - Parameter view: View to detect
    /// - Returns: true for RTL mode, false for LTR mode
    static func isRTL(for view: UIView) -> Bool {
        return UIView.userInterfaceLayoutDirection(
            for: view.semanticContentAttribute
        ) == .rightToLeft
    }
    
    /// Detects whether the current app is in RTL mode
    /// - Returns: true for RTL mode, false for LTR mode
    static func isRTL() -> Bool {
        return UIApplication.shared.userInterfaceLayoutDirection == .rightToLeft
    }
    
    // MARK: - Logical Property Mapping
    
    /// Maps logical properties to physical properties
    /// - Parameters:
    ///   - logicalProperty: Logical property name (e.g., "margin-inline-start")
    ///   - view: View object, used to determine RTL mode
    /// - Returns: Physical property name (e.g., "margin-left" or "margin-right")
    static func mapLogicalToPhysical(logicalProperty: String, for view: UIView) -> String {
        let isRTL = isRTL(for: view)
        return mapLogicalToPhysical(logicalProperty: logicalProperty, isRTL: isRTL)
    }
    
    /// Maps logical properties to physical properties
    /// - Parameters:
    ///   - logicalProperty: Logical property name
    ///   - isRTL: Whether in RTL mode
    /// - Returns: Physical property name
    static func mapLogicalToPhysical(logicalProperty: String, isRTL: Bool) -> String {
        switch logicalProperty {
        // Margin logical properties
        case "margin-inline-start":
            return isRTL ? "margin-right" : "margin-left"
        case "margin-inline-end":
            return isRTL ? "margin-left" : "margin-right"
        case "margin-block-start":
            return "margin-top"
        case "margin-block-end":
            return "margin-bottom"
            
        // Padding logical properties
        case "padding-inline-start":
            return isRTL ? "padding-right" : "padding-left"
        case "padding-inline-end":
            return isRTL ? "padding-left" : "padding-right"
        case "padding-block-start":
            return "padding-top"
        case "padding-block-end":
            return "padding-bottom"
            
        // If not a logical property, return as-is
        default:
            return logicalProperty
        }
    }
    
    // MARK: - Directional Value Mapping
    
    /// Maps directional keywords (e.g., start/end) to physical directions
    /// - Parameters:
    ///   - keyword: Directional keyword ("start" or "end")
    ///   - isRTL: Whether in RTL mode
    /// - Returns: Physical direction ("left" or "right")
    static func mapDirectionKeyword(_ keyword: String, isRTL: Bool) -> String {
        switch keyword.lowercased() {
        case "start":
            return isRTL ? "right" : "left"
        case "end":
            return isRTL ? "left" : "right"
        default:
            return keyword
        }
    }
    
    // MARK: - Batch Mapping
    
    /// Batch maps logical properties to physical properties
    /// - Parameters:
    ///   - properties: Property dictionary
    ///   - view: View object
    /// - Returns: Mapped property dictionary
    static func mapLogicalProperties(_ properties: [String: Any], for view: UIView) -> [String: Any] {
        var mappedProperties: [String: Any] = [:]
        let isRTL = isRTL(for: view)
        
        for (key, value) in properties {
            let physicalKey = mapLogicalToPhysical(logicalProperty: key, isRTL: isRTL)
            mappedProperties[physicalKey] = value
        }
        
        return mappedProperties
    }
    
    // MARK: - Helper Methods
    
    /// Determines if a property is a logical property
    /// - Parameter property: Property name
    /// - Returns: true if it is a logical property
    static func isLogicalProperty(_ property: String) -> Bool {
        let logicalProperties = [
            "margin-inline-start", "margin-inline-end",
            "margin-block-start", "margin-block-end",
            "padding-inline-start", "padding-inline-end",
            "padding-block-start", "padding-block-end"
        ]
        return logicalProperties.contains(property)
    }
    
    /// Determines if a property is an inline-direction logical property
    /// - Parameter property: Property name
    /// - Returns: true if it is an inline-direction logical property
    static func isInlineProperty(_ property: String) -> Bool {
        return property.contains("inline")
    }
    
    /// Determines if a property is a block-direction logical property
    /// - Parameter property: Property name
    /// - Returns: true if it is a block-direction logical property
    static func isBlockProperty(_ property: String) -> Bool {
        return property.contains("block")
    }
}
