//
//  AudioPlayerComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/20.
//

import UIKit
import AVFoundation
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// Audio player state
private enum AudioPlayerState {
    case idle           // Not loaded
    case loading        // Loading
    case ready          // Loaded (not playing)
    case playing        // Playing
    case error          // Load failed
}

/// AVAudioPlayer delegate helper class
private class AudioPlayerDelegate: NSObject, AVAudioPlayerDelegate {
    weak var component: AudioPlayerComponent?
    
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        component?.handlePlaybackFinished()
    }
    
    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        component?.handleDecodeError(error)
    }
}

/// Circular audio play button view
private class CircularAudioButton: UIView {
    
    // MARK: - UI Components
    
    private let backgroundCircle = UIView()
    private let iconImageView = UIImageView()
    private let progressRingLayer = CAShapeLayer()
    private let progressBackgroundLayer = CAShapeLayer()
    private let loadingIndicator = UIActivityIndicatorView(style: .medium)
    
    // MARK: - Style Properties
    
    private var buttonSize: CGFloat = 80
    private var playIconSize: CGFloat = 40
    private var pauseIconSize: CGFloat = 35
    private var ringWidth: CGFloat = 8
    private var playBgColor: UIColor = UIColor(hex: "#2273F7") ?? .blue
    private var pauseBgColor: UIColor = .white
    private var ringColor: UIColor = UIColor(hex: "#2273F7") ?? .blue
    private var playIconColor: UIColor = .white
    private var pauseIconColor: UIColor = UIColor(hex: "#2273F7") ?? .blue
    private var loadingColor: UIColor = UIColor(hex: "#2273F7") ?? .blue
    private var errorBgColor: UIColor = UIColor(hex: "#CCCCCC") ?? .lightGray
    
    // MARK: - State
    
    private var currentState: AudioPlayerState = .idle {
        didSet {
            updateAppearance()
        }
    }
    
    var onTap: (() -> Void)?
    
    // MARK: - Initialization
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupViews()
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Setup
    
