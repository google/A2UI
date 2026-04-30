//
//  VideoComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import UIKit
import AVFoundation
import AVKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// VideoComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - url: Video URL (String, supports http/https, file://, res://, and resource name)
///
/// Design notes:
/// - Uses AVPlayer and AVPlayerViewController for video playback
/// - Container has fixed 16:9 aspect ratio with black background and rounded corners
/// - Supports network URLs, local file paths, and bundled resources
/// - Provides play(), pause(), stop(), seekTo(), getCurrentPosition(), getDuration(), getIsPlaying() methods
/// - Auto-cleans observers and player resources on deinit/destroy
class VideoComponent: Component {
    
    // MARK: - Properties
    
    private var player: AVPlayer?
    private var playerViewController: AVPlayerViewController?
    private var timeObserver: Any?
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Video", properties: properties)
        
        // Configure container view style
        backgroundColor = .black
        clipsToBounds = true
        layer.cornerRadius = 8
        
        // Create AVPlayerViewController
        let playerVC = AVPlayerViewController()
        playerVC.view.backgroundColor = .black
        playerVC.videoGravity = .resizeAspect
        self.playerViewController = playerVC
        
        // Add playerViewController.view to container
        addSubview(playerVC.view)
        
        // Use FlexLayout for layout: full width with 16:9 aspect ratio
        flex.width(100%).aspectRatio(16.0 / 9.0)
        playerVC.view.flex.width(100%).height(100%)
        
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
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        // Call parent method to apply CSS properties (e.g., padding, background-color)
        super.updateProperties(properties)
        
        // Update video URL
        if let urlValue = properties["url"] {
            let url = CSSPropertyParser.extractStringValue(urlValue)
            setVideoUrl(url)
        }
    }
    
    override func destroy() {
        cleanup()
        super.destroy()
    }
    
    // MARK: - Private Methods
    
    /// Set video URL
    private func setVideoUrl(_ urlString: String) {
        Logger.shared.debug("setVideoUrl called with: \(urlString)")
        
        guard !urlString.isEmpty else {
            Logger.shared.error("URL string is empty")
            player?.replaceCurrentItem(with: nil)
            return
        }
        
        var videoURL: URL?
        
        // Determine URL type
        if urlString.hasPrefix("http://") || urlString.hasPrefix("https://") {
            // Network video
            videoURL = URL(string: urlString)
            Logger.shared.debug("Detected network URL")
        } else if urlString.hasPrefix("file://") {
            // Local file
            let filePath = String(urlString.dropFirst(7))
            videoURL = URL(fileURLWithPath: filePath)
            Logger.shared.debug("Detected file URL")
        } else if urlString.hasPrefix("res://") {
            // Local resource
            let resName = String(urlString.dropFirst(6))
            if let path = Bundle.main.path(forResource: resName, ofType: nil) {
                videoURL = URL(fileURLWithPath: path)
                Logger.shared.debug("Found resource: \(resName)")
            }
        } else {
            // Try as local resource name
            if let path = Bundle.main.path(forResource: urlString, ofType: nil) {
                videoURL = URL(fileURLWithPath: path)
                Logger.shared.debug("Found resource by name: \(urlString)")
            } else {
                // Try as network URL
                videoURL = URL(string: urlString)
                Logger.shared.debug("Treating as network URL")
            }
        }
        
        guard let url = videoURL else {
            Logger.shared.error("Invalid video URL: \(urlString)")
            return
        }
        
        Logger.shared.debug("Video URL created: \(url.absoluteString)")
        
        // Remove old notification observer (prevent observer stacking from multiple setVideoUrl calls)
        NotificationCenter.default.removeObserver(self, name: .AVPlayerItemDidPlayToEndTime, object: player?.currentItem)
        
        // Create AVPlayer
        player = AVPlayer(url: url)
        playerViewController?.player = player
        
        Logger.shared.debug("Player created and set to playerViewController")
        
        // Add playback finished notification
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(playerDidFinishPlaying),
            name: .AVPlayerItemDidPlayToEndTime,
            object: player?.currentItem
        )
        
        // Add time observer
        addTimeObserver()
    }
    
    /// Add time observer
    private func addTimeObserver() {
        guard let player = player else { return }
        
        // Update every second
        let interval = CMTime(seconds: 1.0, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
        timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { _ in
            // Can update playback progress here
        }
    }
    
    /// Playback finished notification handler
    @objc private func playerDidFinishPlaying() {
        // Can add playback finished callback here
    }
    
    /// Clean up resources
    private func cleanup() {
        // Remove time observer
        if let timeObserver = timeObserver {
            player?.removeTimeObserver(timeObserver)
            self.timeObserver = nil
        }
        
        // Remove notification observer
        NotificationCenter.default.removeObserver(self)
        
        // Stop playback
        player?.pause()
        player = nil
        playerViewController = nil
    }
    
    // MARK: - Public Methods
    
    /// Play video
    func play() {
        player?.play()
    }
    
    /// Pause video
    func pause() {
        player?.pause()
    }
    
    /// Stop video
    func stop() {
        player?.pause()
        player?.seek(to: .zero)
    }
    
    /// Get current playback position (seconds)
    func getCurrentPosition() -> Double {
        guard let player = player else { return 0 }
        return CMTimeGetSeconds(player.currentTime())
    }
    
    /// Get total video duration (seconds)
    func getDuration() -> Double {
        guard let player = player,
              let duration = player.currentItem?.duration else { return 0 }
        return CMTimeGetSeconds(duration)
    }
    
    /// Seek to specified position (seconds)
    func seekTo(_ position: Double) {
        guard let player = player else { return }
        let time = CMTime(seconds: position, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
        player.seek(to: time)
    }
    
    /// Whether currently playing
    func getIsPlaying() -> Bool {
        guard let player = player else { return false }
        return player.rate > 0
    }
}
