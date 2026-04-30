//
//  ModalComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// ModalComponent component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - trigger: Trigger button component ID (String)
/// - content: Dialog content component ID (String)
///
/// Style configuration (from localConfig.json):
/// - overlay-color: Overlay background color (String, default rgba(0,0,0,0.5))
///
/// Design notes:
/// - Dialog presented modally with overFullScreen presentation style
/// - Tap outside dialog container to dismiss
/// - Child management: first child is trigger button, second is dialog content
/// - Uses ModalDialogViewController for custom dialog rendering
/// - Trigger button tap gesture shows dialog with crossDissolve transition
class ModalComponent: Component {
    
    // MARK: - Properties
    
    private var triggerComponent: Component?
    private var contentComponent: Component?
    
    /// Custom dialog view controller
    private var modalViewController: ModalDialogViewController?
    
    // MARK: - Style Configuration Properties
    
    /// Overlay color
    private var overlayColor: UIColor = UIColor(white: 0.0, alpha: 0.5)
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Modal", properties: properties)
        
        // Load style configuration
        loadStyleConfig()
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Style Configuration
    
    /// Load style configuration
    private func loadStyleConfig() {
        guard let config = getLocalStyleConfig() as? [String: String] else {
            Logger.shared.debug("No style config found, using defaults")
            return
        }
        
        Logger.shared.debug("Loading style config: \(config)")
        
        // Parse overlay-color
        if let colorStr = config["overlay-color"],
           let color = ComponentStyleConfigManager.parseColorToUIColor(colorStr) {
            overlayColor = color
        }
        
        Logger.shared.debug("Style config loaded: overlayColor=\(overlayColor)")
    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        // Call parent method to apply CSS properties (e.g., padding, background-color)
        super.updateProperties(properties)
        
        // Modal component property update logic
        // trigger and content association is handled in addChild
    }
    
    // MARK: - Child Component Management
    
    /// Add child component
    /// First identify child component role based on trigger and content ID in properties
    /// If no IDs, identify by order: first is trigger, second is content
    override func addChild(_ child: Component) {
        // Identify child component role based on trigger and content ID in properties
        let triggerId = properties["trigger"] as? String
        let contentId = properties["content"] as? String
                
        if let tid = triggerId, child.componentId == tid {
            // As trigger button
            triggerComponent = child
            super.addChild(child)
        } else if let cid = contentId, child.componentId == cid {
            // As dialog content
            contentComponent = child
        } else {
            // If no trigger/content ID in properties, identify by addition order
            // First child as trigger, second as content
            if triggerComponent == nil {
                triggerComponent = child
            } else if contentComponent == nil {
                contentComponent = child
            }
        }
        
        // If this is trigger component, mount its view
        if child === triggerComponent {
            mountTriggerView(child)
        }
    }
    
    /// Mount trigger button view
    private func mountTriggerView(_ child: Component) {

        // Remove old parent view
        if child.superview != nil {
            child.removeFromSuperview()
        }
        
        // Add trigger button using FlexLayout
        flex.addItem(child)
        
        Logger.shared.debug("  ✓ Trigger view added")
        
        // Set tap gesture
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleTriggerTap))
        child.addGestureRecognizer(tapGesture)
        child.isUserInteractionEnabled = true
    }
    
    /// Remove child component
    override func removeChild(_ child: Component) {
        super.removeChild(child)
        
        if child === triggerComponent {
            triggerComponent = nil
        } else if child === contentComponent {
            contentComponent = nil
        }
    }
    
    
    // MARK: - Modal Display
    
    /// Show dialog
    private func showDialog() {
        // If dialog already showing, do not show again
        if modalViewController != nil {
            return
        }
        
        // Find current ViewController
        guard let presentingVC = findViewController() else {
            Logger.shared.error("Cannot find view controller to present dialog")
            return
        }
        
        // Get content component (prefer contentComponent property, otherwise search in children)
        var content = contentComponent
        if content == nil {
            let contentId = properties["content"] as? String
            Logger.shared.debug("[ModalComponent] contentId from properties=\(contentId ?? "nil")")
            
            // Iterate children to find matching component
            for child in children {
                Logger.shared.debug("  checking child: \(child.componentId)")
                if child.componentId == contentId {
                    content = child
                    Logger.shared.debug("  ✓ Found content in children: \(child.componentId)")
                    break
                }
            }
            
            if content == nil {
                Logger.shared.debug("  ⚠ Content not found in children, using last child as fallback")
                // Fallback: use last child as content
                content = children.last
            }
        }
        
        Logger.shared.debug("[ModalComponent] Final content component: \(content?.componentId ?? "nil")")
        
        // Create custom dialog view controller
        let modalVC = ModalDialogViewController(
            contentComponent: content,
            overlayColor: overlayColor,
            dismissHandler: { [weak self] in
                self?.modalViewController = nil
            }
        )
        
        modalVC.modalPresentationStyle = .overFullScreen
        modalVC.modalTransitionStyle = .crossDissolve
        
        presentingVC.present(modalVC, animated: true) {
            #if DEBUG
            Logger.shared.debug("Dialog presented")
            #endif
        }
        
        self.modalViewController = modalVC
    }
    
    /// Dismiss dialog
    func dismissDialog() {
        #if DEBUG
        Logger.shared.debug("Dismissing dialog")
        #endif
        
        modalViewController?.dismiss(animated: true) { [weak self] in
            self?.modalViewController = nil
            #if DEBUG
            Logger.shared.debug("Dialog dismissed")
            #endif
        }
    }
    
    // MARK: - Event Handling
    
    @objc private func handleTriggerTap() {
        #if DEBUG
        Logger.shared.debug("Trigger button tapped")
        #endif
        showDialog()
    }
    
    // MARK: - Helper Methods
    
    /// Find ViewController containing current view
    private func findViewController() -> UIViewController? {
        var responder: UIResponder? = self
        while responder != nil {
            if let viewController = responder as? UIViewController {
                return viewController
            }
            responder = responder?.next
        }
        return nil
    }
}

