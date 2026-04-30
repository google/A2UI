//
//  CSSPropertyRegistry.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import UIKit

/// CSS property registry
/// Manages configuration information for all CSS properties
class CSSPropertyRegistry {
    
    // MARK: - Singleton
    
    /// Shared instance
    static let shared: CSSPropertyRegistry = {
        let instance = CSSPropertyRegistry()
        // Automatically initialize all properties when singleton is created
        initialize()
        return instance
    }()
    
    // MARK: - Property Storage
    
    /// Property configuration dictionary
    /// Key: property name, Value: property configuration
    private static var configs: [String: CSSPropertyConfig] = [:]
    
    /// Whether initialization is complete
    private static var isInitialized = false
    
    // MARK: - Public Methods
    
    /// Registers property configuration
    /// - Parameter config: Property configuration to register
    static func register(config: CSSPropertyConfig) {
        configs[config.name] = config
    }
    
    /// Gets property configuration
    /// - Parameter property: Property name
    /// - Returns: Property configuration, or nil if not found
    static func config(for property: String) -> CSSPropertyConfig? {
        return configs[property]
    }
    
    /// Gets all registered property names
    /// - Returns: Set of property names
    func getAllPropertyNames() -> Set<String> {
        return Set(CSSPropertyRegistry.configs.keys)
    }
    
    /// Initializes all property configurations
    /// Registers all supported CSS properties
    static func initialize() {
        guard !isInitialized else { return }
        isInitialized = true
        
        // Register P0 batch properties
        registerP0Properties()
        
        // Register P1 batch properties
        registerP1Properties()
        
        // Register Flex layout extension properties
        registerFlexLayoutProperties()
        
        // Register Requirement 9 properties
        registerRequirement9Properties()
        
        // Register Position properties
        registerPositionProperties()
    }
    
    // MARK: - P0 Batch Property Registration
    
    /// Registers 18 properties in the P0 batch
    private static func registerP0Properties() {
        // Size control (priority: 100, 90, 80)
        registerDimensionProperties()
        
        // Spacing control - uniform values (priority: 70)
        registerUniformSpacingProperties()
        
        // Spacing control - logical properties (priority: 60)
        registerLogicalSpacingProperties()
        
        // Layout alignment (priority: 50)
        registerLayoutProperties()
        
        // Style properties (priority: 40)
        registerStyleProperties()
    }
    
    /// Registers size control properties
    private static func registerDimensionProperties() {
        // width, height (priority: 100)
        register(config: CSSPropertyConfig(
            name: "width",
            valueType: .dimension,
            defaultValue: nil,
            validator: nil,
            priority: 100
        ))
        
        register(config: CSSPropertyConfig(
            name: "height",
            valueType: .dimension,
            defaultValue: nil,
            validator: nil,
            priority: 100
        ))
        
        // max-width, max-height (priority: 90)
        register(config: CSSPropertyConfig(
            name: "max-width",
            valueType: .dimension,
            defaultValue: nil,
            validator: nil,
            priority: 90
        ))
        
        register(config: CSSPropertyConfig(
            name: "max-height",
            valueType: .dimension,
            defaultValue: nil,
            validator: nil,
            priority: 90
        ))
        
        // min-width, min-height (priority: 80)
        register(config: CSSPropertyConfig(
            name: "min-width",
            valueType: .dimension,
            defaultValue: nil,
            validator: nil,
            priority: 80
        ))
        
        register(config: CSSPropertyConfig(
            name: "min-height",
            valueType: .dimension,
            defaultValue: nil,
            validator: nil,
            priority: 80
        ))
    }
    
    /// Registers uniform spacing properties
    private static func registerUniformSpacingProperties() {
        // margin, padding (priority: 70)
        register(config: CSSPropertyConfig(
            name: "margin",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 70
        ))
        
        register(config: CSSPropertyConfig(
            name: "padding",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 70
        ))
    }
    
