//
//  ImageLoaderError.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/4/9.
//

import Foundation

/// Image loading error
public enum ImageLoaderError: Error, LocalizedError, Equatable {
    case invalidURL(String)
    case networkError(Error)
    case invalidData
    case decompressionFailed
    case cancelled                // Task was cancelled
    
    // MARK: - Equatable
    
    public static func == (lhs: ImageLoaderError, rhs: ImageLoaderError) -> Bool {
        switch (lhs, rhs) {
        case (.invalidURL(let l), .invalidURL(let r)):
            return l == r
        case (.networkError, .networkError):
            return true
        case (.invalidData, .invalidData):
            return true
        case (.decompressionFailed, .decompressionFailed):
            return true
        case (.cancelled, .cancelled):
            return true
        default:
            return false
        }
    }
    
    // MARK: - LocalizedError
    
    public var errorDescription: String? {
        switch self {
        case .invalidURL(let urlString):
            return "Invalid URL: \(urlString)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .invalidData:
            return "Invalid image data"
        case .decompressionFailed:
            return "Image decompression failed"
        case .cancelled:
            return "Image loading was cancelled"
        }
    }
    
    // MARK: - Convenience
    
    /// Whether this is a cancellation error (convenience property)
    public var isCancelled: Bool {
        if case .cancelled = self { return true }
        return false
    }
}
