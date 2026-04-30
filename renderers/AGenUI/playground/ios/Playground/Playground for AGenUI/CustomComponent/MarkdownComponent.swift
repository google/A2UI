//
//  MarkdownComponent.swift
//  GenerativeUIClientSDK
//
//  Created by AGenUI on 2026/3/20.
//

import UIKit
import MarkdownKit
import AGenUI

// MARK: - Custom Header Element

/// Custom Markdown Header element with line height configuration
class CustomMarkdownHeader: MarkdownHeader {
    
    /// Fixed line height value (used with priority)
    var fixedLineHeight: CGFloat?
    
    /// Line height multiplier (e.g., 1.5 means line height is 1.5x font size), used when fixedLineHeight is nil
    var lineHeightMultiple: CGFloat = 2
    
    override func attributesForLevel(_ level: Int) -> [NSAttributedString.Key: AnyObject] {
        var attributes = super.attributesForLevel(level)
        
        // Create paragraph style, set line height
        let paragraphStyle = NSMutableParagraphStyle()
        if let font = attributes[.font] as? UIFont {
            // Calculate target line height: use fixed value with priority, otherwise use multiplier
            let targetLineHeight: CGFloat
            if let fixed = fixedLineHeight {
                targetLineHeight = fixed
            } else {
                targetLineHeight = font.pointSize * lineHeightMultiple
            }
            // Force line height using minimumLineHeight and maximumLineHeight
            // This also works for single-line text (like headers)
            paragraphStyle.minimumLineHeight = targetLineHeight
            paragraphStyle.maximumLineHeight = targetLineHeight
            // Set baseline offset to vertically center text within line
            let baselineOffset = (targetLineHeight - font.lineHeight) / 2
            attributes[.baselineOffset] = baselineOffset as AnyObject
        }
        attributes[.paragraphStyle] = paragraphStyle
        
        return attributes
    }
}

/// Markdown component implementation (complies with A2UI v0.9 protocol)
///
/// Supported properties:
/// - content: Markdown content - required
/// - styles: Style dictionary (font-size, color, text-align, etc.)
///
/// Supported Markdown syntax:
/// - Headers (#, ##, ###, etc.)
/// - Bold (**text** or __text__)
/// - Italic (*text* or _text_)
/// - Strikethrough (~~text~~)
/// - Links ([text](url))
/// - Code blocks (`code` and ```language```)
/// - Unordered lists (- item)
/// - Ordered lists (1. item)
/// - Quotes (> text)
/// - Images (![alt](url))
///
/// Design notes:
/// - Use MarkdownKit to parse Markdown to NSAttributedString
/// - Use UITextView as subview (supports link clicks)
/// - Control rendering via NSAttributedString attributes
/// - Calculate content height using native method
/// - Use FlexLayout for height management
class MarkdownComponent: Component {
    
    // MARK: - Properties
    
    private var textView: UITextView?
    private var markdownParser: MarkdownParser?
    private var currentText: String = "" // Save current full text
    
    // MARK: - Async Parse Properties
    
    /// Background parse queue
    private let parseQueue = DispatchQueue(label: "com.amap.markdown.parse", qos: .userInitiated)
    /// Current parse task, used to cancel unfinished tasks
    private var currentParseWorkItem: DispatchWorkItem?
    
    // MARK: - Initialization
    
