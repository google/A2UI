//
//  ListComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/3.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// ListComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - direction: Layout direction (String: vertical, horizontal)
/// - align: Cross axis alignment (String: start, center, end, stretch)
/// - spacing: Child component spacing (Double, default 0)
/// - children: Child component ID array (Array<String>)
///
/// Design notes:
/// - Uses UIScrollView as the underlying container for scrollable content
/// - Vertical direction: scrolling disabled, layout is .column
/// - Horizontal direction: scrolling enabled, layout is .row
/// - Content size is manually synced based on child component frames
class ListComponent: Component {
    
    // MARK: - Properties
    
    /// List direction
    private var direction: ListDirection = .vertical
    
    /// Cross axis alignment
    private var align: String = "start"
    
    /// Underlying ScrollView, all child components are added directly to this
    private let scrollView: UIScrollView = UIScrollView()
        
    // MARK: - Enums
    
    enum ListDirection: String {
        case vertical = "vertical"
        case horizontal = "horizontal"
    }
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "List", properties: properties)
        
        // Configure scrollView basic properties (without setting flex)
        scrollView.showsVerticalScrollIndicator = false
        scrollView.showsHorizontalScrollIndicator = false
        flex.addItem(scrollView).grow(1)
        
        // Parse properties and configure
        parseProperties()
        configureLayout()
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        // Call parent method to apply CSS properties to self
        super.updateProperties(properties)
        
        // Parse properties
        let oldDirection = direction
        parseProperties()
        
        // Reconfigure layout if direction changed
        if oldDirection != direction {
            configureLayout()
        }
    }
    
    // MARK: - Private Methods
    
    /// Parse component properties
    private func parseProperties() {
        // Parse direction
        if let directionStr = properties["direction"] as? String,
           let dir = ListDirection(rawValue: directionStr) {
            direction = dir
        }
        
        // Parse align
        if let alignValue = properties["align"] as? String {
            align = alignValue
        }
    }
    
    /// Configure scroll direction
    private func configureLayout() {
        if direction == .vertical {
            scrollView.isScrollEnabled = false
            scrollView.alwaysBounceVertical = false
            scrollView.alwaysBounceHorizontal = false
            scrollView.flex.direction(.column)
        } else {
            scrollView.isScrollEnabled = true
            scrollView.alwaysBounceVertical = false
            scrollView.alwaysBounceHorizontal = false
            scrollView.flex.direction(.row)
        }
    }
    
    /// Sync scrollView contentSize
    private func updateScrollViewContentSize() {
        var contentHeight: CGFloat = 0
        var contentWidth: CGFloat = 0
        
        for child in children {
            if child.frame.maxY > contentHeight { contentHeight = child.frame.maxY }
            if child.frame.maxX > contentWidth { contentWidth = child.frame.maxX }
        }
        
        if direction == .vertical {
            scrollView.contentSize = CGSize(width: scrollView.bounds.width, height: contentHeight)
        } else {
            scrollView.contentSize = CGSize(width: contentWidth, height: scrollView.bounds.height)
        }
    }
    
    // MARK: - Child Management
    
    override func addChild(_ child: Component) {
        // Call super first, let base class handle parent/surface/children array and insert position calculation
        super.addChild(child)
        
        // Base class adds child to self, move it into scrollView
        if child.superview == self {
            let insertPosition = scrollView.subviews.count
            scrollView.insertSubview(child, at: insertPosition)
            updateScrollViewContentSize()
        }
    }
    
    override func removeChild(_ child: Component) {
        super.removeChild(child)
        updateScrollViewContentSize()
    }
}
