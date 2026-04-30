//
//  AGenUIFunctionProtocol.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/4/22.
//

import Foundation

// MARK: - FunctionConfig

/// SDK-internal function configuration
@objc public class FunctionConfig: NSObject {
    
    /// Function name (unique identifier for registration)
    @objc public let name: String
    
    @objc public init(name: String) {
        self.name = name
    }
    
    /// Serialize config to JSON string for engine registration
    @objc public func toJSON() -> String {
        let dict: [String: Any] = ["name": name]
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let json = String(data: data, encoding: .utf8) else {
            return "{}"
        }
        return json
    }
}

// MARK: - AGenUIFunctionResult

/// SDK-internal function execution result
@objc public class FunctionResult: NSObject {
    
    /// Whether the function call succeeded
    @objc public let result: Bool
    
    /// Additional data returned by the function call
    @objc public let value: [String: Any]
    
    @objc public init(result: Bool, value: [String: Any]) {
        self.result = result
        self.value = value
    }
    
    /// Create a success result
    @objc public static func success(value: [String: Any]) -> FunctionResult {
        return FunctionResult(result: true, value: value)
    }
    
    /// Create a failure result
    @objc public static func failure(value: [String: Any]) -> FunctionResult {
        return FunctionResult(result: false, value: value)
    }
}

// MARK: - AGenUIFunctionProtocol

/// SDK-internal protocol for platform function implementations
///
/// Bridge layer should adapt external function objects to this protocol
/// before passing them to AGenUI for registration.
@objc public protocol Function: AnyObject {
    
    /// Function configuration
    @objc var functionConfig: FunctionConfig { get }
    
    /// Execute the function synchronously
    /// - Parameter params: JSON string containing the function parameters
    /// - Returns: Execution result with success/failure status and return value
    @objc func execute(_ params: String) -> FunctionResult
}
