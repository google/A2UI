//
//  Logger.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/18.
//

import Foundation

/// AGenUI SDK Logger
///
/// Provides unified log output interface with log switch control and level filtering
class Logger {
    
    // MARK: - Log Level
    
    /// Log level
    enum Level: Int, Comparable {
        case verbose = 0  // Verbose log
        case debug = 1    // Debug log
        case info = 2     // Info log
        case warning = 3  // Warning log
        case error = 4    // Error log
        
        static func < (lhs: Level, rhs: Level) -> Bool {
            return lhs.rawValue < rhs.rawValue
        }
    }
    
    // MARK: - Singleton
    
    /// Singleton instance
    static let shared = Logger()
    
    // MARK: - Properties
    
    /// Whether log output is enabled
    /// Default is disabled in both DEBUG and Release modes
    var isEnabled: Bool = {
        #if DEBUG
        return false
        #else
        return false
        #endif
    }()
    
    /// Minimum log level
    /// Only logs with level greater than or equal to this will be output
    var minimumLevel: Level = .debug
    
    /// Whether to show file name and line number
    var showFileInfo: Bool = true
    
    // MARK: - Initialization
    
    private init() {}
    
    // MARK: - Public Methods
    
    /// Output log
    ///
    /// - Parameters:
    ///   - message: Log message
    ///   - level: Log level
    ///   - file: File name (auto captured)
    ///   - function: Function name (auto captured)
    ///   - line: Line number (auto captured)
    func log(_ message: String, 
                   level: Level = .debug,
                   file: String = #file, 
                   function: String = #function, 
                   line: Int = #line) {
        guard isEnabled, level >= minimumLevel else { return }
        
        let prefix = levelPrefix(level)
        
        if showFileInfo {
            let fileName = (file as NSString).lastPathComponent
            print("[\(prefix)] [\(fileName):\(line)] \(message)")
        } else {
            print("[\(prefix)] \(message)")
        }
    }
    
    // MARK: - Private Methods
    
    private func levelPrefix(_ level: Level) -> String {
        switch level {
        case .verbose: return "VERBOSE"
        case .debug: return "DEBUG"
        case .info: return "INFO"
        case .warning: return "WARNING"
        case .error: return "ERROR"
        }
    }
}

// MARK: - Convenience Methods

extension Logger {
    
    /// Output verbose log
    func verbose(_ message: String, 
                       file: String = #file, 
                       function: String = #function, 
                       line: Int = #line) {
        log(message, level: .verbose, file: file, function: function, line: line)
    }
    
    /// Output debug log
    func debug(_ message: String, 
                     file: String = #file, 
                     function: String = #function, 
                     line: Int = #line) {
        log(message, level: .debug, file: file, function: function, line: line)
    }
    
    /// Output info log
    func info(_ message: String, 
                    file: String = #file, 
                    function: String = #function, 
                    line: Int = #line) {
        log(message, level: .info, file: file, function: function, line: line)
    }
    
    /// Output warning log
    func warning(_ message: String, 
                       file: String = #file, 
                       function: String = #function, 
                       line: Int = #line) {
        log(message, level: .warning, file: file, function: function, line: line)
    }
    
    /// Output error log
    func error(_ message: String, 
                     file: String = #file, 
                     function: String = #function, 
                     line: Int = #line) {
        log(message, level: .error, file: file, function: function, line: line)
    }
}

// MARK: - Objective-C Bridge Support

extension Logger {
    
    /// Objective-C compatible log method
    @objc static func logFromObjC(_ message: String, levelRaw: Int) {
        guard let level = Level(rawValue: levelRaw) else { return }
        shared.log(message, level: level)
    }
}
