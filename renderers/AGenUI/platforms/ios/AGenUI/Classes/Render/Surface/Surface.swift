//
//  Surface.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/27.
//  Refactored on 2026/4/1.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// Surface state
public enum SurfaceState {
    case created    // Created
    case destroyed  // Destroyed
}

/// Surface - Independent UI canvas
///
/// Manages component tree, where each Component is a UIView subclass.
/// The root component serves as the Surface's view.
@objc public class Surface: NSObject {
    
    // MARK: - Properties
    
    /// Surface unique identifier
    @objc public let surfaceId: String
    
    /// Surface state
    public private(set) var state: SurfaceState = .created
    
    /// Surface width constraint (CGFloat.infinity means infinite width)
    private(set) var width: CGFloat
    
    /// Surface height constraint (CGFloat.infinity means infinite height)
    private(set) var height: CGFloat
    
    /// Surface container view
    /// Root component will be added as a subview of this view
    @objc public let view: UIView
    
    /// Root component (tree root)
    private(set) var rootComponent: Component?
    
    /// Component tree (componentId -> Component)
    private var componentTree: [String: Component] = [:]
    
    /// Pending children waiting to be claimed by parent (componentId -> Component)
    /// Used when child component arrives before its parent
    private var pendingChildren: [String: Component] = [:]
    
    /// Layout change callback
    @objc public var onLayoutChanged: (() -> Void)?
    
    /// Whether component appear animations are enabled for this surface
    @objc public var animationEnabled: Bool = true
    
    /// Associated SurfaceManager (weak reference to avoid retain cycle)
    weak var surfaceManager: SurfaceManager?
    
    /// Flag indicating whether built-in components have been registered
    private static var hasRegisteredBuiltInComponents = false
    
    // MARK: - Initialization
    
    /// Initialize Surface
    ///
    /// - Parameters:
    ///   - surfaceId: Surface ID
    @objc public init(surfaceId: String) {
        self.surfaceId = surfaceId
        self.width = CGFloat.infinity
        self.height = CGFloat.infinity
        
        // Create container view
        let containerView = UIView()
        containerView.backgroundColor = .clear
        containerView.translatesAutoresizingMaskIntoConstraints = true
        containerView.clipsToBounds = false
        self.view = containerView
        
        self.view.accessibilityLabel = surfaceId;
        self.view.accessibilityIdentifier = surfaceId;
        
        Logger.shared.debug("Created: \(surfaceId), width: \(width), height: \(height)")
    }
    
    /// Create component using registered factory
    ///
    /// - Parameters:
    ///   - type: Component type
    ///   - id: Component ID
    ///   - properties: Component properties
    /// - Returns: Created component, or nil if factory not found
    private func createComponent(_ type: String, id: String, properties: [String: Any]) -> Component? {
        return ComponentRegister.shared.createComponent(type, id: id, properties: properties)
    }
    
    // MARK: - Notification
    @objc internal func notifyLayoutChangedInternal() {
        // Cancel previously scheduled but not yet executed layout updates
        notifyLayoutChangedInternalReal()
//        NSObject.cancelPreviousPerformRequests(withTarget: self, selector: #selector(Surface.notifyLayoutChangedInternalReal), object: nil)
//
//        // Perform layout update on next runloop (delay: 0 means next runloop)
//        perform(#selector(Surface.notifyLayoutChangedInternalReal), with: nil, afterDelay: 0)
    }
    
    /// Notify layout change
    @objc internal func notifyLayoutChangedInternalReal() {
        guard rootComponent != nil else {
            return
        }
        
        // Determine layout mode based on width/height constraints
        let layoutMode = determineLayoutMode()
        Logger.shared.debug("notifyLayoutChangedInternal: width=\(self.width), height=\(self.height), mode=\(layoutMode)")
        
        switch layoutMode {
        case .fitContainer:
            // Both width and height are finite: use fitContainer mode
            guard width > 0, height > 0 else {
                Logger.shared.debug("⚠ Invalid size for fitContainer mode")
                return
            }
            view.flex.width(width).height(height)
            view.flex.layout(mode: .fitContainer)
            view.tag = 0
            Logger.shared.debug("Layout completed (fitContainer): \(width) x \(height)")
            
        case .adjustHeight:
            // Width is finite, height is infinite: use adjustHeight mode
            let layoutWidth = width.isFinite ? width : UIScreen.main.bounds.width
            guard layoutWidth > 0 else {
                return
            }
            // Set view frame width to ensure correct percentage width calculation for child components
            view.flex.width(layoutWidth)
            view.flex.layout(mode: .adjustHeight)
            view.tag = 1
            Logger.shared.debug("Layout completed (adjustHeight): \(layoutWidth) x \(view.frame.height)")
            
        case .adjustWidth:
            // Width is infinite, height is finite: use adjustWidth mode
            guard height > 0 else {
                Logger.shared.debug("⚠ Invalid height for adjustWidth mode")
                return
            }
            // Set view frame height to ensure correct percentage height calculation for child components
            view.flex.height(height)
            view.flex.layout(mode: .adjustWidth)
            view.tag = 2
            Logger.shared.debug("Layout completed (adjustWidth): \(view.frame.width) x \(height)")
        }
        
        // Trigger layout change callback
        onLayoutChanged?()
    }
    
