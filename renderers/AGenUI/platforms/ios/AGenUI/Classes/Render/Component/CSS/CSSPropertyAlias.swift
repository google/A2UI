//
//  CSSPropertyAlias.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import Foundation

/// CSS property alias handling
///
/// Provides mapping from property aliases to standard property names, ensuring backward compatibility.
/// Supports converting common camelCase naming to standard CSS kebab-case.
class CSSPropertyAlias {
    
    // MARK: - Properties
    
    /// Property alias mapping table
    ///
    /// Maps common camelCase naming to standard CSS kebab-case naming
    private static let aliases: [String: String] = [
        // Style property aliases
        "backgroundColor": "background-color",
        "background": "background",
        "cornerRadius": "border-radius",
        "borderColor": "border-color",
        "borderWidth": "border-width",
        "borderStyle": "border-style",
        "boxShadow": "box-shadow",
        
        // Layout property aliases
        "justifyContent": "justify-content",
        "justify": "justify-content",
        "align": "align-items",
        "alignSelf": "align-self",
        "alignContent": "align-content",
        "flexGrow": "flex-grow",
        "flexShrink": "flex-shrink",
        "flexWrap": "flex-wrap",
        "flexBasis": "flex-basis",
        
        // Size property aliases
        "maxWidth": "max-width",
        "maxHeight": "max-height",
        "minWidth": "min-width",
        "minHeight": "min-height",
        
        // Logical spacing property aliases
        "marginInlineStart": "margin-inline-start",
        "marginInlineEnd": "margin-inline-end",
        "marginBlockStart": "margin-block-start",
        "marginBlockEnd": "margin-block-end",
        "paddingInlineStart": "padding-inline-start",
        "paddingInlineEnd": "padding-inline-end",
        "paddingBlockStart": "padding-block-start",
        "paddingBlockEnd": "padding-block-end",
        
        // Physical directional property aliases
        "marginTop": "margin-top",
        "marginRight": "margin-right",
        "marginBottom": "margin-bottom",
        "marginLeft": "margin-left",
        "paddingTop": "padding-top",
        "paddingRight": "padding-right",
        "paddingBottom": "padding-bottom",
        "paddingLeft": "padding-left"
    ]
    
    // MARK: - Public Methods
    
    /// Converts an alias to its standard property name
    ///
    /// - Parameter property: Property name (may be an alias)
    /// - Returns: Standard property name
    ///
    /// Example:
    /// ```swift
    /// let standard = CSSPropertyAlias.normalize(property: "backgroundColor")
    /// // Returns: "background-color"
    /// ```
    static func normalize(property: String) -> String {
        return aliases[property] ?? property
    }
    
    /// Batch converts a property dictionary
    ///
    /// - Parameter properties: Property dictionary (may contain aliases)
    /// - Returns: Normalized property dictionary
    ///
    /// Example:
    /// ```swift
    /// let props = ["backgroundColor": "#FF0000", "width": "100"]
    /// let normalized = CSSPropertyAlias.normalize(properties: props)
    /// // Returns: ["background-color": "#FF0000", "width": "100"]
    /// ```
    ///
    /// Note:
    /// - When the same standard property appears multiple times (e.g., "border-radius" and "cornerRadius"),
    ///   the later declared value will overwrite the earlier one
    /// - To maintain declaration order, uses sorted(by:) to sort by key name for consistency
    static func normalize(properties: [String: Any]) -> [String: Any] {
        var normalized: [String: Any] = [:]
        
        // Sort by key name to ensure consistent processing order
        // This guarantees the same input always produces the same output
        let sortedProperties = properties.sorted { $0.key < $1.key }
        
        for (key, value) in sortedProperties {
            let normalizedKey = normalize(property: key)
            // If the normalized key already exists, the later value overwrites the earlier one
            normalized[normalizedKey] = value
        }
        
        return normalized
    }
}
