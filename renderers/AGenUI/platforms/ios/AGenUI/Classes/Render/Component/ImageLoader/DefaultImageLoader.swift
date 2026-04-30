//
//  DefaultImageLoader.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/4/9.
//

import UIKit

/// Default image loader
///
/// Features:
/// - Uses URLSession for network requests
/// - Two-level caching: NSCache memory cache + disk cache
/// - Supports cancellation by URL
public class DefaultImageLoader: ImageLoader {
    
    // MARK: - Properties
    
    private let session: URLSession
    private let memoryCache = NSCache<NSString, UIImage>()
    private let diskCache: DiskImageCache
    
    /// Task info (stores dataTask and completion)
    private struct TaskInfo {
        let dataTask: URLSessionDataTask
        let completion: (UIImage?, Bool, Error?) -> Void
    }
    private var tasks: [String: TaskInfo] = [:]
    private let lock = NSLock()
    
    // MARK: - Initialization
    
    public init(session: URLSession = .shared, diskCacheConfiguration: DiskImageCache.Configuration? = nil) {
        self.session = session
        // Use totalCostLimit (bytes) instead of countLimit for better memory control
        // 50MB limit for memory cache
        self.memoryCache.totalCostLimit = 50 * 1024 * 1024
        self.diskCache = DiskImageCache(configuration: diskCacheConfiguration ?? DiskImageCache.Configuration())
        
        // Clean expired disk cache on startup (async to avoid blocking init)
        DispatchQueue.global(qos: .background).async { [weak self] in
            self?.diskCache.cleanExpired()
        }
    }
    
    // MARK: - ImageLoader
    
    @discardableResult
    public func loadImage(
        from url: URL,
        options: [String: Any]? = nil,
        completion: @escaping (UIImage?, Bool, Error?) -> Void
    ) -> String {
        let taskId = url.absoluteString
        
        // 1. Check memory cache
        let cacheKey = url.absoluteString as NSString
        if let cachedImage = memoryCache.object(forKey: cacheKey) {
            DispatchQueue.main.async {
                completion(cachedImage, true, nil)
            }
            return taskId
        }
        
        // 2. Check disk cache and decode on background thread
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            
            // Read disk cache
            guard let diskCachedImage = self.diskCache.image(for: url) else {
                // Disk cache miss, initiate network request
                self.startNetworkTask(for: url, taskId: taskId, cacheKey: cacheKey, completion: completion)
                return
            }
            
            // Force decode image (disk stores compressed format, needs decoding)
            let decodedImage = self.decodeImage(diskCachedImage)
            
            // Write to memory cache
            self.memoryCache.setObject(decodedImage, forKey: cacheKey)
            
            DispatchQueue.main.async {
                completion(decodedImage, true, nil)
            }
        }
        
        return taskId
    }
    
    public func cancel(for taskId: String) {
        lock.lock()
        if let taskInfo = tasks.removeValue(forKey: taskId) {
            taskInfo.dataTask.cancel()
            // Callback cancellation status
            DispatchQueue.main.async {
                taskInfo.completion(nil, false, ImageLoaderError.cancelled)
            }
        }
        lock.unlock()
    }
    
    // MARK: - Private Methods
    
    /// Initiate network request
    private func startNetworkTask(
        for url: URL,
        taskId: String,
        cacheKey: NSString,
        completion: @escaping (UIImage?, Bool, Error?) -> Void
    ) {
        let task = session.dataTask(with: url) { [weak self] data, response, error in
            guard let self = self else { return }
            
            // Remove from dictionary after task completes
            self.lock.lock()
            self.tasks.removeValue(forKey: taskId)
            self.lock.unlock()
            
            if let error = error {
                // When URLSession cancels a task, error is NSURLErrorCancelled
                let nsError = error as NSError
                if nsError.code == NSURLErrorCancelled {
                    DispatchQueue.main.async {
                        completion(nil, false, ImageLoaderError.cancelled)
                    }
                } else {
                    DispatchQueue.main.async {
                        completion(nil, false, ImageLoaderError.networkError(error))
                    }
                }
                return
            }
            
            guard let data = data else {
                DispatchQueue.main.async {
                    completion(nil, false, ImageLoaderError.invalidData)
                }
                return
            }
            
            // Decode image on background thread
            DispatchQueue.global(qos: .userInitiated).async {
                guard let image = UIImage(data: data) else {
                    DispatchQueue.main.async {
                        completion(nil, false, ImageLoaderError.invalidData)
                    }
                    return
                }
                
                // Force decode image (avoid decoding on main thread)
                let decodedImage = self.decodeImage(image)
                
                // Two-level cache
                self.memoryCache.setObject(decodedImage, forKey: cacheKey)
                self.diskCache.store(decodedImage, for: url)
                
                // Callback
                DispatchQueue.main.async {
                    completion(decodedImage, false, nil)
                }
            }
        }
        
        lock.lock()
        tasks[taskId] = TaskInfo(dataTask: task, completion: completion)
        lock.unlock()
        
        task.resume()
    }
    
    // MARK: - Image Decoding
    
    /// Force decode image
    /// Decode by drawing to CGContext to avoid decoding on main thread when displayed
    private func decodeImage(_ image: UIImage) -> UIImage {
        guard let cgImage = image.cgImage else {
            return image
        }
        
        let width = cgImage.width
        let height = cgImage.height
        
        // Create bitmap context
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        guard let context = CGContext(
            data: nil,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: width * 4,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else {
            return image
        }
        
        // Draw image to context (this triggers decoding)
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))
        
        // Get decoded image from context
        if let decodedCGImage = context.makeImage() {
            return UIImage(cgImage: decodedCGImage, scale: image.scale, orientation: image.imageOrientation)
        }
        
        return image
    }
    
    // MARK: - Cache Management
    
    public func clearMemory() {
        memoryCache.removeAllObjects()
    }
    
    public func clearDisk() {
        diskCache.removeAll()
    }
}