    /// Determine layout mode based on width/height constraints
    private func determineLayoutMode() -> Flex.LayoutMode {
        if width.isFinite && height.isFinite {
            return .fitContainer
        }
        if width.isFinite && height.isInfinite {
            return .adjustHeight
        }
        if width.isInfinite && height.isFinite {
            return .adjustWidth
        }
        // Default: both infinite, use adjustHeight
        return .adjustHeight
    }
    
    // MARK: - Size Management
    
    /// Update Surface size constraints
    ///
    /// - Parameters:
    ///   - width: New width constraint
    ///   - height: New height constraint
    @objc public func updateSize(width: CGFloat, height: CGFloat) {
        // Normalize size values
        let normalizedWidth = normalizeSize(width)
        let normalizedHeight = normalizeSize(height)
        
        self.width = normalizedWidth
        self.height = normalizedHeight
        
        Logger.shared.debug("Size updated: width=\(width)(normalized: \(normalizedWidth)), height=\(height)(normalized: \(normalizedHeight))")
        
        // Trigger layout change
        notifyLayoutChangedInternal()
    }
    
    /// Normalize size value - convert CGFloat_MAX to infinity
    private func normalizeSize(_ value: CGFloat) -> CGFloat {
        let maxThreshold: CGFloat = 1e308
        return value >= maxThreshold ? CGFloat.infinity : value
    }
    
    // MARK: - Component Management
    
    /// Add component to tree
    ///
    /// - Parameters:
    ///   - componentId: Component ID
    ///   - componentType: Component type
    ///   - properties: Component properties
    func addComponent(componentId: String, componentType: String, properties: [String: Any]) {
        guard state != .destroyed else {
            Logger.shared.debug("Cannot add component: Surface is destroyed")
            return
        }
        
        Logger.shared.debug("[Surface] Adding component: \(componentId) (\(componentType))")
        
        // Check if component already exists
        if componentTree[componentId] != nil {
            Logger.shared.debug("⚠ Component already exists: \(componentId)")
            return
        }
        
        // Create component
        guard let component = createComponent(componentType, id: componentId, properties: properties) else {
            Logger.shared.error("Failed to create component: \(componentType)")
            return
        }
        
        // Set owning Surface
        component.surface = self
        
        // Add to component tree
        componentTree[componentId] = component
        Logger.shared.debug("Component added to componentTree")
        
        // Case 1: componentId is "root" - add to view as root component
        if componentId == "root" {
            rootComponent = component
            Logger.shared.debug("Set as root component (id == 'root')")
            
            // Add root component to view
            view.flex.addItem(component)
        }
        
        // Process pending children: check if children IDs are in pendingChildren
        let childrenIds = component.getChildrenIdsFromProperties()
        if !childrenIds.isEmpty {
            processPendingChildren(for: component, childrenIds: childrenIds)
        }
        
        // Case 2: Check if parent already exists in componentTree
        // (parent arrived before this child) - traverse to find parent
        if componentId != "root" && component.parent == nil {
            if let parentComponent = findParentComponent(for: componentId) {
                parentComponent.addChild(component)
                Logger.shared.debug("Added to existing parent: \(parentComponent.componentId)")
            } else {
                // Parent not yet arrived, add to pendingChildren
                pendingChildren[componentId] = component
                Logger.shared.debug("Component added to pendingChildren: \(componentId)")
            }
        }
        
        notifyLayoutChangedInternal()
        Logger.shared.debug("Component added: \(component.componentId)")
    }
    
