//
//  CarouselComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/1.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// CarouselComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - autoplay: Whether to auto-switch (Bool, default false)
/// - autoplaySpeed: Auto-switch interval in milliseconds (Number, default 3000)
/// - draggable: Whether to enable drag switching (Bool, default false)
/// - content: Image URL array (Array<String>)
///
/// Style configuration (from localConfig.json):
/// - indicator-dot-spacing: Spacing between indicator dots (String, default 6)
/// - indicator-inactive-dot-width: Inactive dot width (String, default 6)
/// - indicator-active-dot-width: Active dot width/capsule width (String, default 20)
/// - indicator-container-height: Indicator container height (String, default 6)
/// - indicator-bottom-offset: Bottom offset from carousel (String, default 10)
/// - indicator-background-color: Indicator container background (String, default semi-transparent black)
/// - indicator-active-dot-color: Active dot color (String, default white)
/// - indicator-inactive-dot-color: Inactive dot color (String, default semi-transparent white)
/// - indicator-active-corner-radius: Active dot corner radius (String, default 3)
/// - transition-duration: Scroll transition duration (String, default 0.3s)
/// - indicator-animation-duration: Indicator animation duration (String, default 0.3s)
/// - image-content-mode: Image content mode (String, default scaleAspectFill)
/// - image-placeholder-color: Image placeholder color (String, default systemGray6)
/// - scroll-bounces: Enable scroll bounce (Bool, default false)
///
/// Design notes:
/// - Uses UIScrollView with pagingEnabled for horizontal image carousel
/// - Custom capsule-style page indicator with animated transitions
/// - Supports autoplay with Timer; pauses on drag, resumes after drag ends
/// - Images loaded via ImageLoader with task cancellation on destroy
/// - Supports network URLs, res://, file://, and resource names
class CarouselComponent: Component {
    
    // MARK: - Properties
    
    private var scrollView: UIScrollView!
    private var pageControl: UIPageControl?
    private var customPageIndicatorView: UIView?
    private var indicatorDots: [UIView] = []
    private var imageViews: [UIImageView] = []
    
    // Configuration properties
    private var autoplay: Bool = false
    private var autoplaySpeed: TimeInterval = 3.0 // Default 3000ms = 3s
    private var draggable: Bool = false
    private var imageUrls: [String] = []
    
    // Autoplay timer
    private var autoplayTimer: Timer?
    private var currentPage: Int = 0
    
    // Image loading tasks (taskId -> imageView)
    private var activeImageTasks: [String: UIImageView] = [:]
    
    // Page indicator style configuration (configurable via localConfig.json)
    private var indicatorDotSize: CGFloat = 6
    private var indicatorDotSpacing: CGFloat = 6
    private var indicatorInactiveDotWidth: CGFloat = 6
    private var indicatorActiveDotWidth: CGFloat = 20
    private var indicatorContainerPadding: CGFloat = 0  // Remove left and right padding
    private var indicatorContainerHeight: CGFloat = 6
    private var indicatorBottomOffset: CGFloat = 10
    private var indicatorBackgroundColor: UIColor = UIColor.black.withAlphaComponent(0.3)
    private var indicatorActiveDotColor: UIColor = .white
    private var indicatorInactiveDotColor: UIColor = UIColor.white.withAlphaComponent(0.5)
    private var indicatorActiveCornerRadius: CGFloat = 3
    
    // Animation configuration
    private var transitionDuration: TimeInterval = 0.3
    private var indicatorAnimationDuration: TimeInterval = 0.3
    
    // Image display configuration
    private var imageContentMode: UIView.ContentMode = .scaleAspectFill
    private var imagePlaceholderColor: UIColor = .systemGray6
    
    // Scroll behavior configuration
    private var scrollBounces: Bool = false
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Carousel", properties: properties)
        
        // Configure self (Component itself is a UIView)
        backgroundColor = .clear
        
        // Load local style configuration
        loadLocalStyleConfig()
        
        // Create UIScrollView
        let scrollView = UIScrollView()
        scrollView.isPagingEnabled = true
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.showsVerticalScrollIndicator = false
        scrollView.delegate = nil  // Set to nil first, will set delegate later
        scrollView.bounces = scrollBounces
        scrollView.isScrollEnabled = draggable
        
        // Add scrollView using FlexLayout, fills entire container
        flex.addItem(scrollView).grow(1).shrink(1)
        self.scrollView = scrollView
        
        // Set scrollView delegate
        scrollView.delegate = self
        
        // Create custom page indicator container
        let indicatorContainer = UIView()
        indicatorContainer.backgroundColor = indicatorBackgroundColor
        indicatorContainer.layer.cornerRadius = indicatorContainerHeight / 2
        indicatorContainer.clipsToBounds = true
        
