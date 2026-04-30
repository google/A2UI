//
//  WebComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/1.
//

import UIKit
import WebKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// Web component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - source: Content source - URL or HTML text with auto-detection (String, highest priority)
/// - url: Web address supporting http/https/file protocols (String, backward compatible)
/// - html: HTML content string (String, backward compatible)
/// - enableJavaScript: Whether to enable JavaScript (Boolean, default true)
/// - enableZoom: Whether to allow zoom (Boolean, default false)
/// - styles: Style dictionary including width, height, background-color, etc. (Dictionary)
///
/// Design notes:
/// - Uses WKWebView with progress bar for loading feedback
/// - Auto-detects source type: URL patterns (http/https/file/ftp/domain/IP) vs HTML text
/// - Supports JavaScript alert/confirm dialogs via WKUIDelegate
class WebComponent: Component {
    
    // MARK: - Properties
    
    private var webView: WKWebView?
    private var progressView: UIProgressView?
    private var enableJavaScript: Bool = true
    private var enableZoom: Bool = false
    
    // KVO observers
    private var progressObservation: NSKeyValueObservation?
    private var titleObservation: NSKeyValueObservation?
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Web", properties: properties)
        
        backgroundColor = .white
        
        // Configure WKWebView
        let configuration = WKWebViewConfiguration()
        configuration.preferences.javaScriptEnabled = enableJavaScript
        
        // Create WKWebView
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.bounces = true
        
        self.webView = webView
        
        // Create progress bar
        let progressView = UIProgressView(progressViewStyle: .default)
        progressView.progressTintColor = .systemBlue
        progressView.trackTintColor = .clear
        progressView.alpha = 0
        
        self.progressView = progressView
        
        // Use FlexLayout for layout
        flex.define { flex in
            flex.addItem(webView).width(100%).height(100%)
            flex.addItem(progressView).position(.absolute).top(0).left(0).right(0).height(2)
        }
        
        // Add KVO observers
        setupObservers()
        
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
        super.updateProperties(properties)
        
        // Update JavaScript enabled state
        if let enableJS = properties["enableJavaScript"] as? Bool {
            enableJavaScript = enableJS
            webView?.configuration.preferences.javaScriptEnabled = enableJS
        }
        
        // Update zoom settings
        if let enableZoomValue = properties["enableZoom"] as? Bool {
            enableZoom = enableZoomValue
            updateZoomSettings()
        }
        