    /// Find parent component by traversing componentTree
    ///
    /// - Parameter childId: Child component ID
    /// - Returns: Parent component if found, nil otherwise
    private func findParentComponent(for childId: String) -> Component? {
        for (_, component) in componentTree {
            let childrenIds = component.getChildrenIdsFromProperties()
            if childrenIds.contains(childId) {
                return component
            }
        }
        return nil
    }
    
    /// Process pending children for a newly added component
    ///
    /// - Parameters:
    ///   - parent: The parent component
    ///   - childrenIds: Array of children component IDs
    private func processPendingChildren(for parent: Component, childrenIds: [String]) {
        for childId in childrenIds {
            // Check if child is in pendingChildren
            if let pendingChild = pendingChildren[childId] {
                parent.addChild(pendingChild)
                Logger.shared.debug("Added pending child: \(childId) to parent: \(parent.componentId)")
                
                // Remove from pending
                pendingChildren.removeValue(forKey: childId)
            }
        }
    }
    
    /// Remove component from tree
    ///
    /// - Parameter componentId: Component ID
    func removeComponent(componentId: String) {
        guard let component = componentTree[componentId] else {
            Logger.shared.debug("Component not found: \(componentId)")
            return
        }
        
        // Remove from parent
        component.parent?.removeChild(component)
        
        // Destroy component
        component.destroy()
        
        // Remove from tree
        componentTree.removeValue(forKey: componentId)
        
        // If it's the root component
        if rootComponent?.componentId == componentId {
            rootComponent = nil
        }
        
        // Notify layout change
        notifyLayoutChangedInternal()
        
        Logger.shared.debug("Component removed: \(componentId)")
    }
    
    /// Update component properties
    ///
    /// - Parameters:
    ///   - componentId: Component ID
    ///   - properties: New properties
    func updateComponent(componentId: String, properties: [String: Any]) {
        guard let component = componentTree[componentId] else {
            Logger.shared.debug("Component not found: \(componentId)")
            return
        }
        
        // Snapshot old children IDs before properties are overwritten
        let oldChildrenIds = component.getChildrenIdsFromProperties()
        
        // Update properties (component.properties["children"] is now updated)
        component.updateProperties(properties)
        
        // Sync children tree if children changed
        if properties["children"] != nil {
            let newChildrenIds = component.getChildrenIdsFromProperties()
            syncChildrenAfterUpdate(component: component,
                                    oldChildrenIds: oldChildrenIds,
                                    newChildrenIds: newChildrenIds)
        }
        
        // Notify layout change
        notifyLayoutChangedInternal()
        
        Logger.shared.debug("Component updated: \(componentId)")
    }
    
    /// Sync component children after a properties update.
    ///
    /// Mirrors the coordination logic in addComponent / processPendingChildren,
    /// keeping Surface as the sole orchestrator of the component tree.
    ///
    /// - Parameters:
    ///   - component:      The component whose children list changed
    ///   - oldChildrenIds: Children IDs before the update
    ///   - newChildrenIds: Children IDs after the update
    private func syncChildrenAfterUpdate(component: Component,
                                         oldChildrenIds: [String],
                                         newChildrenIds: [String]) {
        let oldSet = Set(oldChildrenIds)
        let newSet = Set(newChildrenIds)
        
        // 1. Remove children that are no longer listed
        //    Keep them in componentTree — they may be reused elsewhere
        let removedIds = oldSet.subtracting(newSet)
        for id in removedIds {
            if let child = component.getChild(id) {
                component.removeChild(child)
                Logger.shared.debug("[syncChildren] Removed child: \(id) from \(component.componentId)")
            }
        }
        
        // 2. Add newly listed children
        //    - If already in componentTree: attach immediately via addChild
        //      (addChild uses the now-updated properties["children"] for ordering)
        //    - If not yet arrived: register in pendingChildren so addComponent
        //      will claim them when they arrive — reusing the existing mechanism
        let addedIds = newSet.subtracting(oldSet)
        for id in addedIds {
            if let child = componentTree[id] {
                component.addChild(child)
                pendingChildren.removeValue(forKey: id)
                Logger.shared.debug("[syncChildren] Added child: \(id) to \(component.componentId)")
            } else {
                // Child not yet arrived; addComponent will find this parent via
                // findParentComponent when the child's JSON is processed
                Logger.shared.debug("[syncChildren] Child not yet arrived, pending: \(id)")
            }
        }
        
        // 3. Re-order retained children whose position may have changed.
        //    removeChild + addChild round-trips through the existing ordered-insert
        //    algorithm in Component.addChild, which reads the already-updated
        //    properties["children"] for the correct target index.
        let retainedIds = oldSet.intersection(newSet)
        let reorderNeeded = oldChildrenIds.filter { retainedIds.contains($0) }
                            != newChildrenIds.filter { retainedIds.contains($0) }
        if reorderNeeded {
            // Detach retained children (view + children array) without destroying
            var retainedComponents: [Component] = []
            for id in retainedIds {
                if let child = component.getChild(id) {
                    retainedComponents.append(child)
                    component.removeChild(child)
                }
            }
            // Re-attach in the order dictated by newChildrenIds
            let ordered = newChildrenIds.compactMap { id in
                retainedComponents.first { $0.componentId == id }
            }
            for child in ordered {
                component.addChild(child)
                Logger.shared.debug("[syncChildren] Reordered child: \(child.componentId)")
            }
        }
    }
    
