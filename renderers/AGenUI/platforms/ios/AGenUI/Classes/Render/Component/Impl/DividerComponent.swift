//
//  DividerComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/27.
//

import UIKit

/// DividerComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - axis: Divider direction (String: horizontal, vertical)
/// - variants: Divider style variant (Dictionary)
///   - type: Style type (String: solid, dashed, dotted, repeat, plain)
///   - background-color: Background color for repeat variant (String, hex format)
///   - img: Image URL for repeat variant (String)
class DividerComponent: Component {
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Divider", properties: properties)
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        // Call parent method to apply CSS properties to self
        // background-color, height, width etc. are applied automatically
        super.updateProperties(properties)
    }
    
    // MARK: - Private Methods
}
