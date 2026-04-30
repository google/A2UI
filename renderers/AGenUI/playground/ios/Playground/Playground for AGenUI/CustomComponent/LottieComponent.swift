//
//  LottieComponent.swift
//  GenerativeUIClientSDK
//
//  Created by AGenUI on 2026/2/28.
//

import UIKit
import Lottie
import FlexLayout
import AGenUI

/// Lottie component implementation (complies with A2UI protocol)
///
/// Use Lottie library for animation playback
///
/// Supported properties:
/// - url: Animation file URL (String)
/// - autoPlay: Whether to auto-play (Boolean, default false)
/// - loop: Whether to loop (Boolean, default false)
class LottieComponent: Component {
    
    // MARK: - Properties
    
    private var animationView: LottieAnimationView?
    
    /// Default size (used when animation not loaded and no valid size)
    private let defaultSize: CGFloat = 100
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Lottie", properties: properties)
        
        // Configure self (Component itself is a UIView)
        backgroundColor = .clear
        clipsToBounds = true
        
        // Create LottieAnimationView
        let animationView = LottieAnimationView(frame: CGRectMake(0, 0, defaultSize, defaultSize))
        animationView.contentMode = .scaleAspectFit
        animationView.backgroundBehavior = .pauseAndRestore
        self.animationView = animationView
        
        // Add to self using FlexLayout
        flex.addItem(animationView).width(100%).height(100%)
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    deinit {
        // Clean up resources
        cleanup()
    }
    
    // MARK: - Layout
    
    override func sizeThatFits(_ size: CGSize) -> CGSize {
        // Return directly when input size is valid
        guard size.width <= 0 || size.height <= 0 else {
            return size
        }
        
        // Return default value when size is invalid
        return CGSize(width: defaultSize, height: defaultSize)
    }
    
    override func updateProperties(_ properties: [String: Any]) {
        super.updateProperties(properties)
        
        // Update animation URL
        if let urlValue = properties["url"] {
            loadAnimation(from: urlValue as? String ?? "")
        }
        
        // Update loop mode
        if let loopValue = properties["loop"] {
            let loop = loopValue as? Bool ?? true
            animationView?.loopMode = loop ? .loop : .playOnce
//            print("[Lottie] Loop mode set to: \(animationView?.loopMode == .loop ? "loop" : "playOnce")")
        }
        
        // Update auto-play
        if let autoPlayValue = properties["autoPlay"] {
            let autoPlay = autoPlayValue as? Bool ?? true
            if autoPlay, animationView?.animation != nil {
                animationView?.play()
                print("[Lottie] Auto play started")
            }
        }
    }
    
    // MARK: - Private Methods
    
    /// Load animation
    private func loadAnimation(from urlString: String) {
        print("[Lottie] loadAnimation called with: \(urlString)")

        guard !urlString.isEmpty else {
            print("[Lottie] ERROR: URL string is empty")
            animationView?.animation = nil
            return
        }

        // Determine URL type and load animation
        if urlString.hasPrefix("http://") || urlString.hasPrefix("https://") {
            // Network animation
            loadNetworkAnimation(from: urlString)
        } else if urlString.hasPrefix("file://") {
            // Local file
            let filePath = String(urlString.dropFirst(7))
            loadLocalAnimation(from: filePath)
        } else if urlString.hasPrefix("res://") {
            // Local resource
            let resName = String(urlString.dropFirst(6))
            loadResourceAnimation(named: resName)
        } else if urlString.hasPrefix("{") {
            // JSON string
            loadAnimationFromJSON(urlString)
        } else {
            // Try as local resource name
            loadResourceAnimation(named: urlString)
        }
    }
    
    /// Load network animation
    private func loadNetworkAnimation(from urlString: String) {
        guard let url = URL(string: urlString) else {
            print("[Lottie] ERROR: Invalid network URL: \(urlString)")
            return
        }
        
        print("[Lottie] Loading network animation from: \(url.absoluteString)")
        
        LottieAnimation.loadedFrom(url: url, closure: { [weak self] animation in
            DispatchQueue.main.async {
                guard let self = self else { return }
                
                if let animation = animation {
                    self.animationView?.animation = animation
                    print("[Lottie] Network animation loaded successfully")
                    
                    // If auto-play is set, then play
                    if let autoPlayValue = self.properties["autoPlay"] {
                        let autoPlay = autoPlayValue as? Bool ?? true
                        if autoPlay {
                            self.animationView?.play()
                        }
                    }
                } else {
                    print("[Lottie] ERROR: Failed to load network animation")
                }
            }
        }, animationCache: nil)
    }
    
    /// Load local file animation
    private func loadLocalAnimation(from filePath: String) {
        print("[Lottie] Loading local animation from: \(filePath)")
        
        guard FileManager.default.fileExists(atPath: filePath) else {
            print("[Lottie] ERROR: File not found: \(filePath)")
            return
        }
        
        if let animation = LottieAnimation.filepath(filePath) {
            animationView?.animation = animation
            print("[Lottie] Local animation loaded successfully")
        } else {
            print("[Lottie] ERROR: Failed to load local animation")
        }
    }

    /// Load resource animation
    private func loadResourceAnimation(named name: String) {
        print("[Lottie] Loading resource animation: \(name)")
        
        // Remove possible file extension
        let resourceName = name.replacingOccurrences(of: ".json", with: "")
        
        if let animation = LottieAnimation.named(resourceName) {
            animationView?.animation = animation
            print("[Lottie] Resource animation loaded successfully")
        } else {
            print("[Lottie] ERROR: Resource animation not found: \(resourceName)")
        }
    }
    
    /// Load animation from JSON string
    private func loadAnimationFromJSON(_ jsonString: String) {
        print("[Lottie] Loading animation from JSON string")
        
        guard let data = jsonString.data(using: .utf8) else {
            print("[Lottie] ERROR: Failed to convert JSON string to data")
            return
        }
        
        do {
            let animation = try LottieAnimation.from(data: data)
            animationView?.animation = animation
            print("[Lottie] Animation loaded from JSON string")
        } catch {
            print("[Lottie] ERROR: Failed to parse JSON: \(error.localizedDescription)")
        }
    }
    
    /// Clean up resources
    private func cleanup() {
        animationView?.stop()
        animationView?.animation = nil
        animationView = nil
    }
    
    // MARK: - Public Methods
    
    /// Play animation
    func play() {
        animationView?.play()
    }
    
    /// Pause animation
    func pause() {
        animationView?.pause()
    }
    
    /// Stop animation
    func stop() {
        animationView?.stop()
    }
    
    /// Get current playback progress (0.0 - 1.0)
    func getCurrentProgress() -> CGFloat {
        return animationView?.currentProgress ?? 0
    }
    
    /// Set playback progress (0.0 - 1.0)
    func setProgress(_ progress: CGFloat) {
        animationView?.currentProgress = progress
    }
    
    /// Whether currently playing
    func isAnimationPlaying() -> Bool {
        return animationView?.isAnimationPlaying ?? false
    }
}