    /// Get component by ID
    ///
    /// - Parameter componentId: Component ID
    /// - Returns: Component instance
    func getComponent(componentId: String) -> Component? {
        return componentTree[componentId]
    }
    
    /// Get all components
    ///
    /// - Returns: All components in tree
    func getAllComponents() -> [Component] {
        return Array(componentTree.values)
    }
    
    // MARK: - Lifecycle
    
    /// Destroy Surface
    func destroy() {
        guard state != .destroyed else {
            return
        }
        
        Logger.shared.debug("Destroying: \(surfaceId)")
        
        // Destroy all components
        for component in componentTree.values {
            component.destroy()
        }
        
        // Clear component tree
        componentTree.removeAll()
        rootComponent = nil
        
        // Update state
        state = .destroyed
        
        Logger.shared.debug("Destroyed: \(surfaceId)")
    }
    
    // MARK: - JSON Processing
    
    /// Process single component JSON
    ///
    /// - Parameter componentJson: Component JSON string
    func processComponentJson(_ componentJson: String) {
        // Parse component JSON
        guard var componentData = parseJSON(componentJson) else {
            Logger.shared.error("Failed to parse component JSON")
            return
        }
        
        // Normalize: convert "child" to "children" array
        // This allows components like Button to have a single child
        if let child = componentData["child"] as? String {
            if (child.count != 0) {
                componentData["children"] = [child]
                componentData.removeValue(forKey: "child")
            }
        }
        
        // Extract component information
        guard let componentId = componentData["id"] as? String else {
            Logger.shared.error("Component missing id")
            return
        }
        
        var componentType = componentData["type"] as? String
        if componentType == nil {
            componentType = componentData["component"] as? String
        }
        
        guard let type = componentType else {
            Logger.shared.error("Component missing type: \(componentId)")
            return
        }
        
        Logger.shared.debug("Processing component: id=\(componentId), type=\(type)")
        
        // Extract properties: use entire componentData excluding metadata fields
        var properties = componentData
        properties.removeValue(forKey: "id")
        properties.removeValue(forKey: "type")
        properties.removeValue(forKey: "component")
        properties.removeValue(forKey: "parent")
        
        // Check if component already exists
        if getComponent(componentId: componentId) != nil {
            Logger.shared.warning("Component already exists, updating: \(componentId)")
            updateComponent(componentId: componentId, properties: properties)
        } else {
            // Add new component
            addComponent(
                componentId: componentId,
                componentType: type,
                properties: properties
            )
            Logger.shared.info("Component added: \(componentId)")
        }
    }
    
    /// Process multiple component JSON strings
    ///
    /// - Parameter components: Array of component JSON strings
    func processComponents(_ components: [String]) {
        for (index, componentJson) in components.enumerated() {
            Logger.shared.debug("[\(index)]: Processing component JSON")
            processComponentJson(componentJson)
        }
    }
    
    // MARK: - JSON Helpers
    
    /// Parse JSON string to dictionary
    ///
    /// - Parameter jsonString: JSON string
    /// - Returns: Dictionary, returns nil if parsing fails
    private func parseJSON(_ jsonString: String) -> [String: Any]? {
        guard let jsonData = jsonString.data(using: .utf8),
              let dict = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any] else {
            return nil
        }
        return dict
    }
}
