//
//  SurfaceManager.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/18.
//

import Foundation
import UIKit

// MARK: - SurfaceManagerListener Protocol

/// Surface Manager Listener Protocol
////// Implement this protocol to receive Surface lifecycle events
@objc public protocol SurfaceManagerListener: AnyObject {
    /// Surface created callback
    ///
    /// Called when a Surface has been created
    /// - Parameter surface: The created Surface object
    @objc optional func onCreateSurface(_ surface: Surface)
    
    /// Surface deleted callback
    ///
    /// Called when a Surface has been deleted
    /// - Parameter surfaceId: The ID of the deleted Surface
    @objc optional func onDeleteSurface(_ surface: Surface)
    
    /// Action event routed callback
    ///
    /// Called when C++ routes an action event back after processing
    /// - Parameter event: Action event context JSON string
    @objc optional func onReceiveActionEvent(_ event: String)
}

/// AGenUI Surface Manager
///
/// Manages Surface creation, binding, and destruction
/// Also serves as the main SDK entry point
@objc public class SurfaceManager: NSObject {
    
    // MARK: - Properties

    /// Surface dictionary (surfaceId -> Surface)
    private var surfaces: [String: Surface] = [:]

    /// Per-instance SurfaceManager bridge (owns an independent C++ ISurfaceManager)
    private let surfaceBridge = AGenUIEngineSurfaceManagerBridge()

    /// Listener container (weak references)
    private let listeners = NSHashTable<SurfaceManagerListener>.weakObjects()

    // MARK: - Initialization
    
    public override init() {
        super.init()
        
        // Register for notifications from this instance's surfaceBridge
        setupNotificationObservers()
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
        surfaceBridge.teardown()
    }
    
    // MARK: - Notification Setup
    
    private func setupNotificationObservers() {
        let notificationCenter = NotificationCenter.default
        let engineId = surfaceBridge.engineId
        
        notificationCenter.addObserver(
            self,
            selector: #selector(handleCreateSurfaceNotification(_:)),
            name: NSNotification.Name(rawValue: "AGenUICreateSurfaceNotification_\(engineId)"),
            object: surfaceBridge
        )
        
        notificationCenter.addObserver(
            self,
            selector: #selector(handleUpdateComponentsNotification(_:)),
            name: NSNotification.Name(rawValue: "AGenUIUpdateComponentsNotification_\(engineId)"),
            object: surfaceBridge
        )
        
        notificationCenter.addObserver(
            self,
            selector: #selector(handleDeleteSurfaceNotification(_:)),
            name: NSNotification.Name(rawValue: "AGenUIDeleteSurfaceNotification_\(engineId)"),
            object: surfaceBridge
        )
        
        notificationCenter.addObserver(
            self,
            selector: #selector(handleActionEventRoutedNotification(_:)),
            name: NSNotification.Name(rawValue: "AGenUIActionEventRoutedNotification_\(engineId)"),
            object: surfaceBridge
        )
    }
    
    // MARK: - Notification Handlers
    
    @objc private func handleCreateSurfaceNotification(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let surfaceId = userInfo["surfaceId"] as? String,
              let catalogId = userInfo["catalogId"] as? String,
              let theme = userInfo["theme"] as? [String: String],
              let sendDataModelValue = userInfo["sendDataModel"] as? NSNumber,
              let animatedValue = userInfo["animated"] as? NSNumber else {
            Logger.shared.error("Invalid create surface notification userInfo")
            return
        }
                
        onCreateSurface(withSurfaceId: surfaceId,
                       catalogId: catalogId,
                       theme: theme,
                       sendDataModel: sendDataModelValue.boolValue,
                    animated: animatedValue.boolValue)
    }
    
    @objc private func handleUpdateComponentsNotification(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let surfaceId = userInfo["surfaceId"] as? String,
              let components = userInfo["components"] as? [String] else {
            Logger.shared.error("Invalid update components notification userInfo")
            return
        }
        
        onUpdateComponents(withSurfaceId: surfaceId, components: components)
    }
    
    @objc private func handleDeleteSurfaceNotification(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let surfaceId = userInfo["surfaceId"] as? String else {
            Logger.shared.error("Invalid delete surface notification userInfo")
            return
        }
        
        onDeleteSurface(withSurfaceId: surfaceId)
    }
    
    @objc private func handleActionEventRoutedNotification(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let context = userInfo["context"] as? String else {
            Logger.shared.error("Invalid action event routed notification userInfo")
            return
        }
        
        for listener in listeners.allObjects.compactMap({ $0 }) {
            listener.onReceiveActionEvent?(context)
        }
    }
    
    // MARK: - Listener Management
    
    /// Add Surface lifecycle listener
    ///
    /// - Parameter listener: Object implementing SurfaceManagerListener protocol
    @objc public func addListener(_ listener: SurfaceManagerListener) {
        listeners.add(listener)
    }
    
    /// Remove Surface lifecycle listener
    ///
    /// - Parameter listener: Listener object to remove
    @objc public func removeListener(_ listener: SurfaceManagerListener) {
        listeners.remove(listener)
    }
    