    /// Registers logical spacing properties (RTL support)
    private static func registerLogicalSpacingProperties() {
        // margin-inline-start, margin-inline-end (priority: 60)
        register(config: CSSPropertyConfig(
            name: "margin-inline-start",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 60
        ))
        
        register(config: CSSPropertyConfig(
            name: "margin-inline-end",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 60
        ))
    }
    
    /// Registers layout alignment properties
    private static func registerLayoutProperties() {
        // justify-content (priority: 50)
        register(config: CSSPropertyConfig(
            name: "justify-content",
            valueType: .alignment,
            defaultValue: .keyword("start"),
            validator: nil,
            priority: 50
        ))
        
        // align-items (priority: 50)
        register(config: CSSPropertyConfig(
            name: "align-items",
            valueType: .alignment,
            defaultValue: .keyword("stretch"),
            validator: nil,
            priority: 50
        ))
        
        // align-self (priority: 50)
        register(config: CSSPropertyConfig(
            name: "align-self",
            valueType: .alignment,
            defaultValue: .keyword("auto"),
            validator: nil,
            priority: 50
        ))
        
        // flex-grow (priority: 50)
        register(config: CSSPropertyConfig(
            name: "flex-grow",
            valueType: .number,
            defaultValue: .number(0),
            validator: nil,
            priority: 50
        ))
        
        // flex-shrink (priority: 50)
        register(config: CSSPropertyConfig(
            name: "flex-shrink",
            valueType: .number,
            defaultValue: .number(1),
            validator: nil,
            priority: 50
        ))
    }
    
    /// Registers style properties
    private static func registerStyleProperties() {
        // background (priority: 40)
        // Simplified version: only supports color values
        register(config: CSSPropertyConfig(
            name: "background",
            valueType: .color,
            defaultValue: nil,
            validator: nil,
            priority: 40
        ))
        
        // background-color (priority: 40)
        register(config: CSSPropertyConfig(
            name: "background-color",
            valueType: .color,
            defaultValue: nil,
            validator: nil,
            priority: 40
        ))
        
        // border-radius (priority: 40)
        register(config: CSSPropertyConfig(
            name: "border-radius",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 40
        ))
        
        // opacity (priority: 40)
        register(config: CSSPropertyConfig(
            name: "opacity",
            valueType: .opacity,
            defaultValue: .number(1.0),
            validator: nil,
            priority: 40
        ))
        
        // background-image (priority: 39, lower than background-color)
        // Supports CSS url() function format
        register(config: CSSPropertyConfig(
            name: "background-image",
            valueType: .url,
            defaultValue: nil,
            validator: nil,
            priority: 39
        ))
    }
    
    // MARK: - P1 Batch Property Registration
    
    /// Registers 6 properties in the P1 batch
    private static func registerP1Properties() {
        // Directional spacing properties (priority: 60)
        registerDirectionalSpacingProperties()
        
        // Border properties (priority: 40)
        registerBorderProperties()
        
        // Physical directional properties (priority: 55)
        registerPhysicalDirectionalProperties()
    }
    
    /// Registers directional spacing properties
    private static func registerDirectionalSpacingProperties() {
        // margin-block-start, margin-block-end
        register(config: CSSPropertyConfig(
            name: "margin-block-start",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 60
        ))
        
        register(config: CSSPropertyConfig(
            name: "margin-block-end",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 60
        ))
        
        // padding-inline-start, padding-inline-end
        register(config: CSSPropertyConfig(
            name: "padding-inline-start",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 60
        ))
        
        register(config: CSSPropertyConfig(
            name: "padding-inline-end",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 60
        ))
        
        // padding-block-start, padding-block-end
        register(config: CSSPropertyConfig(
            name: "padding-block-start",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 60
        ))
        
        register(config: CSSPropertyConfig(
            name: "padding-block-end",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 60
        ))
    }
    
