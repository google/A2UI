//
//  DiskImageCache.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/4/9.
//

import UIKit
import CryptoKit

/// Disk image cache
///
/// Features:
/// - Stored in system Caches directory, may be auto-cleaned by system
/// - Supports expiration policy and capacity limits
/// - Thread-safe
public class DiskImageCache {
    
    // MARK: - Configuration
    
    /// Cache configuration
    public struct Configuration {
        /// Cache directory name
        public var directoryName: String = "com.a2ui.imageCache"
        
        /// Maximum cache capacity (bytes), default 100MB
        public var maxDiskSize: UInt = 100 * 1024 * 1024
        
        /// Cache expiration time (seconds), default 7 days
        public var expirationInterval: TimeInterval = 7 * 24 * 60 * 60
        
        public init() {}
    }
    
    // MARK: - Properties
    
    private let configuration: Configuration
    private let fileManager = FileManager.default
    private let cacheDirectory: URL
    private let lock = NSLock()
    
    // MARK: - Initialization
    
    public init(configuration: Configuration = Configuration()) {
        self.configuration = configuration
        
        // Create cache directory
        let cachesDirectory = fileManager.urls(for: .cachesDirectory, in: .userDomainMask).first ?? fileManager.temporaryDirectory

        cacheDirectory = cachesDirectory.appendingPathComponent(configuration.directoryName)
        
        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
    
    // MARK: - Public Methods
    
    /// Store image to disk
    /// - Parameters:
    ///   - image: Image
    ///   - url: Image URL (used as cache key)
    public func store(_ image: UIImage, for url: URL) {
        guard let data = image.pngData() ?? image.jpegData(compressionQuality: 0.8) else { return }
        
        let fileURL = cacheFileURL(for: url)
        let metaURL = metaFileURL(for: url)
        
        lock.lock()
        defer { lock.unlock() }
        
        // Write image data
        do {
            try data.write(to: fileURL)
        } catch {
            Logger.shared.error("DiskImageCache: failed to write image data for \(url.absoluteString) - \(error.localizedDescription)")
            return
        }
        
        // Write metadata (timestamp)
        let metadata: [String: Any] = [
            "timestamp": Date().timeIntervalSince1970,
            "url": url.absoluteString
        ]
        do {
            try (metadata as NSDictionary).write(to: metaURL)
        } catch {
            Logger.shared.error("DiskImageCache: failed to write metadata for \(url.absoluteString) - \(error.localizedDescription)")
            // Clean up the image file since metadata is missing
            try? fileManager.removeItem(at: fileURL)
        }
    }
    
    /// Read image from disk
    /// - Parameter url: Image URL
    /// - Returns: Cached image, or nil if not found or expired
    public func image(for url: URL) -> UIImage? {
        let fileURL = cacheFileURL(for: url)
        let metaURL = metaFileURL(for: url)
        
        lock.lock()
        defer { lock.unlock() }
        
        // Check if file exists
        guard fileManager.fileExists(atPath: fileURL.path) else {
            return nil
        }
        
        // Check if expired (in image retrieval)
        if isExpired(metaURL: metaURL) {
            try? fileManager.removeItem(at: fileURL)
            try? fileManager.removeItem(at: metaURL)
            return nil
        }
        
        // Read image
        guard let data = try? Data(contentsOf: fileURL),
              let image = UIImage(data: data) else {
            return nil
        }
        
        return image
    }
    
    /// Remove cache for specified URL
    public func remove(for url: URL) {
        let fileURL = cacheFileURL(for: url)
        let metaURL = metaFileURL(for: url)
        
        lock.lock()
        defer { lock.unlock() }
        
        try? fileManager.removeItem(at: fileURL)
        try? fileManager.removeItem(at: metaURL)
    }
    
    /// Clear all cache
    public func removeAll() {
        lock.lock()
        defer { lock.unlock() }
        
        try? fileManager.removeItem(at: cacheDirectory)
        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
    
    /// Clean expired cache and cache exceeding capacity
    public func cleanExpired() {
        lock.lock()
        defer { lock.unlock() }
        
        guard let files = try? fileManager.contentsOfDirectory(at: cacheDirectory, includingPropertiesForKeys: [.fileSizeKey, .creationDateKey]) else {
            return
        }
        
        var totalSize: UInt = 0
        var validFiles: [(URL, URL, Date, UInt)] = [] // (fileURL, metaURL, date, size)
        
        for fileURL in files where fileURL.pathExtension == "data" {
            let metaURL = fileURL.deletingPathExtension().appendingPathExtension("meta")
            
            // Check if expired
            if isExpired(metaURL: metaURL) {
                try? fileManager.removeItem(at: fileURL)
                try? fileManager.removeItem(at: metaURL)
                continue
            }
            
            // Get file size
            let size = fileSize(at: fileURL)
            totalSize += size
            
            // Get creation time
            let date = creationDate(at: metaURL) ?? Date.distantPast
            validFiles.append((fileURL, metaURL, date, size))
        }
        
        // If exceeding capacity, delete oldest by time
        if totalSize > configuration.maxDiskSize {
            let sorted = validFiles.sorted { $0.2 < $1.2 }
            var currentSize = totalSize
            
            for (fileURL, metaURL, _, size) in sorted {
                try? fileManager.removeItem(at: fileURL)
                try? fileManager.removeItem(at: metaURL)
                currentSize -= size
                
                if currentSize <= configuration.maxDiskSize {
                    break
                }
            }
        }
    }
    
    // MARK: - Private Methods
    
    /// Generate cache file URL
    private func cacheFileURL(for url: URL) -> URL {
        let fileName = md5(url.absoluteString)
        return cacheDirectory.appendingPathComponent(fileName).appendingPathExtension("data")
    }
    
    /// Generate metadata file URL
    private func metaFileURL(for url: URL) -> URL {
        let fileName = md5(url.absoluteString)
        return cacheDirectory.appendingPathComponent(fileName).appendingPathExtension("meta")
    }
    
    /// MD5 hash
    private func md5(_ string: String) -> String {
        let digest = Insecure.MD5.hash(data: Data(string.utf8))
        return digest.map { String(format: "%02hhx", $0) }.joined()
    }
    
    /// Check if expired
    private func isExpired(metaURL: URL) -> Bool {
        guard let metadata = NSDictionary(contentsOf: metaURL),
              let timestamp = metadata["timestamp"] as? TimeInterval else {
            return true
        }
        
        let age = Date().timeIntervalSince1970 - timestamp
        return age > configuration.expirationInterval
    }
    
    /// Get file size
    private func fileSize(at url: URL) -> UInt {
        guard let attributes = try? fileManager.attributesOfItem(atPath: url.path),
              let size = attributes[.size] as? UInt else {
            return 0
        }
        return size
    }
    
    /// Get creation time
    private func creationDate(at metaURL: URL) -> Date? {
        guard let metadata = NSDictionary(contentsOf: metaURL),
              let timestamp = metadata["timestamp"] as? TimeInterval else {
            return nil
        }
        return Date(timeIntervalSince1970: timestamp)
    }
}
