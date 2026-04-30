//
//  CSSPropertyConfig.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import Foundation

/// CSS property configuration
/// Defines metadata information for each CSS property
struct CSSPropertyConfig {
    /// Property name, e.g., "width", "margin", "background-color"
    let name: String
    
    /// Property value type
    let valueType: CSSValueType
    
    /// Default value (optional)
    let defaultValue: CSSPropertyValue?
    
    /// Property validator (optional)
    /// Used to validate whether a property value meets specific rules
    let validator: PropertyValidator?
    
    /// Property priority
    /// Lower number means higher priority, used for property override handling
    /// Example: margin-inline-start has higher priority than margin
    let priority: Int
    
    /// Valid values list (optional)
    /// Used for value validation of keyword type properties
    /// Example: valid values for border-style are ["solid"]
    let validValues: [String]?
    
    // MARK: - Initialization
    
    /// Creates property configuration
    /// - Parameters:
    ///   - name: Property name
    ///   - valueType: Value type
    ///   - defaultValue: Default value
    ///   - validator: Validator
    ///   - priority: Priority
    ///   - validValues: Valid values list (for keyword types)
    init(
        name: String,
        valueType: CSSValueType,
        defaultValue: CSSPropertyValue? = nil,
        validator: PropertyValidator? = nil,
        priority: Int,
        validValues: [String]? = nil
    ) {
        self.name = name
        self.valueType = valueType
        self.defaultValue = defaultValue
        self.validator = validator
        self.priority = priority
        self.validValues = validValues
    }
}

/// Property validator protocol
/// Used for custom property value validation logic
protocol PropertyValidator {
    /// Validates whether a property value is valid
    /// - Parameter value: Property value to validate
    /// - Returns: true if valid, false if invalid
    func validate(_ value: CSSPropertyValue) -> Bool
}