        // Use FlexLayout absolute positioning to overlay indicator at bottom
        flex.addItem(indicatorContainer)
            .position(.absolute)
            .bottom(indicatorBottomOffset)
            .height(indicatorContainerHeight)
            .alignSelf(.center)
        
        self.customPageIndicatorView = indicatorContainer
        
        // Keep original UIPageControl for compatibility (hidden)
        let pageControl = UIPageControl()
        pageControl.isHidden = true
        self.pageControl = pageControl
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    deinit {
        stopAutoplay()
    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        // Call parent method to apply CSS properties to self
        super.updateProperties(properties)
        
        // Update autoplay
        if let autoplayValue = properties["autoplay"] as? Bool {
            self.autoplay = autoplayValue
        }
        
        // Update autoplaySpeed (milliseconds to seconds)
        if let speed = properties["autoplaySpeed"] as? Double {
            self.autoplaySpeed = speed / 1000.0
        } else if let speed = properties["autoplaySpeed"] as? Int {
            self.autoplaySpeed = Double(speed) / 1000.0
        }
        
        // Update draggable
        if let draggableValue = properties["draggable"] as? Bool {
            self.draggable = draggableValue
            scrollView?.isScrollEnabled = draggableValue
        }
        
        // Update content (image URL array)
        if let content = properties["content"] as? [String] {
            self.imageUrls = content
            setupImages()
        }
        
        // Start or stop autoplay
        updateAutoplay()
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        
        // Layout image views
        layoutImageViews()
    }

    override func destroy() {
        // Stop timer
        stopAutoplay()
        
        // Cancel ongoing image tasks
        cancelAllImageTasks()
        
        super.destroy()
    }
    
    // MARK: - Configuration Methods

    /// Load local style configuration
    private func loadLocalStyleConfig() {
        guard let config = ComponentStyleConfigManager.shared.getConfig(for: componentType) else {
            Logger.shared.debug("Using default configuration")
            return
        }

        Logger.shared.info("Loading local style configuration + \(config)")
        
        // Parse and apply indicator style configuration
        if let spacing = config["indicator-dot-spacing"] as? String,
           let value = ComponentStyleConfigManager.parseSize(spacing) {
            self.indicatorDotSpacing = value
        }
        
        if let width = config["indicator-inactive-dot-width"] as? String,
           let value = ComponentStyleConfigManager.parseSize(width) {
            self.indicatorInactiveDotWidth = value
            self.indicatorDotSize = value // Dot height equals inactive width
        }
        
        if let width = config["indicator-active-dot-width"] as? String,
           let value = ComponentStyleConfigManager.parseSize(width) {
            self.indicatorActiveDotWidth = value
        }
        
        if let height = config["indicator-container-height"] as? String,
           let value = ComponentStyleConfigManager.parseSize(height) {
            self.indicatorContainerHeight = value
        }
        
        if let offset = config["indicator-bottom-offset"] as? String,
           let value = ComponentStyleConfigManager.parseSize(offset) {
            self.indicatorBottomOffset = value
        }
        
        if let color = config["indicator-background-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.indicatorBackgroundColor = value
        }
        
        if let color = config["indicator-active-dot-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.indicatorActiveDotColor = value
        }
        
        if let color = config["indicator-inactive-dot-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.indicatorInactiveDotColor = value
        }
        
        if let radius = config["indicator-active-corner-radius"] as? String,
           let value = ComponentStyleConfigManager.parseSize(radius) {
            self.indicatorActiveCornerRadius = value
        }
        
        // Parse animation configuration
        if let duration = config["transition-duration"] as? String,
           let value = ComponentStyleConfigManager.parseTime(duration) {
            self.transitionDuration = value
        }
        
        if let duration = config["indicator-animation-duration"] as? String,
           let value = ComponentStyleConfigManager.parseTime(duration) {
            self.indicatorAnimationDuration = value
        }
        
        // Parse image display configuration
        if let mode = config["image-content-mode"] as? String {
            self.imageContentMode = ComponentStyleConfigManager.parseContentMode(mode)
        }
        
        if let color = config["image-placeholder-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.imagePlaceholderColor = value
        }
        
        // Parse scroll behavior configuration
        if let bounces = config["scroll-bounces"] as? Bool {
            self.scrollBounces = bounces
        }
    }
    
    // MARK: - Private Methods
    