    private func setupViews() {
        // Background circle
        backgroundCircle.layer.cornerRadius = buttonSize / 2
        backgroundCircle.clipsToBounds = true
        
        // Icon
        iconImageView.contentMode = .scaleAspectFit
        iconImageView.tintColor = playIconColor
        
        // Loading - white loading icon
        loadingIndicator.color = .white
        loadingIndicator.hidesWhenStopped = true
        
        // Use FlexLayout to layout UIView subviews
        flex.define { flex in
            // Background circle - fills entire container
            flex.addItem(backgroundCircle).position(.absolute).all(0)
            
            // Icon - uses absolute positioning + percentage centering
            flex.addItem(iconImageView)
                .position(.absolute)
                .top(50%)
                .left(50%)
                .marginTop(-playIconSize / 2)
                .marginLeft(-playIconSize / 2)
                .width(playIconSize)
                .height(playIconSize)
            
            // Loading - uses absolute positioning + percentage centering
            flex.addItem(loadingIndicator)
                .position(.absolute)
                .top(50%)
                .left(50%)
                .marginTop(-loadingIndicator.intrinsicContentSize.height / 2)
                .marginLeft(-loadingIndicator.intrinsicContentSize.width / 2)
        }
        
        // Add CAShapeLayer (these are not UIViews, need manual management)
        layer.addSublayer(progressBackgroundLayer)
        layer.addSublayer(progressRingLayer)
        
        // Configure CAShapeLayer
        progressBackgroundLayer.fillColor = UIColor.clear.cgColor
        progressBackgroundLayer.strokeColor = UIColor.white.cgColor
        progressBackgroundLayer.lineWidth = ringWidth
        progressBackgroundLayer.lineCap = .round
        
        progressRingLayer.fillColor = UIColor.clear.cgColor
        progressRingLayer.strokeColor = ringColor.cgColor
        progressRingLayer.lineWidth = ringWidth
        progressRingLayer.lineCap = .round
        progressRingLayer.strokeEnd = 0
        
        // Tap gesture
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTap))
        addGestureRecognizer(tapGesture)
        
        // Initial state
        updateAppearance()
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        
        // Use FlexLayout to layout UIView subviews
        flex.layout()
        
        // Update background circle corner radius
        let size = min(bounds.width, bounds.height)
        backgroundCircle.layer.cornerRadius = size / 2
        
        // Update CAShapeLayer path (CAShapeLayer is not a UIView, needs manual update)
        updateProgressRingPath()
    }
    
    /// Update progress ring path
    private func updateProgressRingPath() {
        let size = min(bounds.width, bounds.height)
        let center = CGPoint(x: bounds.midX, y: bounds.midY)
        
        // Ring path (starts from 12 o'clock, clockwise)
        let ringRadius = (size - ringWidth) / 2
        let ringPath = UIBezierPath(
            arcCenter: center,
            radius: ringRadius,
            startAngle: -.pi / 2,  // 12 o'clock direction
            endAngle: .pi * 1.5,   // Full clockwise rotation
            clockwise: true
        )
        progressBackgroundLayer.path = ringPath.cgPath
        progressRingLayer.path = ringPath.cgPath
    }
    
    // MARK: - Public Methods
    
    func loadStyleConfig(_ config: [String: Any]) {
        if let size = config["size"] as? String,
           let value = ComponentStyleConfigManager.parseSize(size) {
            buttonSize = value
        }
        
        if let size = config["play-icon-size"] as? String,
           let value = ComponentStyleConfigManager.parseSize(size) {
            playIconSize = value
        }
        
        if let size = config["pause-icon-size"] as? String,
           let value = ComponentStyleConfigManager.parseSize(size) {
            pauseIconSize = value
        }
        
        if let width = config["ring-width"] as? String,
           let value = ComponentStyleConfigManager.parseSize(width) {
            ringWidth = value
            progressRingLayer.lineWidth = ringWidth
            progressBackgroundLayer.lineWidth = ringWidth
        }
        
        if let color = config["play-bg-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            playBgColor = value
        }
        
        if let color = config["pause-bg-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            pauseBgColor = value
        }
        
        if let color = config["ring-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            ringColor = value
            progressRingLayer.strokeColor = ringColor.cgColor
        }
        
        if let color = config["play-icon-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            playIconColor = value
        }
        
        if let color = config["pause-icon-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            pauseIconColor = value
        }
        
        // loading-color config item removed, loading icon is fixed white
        
        if let color = config["error-bg-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            errorBgColor = value
        }
        
        setNeedsLayout()
        updateAppearance()
    }
    
    func setState(_ state: AudioPlayerState) {
        currentState = state
    }
    
    func setProgress(_ progress: Float) {
        CATransaction.begin()
        CATransaction.setDisableActions(true)
        progressRingLayer.strokeEnd = CGFloat(progress)
        CATransaction.commit()
    }
    
    override var intrinsicContentSize: CGSize {
        return CGSize(width: buttonSize, height: buttonSize)
    }
    
    // MARK: - Private Methods
    
    private func updateAppearance() {
        // Update icon size and centered margin (based on state)
        let iconSize = currentState == .playing ? pauseIconSize : playIconSize
        iconImageView.flex
            .width(iconSize)
            .height(iconSize)
            .marginTop(-iconSize / 2)
            .marginLeft(-iconSize / 2)
            .markDirty()
        
        UIView.animate(withDuration: 0.3) {
            switch self.currentState {
            case .idle:
                self.backgroundCircle.backgroundColor = self.playBgColor
                self.iconImageView.isHidden = false
                self.iconImageView.image = self.createPlayIcon()
                self.iconImageView.tintColor = self.playIconColor
                self.progressRingLayer.isHidden = true
                self.progressBackgroundLayer.isHidden = true
                self.loadingIndicator.stopAnimating()
                self.isUserInteractionEnabled = false
                
            case .loading:
                self.backgroundCircle.backgroundColor = self.playBgColor  // Use blue background
                self.iconImageView.isHidden = true
                self.progressRingLayer.isHidden = true
                self.progressBackgroundLayer.isHidden = true
                self.loadingIndicator.startAnimating()
                self.isUserInteractionEnabled = false
                
            case .ready:
                self.backgroundCircle.backgroundColor = self.playBgColor
                self.iconImageView.isHidden = false
                self.iconImageView.image = self.createPlayIcon()
                self.iconImageView.tintColor = self.playIconColor
                self.progressRingLayer.isHidden = true
                self.progressBackgroundLayer.isHidden = true
                self.loadingIndicator.stopAnimating()
                self.isUserInteractionEnabled = true
                
            case .playing:
                self.backgroundCircle.backgroundColor = self.pauseBgColor
                self.iconImageView.isHidden = false
                self.iconImageView.image = self.createPauseIcon()
                self.iconImageView.tintColor = self.pauseIconColor
                self.progressRingLayer.isHidden = false
                self.progressBackgroundLayer.isHidden = false
                self.loadingIndicator.stopAnimating()
                self.isUserInteractionEnabled = true
                
            case .error:
                self.backgroundCircle.backgroundColor = self.errorBgColor
                self.iconImageView.isHidden = true
                self.progressRingLayer.isHidden = true
                self.progressBackgroundLayer.isHidden = true
                self.loadingIndicator.stopAnimating()
                self.isUserInteractionEnabled = false
            }
            
            self.setNeedsLayout()
            self.layoutIfNeeded()
        }
    }
    
    private func createPlayIcon() -> UIImage? {
        let config = UIImage.SymbolConfiguration(pointSize: playIconSize, weight: .medium)
        return UIImage(systemName: "play.fill", withConfiguration: config)
    }
    
    private func createPauseIcon() -> UIImage? {
        let config = UIImage.SymbolConfiguration(pointSize: pauseIconSize, weight: .medium)
        return UIImage(systemName: "pause.fill", withConfiguration: config)
    }
    
    @objc private func handleTap() {
        onTap?()
    }
}

/// AudioPlayerComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - url: Audio file URL (String, supports http/https, file://, res://, and resource name)
/// - autoPlay: Whether to autoplay (Bool, default false)
///
/// Style configuration (from localConfig.json, applied to CircularAudioButton):
/// - size: Button size (String, default 80)
/// - play-icon-size: Play icon size (String, default 40)
/// - pause-icon-size: Pause icon size (String, default 35)
/// - ring-width: Progress ring width (String, default 8)
/// - play-bg-color: Play state background color (String, default #2273F7)
/// - pause-bg-color: Pause state background color (String, default white)
/// - ring-color: Progress ring color (String, default #2273F7)
/// - play-icon-color: Play icon color (String, default white)
/// - pause-icon-color: Pause icon color (String, default #2273F7)
/// - error-bg-color: Error state background color (String, default #CCCCCC)
///
/// Design notes:
/// - Uses AVAudioPlayer for audio playback with progress ring visualization
/// - Custom CircularAudioButton with state machine: idle -> loading -> ready -> playing -> error
/// - Progress ring (CAShapeLayer) animates during playback
/// - Network audio downloaded via URLSession before playback
/// - Tap toggles between play and pause; auto-stops timer on finish
class AudioPlayerComponent: Component {
    
    // MARK: - Properties
    
    private var audioButton: CircularAudioButton!
    
    private var audioPlayer: AVAudioPlayer?
    private var audioPlayerDelegate: AudioPlayerDelegate?
    private var progressTimer: Timer?
    