    init(componentId: String, properties: [String: Any]) {
        super.init(componentId: componentId, componentType: "Markdown", properties: properties)
        
        // Create UITextView
        let textView = UITextView(frame: CGRect(x: 0, y: 0, width: 10, height: 10))
        
        // Configure UITextView
        textView.backgroundColor = .clear
        textView.isEditable = false
        textView.isScrollEnabled = false
        textView.showsHorizontalScrollIndicator = false
        textView.showsVerticalScrollIndicator = false
        textView.textContainerInset = .zero
        textView.textContainer.lineFragmentPadding = 0
        textView.dataDetectorTypes = .link
        textView.linkTextAttributes = [
            .foregroundColor: UIColor.systemBlue,
            .underlineStyle: NSUnderlineStyle.single.rawValue
        ]
        textView.isSelectable = false
        
        
        // Add to self using FlexLayout
        flex.addItem(textView).grow(1)
        self.textView = textView
        
        // Initialize MarkdownParser
        self.markdownParser = createMarkdownParser()
        
        // Apply initial properties
        updateProperties(properties)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    // MARK: - Layout
    
//    override func sizeThatFits(_ size: CGSize) -> CGSize {
//        // Use UITextView's sizeThatFits to calculate actual height
//        return textView?.sizeThatFits(CGSize(width: size.width, height:size.height)) ?? CGSize(width: 10, height: 10)
//    }
    
    // MARK: - Component Override
    
    override func updateProperties(_ properties: [String: Any]) {
        // Call parent method to apply CSS properties to self
        super.updateProperties(properties)
        
        // Handle content field (full replacement)
        if properties.keys.contains("content") {
            let contentString = extractTextValue(from: properties["content"])
            // Full replace current text
            currentText = contentString
            // Async parse Markdown
            scheduleParseAndRender()
        }
        // Handle appendContent field (content append)
        else if properties.keys.contains("appendContent") {
            let appendString = extractTextValue(from: properties["appendContent"])
            
            if !appendString.isEmpty {
                // Append text to current content
                currentText += appendString
                // Async parse Markdown
                scheduleParseAndRender()
            }
        }
    }
    
    // MARK: - Async Parse
    
    /// Schedule async parse task
    ///
    /// Execute Markdown parsing on background thread to avoid main thread blocking.
    /// Use DispatchWorkItem for debounce/cancel mechanism, ensuring only latest parse task is executed.
    private func scheduleParseAndRender() {
        guard let textView = textView, let parser = markdownParser else { return }
        
        // Cancel previous unfinished parse task
        currentParseWorkItem?.cancel()
        
        // Snapshot current text for later consistency check
        let textSnapshot = currentText
        
        let workItem = DispatchWorkItem { [weak self] in
            guard let self = self else { return }
            
            // Execute parsing on background thread
            let parsedAttributedString = parser.parse(textSnapshot)
            // Apply line height style (normal text line height)
            let attributedString = self.applyLineHeight(to: parsedAttributedString)
            
            DispatchQueue.main.async { [weak self] in
                guard let self = self, let textView = self.textView else { return }
                
                // Check if text has been overwritten by newer request
                guard self.currentText == textSnapshot else { return }
                
                // Update UI on main thread
                textView.attributedText = attributedString
                textView.sizeToFit()
                textView.flex.markDirty()
                notifyLayoutChanged()
            }
        }
        
        currentParseWorkItem = workItem
        parseQueue.async(execute: workItem)
    }
    
    /// Extract text value (supports literalString, path, or direct string)
    private func extractTextValue(from value: Any?) -> String {
        // If dictionary format
        if let stringValue = value as? String {
            return stringValue
        }
        
        return " "
    }
    
    // MARK: - MarkdownParser Configuration
    
    /// Normal text line height
    private var normalTextLineHeight: CGFloat = 25
    
    /// Create and configure MarkdownParser
    private func createMarkdownParser() -> MarkdownParser {
        // Set base font and color
        let baseFont = UIFont.systemFont(ofSize: 16)
        let baseColor = UIColor.black

        // Create parser, enable all  except header (header uses custom implementation)
        let parser = MarkdownParser(
            font: baseFont,
            color: baseColor,
            enabledElements: .all.subtracting(.header)
        )
        
        // Create custom header and configure
        let customHeader = CustomMarkdownHeader(
            font: UIFont.boldSystemFont(ofSize: 20),
            maxLevel: 6,
            fontIncrease: 2
        )
        customHeader.fixedLineHeight = 52  // Set header fixed line height
        parser.addCustomElement(customHeader)
        
        // Configure code style
        if let menloFont = UIFont(name: "Menlo", size: 14) {
            parser.code.font = menloFont
        } else {
            parser.code.font = UIFont.monospacedSystemFont(ofSize: 14, weight: .regular)
        }
        
        // Configure link style
        parser.link.color = UIColor.systemBlue
        
        // Configure quote style
        parser.quote.color = UIColor.systemGray
        
        // Configure bold
        parser.bold.font = UIFont.boldSystemFont(ofSize: 16)
        
        // Configure italic
        parser.italic.font = UIFont.italicSystemFont(ofSize: 16)
        
        // Configure strikethrough
        parser.strikethrough.color = UIColor.systemGray
        
        return parser
    }
    
    /// Apply line height style for normal text
    /// - Parameter attributedString: Original attributed string
    /// - Returns: Attributed string after applying line height
    private func applyLineHeight(to attributedString: NSAttributedString) -> NSAttributedString {
        let mutableString = NSMutableAttributedString(attributedString: attributedString)
        let fullRange = NSRange(location: 0, length: mutableString.length)
        
        // Iterate through all characters, check if paragraph style exists
        mutableString.enumerateAttribute(.paragraphStyle, in: fullRange, options: []) { value, range, _ in
            // If no custom paragraph style (non-header) in this range, apply normal text line height
            if value == nil {
                let paragraphStyle = NSMutableParagraphStyle()
                paragraphStyle.minimumLineHeight = normalTextLineHeight
                paragraphStyle.maximumLineHeight = normalTextLineHeight
                
                // Calculate baseline offset
                let font = mutableString.attribute(.font, at: range.location, effectiveRange: nil) as? UIFont ?? UIFont.systemFont(ofSize: 16)
                let baselineOffset = (normalTextLineHeight - font.lineHeight) / 2
                
                mutableString.addAttribute(.paragraphStyle, value: paragraphStyle, range: range)
                mutableString.addAttribute(.baselineOffset, value: baselineOffset, range: range)
            }
        }
        
        return mutableString
    }
}