    /// Set up image views
    private func setupImages() {
        guard let scrollView = scrollView else { return }
        
        // Cancel ongoing image tasks
        cancelAllImageTasks()
        
        // Clear existing image views
        imageViews.forEach { $0.removeFromSuperview() }
        imageViews.removeAll()
        
        // If no images, return directly
        guard !imageUrls.isEmpty else {
            updateCustomPageIndicator()
            return
        }
        
        // Update current page
        currentPage = 0
        updateCustomPageIndicator()
        
        // Create image views
        for (index, urlString) in imageUrls.enumerated() {
            let imageView = UIImageView()
            imageView.contentMode = imageContentMode // 5. Apply configured content mode
            imageView.clipsToBounds = true
            imageView.backgroundColor = imagePlaceholderColor // 6. Apply configured placeholder color
            
            scrollView.addSubview(imageView)
            imageViews.append(imageView)
            
            // Load image
            loadImage(urlString, into: imageView, at: index)
        }
        
        // Layout image views
        layoutImageViews()
    }
    
    /// Layout image views
    private func layoutImageViews() {
        guard let scrollView = scrollView,
              !imageViews.isEmpty else { return }
        
        let scrollWidth = scrollView.bounds.width
        let scrollHeight = scrollView.bounds.height
        
        // If scrollView has no size yet, delay layout
        if scrollWidth == 0 || scrollHeight == 0 {
            DispatchQueue.main.async { [weak self] in
                self?.layoutImageViews()
            }
            return
        }
        
        // Layout each image view
        for (index, imageView) in imageViews.enumerated() {
            let x = CGFloat(index) * scrollWidth
            imageView.frame = CGRect(x: x, y: 0, width: scrollWidth, height: scrollHeight)
        }
        
        // Set scrollView contentSize
        scrollView.contentSize = CGSize(
            width: scrollWidth * CGFloat(imageViews.count),
            height: scrollHeight
        )
    }
    
    /// Load image
    private func loadImage(_ urlString: String, into imageView: UIImageView, at index: Int) {
        if urlString.isEmpty {
            return
        }
        
        // Determine if URL or local resource
        if urlString.hasPrefix("http://") || urlString.hasPrefix("https://") {
            // Network image
            loadNetworkImage(from: urlString, into: imageView)
        } else if urlString.hasPrefix("res://") {
            // Local resource
            let resName = String(urlString.dropFirst(6))
            if let image = UIImage(named: resName) {
                imageView.image = image
            }
        } else if urlString.hasPrefix("file://") {
            // Local file
            let filePath = String(urlString.dropFirst(7))
            if let image = UIImage(contentsOfFile: filePath) {
                imageView.image = image
            }
        } else {
            // Try loading as resource name
            if let image = UIImage(named: urlString) {
                imageView.image = image
            } else {
                // Try loading as network URL
                loadNetworkImage(from: urlString, into: imageView)
            }
        }
    }
    
    /// Load network image
    private func loadNetworkImage(from urlString: String, into imageView: UIImageView) {
        guard let url = URL(string: urlString) else { return }
        
        let taskId = ImageLoaderConfiguration.shared.loader.loadImage(from: url, options: nil) { [weak imageView] image, _, error in
            if let error = error {
                Logger.shared.debug("Failed to load carousel image: \(error.localizedDescription)")
                return
            }
            if let image = image {
                imageView?.image = image
            }
        }
        
        // Track task for cancellation on destroy
        activeImageTasks[taskId] = imageView
    }
    
    /// Cancel all ongoing image loading tasks
    private func cancelAllImageTasks() {
        let loader = ImageLoaderConfiguration.shared.loader
        for taskId in activeImageTasks.keys {
            loader.cancel(for: taskId)
        }
        activeImageTasks.removeAll()
    }
    
    /// Update autoplay state
    private func updateAutoplay() {
        if autoplay && imageUrls.count > 1 {
            startAutoplay()
        } else {
            stopAutoplay()
        }
    }
    
    /// Start autoplay
    private func startAutoplay() {
        // Stop existing timer first
        stopAutoplay()
        
        // Create new timer
        autoplayTimer = Timer.scheduledTimer(
            withTimeInterval: autoplaySpeed,
            repeats: true
        ) { [weak self] _ in
            self?.autoScrollToNextPage()
        }
    }
    
    /// Stop autoplay
    private func stopAutoplay() {
        autoplayTimer?.invalidate()
        autoplayTimer = nil
    }
    
    /// Auto scroll to next page
    private func autoScrollToNextPage() {
        guard let scrollView = scrollView,
              !imageUrls.isEmpty else { return }
        
        // Calculate next page index
        let nextPage = (currentPage + 1) % imageUrls.count
        
        // Scroll to next page
        let scrollWidth = scrollView.bounds.width
        let offsetX = CGFloat(nextPage) * scrollWidth
        
        UIView.animate(withDuration: transitionDuration) { // 13. Apply configured transition duration
            scrollView.contentOffset = CGPoint(x: offsetX, y: 0)
        }
        
        // Update current page and indicator
        currentPage = nextPage
        updateIndicatorWithAnimation(to: nextPage)
    }
    
