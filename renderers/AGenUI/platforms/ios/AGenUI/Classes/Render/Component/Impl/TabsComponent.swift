//
//  TabsComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// Tab data model
struct TabItem {
    let title: String
    let childId: String?
}

/// Inner Tab view, manages TabBar and content area
class InnerTabsView: UIView {

    // MARK: - Properties

    private var tabBarView: UIView!
    private var contentView: UIView!
    private var indicatorView: UIView!
    private var tabButtons: [UIButton] = []
    private var currentContentView: UIView?
    private var selectedIndex: Int = 0

    /// Store all content components, keyed by childId
    private var contentComponents: [String: UIView] = [:]

    /// Layout change callback (set by TabsComponent)
    var onLayoutChanged: (() -> Void)?

    /// Tab data
    private var tabItems: [TabItem] = []

    /// Style properties
    var indicatorColor: UIColor = UIColor(red: 0x22/255.0, green: 0x73/255.0, blue: 0xF7/255.0, alpha: 1.0)
    var indicatorWidth: CGFloat = 24
    var indicatorHeight: CGFloat = 4
    var indicatorRadius: CGFloat = 2
    var selectedTabColor: UIColor = UIColor(red: 0x22/255.0, green: 0x73/255.0, blue: 0xF7/255.0, alpha: 1.0)
    var normalTabColor: UIColor = .black
    var fontSize: CGFloat = 16
    var fontSizeSelected: CGFloat = 16
    var fontWeight: UIFont.Weight = .medium
    var fontWeightSelected: UIFont.Weight = .bold

    // MARK: - Initialization

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupSubviews()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupSubviews()
    }

    // MARK: - Setup

    private func setupSubviews() {
        // TabBar container - using FlexLayout
        tabBarView = UIView()
        tabBarView.backgroundColor = .clear
        tabBarView.flex.direction(.row).alignItems(.stretch)
        flex.addItem(tabBarView).height(44)

        // Content container - using FlexLayout
        contentView = UIView()
        contentView.backgroundColor = .clear
        flex.addItem(contentView).grow(1).shrink(1)

        // Indicator container - for positioning indicator
        indicatorView = UIView()
        indicatorView.backgroundColor = indicatorColor
        indicatorView.layer.cornerRadius = indicatorRadius
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        
        guard bounds.width > 0 else { return }
                
        // Ensure indicator position updates after layout completes
        if !tabButtons.isEmpty {
            updateIndicatorPosition(animated: false)
        }
    }

    private func layoutTabButtons() {
        guard !tabButtons.isEmpty else { return }

        // Layout Tab buttons using FlexLayout
        for button in tabButtons {
            tabBarView.flex.addItem(button).grow(1).shrink(1).basis(0).height(100%).justifyContent(.center).alignItems(.center)
        }
    }

    private func updateIndicatorPosition(animated: Bool) {
        guard !tabButtons.isEmpty, selectedIndex < tabButtons.count, tabBarView.bounds.width > 0 else { return }

        // Position indicator using FlexLayout
        indicatorView.removeFromSuperview()
        indicatorView.flex.width(indicatorWidth).height(indicatorHeight)

        // Calculate indicator position and use FlexLayout absolute positioning
        let buttonWidth = tabBarView.bounds.width / CGFloat(tabButtons.count)
        let indicatorLeft = buttonWidth * CGFloat(selectedIndex) + (buttonWidth - indicatorWidth) / 2

        tabBarView.flex.addItem(indicatorView)
            .position(.absolute)
            .left(indicatorLeft)
            .bottom(0)
            .width(indicatorWidth)
            .height(indicatorHeight)

        if animated {
            UIView.animate(withDuration: 0.3, delay: 0, usingSpringWithDamping: 0.8, initialSpringVelocity: 0.5, options: [.curveEaseInOut, .allowUserInteraction], animations: {
                self.tabBarView.flex.layout()
            })
        }
        // Non-animated: indicator position triggered by layoutSubviews
    }

    // MARK: - Public Methods

    /// Set Tab data, recreate TabBar if data changed
    func setTabs(_ items: [TabItem]) {
        // Check if data actually changed
        let currentTitles = tabItems.map { $0.title }
        let newTitles = items.map { $0.title }

        guard newTitles != currentTitles else {
            return
        }

        // Delete old TabBar
        tabButtons.forEach { $0.removeFromSuperview() }
        tabButtons.removeAll()
        indicatorView.removeFromSuperview()

        // Update data
        tabItems = items

        // Recreate TabBar
        setupTabBar()

        // Try to show currently selected content component (may have been added before setTabs)
        tryShowCurrentContent()
    }

    /// Set content view
    func setContentView(_ view: UIView?) {
        // Remove old content view
        currentContentView?.removeFromSuperview()
        currentContentView = nil

        // Add new content view
        guard let view = view else { return }
        currentContentView = view

        // Layout using FlexLayout
        contentView.flex.addItem(view)
        onLayoutChanged?()
    }

    /// Add content component
    /// - Parameters:
    ///   - componentId: Component ID (corresponds to TabItem.childId)
    ///   - component: Component view
    func addContentComponent(componentId: String, component: UIView) {
        // Store component (store first, check later in setTabs or selectTab if display needed)
        contentComponents[componentId] = component

        // Try to show (if tabItems set and matches current selection)
        tryShowCurrentContent()
    }

    /// Try to show content component for currently selected Tab
    private func tryShowCurrentContent() {
        guard selectedIndex < tabItems.count,
              let currentChildId = tabItems[selectedIndex].childId,
              let component = contentComponents[currentChildId],
              currentContentView !== component else {
            return
        }

        setContentView(component)
    }

    /// Select specified Tab
    func selectTab(at index: Int) {
        guard index >= 0, index < tabButtons.count else { return }

        selectedIndex = index
        updateTabAppearance()
        updateIndicatorPosition(animated: true)
        tryShowCurrentContent()
    }

    /// Update styles
    func updateStyles() {
        indicatorView.backgroundColor = indicatorColor
        indicatorView.layer.cornerRadius = indicatorRadius
        updateTabAppearance()
        updateIndicatorPosition(animated: false)
    }

    // MARK: - Private Methods

    private func setupTabBar() {
        // Create Tab buttons (using FlexLayout)
        for (index, item) in tabItems.enumerated() {
            let button = UIButton(type: .system)
            button.setTitle(item.title, for: .normal)
            button.titleLabel?.font = UIFont.systemFont(ofSize: fontSize, weight: fontWeight)
            button.contentHorizontalAlignment = .center
            button.tag = index
            button.addTarget(self, action: #selector(tabButtonTapped(_:)), for: .touchUpInside)
            tabButtons.append(button)
        }

        // Layout buttons using FlexLayout
        layoutTabButtons()

        selectTab(at: 0)
    }

    private func updateTabAppearance() {
        for (index, button) in tabButtons.enumerated() {
            if index == selectedIndex {
                button.setTitleColor(selectedTabColor, for: .normal)
                button.titleLabel?.font = UIFont.systemFont(ofSize: fontSizeSelected, weight: fontWeightSelected)
            } else {
                button.setTitleColor(normalTabColor, for: .normal)
                button.titleLabel?.font = UIFont.systemFont(ofSize: fontSize, weight: fontWeight)
            }
        }
    }

    @objc private func tabButtonTapped(_ sender: UIButton) {
        selectTab(at: sender.tag)
    }
}

