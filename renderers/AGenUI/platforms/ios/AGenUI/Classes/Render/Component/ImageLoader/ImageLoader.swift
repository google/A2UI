//
//  ImageLoader.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/4/9.
//

import UIKit

/// Image load result
public struct ImageLoadResult {
    /// Loaded image
    public let image: UIImage
    
    /// Whether from cache
    public let isFromCache: Bool
    
    public init(image: UIImage, isFromCache: Bool = false) {
        self.image = image
        self.isFromCache = isFromCache
    }
}

/// Image load options key
///
/// Used for the `options` parameter of `ImageLoader.loadImage`, providing additional load information.
public class ImageLoadOptionsKey {
    /// Image width
    public static let width: String = "width"
    /// Image height
    public static let height: String = "height"
    /// Component ID
    public static let componentId: String = "componentId"
    /// Surface ID
    public static let surfaceId: String = "surfaceId"
    
    private init() {}
}

/// Pluggable image loader protocol
///
/// Implement this protocol and register via `AGenUI.registerImageLoader(_:)` to globally replace image loading logic.
///
/// Usage example:
/// ```swift
/// // Use default loader (no configuration needed)
///
/// // Replace with custom loader
/// AGenUI.registerImageLoader(MyKingfisherLoader())
/// ```
@objc public protocol ImageLoader: AnyObject {
    
    // MARK: - Load & Cancel
    
    /// Load image
    /// - Parameters:
    ///   - url: Image URL
    ///   - options: Load options (keys use constants from ImageLoadOptionsKey)
    ///   - completion: Completion callback (main thread), parameters are (image, isFromCache, error)
    /// - Returns: Task identifier, can be used to cancel the task
    @objc func loadImage(
        from url: URL,
        options: [String: Any]?,
        completion: @escaping (UIImage?, Bool, Error?) -> Void
    ) -> String
    
    /// Cancel loading task with specified task identifier
    /// - Parameter taskId: Task identifier to cancel (returned by loadImage)
    @objc func cancel(for taskId: String)
    
    // MARK: - Cache Cleanup
    
    /// Clear memory cache
    @objc func clearMemory()
    
    /// Clear disk cache
    @objc func clearDisk()
}
