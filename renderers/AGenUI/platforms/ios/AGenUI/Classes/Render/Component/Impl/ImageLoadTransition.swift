//
//  ImageLoadTransition.swift
//  AGenUI
//
//  Created by acoder-ai-infra on 2026/3/30.
//

import UIKit

// MARK: - Protocol

/// Protocol for transition animation after image loading completes
///
/// Implement this protocol to customize any transition effect, then assign to
/// `ImageComponent.defaultTransition` for global effect.
///
/// Usage example:
/// ```swift
/// // Global transition switch
/// ImageComponent.defaultTransition = CrossDissolveTransition(duration: 0.3)
/// ImageComponent.defaultTransition = ScaleAndFadeTransition()
/// ImageComponent.defaultTransition = NoneTransition()   // Disable animation
/// ```
protocol ImageLoadTransition {
    /// Execute transition animation on imageView
    /// - Parameters:
    ///   - imageView: Target imageView (image already set to new image)
    ///   - duration: Animation duration (seconds)
    ///   - completion: Callback after animation ends
    func animate(on imageView: UIImageView,
                 duration: TimeInterval,
                 completion: (() -> Void)?)
}

// MARK: - Default parameter extension

extension ImageLoadTransition {
    func animate(on imageView: UIImageView,
                 duration: TimeInterval = 0.3,
                 completion: (() -> Void)? = nil) {
        animate(on: imageView, duration: duration, completion: completion)
    }
}

/// Magic reveal - frosted glass lens light band sweeps diagonally (top-left to bottom-right), gradually revealing image content
///
/// Effect inspired by iOS 26 Liquid Glass:
/// 1. Use CAGradientLayer mask to control progressive image reveal
/// 2. Overlay a multi-color light band simulating frosted glass refraction on superview
/// 3. Light band slightly leads reveal edge, creating "lens first, content follows" effect
/// 4. Image subtly scales from 0.98 to 1.0 throughout, creating "emerging" 3D effect
///
/// Usage example:
/// ```swift
/// ImageComponent.defaultTransition = MagicRevealTransition()
/// ImageComponent.defaultTransition = MagicRevealTransition(glassOpacity: 0.6)
/// ```
struct MagicRevealTransition: ImageLoadTransition {
    /// Peak opacity of frosted glass light band (0~1)
    let glassOpacity: CGFloat
    /// Micro scale start value (< 1.0), image scales from this value to 1.0 as light sweeps
    let initialScale: CGFloat

    init(glassOpacity: CGFloat = 0.5, initialScale: CGFloat = 0.98) {
        self.glassOpacity = glassOpacity
        self.initialScale = initialScale
    }

    func animate(on imageView: UIImageView,
                 duration: TimeInterval,
                 completion: (() -> Void)?) {
        let bounds = imageView.bounds
        guard bounds.width > 0, bounds.height > 0 else {
            completion?()
            return
        }

        imageView.alpha = 1
        // Micro scale initial state
        imageView.transform = CGAffineTransform(scaleX: initialScale, y: initialScale)

        // -- Mask layer: controls diagonal progressive image reveal --
        let maskLayer = CAGradientLayer()
        maskLayer.frame = bounds
        maskLayer.colors = [
            UIColor.black.cgColor,
            UIColor.black.cgColor,
            UIColor.clear.cgColor,
            UIColor.clear.cgColor
        ]
        maskLayer.locations = [0, 0.55, 0.85, 1.0]
        maskLayer.startPoint = CGPoint(x: -0.8, y: -0.8)
        maskLayer.endPoint = CGPoint(x: 0.2, y: 0.2)
        imageView.layer.mask = maskLayer

        // -- Frosted glass light band: simulates Liquid Glass refraction effect --
        //
        // Placed on superview to avoid mask clipping,
        // allowing light band to appear "ahead" of reveal edge (unrevealed area)
        //
        // Color composition (from revealed side to unrevealed side):
        //   Transparent to pale warm white (warm refraction edge) to bright white (glass highlight) to pale cool blue (cool refraction edge) to transparent
        // This warm-to-cool color separation simulates real glass dispersion effect
        let glassLayer = CAGradientLayer()
        let glassHost = imageView.superview ?? imageView
        let glassIsOnSuperview = (glassHost !== imageView)
        glassLayer.frame = glassIsOnSuperview ? imageView.frame : bounds
        let warmTint = UIColor(red: 1.0, green: 0.95, blue: 0.88, alpha: glassOpacity * 0.35)
        let peakWhite = UIColor.white.withAlphaComponent(glassOpacity)
        let coolTint = UIColor(red: 0.85, green: 0.92, blue: 1.0, alpha: glassOpacity * 0.3)
        let subtleEdge = UIColor.white.withAlphaComponent(glassOpacity * 0.12)
        glassLayer.colors = [
            UIColor.clear.cgColor,       // Revealed area
            subtleEdge.cgColor,          // Very faint leading light
            warmTint.cgColor,            // Warm edge refraction
            peakWhite.cgColor,           // Glass highlight peak
            coolTint.cgColor,            // Cool edge refraction
            subtleEdge.cgColor,          // Very faint trailing light
            UIColor.clear.cgColor        // Unrevealed area
        ]
        glassLayer.locations = [0, 0.25, 0.38, 0.50, 0.62, 0.75, 1.0]
        glassLayer.startPoint = CGPoint(x: -0.6, y: -0.6)
        glassLayer.endPoint = CGPoint(x: 0.4, y: 0.4)
        glassHost.layer.addSublayer(glassLayer)

        // -- Animation --
        let timing = CAMediaTimingFunction(name: .easeInEaseOut)

        CATransaction.begin()
        CATransaction.setCompletionBlock { [weak imageView] in
            imageView?.layer.mask = nil
            imageView?.transform = .identity
            glassLayer.removeFromSuperlayer()
            completion?()
        }

        // Mask animation: diagonal sweep
        addSweepAnimation(to: maskLayer,
                          toStart: CGPoint(x: 1.0, y: 1.0),
                          toEnd: CGPoint(x: 2.0, y: 2.0),
                          duration: duration, timing: timing)

        // Frosted glass light band animation: slightly ahead of mask
        addSweepAnimation(to: glassLayer,
                          toStart: CGPoint(x: 1.2, y: 1.2),
                          toEnd: CGPoint(x: 2.2, y: 2.2),
                          duration: duration, timing: timing)

        // Micro scale animation: slowly scales from initialScale to 1.0
        UIView.animate(withDuration: duration,
                       delay: 0,
                       options: .curveEaseOut) {
            imageView.transform = .identity
        }

        CATransaction.commit()
    }

    private func addSweepAnimation(to layer: CAGradientLayer,
                                   toStart: CGPoint,
                                   toEnd: CGPoint,
                                   duration: TimeInterval,
                                   timing: CAMediaTimingFunction) {
        let startAnim = CABasicAnimation(keyPath: "startPoint")
        startAnim.toValue = NSValue(cgPoint: toStart)
        startAnim.duration = duration
        startAnim.timingFunction = timing
        startAnim.fillMode = .forwards
        startAnim.isRemovedOnCompletion = false
        layer.add(startAnim, forKey: "magicSweepStart")

        let endAnim = CABasicAnimation(keyPath: "endPoint")
        endAnim.toValue = NSValue(cgPoint: toEnd)
        endAnim.duration = duration
        endAnim.timingFunction = timing
        endAnim.fillMode = .forwards
        endAnim.isRemovedOnCompletion = false
        layer.add(endAnim, forKey: "magicSweepEnd")
    }
}
