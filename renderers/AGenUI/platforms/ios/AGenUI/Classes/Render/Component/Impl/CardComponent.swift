//
//  CardComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/27.
//

import UIKit

/// CardComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - children: Child component ID array (Array<String>)
/// - CSS properties: padding, background-color, border-radius, box-shadow (applied via CSSPropertyApplier)
class CardComponent: Component {
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Card", properties: properties)
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        // Call parent method to apply CSS properties to self
        // padding, background-color, border-radius, box-shadow etc. are applied automatically
        super.updateProperties(properties)
    }
}