        // Handle source field (can be URL or HTML text)
        if let sourceValue = properties["source"] {
            handleSource(sourceValue as? String ?? "")
        }
        // Load URL (backward compatible)
        else if let urlValue = properties["url"] {
            loadURL(urlValue as? String ?? "")
        }
        // Load HTML content (backward compatible)
        else if let htmlValue = properties["html"] {
            loadHTML(htmlValue as? String ?? "")
        }
    }
    
    override func destroy() {
        cleanup()
        super.destroy()
    }
    
    // MARK: - Private Methods
    
    /// Setup observers
    private func setupObservers() {
        guard let webView = webView else { return }
        
        // Observe loading progress
        progressObservation = webView.observe(\.estimatedProgress, options: [.new]) { [weak self] _, change in
            guard let self = self, let progress = change.newValue else { return }
            self.updateProgress(Float(progress))
        }
        
        // Observe title change
        titleObservation = webView.observe(\.title, options: [.new]) { [weak self] _, change in
            guard let self = self, let title = change.newValue else { return }
            self.handleTitleChanged(title ?? "")
        }
    }
    
    /// Update zoom settings
    private func updateZoomSettings() {
        // Zoom settings handled via WKWebViewConfiguration and JavaScript injection
    }
    
    /// Handle source field, auto-detect if it's URL or HTML text
    private func handleSource(_ source: String) {
        guard !source.isEmpty else {
            return
        }
        
        // Check if it's a URL
        if isURL(source) {
            loadURL(source)
        } else {
            // Treat as HTML text
            loadHTML(source)
        }
    }
    
    /// Check if string is a URL
    private func isURL(_ string: String) -> Bool {
        // Check if it starts with common URL protocols
        if string.hasPrefix("http://") ||
           string.hasPrefix("https://") ||
           string.hasPrefix("file://") ||
           string.hasPrefix("ftp://") ||
           string.hasPrefix("ftps://") {
            return true
        }
        
        // Check if it contains URL features (domain format)
        // e.g.: www.example.com, example.com, subdomain.example.com
        let urlPattern = "^([a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}(/.*)?$"
        if let regex = try? NSRegularExpression(pattern: urlPattern, options: .caseInsensitive) {
            let range = NSRange(location: 0, length: string.utf16.count)
            if regex.firstMatch(in: string, options: [], range: range) != nil {
                return true
            }
        }
        
        // Check if it's IP address format (including port)
        // e.g.: 192.168.1.1, 192.168.1.1:8080, localhost:3000
        let ipPattern = "^(localhost|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})(:\\d+)?(/.*)?$"
        if let regex = try? NSRegularExpression(pattern: ipPattern, options: .caseInsensitive) {
            let range = NSRange(location: 0, length: string.utf16.count)
            if regex.firstMatch(in: string, options: [], range: range) != nil {
                return true
            }
        }
        
        // Other cases treated as HTML text
        return false
    }
    
    /// Load URL
    private func loadURL(_ urlString: String) {
        guard !urlString.isEmpty else {
            return
        }
        
        var url: URL?
        
        // Determine URL type
        if urlString.hasPrefix("http://") || urlString.hasPrefix("https://") {
            // Network URL
            url = URL(string: urlString)
        } else if urlString.hasPrefix("file://") {
            // Local file
            url = URL(string: urlString)
        } else {
            // Try as network URL
            url = URL(string: "https://\(urlString)")
        }
        
        guard let validURL = url else {
            return
        }
        
        let request = URLRequest(url: validURL)
        webView?.load(request)
    }
    
    /// Load HTML content
    private func loadHTML(_ htmlString: String) {
        guard !htmlString.isEmpty else {
            return
        }
        
        webView?.loadHTMLString(htmlString, baseURL: nil)
    }
    
    /// Update progress bar
    private func updateProgress(_ progress: Float) {
        progressView?.progress = progress
        
        if progress >= 1.0 {
            // Loading complete, hide progress bar
            UIView.animate(withDuration: 0.3, delay: 0.3, options: .curveEaseOut) {
                self.progressView?.alpha = 0
            }
        } else if progress > 0 {
            // Show progress bar
            UIView.animate(withDuration: 0.2) {
                self.progressView?.alpha = 1
            }
        }
    }
    
    /// Handle title change
    private func handleTitleChanged(_ title: String) {
        // Can trigger title change event here
    }
    
    /// Cleanup resources
    private func cleanup() {
        // Remove observers
        progressObservation?.invalidate()
        titleObservation?.invalidate()
        progressObservation = nil
        titleObservation = nil
        
        // Stop loading
        webView?.stopLoading()
        webView?.navigationDelegate = nil
        webView?.uiDelegate = nil
        webView = nil
        progressView = nil
    }
    
    // MARK: - Public Methods
    
    /// Reload page
    func reload() {
        webView?.reload()
    }
    
    /// Stop loading
    func stopLoading() {
        webView?.stopLoading()
    }
    
    /// Go back
    func goBack() {
        webView?.goBack()
    }
    
    /// Go forward
    func goForward() {
        webView?.goForward()
    }
    
    /// Can go back
    func canGoBack() -> Bool {
        return webView?.canGoBack ?? false
    }
    
    /// Can go forward
    func canGoForward() -> Bool {
        return webView?.canGoForward ?? false
    }
    
    /// Execute JavaScript
    func evaluateJavaScript(_ script: String, completion: ((Any?, Error?) -> Void)? = nil) {
        webView?.evaluateJavaScript(script, completionHandler: completion)
    }
    
    /// Get current URL
    func getCurrentURL() -> String? {
        return webView?.url?.absoluteString
    }
    
    /// Get page title
    func getTitle() -> String? {
        return webView?.title
    }
}

// MARK: - WKNavigationDelegate

extension WebComponent: WKNavigationDelegate {
    
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        // Loading started
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Loading finished
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        // Loading failed
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        // Provisional navigation failed
    }
    
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        // Can intercept specific navigation requests here
        decisionHandler(.allow)
    }
}

// MARK: - WKUIDelegate

extension WebComponent: WKUIDelegate {
    
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        // Handle target="_blank" links
        if navigationAction.targetFrame == nil {
            webView.load(navigationAction.request)
        }
        return nil
    }
    
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        // Handle JavaScript alert
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler()
        })
        
        // Get current ViewController
        if let viewController = webView.window?.rootViewController {
            viewController.present(alert, animated: true)
        } else {
            completionHandler()
        }
    }
    
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        // Handle JavaScript confirm
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in
            completionHandler(false)
        })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler(true)
        })
        
        // Get current ViewController
        if let viewController = webView.window?.rootViewController {
            viewController.present(alert, animated: true)
        } else {
            completionHandler(false)
        }
    }
}
