//
//  Component.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/4/1.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// Component base class - inherits from UIView
///
/// Core design philosophy: Component is View, View is Component
/// - Component itself is a UIView, no additional view property needed
/// - Parent-child relationship is view hierarchy: addChild() automatically calls addSubview()
/// - Tree structure managed via Component's parent/children properties
@objc open class Component: UIView {
    
    // MARK: - Core Properties
    
    /// Unique component identifier
    public let componentId: String
    
    /// Component type
    public let componentType: String
    
    /// Component properties
    public var properties: [String: Any] = [:]
    
    // MARK: - Tree Structure
    
    /// Child components list
    public private(set) var children: [Component] = []
    
    /// Parent component
    public weak var parent: Component?
    
    /// Owning Surface
    public weak var surface: Surface?
    
    // MARK: - Action
    
    /// Action definition, extracted from properties["action"]
    private(set) var actionDef: [String: Any]?
    
    /// Tap gesture recognizer
    private var tapGesture: UITapGestureRecognizer?
    
    // MARK: - Initialization
    
    /// Initialize component
    ///
    /// - Parameters:
    ///   - componentId: Unique component identifier
    ///   - componentType: Component type
    ///   - properties: Initial properties
    public init(componentId: String, componentType: String, properties: [String: Any] = [:]) {
        self.componentId = componentId
        self.componentType = componentType
        self.properties = properties
        super.init(frame: .zero)
        
        #if DEBUG
        accessibilityLabel = "\(componentType) \(componentId)"
        accessibilityIdentifier = "\(componentType) \(componentId)"
        #endif
        
        // Note: Do not call updateProperties in base class init
        // because subclass properties (e.g., label) are not yet initialized
        // Subclasses should call updateProperties(properties) after creating internal views
    }
    
    required public init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Tree Operations
    
    /// Add a child component
    ///
    /// Automatically establishes parent-child relationship and adds to view hierarchy.
    /// Uses relative position insertion to ensure child view order matches properties["children"].
    ///
    /// - Parameter child: Child component
    open func addChild(_ child: Component) {
        // Avoid duplicate addition
        if children.contains(where: { $0.componentId == child.componentId }) {
            return
        }
        
        // Set parent-child relationship
        child.parent = self
        child.surface = self.surface
        
        // Get target position from children array
        let childrenIds = getChildrenIdsFromProperties()
        guard let targetIndex = childrenIds.firstIndex(of: child.componentId) else {
            // Not in children array
            return
        }
        
        // Calculate actual insertion position (relative position insertion algorithm)
        // Iterate through siblings before current child in childrenIds, count those already in children array
        var insertPosition = 0
        for (index, siblingId) in childrenIds.enumerated() {
            if index >= targetIndex { break }
            // Check if this sibling is already in children array (by componentId match)
            if children.contains(where: { $0.componentId == siblingId }) {
                insertPosition += 1
            }
        }
        
        // Insert at correct position in children array
        children.insert(child, at: min(insertPosition, children.count))
        
        // Use insertSubview to insert at correct view position
        insertSubview(child, at: insertPosition)
        _ = child.flex
    }
    
    /// Remove a child component
    ///
    /// - Parameter child: Child component
    open func removeChild(_ child: Component) {
        // Remove from view hierarchy
        child.removeFromSuperview()
        
        // Clear parent-child relationship
        child.parent = nil
        child.surface = nil
        
        // Remove from list
        children.removeAll { $0.componentId == child.componentId }
    }
    
    /// Insert child component at specified position
    ///
    /// - Parameters:
    ///   - child: Child component
    ///   - index: Insertion position
    open func insertChild(_ child: Component, at index: Int) {
        guard index >= 0 && index <= children.count else { return }
        
        // Avoid duplicate addition
        if children.contains(where: { $0.componentId == child.componentId }) {
            return
        }
        
        children.insert(child, at: index)
        child.parent = self
        child.surface = self.surface
        
        // Add subview via FlexLayout (FlexLayout will arrange in order)
        flex.addItem(child)
    }
    
    /// Get child component
    ///
    /// - Parameter componentId: Component ID
    /// - Returns: Child component instance, or nil if not found
    public func getChild(_ componentId: String) -> Component? {
        return children.first { $0.componentId == componentId }
    }
    
    /// Find child component (recursive)
    ///
    /// - Parameter componentId: Component ID
    /// - Returns: Child component instance, or nil if not found
    public func findChild(_ componentId: String) -> Component? {
        // First search direct children
        if let child = getChild(componentId) {
            return child
        }
        
        // Recursive search
        for child in children {
            if let found = child.findChild(componentId) {
                return found
            }
        }
        
        return nil
    }
    
