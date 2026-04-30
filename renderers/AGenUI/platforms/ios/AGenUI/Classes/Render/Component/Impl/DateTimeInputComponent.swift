//
//  DateTimeInputComponent.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/2/28.
//  Updated by acoder-ai-infra on 2026/3/19 - Added Compact popup interaction
//

import UIKit
#if ENABLE_CUSTOM_YOGA
#else
import FlexLayout
#endif

/// DateTimeInput component implementation (compliant with A2UI v0.9 protocol)
///
/// Supported properties:
/// - enableDate: Whether to enable date selection (Boolean, default true)
/// - enableTime: Whether to enable time selection (Boolean, default false)
/// - value: Current date/time value in ISO 8601 format (String)
/// - min: Minimum date/time value in ISO 8601 format (String)
/// - max: Maximum date/time value in ISO 8601 format (String)
///
/// Design notes:
/// - Uses Compact style with popup UIPickerView for date/time selection
/// - Column count auto-adjusts based on enableDate/enableTime: 2 columns (time only), 3 columns (date only), 5 columns (date and time)
/// - Supports dynamic day adjustment based on selected year/month (leap year handling)
class DateTimeInputComponent: Component {
    
    // MARK: - Style Enum
    
    enum WheelsColumnCount {
        case two    // Hour and minute
        case three  // Year, month, day
        case five   // Year, month, day, hour, minute
    }
    
    // MARK: - Properties
    
    private var compactButton: UIButton?
    private var buttonBackgroundView: UIView?
    private var iconImage: UIImage?  // Cache icon image for setImage
    private var customPickerView: UIPickerView?
    
    // Popup related
    private var customMaskView: UIView?
    private var popupContainerView: UIView?
    private var isPopupVisible = false
    
    private var enableDate: Bool = true
    private var enableTime: Bool = false
    private var isUpdatingFromNative = false
    
    private var currentDate: Date = Date()
    private var minDate: Date?
    private var maxDate: Date?
    
    // Style configuration
    private var wheelsColumnCount: WheelsColumnCount = .three
    
    // Compact style configuration
    private var compactHeight: CGFloat = 56
    private var compactFontSize: CGFloat = 24
    private var compactSelectedBackgroundColor: UIColor = UIColor(red: 34/255, green: 115/255, blue: 247/255, alpha: 0.08)
    private var compactSelectedTextColor: UIColor = UIColor(red: 34/255, green: 115/255, blue: 247/255, alpha: 1.0)
    private var compactUnselectedTextColor: UIColor = .black
    private var compactPlaceholderText: String = "Select Date"
    private var compactPaddingVertical: CGFloat = 12
    private var compactPaddingHorizontal: CGFloat = 24
    private var compactCornerRadius: CGFloat = 8
    private var compactPopupMaskColor: UIColor = UIColor(white: 0, alpha: 0.4)
    private var compactPopupCornerRadius: CGFloat = 12
    
    // Wheels style configuration
    private var wheelsFontSize: CGFloat = 28
    private var wheelsRowSpacing: CGFloat = 80
    private var wheelsSelectedColor: UIColor = .black
    private var wheelsUnselectedColor: UIColor = UIColor(white: 0, alpha: 0.2)
    private var wheelsSelectedBackgroundColor: UIColor = .white
    private var wheelsPickerHeight: CGFloat = 368
    private var wheelsDividerColor: UIColor = UIColor(white: 0, alpha: 0.06)
    private var wheelsDividerHeight: CGFloat = 2
    private var wheelsBackgroundColor: UIColor = .white
    private var wheelsContainerPadding: CGFloat = 16
    