    /// Registers border properties
    private static func registerBorderProperties() {
        // border-color (priority: 40)
        register(config: CSSPropertyConfig(
            name: "border-color",
            valueType: .color,
            defaultValue: .color(.black),
            validator: nil,
            priority: 40
        ))
        
        // border-width (priority: 40)
        register(config: CSSPropertyConfig(
            name: "border-width",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 40
        ))
    }
    
    /// Registers physical directional properties
    /// Priority 55: higher than uniform properties (70), but lower than logical properties (60)
    private static func registerPhysicalDirectionalProperties() {
        // margin-top, margin-right, margin-bottom, margin-left
        register(config: CSSPropertyConfig(
            name: "margin-top",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 55
        ))
        
        register(config: CSSPropertyConfig(
            name: "margin-right",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 55
        ))
        
        register(config: CSSPropertyConfig(
            name: "margin-bottom",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 55
        ))
        
        register(config: CSSPropertyConfig(
            name: "margin-left",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 55
        ))
        
        // padding-top, padding-right, padding-bottom, padding-left
        register(config: CSSPropertyConfig(
            name: "padding-top",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 55
        ))
        
        register(config: CSSPropertyConfig(
            name: "padding-right",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 55
        ))
        
        register(config: CSSPropertyConfig(
            name: "padding-bottom",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 55
        ))
        
        register(config: CSSPropertyConfig(
            name: "padding-left",
            valueType: .dimension,
            defaultValue: .number(0),
            validator: nil,
            priority: 55
        ))
    }
    
    // MARK: - Flex Layout Extension Property Registration
    
    /// Registers flex layout extension properties (flex-wrap, align-content, flex-basis, aspect-ratio)
    private static func registerFlexLayoutProperties() {
        // flex-wrap (priority: 50)
        // Controls whether flex items wrap
        register(config: CSSPropertyConfig(
            name: "flex-wrap",
            valueType: .keyword,
            defaultValue: .keyword("nowrap"),
            validator: nil,
            priority: 50,
            validValues: ["nowrap", "wrap", "wrap-reverse"]
        ))
        
        // align-content (priority: 50)
        // Controls alignment of rows in a multi-line flex container
        register(config: CSSPropertyConfig(
            name: "align-content",
            valueType: .keyword,
            defaultValue: .keyword("stretch"),
            validator: nil,
            priority: 50,
            validValues: ["start", "center", "end", "stretch", "space-between", "space-around"]
        ))
        
        // flex-basis (priority: 50)
        // Sets the initial size of flex items
        register(config: CSSPropertyConfig(
            name: "flex-basis",
            valueType: .dimension,
            defaultValue: nil,
            validator: nil,
            priority: 50
        ))
        
        // aspect-ratio (priority: 50)
        // Sets the aspect ratio of flex items
        // Example: "1.5", "16/9", etc.
        register(config: CSSPropertyConfig(
            name: "aspect-ratio",
            valueType: .number,
            defaultValue: nil,
            validator: nil,
            priority: 50
        ))
    }
    
    // MARK: - Requirement 9 Property Registration
    