    /// Update custom page indicator
    private func updateCustomPageIndicator() {
        guard let indicatorContainer = customPageIndicatorView else { return }
        
        // Clear existing indicator dots
        indicatorDots.forEach { $0.removeFromSuperview() }
        indicatorDots.removeAll()
        
        // If no images, hide indicator
        guard !imageUrls.isEmpty else {
            indicatorContainer.isHidden = true
            return
        }
        
        indicatorContainer.isHidden = false
        
        // Create indicator dots
        for index in 0..<imageUrls.count {
            let dotView = UIView()
            dotView.layer.cornerRadius = indicatorDotSize / 2
            dotView.clipsToBounds = true
            
            if index == currentPage {
                // Current page - capsule shape
                dotView.backgroundColor = indicatorActiveDotColor // 7. Apply configured active dot color
                dotView.frame = CGRect(x: 0, y: 0, width: indicatorActiveDotWidth, height: indicatorDotSize)
                dotView.layer.cornerRadius = indicatorActiveCornerRadius // 8. Apply configured corner radius
            } else {
                // Non-current page - dot (using configurable width)
                dotView.backgroundColor = indicatorInactiveDotColor // 9. Apply configured inactive dot color
                dotView.frame = CGRect(x: 0, y: 0, width: indicatorInactiveDotWidth, height: indicatorDotSize)
            }
            
            indicatorContainer.addSubview(dotView)
            indicatorDots.append(dotView)
        }
        
        // Layout indicator dots
        layoutIndicatorDots()
        
        // Update container width
        let totalWidth = calculateIndicatorContainerWidth()
        indicatorContainer.flex.width(totalWidth)
        
        // Key fix: do not call layout() at component level
        // Let Surface trigger layout uniformly
        // self.flex.layout() removed (self is the container)
    }
    
    /// Layout indicator dots
    private func layoutIndicatorDots() {
        guard !indicatorDots.isEmpty else { return }
        
        var xOffset: CGFloat = 0  // Start from 0, no left margin
        let yOffset: CGFloat = (indicatorContainerHeight - indicatorDotSize) / 2
        
        for (index, dotView) in indicatorDots.enumerated() {
            let isActive = index == currentPage
            let width = isActive ? indicatorActiveDotWidth : indicatorInactiveDotWidth
            
            dotView.frame = CGRect(x: xOffset, y: yOffset, width: width, height: indicatorDotSize)
            xOffset += width
            
            // Only add spacing after non-last dots
            if index < indicatorDots.count - 1 {
                xOffset += indicatorDotSpacing
            }
        }
    }
    
    /// Calculate indicator container width
    private func calculateIndicatorContainerWidth() -> CGFloat {
        guard !imageUrls.isEmpty else { return 0 }
        
        // Calculate total width: one active dot + (n-1) normal dots + (n-1) spacing
        let totalWidth = indicatorActiveDotWidth + CGFloat(imageUrls.count - 1) * indicatorInactiveDotWidth + CGFloat(imageUrls.count - 1) * indicatorDotSpacing
        return totalWidth
    }
    
    /// Update indicator animation
    private func updateIndicatorWithAnimation(to page: Int) {
        guard page >= 0 && page < indicatorDots.count else { return }
        
        UIView.animate(withDuration: indicatorAnimationDuration) { [weak self] in // 10. Apply configured animation duration
            guard let self = self else { return }
            
            // Update all dot states
            for (index, dotView) in self.indicatorDots.enumerated() {
                if index == page {
                    // Become active state
                    dotView.backgroundColor = self.indicatorActiveDotColor // 11. Apply configured active dot color
                } else {
                    // Become inactive state
                    dotView.backgroundColor = self.indicatorInactiveDotColor // 12. Apply configured inactive dot color
                }
            }
            
            // Re-layout
            self.layoutIndicatorDots()
        }
    }
}

// MARK: - UIScrollViewDelegate

extension CarouselComponent: UIScrollViewDelegate {
    
    func scrollViewDidScroll(_ scrollView: UIScrollView) {
        guard !imageUrls.isEmpty else { return }
        
        // Calculate current page
        let scrollWidth = scrollView.bounds.width
        guard scrollWidth > 0 else { return }
        
        let page = Int((scrollView.contentOffset.x + scrollWidth / 2) / scrollWidth)
        
        // Update indicator
        if page >= 0 && page < imageUrls.count && page != currentPage {
            currentPage = page
            updateIndicatorWithAnimation(to: page)
        }
    }
    
    func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
        // Pause autoplay when dragging starts
        if autoplay {
            stopAutoplay()
        }
    }
    
    func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool) {
        // Resume autoplay after dragging ends
        if autoplay && !decelerate {
            startAutoplay()
        }
    }
    
    func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
        // Resume autoplay after deceleration ends
        if autoplay {
            startAutoplay()
        }
    }
}