/// Tabs component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - tabs: Tab array, each with title (String) and child (String component reference) (Array)
///
/// Design notes:
/// - Uses InnerTabsView to manage TabBar and content area
/// - Custom Tab buttons with animated indicator
/// - Content components are added via addChild and shown/hidden based on selected tab
class TabsComponent: Component {

    // MARK: - Properties

    private var innerTabsView: InnerTabsView!

    // MARK: - Initialization

    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Tabs", properties: properties)

        // Create InnerTabsView
        innerTabsView = InnerTabsView()
        innerTabsView.onLayoutChanged = { [weak self] in
            self?.notifyLayoutChanged()
        }
        flex.addItem(innerTabsView).direction(.column).grow(1).shrink(1)

        updateProperties(properties)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // MARK: - Children Management

    /// Get child component ID list from tabs configuration
    /// Parse directly from properties, not relying on tabConfigs (as this method may be called before init)
    override func getChildrenIdsFromProperties() -> [String] {
        guard let tabs = properties["tabs"] as? [[String: Any]] else {
            return []
        }
        return tabs.compactMap { $0["child"] as? String }
    }

    // MARK: - Component Override

    override func updateProperties(_ properties: [String: Any]) {
        // Note: children sync is completed in init
        // Only call super here to handle CSS properties etc.
        super.updateProperties(properties)

        // Update tabs configuration (during dynamic updates)
        if let tabs = properties["tabs"] as? [[String: Any]] {
            // Convert to TabItem array
            let items = tabs.map { tab -> TabItem in
                let title = tab["title"] as? String ?? "Tab"
                let childId = tab["child"] as? String
                return TabItem(title: title, childId: childId)
            }

            // Set Tab data (InnerTabsView auto-handles changes)
            innerTabsView.setTabs(items)
        }
    }

    // MARK: - Children Management

    override func addChild(_ child: Component) {
        // Add child component to InnerTabsView (internally checks validity)
        innerTabsView.addContentComponent(componentId: child.componentId, component: child)
    }
}
