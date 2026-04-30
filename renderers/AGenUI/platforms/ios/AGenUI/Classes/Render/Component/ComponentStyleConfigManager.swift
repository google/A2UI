//
//  ComponentStyleConfigManager.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/19.
//

import Foundation
import UIKit

/// Component style configuration manager
///
/// Responsible for loading and managing component style configurations from localConfig.json
/// Uses singleton pattern, loads configurations into memory once at app startup
internal class ComponentStyleConfigManager {
    
    // MARK: - Singleton
    
    static let shared = ComponentStyleConfigManager()
    
    // MARK: - Properties
    
    /// Stores configurations for all components, keyed by componentType
    private var configs: [String: [String: Any]] = [:]
    
    // MARK: - Initialization
    
    private init() {
        loadConfigs()
    }
    
    // MARK: - Public Methods
    
    /// Gets configuration for a specified component type
    ///
    /// - Parameter componentType: Component type (e.g., "Carousel", "Button", etc.)
    /// - Returns: Configuration dictionary, or nil if not found
    func getConfig(for componentType: String) -> [String: Any]? {
        return configs[componentType]
    }
    
    // MARK: - Private Methods
    
    /// Loads configuration file from a constant string
    private func loadConfigs() {
        // Use the contents of AGenUILocalConfig.json directly as a constant string
        let configString = """
        {
          "Tabs": {
            "tab-mode": "fixed",
            "indicator-color": "#2273F7",
            "indicator-width": "48px",
            "indicator-height": "8px",
            "indicator-radius": "4px",
            "tab-font-size": "32px",
            "tab-font-size-selected": "32px",
            "tab-font-color": "#000000",
            "tab-font-color-selected": "#2273F7",
            "tab-font-weight": "normal",
            "tab-font-weight-selected": "bold"
          },
          "Modal": {
            "show-close-button": "false",
            "close-button-margin": "16px",
            "close-button-size": "72px",
            "overlay-color": "rgba(0, 0, 0, 0.5)"
          },
          "Button": {
            "disabled-opacity": "0.4"
          },
          "CheckBox": {
            "checkbox-size": "32px",
            "checkbox-background-color-selected": "#2E82FF",
            "checkbox-border-color-selected": "#2E82FF",
            "checkbox-background-color": "#00000000",
            "checkbox-border-color": "#0000001A",
            "checkbox-background-color-disabled": "#EBEBEB",
            "checkbox-border-color-disabled": "#0000001A",
            "checkbox-border-width": "3px",
            "checkbox-border-radius": "12px",
            "text-margin": "16px",
            "text-color": "#000000",
            "text-color-disabled": "#00000066",
            "text-size": "32px"
          },
          "ChoicePicker": {
            "checkbox-size": "32px",
            "checkbox-background-color-selected": "#2E82FF",
            "checkbox-border-color-selected": "#2E82FF",
            "checkbox-background-color": "#00000000",
            "checkbox-border-color": "#0000001A",
            "checkbox-border-width": "3px",
            "checkbox-border-radius": "12px",
            "text-margin": "16px",
            "text-color": "#000000",
            "text-size": "32px",
            "choice-gap": "40px"
          },
          "Slider": {
            "slider-height": "48px",
            "track-height": "4px",
            "track-corner-radius": "2px",
            "minimum-track-color": "#1A66FF",
            "maximum-track-color": "#EEF0F4",
            "thumb-outer-diameter": "48px",
            "thumb-outer-color": "#FFFFFF",
            "thumb-inner-diameter": "16px",
            "thumb-inner-color": "#1A66FF"
          },
          "AudioPlayer": {
            "size": "80px",
            "play-icon-size": "40px",
            "pause-icon-size": "35px",
            "ring-width": "8px",
            "play-bg-color": "#2273F7",
            "pause-bg-color": "#FFFFFF",
            "ring-color": "#2273F7",
            "play-icon-color": "#FFFFFF",
            "pause-icon-color": "#2273F7",
            "loading-color": "#2273F7",
            "error-bg-color": "#CCCCCC"
          },
          "DateTimeInput": {
            "compact": {
              "height": "56px",
              "font-size": "24px",
              "icon-name": "event",
              "icon-size": "24px",
              "icon-spacing": "6px",
              "selected-background-color": "#2273F714",
              "selected-text-color": "#2273F7",
              "unselected-text-color": "#000000",
              "placeholder-text": "Select Date",
              "padding-vertical": "12px",
              "padding-horizontal": "24px",
              "corner-radius": "8px",
              "popup-mask-color": "#00000066",
              "popup-corner-radius": "12px"
            },
            "wheels-2col": {
              "font-size": "28px",
              "row-spacing": "80px",
              "selected-color": "#000000",
              "unselected-color": "#00000033",
              "selected-background-color": "#FFFFFF",
              "picker-height": "368px",
              "divider-color": "#0000000F",
              "divider-height": "2px",
              "background-color": "#FFFFFF",
              "container-padding": "16px"
            },
            "wheels-3col": {
              "font-size": "36px",
              "row-spacing": "80px",
              "selected-color": "#000000",
              "unselected-color": "#00000033",
              "selected-background-color": "#FFFFFF",
              "picker-height": "428px",
              "divider-color": "#0000000F",
              "divider-height": "2px",
              "background-color": "#FFFFFF",
              "container-padding": "40px"
            },
            "wheels-5col": {
              "font-size": "28px",
              "row-spacing": "80px",
              "selected-color": "#000000",
              "unselected-color": "#00000033",
              "selected-background-color": "#FFFFFF",
              "picker-height": "368px",
              "divider-color": "#0000000F",
              "divider-height": "2px",
              "background-color": "#FFFFFF",
              "container-padding": "15px"
            }
          },
          "Carousel": {
            "indicator-dot-spacing": "8px",
            "indicator-inactive-dot-width": "6px",
            "indicator-active-dot-width": "24px",
            "indicator-container-height": "6px",
            "indicator-bottom-offset": "12px",
            "indicator-background-color": "#00000000",
            "indicator-active-dot-color": "#00000099",
            "indicator-inactive-dot-color": "#0000001A",
            "indicator-active-corner-radius": "3px",
            "image-placeholder-color": "#F2F2F7"
          },
          "Table": {
            "header-bg-color": "#EEEFF2",
            "header-font-color": "#000000",
            "header-font-size": "28px",
            "header-font-weight": "bold",
            "body-bg-color": [
              "#FFFFFF",
              "#F6F7F8"
            ],
            "body-font-color": "#000000",
            "body-font-size": "28px",
            "body-font-weight": "normal",
            "text-align": "left",
            "vertical-align": "center",
            "min-column-width": "100px",
            "max-column-width": "600px",
            "header-padding-vertical": "26px",
            "header-padding-horizontal": "32px",
            "body-padding-vertical": "24px",
            "body-padding-horizontal": "30px",
            "horizontal-scroll": "true",
            "inner-border-color": "#E1E4E9",
            "cell-padding": "32px",
            "cell-padding-vertical": "32px",
            "cell-padding-horizontal": "32px"
          }
        }
        """
        
        do {
            guard let data = configString.data(using: .utf8) else {
                Logger.shared.error("❌ Failed to convert config string to data")
                return
            }
            
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                // Safe filtering, no crash
                let typedConfigs = json.compactMapValues { $0 as? [String: Any] }
                if typedConfigs.count < json.count {
                    Logger.shared.error("ComponentStyleConfigManager: \(json.count - typedConfigs.count) keys skipped (unexpected type)")
                }
                self.configs = typedConfigs
                Logger.shared.info("[ComponentStyleConfigManager] ✅ Loaded \(configs.keys.count) component configs: \(configs.keys.joined(separator: ", "))")
            } else {
                Logger.shared.error("❌ Invalid JSON format in config string")
            }
        } catch {
            Logger.shared.error("❌ Failed to parse config string: \(error.localizedDescription)")
        }
    }
    
    // MARK: - Value Parsing Utilities
    
    /// Parses size values (e.g., "8px" -> 4.0pt)
    /// Converts px from design specs to iOS pt: pt = px / 2
    static func parseSize(_ value: String) -> CGFloat? {
        let numericString = value.replacingOccurrences(of: "px", with: "")
            .trimmingCharacters(in: .whitespaces)
        guard let pixels = Double(numericString) else { return nil }
        return CGFloat(pixels / 2.0)
    }
    
    /// Parses color values to UIColor (supports #RRGGBB, #RRGGBBAA, rgb(), rgba(), transparent)
    /// Internally calls CSSPropertyParser.parseColor() to reuse complete color parsing logic
    static func parseColorToUIColor(_ value: String) -> UIColor? {
        let result = CSSPropertyParser.parseColor(value)
        if case .color(let color) = result {
            return color
        }
        return nil
    }
    
    /// Parses time values (e.g., "300ms" -> 0.3)
    static func parseTime(_ value: String) -> TimeInterval? {
        let numericString = value.replacingOccurrences(of: "ms", with: "")
            .trimmingCharacters(in: .whitespaces)
        return Double(numericString).map { $0 / 1000.0 }
    }
    
    /// Parses content mode (e.g., "fill" -> .scaleAspectFill)
    static func parseContentMode(_ value: String) -> UIView.ContentMode {
        switch value.lowercased() {
        case "fill", "scaleaspectfill":
            return .scaleAspectFill
        case "fit", "scaleaspectfit":
            return .scaleAspectFit
        case "scaletofill":
            return .scaleToFill
        default:
            return .scaleAspectFill
        }
    }
    
    /// Loads SVG icons from AGenUIResource.bundle
    ///
    /// - Parameter name: Icon name (can include or exclude .svg suffix)
    /// - Parameter size: Icon size, defaults to 24x24
    /// - Returns: UIImage or nil
    static func loadIcon(named name: String, size: CGSize = CGSize(width: 24, height: 24)) -> UIImage? {
        Logger.shared.info("[loadIcon] Starting to load icon: \(name), size: \(size)")
        
        // 1. Try to load SVG file using SVGToImageParser
        if let image = SVGToImageParser.shared.loadSVG(named: name, size: size, tintColor: .black) {
            Logger.shared.info("[loadIcon] ✅ SVG load successful")
            return image
        }
        
        // 2. If SVG loading fails, try loading other image formats
        guard let resourceBundleURL = Bundle.main.url(forResource: "AGenUIResource", withExtension: "bundle"),
              let resourceBundle = Bundle(url: resourceBundleURL) else {
            Logger.shared.error("[loadIcon] AGenUIResource.bundle not found")
            return nil
        }
        
        for ext in ["png", "jpg", "jpeg"] {
            if let url = resourceBundle.url(forResource: name, withExtension: ext),
               let image = UIImage(contentsOfFile: url.path) {
                Logger.shared.info("[loadIcon] ✅ Image load successful: \(ext)")
                return resizeImage(image, to: size)
            }
        }
        
        Logger.shared.warning("[loadIcon] ⚠️ Icon not found: \(name)")
        return nil
    }
    
    /// Resizes image
    private static func resizeImage(_ image: UIImage, to size: CGSize) -> UIImage {
        if image.size == size {
            return image
        }
        
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { context in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }
}