    // Wheels data source
    private var years: [Int] = []
    private var months: [Int] = Array(1...12)
    private var days: [Int] = Array(1...31)
    private var hours: [Int] = Array(0...23)
    private var minutes: [Int] = Array(0...59)
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "DateTimeInput", properties: properties)
        
        // Parse initial properties
        parseProperties()
        
        // Load style configuration
        loadLocalStyleConfig()
        
        // Create Compact button
        createCompactButton()
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        super.updateProperties(properties)
        
        // Re-parse properties
        parseProperties()
        
        // Update value
        if let value = properties["value"] {
            isUpdatingFromNative = true
            let dateString = extractTextValue(value)
            if let date = parseISO8601Date(from: dateString) {
                currentDate = date
                updateDisplayValue()
            }
            isUpdatingFromNative = false
        }
    }
    
    // MARK: - Configuration Methods
    
    /// Load local style configuration
    private func loadLocalStyleConfig() {
        guard let config = ComponentStyleConfigManager.shared.getConfig(for: componentType) else {
            return
        }

        // Load Compact and Wheels configuration
        loadCompactStyleConfig(config)
        loadWheelsStyleConfig(config)
    }
    
    /// Load Compact style configuration
    private func loadCompactStyleConfig(_ config: [String: Any]) {
        guard let compactConfig = config["compact"] as? [String: Any] else { return }
        
        if let height = compactConfig["height"] as? String,
           let value = ComponentStyleConfigManager.parseSize(height) {
            self.compactHeight = value
        }
        
        if let size = compactConfig["font-size"] as? String,
           let value = ComponentStyleConfigManager.parseSize(size) {
            self.compactFontSize = value
        }
        
        if let color = compactConfig["selected-background-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.compactSelectedBackgroundColor = value
        }
        
        if let color = compactConfig["selected-text-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.compactSelectedTextColor = value
        }
        
        if let color = compactConfig["unselected-text-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.compactUnselectedTextColor = value
        }
        
        if let text = compactConfig["placeholder-text"] as? String {
            self.compactPlaceholderText = text
        }
        
        if let padding = compactConfig["padding-vertical"] as? String,
           let value = ComponentStyleConfigManager.parseSize(padding) {
            self.compactPaddingVertical = value
        }
        
        if let padding = compactConfig["padding-horizontal"] as? String,
           let value = ComponentStyleConfigManager.parseSize(padding) {
            self.compactPaddingHorizontal = value
        }
        
        if let radius = compactConfig["corner-radius"] as? String,
           let value = ComponentStyleConfigManager.parseSize(radius) {
            self.compactCornerRadius = value
        }
        
        if let color = compactConfig["popup-mask-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.compactPopupMaskColor = value
        }
        
        if let radius = compactConfig["popup-corner-radius"] as? String,
           let value = ComponentStyleConfigManager.parseSize(radius) {
            self.compactPopupCornerRadius = value
        }
    }
    
    /// Load Wheels style configuration
    private func loadWheelsStyleConfig(_ config: [String: Any]) {
        // Select configuration based on column count
        let configKey: String
        switch wheelsColumnCount {
        case .two:
            configKey = "wheels-2col"
        case .three:
            configKey = "wheels-3col"
        case .five:
            configKey = "wheels-5col"
        }
        
        guard let wheelsConfig = config[configKey] as? [String: Any] else { return }
        
        if let size = wheelsConfig["font-size"] as? String,
           let value = ComponentStyleConfigManager.parseSize(size) {
            self.wheelsFontSize = value
        }
        
        if let spacing = wheelsConfig["row-spacing"] as? String,
           let value = ComponentStyleConfigManager.parseSize(spacing) {
            self.wheelsRowSpacing = value
        }
        
        if let color = wheelsConfig["selected-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.wheelsSelectedColor = value
        }
        
        if let color = wheelsConfig["unselected-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.wheelsUnselectedColor = value
        }
        
        if let color = wheelsConfig["selected-background-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.wheelsSelectedBackgroundColor = value
        }
        
        if let height = wheelsConfig["picker-height"] as? String,
           let value = ComponentStyleConfigManager.parseSize(height) {
            self.wheelsPickerHeight = value
        }
        
        if let color = wheelsConfig["divider-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.wheelsDividerColor = value
        }
        
        if let height = wheelsConfig["divider-height"] as? String,
           let value = ComponentStyleConfigManager.parseSize(height) {
            self.wheelsDividerHeight = value
        }
        
        if let color = wheelsConfig["background-color"] as? String,
           let value = ComponentStyleConfigManager.parseColorToUIColor(color) {
            self.wheelsBackgroundColor = value
        }
        
        if let padding = wheelsConfig["container-padding"] as? String,
           let value = ComponentStyleConfigManager.parseSize(padding) {
            self.wheelsContainerPadding = value
        }
    }
    
    // MARK: - UI Creation - Compact Style
    
    /// Create Compact style button
    private func createCompactButton() {
        // Create background view
        let backgroundView = UIView()
        backgroundView.backgroundColor = compactSelectedBackgroundColor
        backgroundView.layer.cornerRadius = compactCornerRadius
        backgroundView.clipsToBounds = true
        backgroundView.isUserInteractionEnabled = false
        self.buttonBackgroundView = backgroundView
        
        // Create button (transparent background)
        let button = UIButton(type: .custom)
        button.backgroundColor = .clear
        button.titleLabel?.font = UIFont.systemFont(ofSize: compactFontSize)
        button.contentHorizontalAlignment = .center
        button.contentEdgeInsets = UIEdgeInsets(
            top: compactPaddingVertical,
            left: compactPaddingHorizontal,
            bottom: compactPaddingVertical,
            right: compactPaddingHorizontal
        )
        button.addTarget(self, action: #selector(compactButtonTapped), for: .touchUpInside)
        
        self.compactButton = button
        
        // Load calendar icon, cache for later setImage use
        let iconSize: CGFloat = 12
        if let calendarIcon = ComponentStyleConfigManager.loadIcon(named: "calendar", size: CGSize(width: iconSize, height: iconSize)) {
            let tintedIcon = calendarIcon.withRenderingMode(.alwaysTemplate)
            self.iconImage = tintedIcon
        }
        
        // Set initial title
        button.setTitle(compactPlaceholderText, for: .normal)
        button.setTitleColor(compactUnselectedTextColor, for: .normal)
        
        // Use FlexLayout layout - width determined by parent container, fixed height
        flex.define { flex in
            flex.addItem().position(.absolute).all(0).define { flex in
                flex.addItem(backgroundView).grow(1).height(compactHeight)
            }
            flex.addItem(button)
                .grow(1)
                .height(compactHeight)
        }
        
        // Initialize button title display
        updateButtonTitle()
    }
    
    /// Check if there's a valid value
    private func hasValidValue() -> Bool {
        // Check value in properties
        guard let value = properties["value"] else {
            return false
        }
        
        let dateString = extractTextValue(value)
        
        // Check for invalid values: 0, "0", empty string, nil
        if dateString.isEmpty || dateString == "0" {
            return false
        }
        
        // Try to parse date, if parsing fails also consider invalid
        if parseISO8601Date(from: dateString) == nil {
            return false
        }
        
        return true
    }
    
    /// Update button title
    private func updateButtonTitle() {
        guard let button = compactButton else { return }
        
        let hasValue = hasValidValue()
        let displayText = hasValue ? formatDisplayText() : compactPlaceholderText
        let iconSize: CGFloat = 12
        let spacing: CGFloat = 3
        
        button.setTitle(displayText, for: .normal)
        button.setTitleColor(hasValue ? compactSelectedTextColor : compactUnselectedTextColor, for: .normal)
        
        // Both states use same background color
        buttonBackgroundView?.backgroundColor = compactSelectedBackgroundColor
        
        if hasValue {
            // Has value: pure text centered, clear image
            button.setImage(nil, for: .normal)
            button.imageEdgeInsets = .zero
            button.titleEdgeInsets = .zero
            button.tintColor = compactSelectedTextColor
        } else {
            // No value: text + icon centered, icon 3pt to the right of text
            if let icon = iconImage {
                button.setImage(icon, for: .normal)
                button.tintColor = compactUnselectedTextColor
                
                // Force layout to get actual text width
                button.layoutIfNeeded()
                let textWidth = button.titleLabel?.intrinsicContentSize.width ?? 0
                
                let imageShift = textWidth + spacing
                button.imageEdgeInsets = UIEdgeInsets(top: 0, left: imageShift, bottom: 0, right: -imageShift)
                let titleShift = iconSize + spacing
                button.titleEdgeInsets = UIEdgeInsets(top: 0, left: -titleShift, bottom: 0, right: titleShift)
            } else {
                // No icon, fall back to pure text centered
                button.setImage(nil, for: .normal)
                button.imageEdgeInsets = .zero
                button.titleEdgeInsets = .zero
            }
        }
    }
    
    /// Format display text
    private func formatDisplayText() -> String {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: currentDate)
        
        if enableDate && enableTime {
            // Year-Month-Day Hour:Minute
            return String(format: "%04d-%02d-%02d %02d:%02d",
                         components.year ?? 0,
                         components.month ?? 0,
                         components.day ?? 0,
                         components.hour ?? 0,
                         components.minute ?? 0)
        } else if enableDate {
            // Year-Month-Day
            return String(format: "%04d-%02d-%02d",
                         components.year ?? 0,
                         components.month ?? 0,
                         components.day ?? 0)
        } else if enableTime {
            // Hour:Minute
            return String(format: "%02d:%02d",
                         components.hour ?? 0,
                         components.minute ?? 0)
        }
        
        return compactPlaceholderText
    }
    
    // MARK: - Popup Management
    
    /// Compact button tapped
    @objc private func compactButtonTapped() {
        if isPopupVisible {
            hidePopup()
        } else {
            showPopup()
        }
    }
    
    /// Show popup
    private func showPopup() {
        guard let window = UIApplication.shared.windows.first(where: { $0.isKeyWindow }) else { return }
        
        // Create mask
        let mask = UIView(frame: window.bounds)
        mask.backgroundColor = compactPopupMaskColor
        mask.alpha = 0
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(maskTapped))
        mask.addGestureRecognizer(tapGesture)
        window.addSubview(mask)
        self.customMaskView = mask
        
        // Create popup container
        let popupHeight = wheelsPickerHeight + wheelsContainerPadding * 2
        let popup = UIView(frame: CGRect(x: 0, y: window.bounds.height, width: window.bounds.width, height: popupHeight))
        popup.backgroundColor = wheelsBackgroundColor
        popup.layer.cornerRadius = compactPopupCornerRadius
        popup.layer.maskedCorners = [.layerMinXMinYCorner, .layerMaxXMinYCorner]
        popup.clipsToBounds = true
        window.addSubview(popup)
        self.popupContainerView = popup
        
        // Create Picker
        initializeDataSource()
        let pickerView = UIPickerView()
        pickerView.delegate = self
        pickerView.dataSource = self
        pickerView.backgroundColor = .clear
        self.customPickerView = pickerView
        
        popup.flex.padding(wheelsContainerPadding).define { flex in
            flex.addItem(pickerView)
                .height(wheelsPickerHeight)
        }
        popup.flex.layout()
        
        setPickerToCurrentDate()
        
        // Initialize date range (ensure initial state is correct)
        if wheelsColumnCount == .three || wheelsColumnCount == .five {
            updateDaysForSelectedYearMonth(pickerView)
        }
        
        addDividerLines(to: pickerView)
        
        // Animate show
        isPopupVisible = true
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseOut) {
            mask.alpha = 1
            popup.frame.origin.y = window.bounds.height - popupHeight
        }
    }
    
    /// Hide popup
    private func hidePopup() {
        guard let mask = customMaskView, let popup = popupContainerView else { return }
        
        isPopupVisible = false
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseIn, animations: {
            mask.alpha = 0
            popup.frame.origin.y = UIScreen.main.bounds.height
        }) { _ in
            mask.removeFromSuperview()
            popup.removeFromSuperview()
            self.customPickerView = nil
            self.popupContainerView = nil
            self.customPickerView = nil
        }
    }
    
    /// Mask tapped
    @objc private func maskTapped() {
        hidePopup()
    }
    
    // MARK: - Helper Methods
    
    /// Parse component properties
    private func parseProperties() {
        // Parse enableDate
        if let value = properties["enableDate"] as? Bool {
            enableDate = value
        }
        
        // Parse enableTime
        if let value = properties["enableTime"] as? Bool {
            enableTime = value
        }
        
        // Determine column count based on enableDate and enableTime
        if enableDate && enableTime {
            wheelsColumnCount = .five  // Year, month, day, hour, minute
        } else if enableDate {
            wheelsColumnCount = .three  // Year, month, day
        } else if enableTime {
            wheelsColumnCount = .two  // Hour, minute
        }
        
        // Parse initial value
        if let value = properties["value"] {
            let dateString = extractTextValue(value)
            if let date = parseISO8601Date(from: dateString) {
                currentDate = date
            }
        }
        
        // Parse minimum value
        if let minValue = properties["min"] as? String {
            minDate = parseISO8601Date(from: minValue)
        }
        
        // Parse maximum value
        if let maxValue = properties["max"] as? String {
            maxDate = parseISO8601Date(from: maxValue)
        }
    }
    
    /// Update display value
    private func updateDisplayValue() {
        updateButtonTitle()
        if let pickerView = customPickerView, isPopupVisible {
            setPickerToCurrentDate()
        }
    }
    
    /// Initialize data source
    private func initializeDataSource() {
        let calendar = Calendar.current
        let currentYear = calendar.component(.year, from: Date())
        
        // Generate year range (50 years before and after current year)
        years = Array((currentYear - 50)...(currentYear + 50))
    }
    
    /// Set PickerView to current date
    private func setPickerToCurrentDate() {
        guard let pickerView = customPickerView else { return }
        
        let calendar = Calendar.current
        let components = calendar.dateComponents([.year, .month, .day, .hour, .minute], from: currentDate)
        
        switch wheelsColumnCount {
        case .two:
            // Hour and minute
            if let hour = components.hour, let minute = components.minute {
                pickerView.selectRow(hour, inComponent: 0, animated: false)
                pickerView.selectRow(minute, inComponent: 1, animated: false)
            }
        case .three:
            // Year, month, day
            if let year = components.year, let month = components.month, let day = components.day {
                if let yearIndex = years.firstIndex(of: year) {
                    pickerView.selectRow(yearIndex, inComponent: 0, animated: false)
                }
                pickerView.selectRow(month - 1, inComponent: 1, animated: false)
                pickerView.selectRow(day - 1, inComponent: 2, animated: false)
            }
        case .five:
            // Year, month, day, hour, minute
            if let year = components.year, let month = components.month, let day = components.day,
               let hour = components.hour, let minute = components.minute {
                if let yearIndex = years.firstIndex(of: year) {
                    pickerView.selectRow(yearIndex, inComponent: 0, animated: false)
                }
                pickerView.selectRow(month - 1, inComponent: 1, animated: false)
                pickerView.selectRow(day - 1, inComponent: 2, animated: false)
                pickerView.selectRow(hour, inComponent: 3, animated: false)
                pickerView.selectRow(minute, inComponent: 4, animated: false)
            }
        }
    }
    
    /// Dynamically update date range based on selected year and month
    private func updateDaysForSelectedYearMonth(_ pickerView: UIPickerView) {
        let yearComponent: Int
        let monthComponent: Int
        
        switch wheelsColumnCount {
        case .three:
            yearComponent = 0
            monthComponent = 1
        case .five:
            yearComponent = 0
            monthComponent = 1
        default:
            return
        }
        
        let yearIndex = pickerView.selectedRow(inComponent: yearComponent)
        let monthIndex = pickerView.selectedRow(inComponent: monthComponent)
        
        let year = years[yearIndex]
        let month = monthIndex + 1
        
        // Calculate actual days in that month
        let calendar = Calendar.current
        let dateComponents = DateComponents(year: year, month: month)
        guard let date = calendar.date(from: dateComponents),
              let range = calendar.range(of: .day, in: .month, for: date) else {
            return
        }
        
        let daysInMonth = range.count
        
        // Update days array
        days = Array(1...daysInMonth)
        
        // Reload day column
        let dayComponent = wheelsColumnCount == .three ? 2 : 2
        pickerView.reloadComponent(dayComponent)
        
        // If currently selected day is out of range, adjust to max
        let currentDay = pickerView.selectedRow(inComponent: dayComponent) + 1
        if currentDay > daysInMonth {
            pickerView.selectRow(daysInMonth - 1, inComponent: dayComponent, animated: true)
        }
    }
    
    /// Get selected date from PickerView
    private func getDateFromPicker() -> Date? {
        guard let pickerView = customPickerView else { return nil }
        
        let calendar = Calendar.current
        var components = DateComponents()
        
        switch wheelsColumnCount {
        case .two:
            // Hour and minute
            let hour = pickerView.selectedRow(inComponent: 0)
            let minute = pickerView.selectedRow(inComponent: 1)
            components.hour = hour
            components.minute = minute
            // Use current date
            let now = Date()
            let dateComponents = calendar.dateComponents([.year, .month, .day], from: now)
            components.year = dateComponents.year
            components.month = dateComponents.month
            components.day = dateComponents.day
        case .three:
            // Year, month, day
            let yearIndex = pickerView.selectedRow(inComponent: 0)
            let monthIndex = pickerView.selectedRow(inComponent: 1)
            let dayIndex = pickerView.selectedRow(inComponent: 2)
            components.year = years[yearIndex]
            components.month = monthIndex + 1
            components.day = dayIndex + 1
        case .five:
            // Year, month, day, hour, minute
            let yearIndex = pickerView.selectedRow(inComponent: 0)
            let monthIndex = pickerView.selectedRow(inComponent: 1)
            let dayIndex = pickerView.selectedRow(inComponent: 2)
            let hour = pickerView.selectedRow(inComponent: 3)
            let minute = pickerView.selectedRow(inComponent: 4)
            components.year = years[yearIndex]
            components.month = monthIndex + 1
            components.day = dayIndex + 1
            components.hour = hour
            components.minute = minute
        }
        
        return calendar.date(from: components)
    }
    
    /// Add divider lines
    private func addDividerLines(to pickerView: UIPickerView) {
        // Calculate divider line position (above and below selected row)
        let centerY = wheelsPickerHeight / 2
        let halfRowHeight = wheelsRowSpacing / 2
        
        // Top divider
        let topDivider = UIView()
        topDivider.backgroundColor = wheelsDividerColor
        topDivider.frame = CGRect(x: 0, y: centerY - halfRowHeight, width: pickerView.bounds.width, height: wheelsDividerHeight)
        topDivider.isUserInteractionEnabled = false
        pickerView.addSubview(topDivider)
        
        // Bottom divider
        let bottomDivider = UIView()
        bottomDivider.backgroundColor = wheelsDividerColor
        bottomDivider.frame = CGRect(x: 0, y: centerY + halfRowHeight, width: pickerView.bounds.width, height: wheelsDividerHeight)
        bottomDivider.isUserInteractionEnabled = false
        pickerView.addSubview(bottomDivider)
    }
    
    // MARK: - Date Parsing
    
    /// Parse ISO 8601 date string
    private func parseISO8601Date(from string: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: string) { return date }
        
        formatter.formatOptions = [.withInternetDateTime]
        if let date = formatter.date(from: string) { return date }
        
        formatter.formatOptions = [.withFullDate]
        if let date = formatter.date(from: string) { return date }
        
        formatter.formatOptions = [.withTime]
        if let date = formatter.date(from: string) { return date }
        
        return nil
    }
    
    /// Format date to ISO 8601 string
    private func formatISO8601Date(_ date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        
        if enableDate && enableTime {
            formatter.formatOptions = [.withInternetDateTime]
        } else if enableDate {
            formatter.formatOptions = [.withFullDate]
        } else if enableTime {
            formatter.formatOptions = [.withTime]
        }
        
        return formatter.string(from: date)
    }
    
    /// Extract text value
    private func extractTextValue(_ value: Any) -> String {
        if let valueDict = value as? [String: Any] {
            if let literalString = valueDict["literalString"] as? String {
                return literalString
            }
            if valueDict["path"] != nil {
                return ""
            }
        }
        return String(describing: value)
    }    
}

