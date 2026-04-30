//
//  ImageComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/27.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// ImageComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - url: Image URL string (String)
/// - fit: Scale mode (String: 100%, contain, cover, adapt)
/// - variant: Semantic name (String: icon, avatar, smallFeature, mediumFeature, largeFeature, header)
/// - width: Image width for loading options (String)
/// - height: Image height for loading options (String)
///
/// Design notes:
/// - Uses ObservedImageView (custom UIImageView) with frame change monitoring for transition animations
/// - Integrates with ImageLoaderConfiguration for network image loading with caching
/// - Supports configurable transition animations (default: MagicRevealTransition, 1.5s duration)
/// - Animations only execute when surface.animationEnabled is true
class ImageComponent: Component {
    
    static var defaultTransition: ImageLoadTransition = MagicRevealTransition()
    /// Global default animation duration (seconds)
    static var defaultTransitionDuration: TimeInterval = 1.5
    
    // MARK: - Properties
    
    private var imageView: ObservedImageView?
    
    /// Placeholder image (using global configuration)
    private var placeholderImage: UIImage {
        return ImageLoaderConfiguration.shared.defaultPlaceholder ?? ImageLoaderConfiguration.defaultPlaceholderImage
    }
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Image", properties: properties)
        
        // Create inner image view - only handles image rendering and contentMode
        let imageView = ObservedImageView()
        imageView.backgroundColor = .clear
        imageView.contentMode = .scaleAspectFit
        imageView.clipsToBounds = true
        imageView.image = placeholderImage
        
        // Add to self using FlexLayout
        flex.addItem(imageView).grow(1).shrink(1)
        self.imageView = imageView
        
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
        
        // Update image URL (A2UI v0.9 protocol: url)
        if let urlValue = properties["url"] {
            let url = urlValue as? String ?? ""
            loadImage(url)
        }
        
        // Update scale mode (A2UI v0.9 protocol: fit)
        if let fit = properties["fit"] as? String {
            imageView?.contentMode = parseFit(fit)
        }
    }
    
    /// Parse scale mode
    /// A2UI v0.9 protocol values: 100%, contain, cover, adapt
    private func parseFit(_ fit: String) -> UIView.ContentMode {
        switch fit.lowercased() {
        case "100%":
            // 100% fill mode: image completely fills container, may stretch
            return .scaleToFill
        case "contain":
            // contain mode: maintain aspect ratio, show full image
            return .scaleAspectFit
        case "cover":
            // cover mode: maintain aspect ratio, fill container, may crop
            return .scaleAspectFill
        case "adapt":
            // adapt mode: auto-adjust based on image size
            return .scaleAspectFit
        default:
            return .scaleAspectFit
        }
    }
    
    // MARK: - Private Methods
    
    /// Load image
    private func loadImage(_ src: String) {
        guard imageView != nil else { return }
        
        // Cancel previous loading tasks
        cancelCurrentLoadTask()
        
        if src.isEmpty {
            showPlaceholder()
            return
        }
        
        showPlaceholder()
        loadNetworkImage(from: src)
    }
    
    /// Show placeholder and start Shimmer
    private func showPlaceholder() {
        imageView?.image = placeholderImage
        imageView?.contentMode = .scaleToFill
    }
    
    /// Current loading task identifier (for cancellation)
    private var currentTaskId: String?
    
    /// Cancel current image loading task
    private func cancelCurrentLoadTask() {
        guard let taskId = currentTaskId else { return }
        ImageLoaderConfiguration.shared.loader.cancel(for: taskId)
        currentTaskId = nil
    }
    
    /// Load network image (using ImageLoaderConfiguration)
    private func loadNetworkImage(from urlString: String) {
        guard let imageView = imageView, let url = URL(string: urlString) else {
            Logger.shared.debug("⚠️ [ImageComponent] Invalid URL or imageView is nil: \(urlString)")
            showPlaceholder()
            return
        }
        
        // Clear current taskId (cancellation handled at start of loadImage)
        currentTaskId = nil
        
        // Use globally configured ImageLoader to load image
        // Pass width/height from properties if present, otherwise not
        var options: [String: Any] = [
            ImageLoadOptionsKey.surfaceId: surface?.surfaceId ?? "",
            ImageLoadOptionsKey.componentId: componentId
        ]
        if let widthStr = properties["width"] as? String,
           let heightStr = properties["height"] as? String,
           let w = CSSPropertyParser.parseDimension(widthStr).numberValue,
           let h = CSSPropertyParser.parseDimension(heightStr).numberValue {
            options[ImageLoadOptionsKey.width] = w
            options[ImageLoadOptionsKey.height] = h
        }
        let taskId = ImageLoaderConfiguration.shared.loader.loadImage(from: url, options: options) { [weak self] image, isFromCache, error in
            guard let self else { return }
            
            DispatchQueue.main.async {
                if let image = image {
                    guard let imageView = self.imageView else { return }
                    
                    imageView.image = image
                    imageView.flex.markDirty()
                    self.notifyLayoutChanged()
                    
                    // Execute transition animation (only when surface animation is enabled)
                    if self.surface?.animationEnabled == true {
                        imageView.executeTransitionAnimation()
                    }
                } else if let error = error {
                    // Log non-cancel errors for debugging
                    if error as? ImageLoaderError != .cancelled {
                        Logger.shared.warning("[ImageComponent] Failed to load image: \(urlString), componentId: \(self.componentId), error: \(error.localizedDescription)")
                    }
                    self.showPlaceholder()
                } else {
                    // No image and no error - unexpected state
                    Logger.shared.warning("[ImageComponent] Image load returned nil without error: \(urlString), componentId: \(self.componentId)")
                    self.showPlaceholder()
                }
            }
        }
        
        // Save current taskId
        currentTaskId = taskId
    }
    
    /// ImageView supporting height change monitoring
    class ObservedImageView: UIImageView {
        private var pendingAnimation: Bool = false
        private var isTransitioning: Bool = false
        
        override var frame: CGRect {
            didSet {
                handleFrameChange(frame)
            }
        }
        
        /// Request animation execution (called when image loading completes)
        public func executeTransitionAnimation() {
            if frame.height > 1 && frame.width > 1 {
                performAnimation()
            } else {
                pendingAnimation = true
            }
        }
        
        private func handleFrameChange(_ frame: CGRect) {
            guard frame.height > 1, frame.width > 1, pendingAnimation else { return }
            
            pendingAnimation = false
            performAnimation()
        }
        
        private func performAnimation() {
            guard !isTransitioning else { return }
            
            isTransitioning = true
            ImageComponent.defaultTransition.animate(
                on: self,
                duration: ImageComponent.defaultTransitionDuration
            ) { [weak self] in
                self?.isTransitioning = false
            }
        }
    }
}