    private var currentState: AudioPlayerState = .idle
    private var audioUrl: String = ""
    private var autoPlay: Bool = false
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "AudioPlayer", properties: properties)
        
        // Configure self (Component itself is a UIView)
        backgroundColor = .clear
        
        // Create circular button
        audioButton = CircularAudioButton(frame: CGRectMake(0, 0, 44, 44))
        audioButton.onTap = { [weak self] in
            self?.handleButtonTap()
        }
        
        // Load style configuration
        loadLocalStyleConfig()
        
        // Use FlexLayout for layout
        flex.addItem(audioButton).grow(1)
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    deinit {
        cleanup()
    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        // Call parent method to apply CSS properties to self
        super.updateProperties(properties)
        
        // Update audio URL
        if let urlValue = properties["url"] {
            let url = CSSPropertyParser.extractStringValue(urlValue)
            if url != audioUrl {
                audioUrl = url
                loadAudio(url)
            }
        }
        
        // Autoplay
        if let autoPlayValue = properties["autoPlay"] as? Bool {
            autoPlay = autoPlayValue
        }
        
        notifyLayoutChanged()
    }
    
    override func destroy() {
        cleanup()
        super.destroy()
    }
    
    // MARK: - Private Methods
    
    private func loadLocalStyleConfig() {
        guard let config = ComponentStyleConfigManager.shared.getConfig(for: componentType) else { return }
        audioButton.loadStyleConfig(config)
    }
    
    private func loadAudio(_ urlString: String) {
        guard !urlString.isEmpty else {
            return
        }
        
        // Set loading state
        currentState = .loading
        audioButton.setState(.loading)
        
        var audioURL: URL?
        
        // Determine URL type
        if urlString.hasPrefix("http://") || urlString.hasPrefix("https://") {
            audioURL = URL(string: urlString)
            if let url = audioURL {
                loadNetworkAudio(url: url)
            }
            return
        } else if urlString.hasPrefix("file://") {
            let filePath = String(urlString.dropFirst(7))
            audioURL = URL(fileURLWithPath: filePath)
        } else if urlString.hasPrefix("res://") {
            let resName = String(urlString.dropFirst(6))
            if let path = Bundle.main.path(forResource: resName, ofType: nil) {
                audioURL = URL(fileURLWithPath: path)
            }
        } else {
            // Try as local resource name
            if let path = Bundle.main.path(forResource: urlString, ofType: nil) {
                audioURL = URL(fileURLWithPath: path)
            } else if let url = URL(string: urlString) {
                audioURL = url
                loadNetworkAudio(url: url)
                return
            }
        }
        
        guard let url = audioURL else {
            currentState = .error
            audioButton.setState(.error)
            return
        }
        
        initAudioPlayer(url: url)
    }
    
    private func loadNetworkAudio(url: URL) {
        // Configure request timeout
        var request = URLRequest(url: url)
        request.timeoutInterval = 30.0
        
        let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else {
                return
            }
            
            if let error = error {
                DispatchQueue.main.async {
                    self.currentState = .error
                    self.audioButton.setState(.error)
                }
                return
            }
            
            guard let data = data else {
                DispatchQueue.main.async {
                    self.currentState = .error
                    self.audioButton.setState(.error)
                }
                return
            }
            
            DispatchQueue.main.async {
                self.initAudioPlayer(data: data)
            }
        }
        
        task.resume()
    }
    
    private func initAudioPlayer(url: URL) {
        do {
            audioPlayer = try AVAudioPlayer(contentsOf: url)
            setupAudioPlayer()
        } catch {
            currentState = .error
            audioButton.setState(.error)
        }
    }
    
    private func initAudioPlayer(data: Data) {
        do {
            audioPlayer = try AVAudioPlayer(data: data)
            setupAudioPlayer()
        } catch {
            currentState = .error
            audioButton.setState(.error)
        }
    }
    
    private func setupAudioPlayer() {
        guard let player = audioPlayer else { return }
        
        // Set delegate
        audioPlayerDelegate = AudioPlayerDelegate()
        audioPlayerDelegate?.component = self
        player.delegate = audioPlayerDelegate
        
        player.prepareToPlay()
        
        currentState = .ready
        audioButton.setState(.ready)
        
        // Force UI refresh to ensure correct state display
        audioButton.setNeedsLayout()
        audioButton.layoutIfNeeded()
        
        // Autoplay
        if autoPlay {
            play()
        }
    }
    
    private func handleButtonTap() {
        switch currentState {
        case .ready:
            play()
        case .playing:
            pause()
        default:
            break
        }
    }
    
    private func play() {
        guard let player = audioPlayer, currentState == .ready else { return }
        
        player.play()
        currentState = .playing
        audioButton.setState(.playing)
        startProgressTimer()
    }
    
    private func pause() {
        guard let player = audioPlayer, currentState == .playing else { return }
        
        player.pause()
        currentState = .ready
        audioButton.setState(.ready)
        stopProgressTimer()
    }
    
    private func stop() {
        guard let player = audioPlayer else { return }
        
        player.stop()
        player.currentTime = 0
        currentState = .ready
        audioButton.setState(.ready)
        audioButton.setProgress(0)
        stopProgressTimer()
    }
    
    private func startProgressTimer() {
        stopProgressTimer()
        
        progressTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.updateProgress()
        }
    }
    
    private func stopProgressTimer() {
        progressTimer?.invalidate()
        progressTimer = nil
    }
    
    private func updateProgress() {
        guard let player = audioPlayer, currentState == .playing else { return }
        
        let progress = Float(player.currentTime / player.duration)
        audioButton.setProgress(progress)
    }
    
    private func cleanup() {
        stopProgressTimer()
        
        if let player = audioPlayer {
            if currentState == .playing {
                player.stop()
            }
            player.delegate = nil
            audioPlayer = nil
        }
        
        audioPlayerDelegate = nil
        currentState = .idle
    }
    
    // MARK: - Delegate Handlers
    
    fileprivate func handlePlaybackFinished() {
        currentState = .ready
        audioButton.setState(.ready)
        audioButton.setProgress(0)
        stopProgressTimer()
        
        // Reset to beginning position
        audioPlayer?.currentTime = 0
    }
    
    fileprivate func handleDecodeError(_ error: Error?) {
        currentState = .error
        audioButton.setState(.error)
        stopProgressTimer()
    }
}

// MARK: - UIColor Extension

private extension UIColor {
    convenience init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        var rgb: UInt64 = 0
        var a: CGFloat = 1.0
        var r: CGFloat = 0.0
        var g: CGFloat = 0.0
        var b: CGFloat = 0.0
        
        let length = hexSanitized.count
        
        guard Scanner(string: hexSanitized).scanHexInt64(&rgb) else { return nil }
        
        if length == 6 {
            r = CGFloat((rgb & 0xFF0000) >> 16) / 255.0
            g = CGFloat((rgb & 0x00FF00) >> 8) / 255.0
            b = CGFloat(rgb & 0x0000FF) / 255.0
        } else if length == 8 {
            a = CGFloat((rgb & 0xFF000000) >> 24) / 255.0
            r = CGFloat((rgb & 0x00FF0000) >> 16) / 255.0
            g = CGFloat((rgb & 0x0000FF00) >> 8) / 255.0
            b = CGFloat(rgb & 0x000000FF) / 255.0
        } else {
            return nil
        }
        
        self.init(red: r, green: g, blue: b, alpha: a)
    }
}