// MARK: - UIPickerViewDataSource

extension DateTimeInputComponent: UIPickerViewDataSource {
    
    func numberOfComponents(in pickerView: UIPickerView) -> Int {
        switch wheelsColumnCount {
        case .two:
            return 2
        case .three:
            return 3
        case .five:
            return 5
        }
    }
    
    func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
        switch wheelsColumnCount {
        case .two:
            return component == 0 ? hours.count : minutes.count
        case .three:
            switch component {
            case 0: return years.count
            case 1: return months.count
            case 2: return days.count
            default: return 0
            }
        case .five:
            switch component {
            case 0: return years.count
            case 1: return months.count
            case 2: return days.count
            case 3: return hours.count
            case 4: return minutes.count
            default: return 0
            }
        }
    }
}

// MARK: - UIPickerViewDelegate

extension DateTimeInputComponent: UIPickerViewDelegate {
    
    func pickerView(_ pickerView: UIPickerView, rowHeightForComponent component: Int) -> CGFloat {
        return wheelsRowSpacing
    }
    
    func pickerView(_ pickerView: UIPickerView, viewForRow row: Int, forComponent component: Int, reusing view: UIView?) -> UIView {
        // Create container view to ensure background color displays correctly
        let containerView: UIView
        if let reusedView = view {
            containerView = reusedView
        } else {
            containerView = UIView()
        }
        
        // Clear old subviews
        containerView.subviews.forEach { $0.removeFromSuperview() }
        
        // Create Label
        let label = UILabel()
        label.textAlignment = .center
        label.font = UIFont.systemFont(ofSize: wheelsFontSize)
        
        // Get text
        let text: String
        switch wheelsColumnCount {
        case .two:
            text = component == 0 ? String(format: "%02d", hours[row]) : String(format: "%02d", minutes[row])
        case .three:
            switch component {
            case 0: text = "\(years[row])"
            case 1: text = "\(months[row])"
            case 2: text = "\(days[row])"
            default: text = ""
            }
        case .five:
            switch component {
            case 0: text = "\(years[row])"
            case 1: text = "\(months[row])"
            case 2: text = "\(days[row])"
            case 3: text = String(format: "%02d", hours[row])
            case 4: text = String(format: "%02d", minutes[row])
            default: text = ""
            }
        }
        
        label.text = text
        
        // Set color and background based on selection state
        let isSelected = pickerView.selectedRow(inComponent: component) == row
        label.textColor = isSelected ? wheelsSelectedColor : wheelsUnselectedColor
        label.backgroundColor = .clear
        
        // Set container background color
        containerView.backgroundColor = isSelected ? wheelsSelectedBackgroundColor : .clear
        
        // Add Label to container
        containerView.addSubview(label)
        label.frame = containerView.bounds
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        return containerView
    }
    
    func pickerView(_ pickerView: UIPickerView, didSelectRow row: Int, inComponent component: Int) {
        guard !isUpdatingFromNative else { return }
        
        // When selecting year or month, dynamically update date range
        if wheelsColumnCount == .three || wheelsColumnCount == .five {
            if component == 0 || component == 1 {  // Year or month
                updateDaysForSelectedYearMonth(pickerView)
            }
        }
        
        // Update all row colors
        pickerView.reloadAllComponents()
        
        // Get new date and sync
        if let newDate = getDateFromPicker() {
            currentDate = newDate
            let newValue = formatISO8601Date(currentDate)
            
            // Update properties["value"], ensure hasValidValue() can judge correctly
            properties["value"] = newValue
            
            // Update button display
            updateButtonTitle()
            
            syncState(["value": newValue])
        }
    }
}
