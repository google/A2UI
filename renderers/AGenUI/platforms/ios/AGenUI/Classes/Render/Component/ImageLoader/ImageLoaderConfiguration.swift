//
//  ImageLoaderConfiguration.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/4/9.
//

import UIKit

/// Image loader global configuration
class ImageLoaderConfiguration {
    
    /// Singleton
    static let shared = ImageLoaderConfiguration()
    
    /// Default placeholder color #E5E5EA
    private static let defaultPlaceholderColor = UIColor(red: 0xE5/255.0, green: 0xE5/255.0, blue: 0xEA/255.0, alpha: 1.0)
    
    /// Global default placeholder image (1x1 solid color image)
    static let defaultPlaceholderImage: UIImage = {
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: 1, height: 1))
        return renderer.image { context in
            defaultPlaceholderColor.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 1, height: 1))
        }
    }()
    
    /// Current image loader
    /// - Replace this property to take effect globally
    /// - Default uses DefaultImageLoader (based on URLSession + memory cache)
    var loader: ImageLoader
    
    /// Default placeholder image
    /// - Default uses 1x1 solid color image (#E5E5EA)
    /// - Can be replaced with custom placeholder image
    var defaultPlaceholder: UIImage?
    
    /// Private initialization
    private init() {
        self.loader = DefaultImageLoader()
        self.defaultPlaceholder = Self.defaultPlaceholderImage
    }
}