    /// Remove all listeners
    @objc public func removeAllListeners() {
        listeners.removeAllObjects()
    }
    
    // MARK: - Data Interaction

    /// Start a new streaming data session
    ///
    /// Clears the buffer and resets parsing state. Should be called before each streaming session.
    @objc public func beginTextStream() {
        Logger.shared.debug("beginTextStream")
        surfaceBridge.beginTextStream()
    }

    /// End the streaming data session
    ///
    /// Resets parsing state. Should be called after SSE stream closes, HTTP response ends, user aborts, or network disconnects.
    @objc public func endTextStream() {
        Logger.shared.debug("endTextStream")
        surfaceBridge.endTextStream()
    }

    /// Receive text chunk from external source
    ///
    /// Receives JSON data for processing. This is the primary method for sending
    /// component updates, data model changes, and other instructions to the rendering engine.
    ///
    /// - Parameter dataString: JSON string containing the data to process
    ///
    /// Usage example:
    /// ```swift
    /// let jsonData = """
    /// {
    ///   "version": "v0.9",
    ///   "updateComponents": {
    ///     "surfaceId": "main",
    ///     "components": [...]
    ///   }
    /// }
    /// """
    /// surfaceManager.receiveTextChunk(jsonData)
    /// ```
    @objc public func receiveTextChunk(_ dataString: String) {
        surfaceBridge.receiveTextChunk(dataString)
    }

    /// Send user interaction event (internal)
    ///
    /// Notifies the SDK when a user interacts with a component (e.g., button tap, text input).
    /// The SDK will process this event and trigger appropriate data updates or callbacks.
    ///
    /// - Parameters:
    ///   - surfaceId: Surface unique identifier
    ///   - componentId: Component ID that received the interaction
    ///   - context: Additional context data for the interaction
    func triggerAction(surfaceId: String, componentId: String, context: [String: Any]) {
        guard let contextJson = convertToJSON(context) else {
            Logger.shared.error("Failed to convert context to JSON")
            return
        }
        surfaceBridge.triggerAction(surfaceId, componentId: componentId, context: contextJson)
    }
    
    /// Synchronize UI state to data model (internal)
    ///
    /// Updates the underlying data model with the current UI state. Use this when you need to
    /// persist UI changes back to the data layer, such as form input values or toggle states.
    ///
    /// - Parameters:
    ///   - surfaceId: Surface unique identifier
    ///   - componentId: Component ID whose state should be synced
    ///   - context: Current state data to sync
    func syncState(surfaceId: String, componentId: String, context: [String: Any]) {
        guard let contextJson = convertToJSON(context) else {
            Logger.shared.error("Failed to convert context to JSON")
            return
        }
        surfaceBridge.syncState(surfaceId, componentId: componentId, context: contextJson)
    }
    
    // MARK: - Helper Methods
    
    /// Convert dictionary to JSON string
    ///
    /// - Parameter dict: Dictionary to convert
    /// - Returns: JSON string, returns nil if conversion fails
    private func convertToJSON(_ dict: [String: Any]) -> String? {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: dict, options: []),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            return nil
        }
        return jsonString
    }

    // MARK: - Surface Event Handlers

    /// Surface creation handler (internal)
    func onCreateSurface(withSurfaceId surfaceId: String,
                                      catalogId: String,
                                      theme: [String: String],
                                      sendDataModel: Bool,
                                      animated: Bool = true) {
        Logger.shared.info("Surface will create: \(surfaceId), catalogId: \(catalogId)")

        // If already exists, return
        if surfaces[surfaceId] != nil {
            Logger.shared.warning("Surface already exists: \(surfaceId)")
            return
        }

        // Create new Surface with provided size
        let surface = Surface(surfaceId: surfaceId)
        surface.animationEnabled = animated
        surface.surfaceManager = self
        surfaces[surfaceId] = surface
        
        Logger.shared.info("Surface created: \(surfaceId), width: \(surface.width), height: \(surface.height)")

        // Notify all listeners
        for listener in listeners.allObjects.compactMap({ $0 }) {
            listener.onCreateSurface?(surface)
        }
    }
    
    /// Update components handler (internal)
    func onUpdateComponents(withSurfaceId surfaceId: String, components: [String]) {
        Logger.shared.info("Surface update components: \(surfaceId), components count: \(components.count)")
        
        // Get Surface
        guard let surface = surfaces[surfaceId] else {
            Logger.shared.warning("Surface not found: \(surfaceId)")
            return
        }
        
        // Process components
        surface.processComponents(components)
    }
    
    /// Delete Surface handler (internal)
    func onDeleteSurface(withSurfaceId surfaceId: String) {
        Logger.shared.info("Surface deleted: \(surfaceId)")

        // Remove and destroy Surface
        guard let surface = surfaces.removeValue(forKey: surfaceId) else {
            Logger.shared.warning("Surface not found: \(surfaceId)")
            return
        }

        // Notify all listeners
        for listener in listeners.allObjects.compactMap({ $0 }) {
            listener.onDeleteSurface?(surface)
        }

        Logger.shared.info("Surface destroyed: \(surfaceId)")
    }
    
}

