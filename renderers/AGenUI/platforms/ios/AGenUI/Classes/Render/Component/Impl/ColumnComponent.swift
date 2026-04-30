//
//  ColumnComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/27.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// ColumnComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - children: Child component ID array (Array<String>)
/// - justify: Main axis alignment (String: start, center, end, spaceBetween, spaceAround, spaceEvenly)
/// - align: Cross axis alignment (String: start, center, end, stretch)
/// - spacing: Child component spacing (Double, default 0)
///
/// Design notes:
/// - Uses FlexLayout with .column direction for vertical layout
/// - CSS properties (justify-content, align-items, etc.) are applied automatically via CSSPropertyApplier
class ColumnComponent: Component {
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Column", properties: properties)
        
        // Configure FlexLayout - vertical layout
        flex.direction(.column)
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        // Call parent method to apply CSS properties to self
        // justify-content, align-items etc. are applied automatically via CSSPropertyApplier
        super.updateProperties(properties)
        
        // Handle Column-specific properties
        applyColumnSpecificProperties(properties)
    }
    
    // MARK: - Private Methods
    
    private func applyColumnSpecificProperties(_ properties: [String: Any]) {
        // Update main axis alignment (justify)
        if let justify = properties["justify"] as? String {
            switch justify.lowercased() {
            case "center":
                flex.justifyContent(.center)
            case "end":
                flex.justifyContent(.end)
            case "spacebetween":
                flex.justifyContent(.spaceBetween)
            case "spacearound":
                flex.justifyContent(.spaceAround)
            case "spaceevenly":
                flex.justifyContent(.spaceEvenly)
            default: // start
                flex.justifyContent(.start)
            }
        }
        
        // Update cross axis alignment (align)
        if let align = properties["align"] as? String {
            switch align.lowercased() {
            case "center":
                flex.alignItems(.center)
            case "end":
                flex.alignItems(.end)
            case "stretch":
                flex.alignItems(.stretch)
            default: // start
                flex.alignItems(.start)
            }
        }
    }
}