// MARK: - ModalDialogViewController

/// Custom dialog view controller
///
/// Custom dialog for displaying Modal content
/// Supports custom overlay color
class ModalDialogViewController: UIViewController {
    
    // MARK: - Properties
    
    private let contentComponent: Component?
    private let overlayColor: UIColor
    private let dismissHandler: (() -> Void)?
    
    private var containerView: UIView!
    private var contentContainerView: UIView!
    private var closeButton: UIButton?
    
    
    // MARK: - Initialization
    
    init(
        contentComponent: Component?,
        overlayColor: UIColor,
        dismissHandler: (() -> Void)?
    ) {
        self.contentComponent = contentComponent
        self.overlayColor = overlayColor
        self.dismissHandler = dismissHandler
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Lifecycle
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupViews()
    }
    
    // MARK: - Setup
    
    private func setupViews() {
        view.backgroundColor = overlayColor
        
        // Add tap background to dismiss gesture
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handleBackgroundTap(_:)))
        tapGesture.delegate = self
        view.addGestureRecognizer(tapGesture)
        
        // Create container view (centered display)
        containerView = UIView()
        view.addSubview(containerView)
        
        // Configure container using FlexLayout
        containerView.flex.direction(.column).alignItems(.center).define { flex in
           // Create content container view (white background)
            contentContainerView = UIView()
            contentContainerView.backgroundColor = .white
            contentContainerView.layer.cornerRadius = 8
            contentContainerView.layer.masksToBounds = true
            
            flex.addItem(contentContainerView).define { contentFlex in
                // Add content view
                if let contentComponent = contentComponent {
                    if contentComponent.superview != nil {
                        contentComponent.removeFromSuperview()
                    }
                    
                    // Add content view using FlexLayout
                    contentFlex.addItem(contentComponent).margin(16)
                    
                    #if DEBUG
                    Logger.shared.debug("Content view added with FlexLayout")
                    #endif
                }
            }
           
        }
        
        // Calculate layout
        layoutModal()
    }
    
    /// Calculate and apply Modal layout
    private func layoutModal() {
        // Get view dimensions (use view.bounds instead of UIScreen.main)
        let viewWidth = view.bounds.width
        let viewHeight = view.bounds.height
        
        // Set container initial frame
        containerView.frame = CGRect(x: 0, y: 0, width: viewWidth, height: viewHeight)
        
        // Calculate content size first (no width limit, let content auto-size)
        contentContainerView.flex.layout(mode: .adjustHeight)
        
        // Get calculated content size
        let contentSize = contentContainerView.frame.size
        
        // Recalculate total height after adding close button
        containerView.flex.layout(mode: .adjustHeight)
        
        // Get total size
        let totalSize = containerView.frame.size
        
        // Calculate centered position
        let x = (viewWidth - totalSize.width) / 2
        let y = (viewHeight - totalSize.height) / 2
        
        // Set container position
        containerView.frame = CGRect(x: x, y: y, width: totalSize.width, height: totalSize.height)
        
        #if DEBUG
        Logger.shared.debug("Layout completed: contentSize=\(contentSize), totalSize=\(totalSize), position=(\(x), \(y))")
        #endif
    }
    
    // MARK: - Actions
    
    @objc private func handleBackgroundTap(_ gesture: UITapGestureRecognizer) {
        let location = gesture.location(in: view)
        // Only dismiss when tapping outside container
        if !containerView.frame.contains(location) {
            dismiss(animated: true) { [weak self] in
                self?.dismissHandler?()
            }
        }
    }
    
}

// MARK: - UIGestureRecognizerDelegate

extension ModalDialogViewController: UIGestureRecognizerDelegate {
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        // Only trigger gesture when tapping background area
        return touch.view === view
    }
}