    // MARK: - Children Management
    
    /// Get child component IDs from properties
    ///
    /// Subclasses can override to customize which properties to extract child IDs from.
    /// Default: extracts from properties["children"].
    ///
    /// - Returns: Child component ID array
    open func getChildrenIdsFromProperties() -> [String] {
        return properties["children"] as? [String] ?? []
    }
    
    // MARK: - Property Updates
    
    /// Update component properties
    ///
    /// Subclasses should override this method to handle specific properties.
    ///
    /// - Parameter properties: New properties dictionary
    open func updateProperties(_ properties: [String: Any]) {
        var allProperties = properties
        
        // 1. Extract and merge styles field
        if let styles = properties["styles"] as? [String: Any] {
            let supportedStyles = filterSupportedProperties(styles)
            allProperties.merge(supportedStyles) { _, new in new }
            allProperties.removeValue(forKey: "styles")
        }
        
        // 2. Normalize property names (handle aliases, e.g., backgroundColor → background-color)
        let normalizedProperties = CSSPropertyAlias.normalize(properties: allProperties)
        
        // 3. Update stored properties
        self.properties.merge(normalizedProperties) { _, new in new }
        
        // 4. Apply CSS properties to self (Component is itself a UIView)
        //    This sets flex.width/height/margin/padding, etc.
        CSSPropertyApplier.apply(properties: normalizedProperties, to: self)
        
        // 5. Extract and process action
        if let action = properties["action"] as? [String: Any] {
            self.actionDef = action
            addTapGesture()
        } else if properties["action"] == nil {
            // Only remove when explicitly passed nil
        }
        
        #if DEBUG
        accessibilityHint = properties.description
        #endif
    }
    
    /// Filter supported CSS properties
    /// - Parameter properties: Original properties dictionary
    /// - Returns: Dictionary containing only supported properties
    private func filterSupportedProperties(_ properties: [String: Any]) -> [String: Any] {
        let supportedKeys = CSSPropertyRegistry.shared.getAllPropertyNames()
        return properties.filter { key, _ in
            let normalizedKey = CSSPropertyAlias.normalize(property: key)
            return supportedKeys.contains(normalizedKey)
        }
    }
    
    // MARK: - Layout
    
    /// Notify layout change
    @objc public func notifyLayoutChanged() {
        surface?.notifyLayoutChangedInternal()
    }
    
    // MARK: - Lifecycle
    
    /// Destroy component
    ///
    /// Recursively destroys all child components and removes from parent view
    open func destroy() {
        // Recursively destroy children
        for child in children {
            child.destroy()
        }
        children.removeAll()
        
        // Clear relationships
        parent = nil
        surface = nil
        
        // Remove from parent view
        removeFromSuperview()
    }
    
    // MARK: - Gesture Handling
    
    /// Add tap gesture
    private func addTapGesture() {
        guard tapGesture == nil else { return }
        
        let gesture = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        addGestureRecognizer(gesture)
        isUserInteractionEnabled = true
        tapGesture = gesture
    }
    
    /// Remove tap gesture
    private func removeTapGesture() {
        guard let gesture = tapGesture else { return }
        removeGestureRecognizer(gesture)
        tapGesture = nil
    }
    
    /// Trigger UI action to notify SDK of user interaction
    ///
    /// Component instance is already bound to its identifier, no need to pass it when calling.
    @objc public func triggerAction() {
        guard let actionDef = actionDef, let surface = surface else { return }
        surface.surfaceManager?.triggerAction(
            surfaceId: surface.surfaceId,
            componentId: componentId,
            context: ["action": actionDef]
        )
    }

    /// Sync this component's UI state to the data model
    ///
    /// Suitable for UI state changes such as form input, toggle state, etc.
    ///
    /// - Parameter change: State change key-value pair
    @objc public func syncState(_ change: [String: Any]) {
        guard let surface = surface else { return }
        surface.surfaceManager?.syncState(
            surfaceId: surface.surfaceId,
            componentId: componentId,
            context: change
        )
    }

    /// Handle tap event
    @objc open func handleTap() {
        triggerAction()
    }
    
    // MARK: - Local Style Config
    
    /// Get the component's local style config
    ///
    /// Reads config for current component type from localConfig.json
    /// - Returns: Config dictionary, or nil if no config for current component type
    internal func getLocalStyleConfig() -> [String: Any]? {
        return ComponentStyleConfigManager.shared.getConfig(for: componentType)
    }
}