    /// Registers 6 display control and visual effect properties from Requirement 9
    private static func registerRequirement9Properties() {
        // border-style (priority: 40)
        // iOS only supports solid, this property is mainly used for validation
        register(config: CSSPropertyConfig(
            name: "border-style",
            valueType: .keyword,
            defaultValue: .keyword("solid"),
            validator: nil,
            priority: 40
        ))
        
        // overflow (priority: 45)
        // Controls content overflow behavior
        register(config: CSSPropertyConfig(
            name: "overflow",
            valueType: .keyword,
            defaultValue: .keyword("visible"),
            validator: nil,
            priority: 45,
            validValues: ["visible", "hidden"]
        ))
        
        // visibility (priority: 45)
        // Controls element visibility (still takes up space)
        register(config: CSSPropertyConfig(
            name: "visibility",
            valueType: .keyword,
            defaultValue: .keyword("visible"),
            validator: nil,
            priority: 45,
            validValues: ["visible", "hidden"]
        ))
        
        // display (priority: 44)
        // Controls element display state (takes no space)
        // Lower priority than visibility, ensuring display is applied last and overrides visibility settings
        register(config: CSSPropertyConfig(
            name: "display",
            valueType: .keyword,
            defaultValue: nil,
            validator: nil,
            priority: 44,
            validValues: ["none", "flex"]
        ))
        
        // filter (priority: 40)
        // Only supports drop-shadow filter effect
        register(config: CSSPropertyConfig(
            name: "filter",
            valueType: .shadow,
            defaultValue: nil,
            validator: nil,
            priority: 40
        ))
        
        // box-shadow (priority: 40)
        // Full box shadow support (including spread parameter)
        register(config: CSSPropertyConfig(
            name: "box-shadow",
            valueType: .shadow,
            defaultValue: nil,
            validator: nil,
            priority: 40
        ))
    }
    
    // MARK: - Position Property Registration
    
    /// Registers 10 Position-related properties
    /// Includes position, top, left, bottom, right, z-index and 4 RTL properties
    private static func registerPositionProperties() {
        // position (priority: 100)
        // Positioning type, must be applied before offset properties
        register(config: CSSPropertyConfig(
            name: "position",
            valueType: .keyword,
            defaultValue: .keyword("static"),
            validator: nil,
            priority: 100,
            validValues: ["static", "relative", "absolute"]
        ))
        
        // top (priority: 200)
        // Top offset, applied after position
        register(config: CSSPropertyConfig(
            name: "top",
            valueType: .dimension,
            defaultValue: .keyword("auto"),
            validator: nil,
            priority: 200
        ))
        
        // left (priority: 200)
        // Left offset, applied after position
        register(config: CSSPropertyConfig(
            name: "left",
            valueType: .dimension,
            defaultValue: .keyword("auto"),
            validator: nil,
            priority: 200
        ))
        
        // bottom (priority: 200)
        // Bottom offset, applied after position
        register(config: CSSPropertyConfig(
            name: "bottom",
            valueType: .dimension,
            defaultValue: .keyword("auto"),
            validator: nil,
            priority: 200
        ))
        
        // right (priority: 200)
        // Right offset, applied after position
        register(config: CSSPropertyConfig(
            name: "right",
            valueType: .dimension,
            defaultValue: .keyword("auto"),
            validator: nil,
            priority: 200
        ))
        
        // z-index (priority: 300)
        // Stacking order, applied after layout positioning
        register(config: CSSPropertyConfig(
            name: "z-index",
            valueType: .number,
            defaultValue: .keyword("auto"),
            validator: nil,
            priority: 300
        ))
        
        // P1: RTL-aware inset properties (priority: 200, same as physical offset)
        
        // inset-inline-start (priority: 200)
        // LTR: left, RTL: right
        register(config: CSSPropertyConfig(
            name: "inset-inline-start",
            valueType: .dimension,
            defaultValue: .keyword("auto"),
            validator: nil,
            priority: 200
        ))
        
        // inset-inline-end (priority: 200)
        // LTR: right, RTL: left
        register(config: CSSPropertyConfig(
            name: "inset-inline-end",
            valueType: .dimension,
            defaultValue: .keyword("auto"),
            validator: nil,
            priority: 200
        ))
        
        // inset-block-start (priority: 200)
        // Always maps to top
        register(config: CSSPropertyConfig(
            name: "inset-block-start",
            valueType: .dimension,
            defaultValue: .keyword("auto"),
            validator: nil,
            priority: 200
        ))
        
        // inset-block-end (priority: 200)
        // Always maps to bottom
        register(config: CSSPropertyConfig(
            name: "inset-block-end",
            valueType: .dimension,
            defaultValue: .keyword("auto"),
            validator: nil,
            priority: 200
        ))
    }
}
