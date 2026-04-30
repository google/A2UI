//
//  AGenUI.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/18.
//

import Foundation

/// AGenUI SDK global entry point
///
/// Singleton responsible for global registration of theme, DesignToken, day/night mode, skills, components, and image loaders.
@objc(AGenUISDK) public class AGenUISDK: NSObject {

    private override init() {
        super.init()
    }

    // MARK: - Engine Bridge

    private static var engineBridge: AGenUIEngineBridge {
        return AGenUIEngineBridge.sharedInstance()
    }

    // MARK: - Global Configuration

    // MARK: - Theme Management

    /// Register default theme configuration
    ///
    /// Registers theme and design token configurations to customize UI component appearance.
    ///
    /// - Parameters:
    ///   - theme: Theme configuration JSON string
    ///   - designToken: Design token configuration JSON string
    /// - Returns: AGenUIError with result and message fields
    @objc public static func registerDefaultTheme(_ theme: String, designToken: String) -> AGenUIError {
        Logger.shared.debug("registerDefaultTheme - theme length: \(theme.count), designToken length: \(designToken.count)")
        
        // 1. Wrap theme with "default" key
        guard let themeData = theme.data(using: .utf8),
              let themeObject = try? JSONSerialization.jsonObject(with: themeData) else {
            Logger.shared.error("Failed to parse theme JSON")
            return AGenUIError(result: false, message: "Invalid theme JSON format")
        }
        
        let wrappedTheme: [String: Any] = ["default": themeObject]
        guard let wrappedData = try? JSONSerialization.data(withJSONObject: wrappedTheme),
              let wrappedThemeJson = String(data: wrappedData, encoding: .utf8) else {
            Logger.shared.error("Failed to serialize wrapped theme JSON")
            return AGenUIError(result: false, message: "Failed to wrap theme JSON")
        }
        
        // 2. Register theme
        let themeResult = engineBridge.loadThemeConfig(wrappedThemeJson)
        if !themeResult {
            Logger.shared.error("Theme registration failed")
            return AGenUIError(result: false, message: "Theme registration failed")
        }
        
        // 3. Register DesignToken
        let designTokenResult = engineBridge.loadDesignTokenConfig(designToken)
        if !designTokenResult {
            Logger.shared.error("DesignToken registration failed")
            return AGenUIError(result: false, message: "DesignToken registration failed")
        }
        
        Logger.shared.info("Default theme registered successfully")
        return AGenUIError(result: true, message: "Success")
    }

    /// Set day/night mode
    ///
    /// - Parameter mode: "light" or "dark"
    @objc public static func setDayNightMode(_ mode: String) {
        Logger.shared.debug("setDayNightMode: \(mode)")
        guard mode == "light" || mode == "dark" else {
            Logger.shared.warning("setDayNightMode: invalid mode '\(mode)', expected 'light' or 'dark'")
            return
        }
        engineBridge.setDayNightMode(mode)
        Logger.shared.info("Day/Night mode set to: \(mode)")
    }

    // MARK: - Component Registration

    /// Register a custom component factory
    ///
    /// - Parameters:
    ///   - type: Component type name
    ///   - creator: Factory closure to create the component
    /// - Note: Overwrites if the component type already exists
    @objc public static func registerComponent(_ type: String, creator: @escaping (String, [String: Any]) -> Component) {
        Logger.shared.debug("registerComponent: \(type)")
        ComponentRegister.shared.register(type, creator: creator)
        Logger.shared.info("Custom component registered: \(type)")
    }
    
    @objc public static func unRegisterComponent(_ type: String) {
        Logger.shared.debug("unregisterComponent: \(type)")
        ComponentRegister.shared.unregister(type)
        Logger.shared.info("Custom component unregistered: \(type)")
    }

    // MARK: - Image Loader Registration

    /// Register a global image loader
    ///
    /// - Parameter loader: A loader instance implementing the ImageLoader protocol
    @objc(registerImageLoader:)
    public static func registerImageLoader(_ loader: ImageLoader) {
        Logger.shared.debug("registerImageLoader: \(type(of: loader))")
        ImageLoaderConfiguration.shared.loader = loader
        Logger.shared.info("ImageLoader registered: \(type(of: loader))")
    }
    
    // MARK: - FunctionCall Management

    /// Register a platform function with the engine
    ///
    /// - Parameter function: Object implementing the AGenUIFunctionProtocol
    @objc(registerFunction:)
    public static func registerFunction(_ function: Function) {
        let config = function.functionConfig
        let name = config.name
        guard !name.isEmpty else {
            Logger.shared.error("registerFunction: function name is empty")
            return
        }
        
        let configJson = config.toJSON()
        Logger.shared.debug("registerFunction - name: \(name)")
        
        // Create bridge callback that delegates to the function instance
        let bridgeCallback: AGenUIFunctionCallCallback = { [weak function] argsJson in
            
            guard let function = function else {
                return "{\"status\":\"Error\",\"error\":\"Function deallocated\"}"
            }
            
            let result = function.execute(argsJson)
            
            let resultDict: [String: Any] = [
                "status": result.result ? "Success" : "Error",
                "data": result.value
            ]
            
            guard let resultData = try? JSONSerialization.data(withJSONObject: resultDict),
                  let resultJson = String(data: resultData, encoding: .utf8) else {
                return "{\"status\":\"Error\",\"error\":\"Failed to serialize result\"}"
            }
            
            return resultJson
        }
        
        engineBridge.registerFunction(name, config: configJson, callback: bridgeCallback)
        Logger.shared.info("FunctionCall registered: \(name)")
    }

    /// Unregister a previously registered platform function
    ///
    /// - Parameter name: Function name to unregister
    @objc(unregisterFunctionWithName:)
    public static func unregisterFunction(_ name: String) {
        guard !name.isEmpty else {
            Logger.shared.error("unregisterFunction: name is empty")
            return
        }
        
        engineBridge.unregisterFunction(name)
        Logger.shared.info("FunctionCall unregistered: \(name)")
    }

    // MARK: - Version Info

    /// Get the AGenUI SDK version
    ///
    /// - Returns: Version string
    @objc public static func getVersion() -> String {
        return "2.0.0"
    }
}

// MARK: - AGenUIError

@objc public class AGenUIError: NSObject {
    /// Whether the operation succeeded
    @objc public let result: Bool
    /// Error message
    @objc public let message: String
    
    @objc public init(result: Bool, message: String) {
        self.result = result
        self.message = message
    }
}


