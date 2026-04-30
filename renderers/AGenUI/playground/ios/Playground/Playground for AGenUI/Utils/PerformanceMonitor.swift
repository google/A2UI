//
//  PerformanceMonitor.swift
//  Playground
//
//  Created by acoder-ai-infra on 2026/3/22.
//

import UIKit
import QuartzCore

/// Performance monitor utility class
class PerformanceMonitor {
    
    // MARK: - Singleton
    
    static let shared = PerformanceMonitor()
    
    // MARK: - Properties
    
    private var displayLink: CADisplayLink?
    private var cpuMemoryTimer: Timer?
    private var lastTimestamp: CFTimeInterval = 0
    private var frameCount: Int = 0
    
    /// Current FPS
    private(set) var currentFPS: Int = 60
    
    /// Current CPU usage (0-100)
    private(set) var currentCPU: Double = 0
    
    /// Current memory usage (MB)
    private(set) var currentMemory: Double = 0
    
    /// Performance data update callback
    var onPerformanceUpdate: ((Int, Double, Double) -> Void)?
    
    // MARK: - Initialization
    
    private init() {}
    
    // MARK: - Public Methods
    
    /// Start monitoring
    func startMonitoring() {
        // Prevent duplicate start
        guard displayLink == nil else { return }
        
        // Start FPS monitoring
        displayLink = CADisplayLink(target: self, selector: #selector(displayLinkTick))
        displayLink?.add(to: .main, forMode: .common)
        
        // Start CPU and memory monitoring timer
        cpuMemoryTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.updateCPUAndMemory()
        }
    }
    
    /// Stop monitoring
    func stopMonitoring() {
        displayLink?.invalidate()
        displayLink = nil
        
        cpuMemoryTimer?.invalidate()
        cpuMemoryTimer = nil
    }
    
    // MARK: - Private Methods
    
    @objc private func displayLinkTick(displayLink: CADisplayLink) {
        if lastTimestamp == 0 {
            lastTimestamp = displayLink.timestamp
            return
        }
        
        frameCount += 1
        let delta = displayLink.timestamp - lastTimestamp
        
        if delta >= 1.0 {
            currentFPS = Int(Double(frameCount) / delta)
            frameCount = 0
            lastTimestamp = displayLink.timestamp
            
            // Trigger callback
            notifyUpdate()
        }
    }
    
    private func updateCPUAndMemory() {
        currentCPU = getCPUUsage()
        currentMemory = getMemoryUsage()
        
        // Trigger callback
        notifyUpdate()
    }
    
    private func notifyUpdate() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            self.onPerformanceUpdate?(self.currentFPS, self.currentCPU, self.currentMemory)
        }
    }
    
    // MARK: - CPU Usage
    
    private func getCPUUsage() -> Double {
        var totalUsageOfCPU: Double = 0.0
        var threadsList: thread_act_array_t?
        var threadsCount = mach_msg_type_number_t(0)
        let threadsResult = withUnsafeMutablePointer(to: &threadsList) {
            $0.withMemoryRebound(to: thread_act_array_t?.self, capacity: 1) {
                task_threads(mach_task_self_, $0, &threadsCount)
            }
        }
        
        if threadsResult == KERN_SUCCESS, let threadsList = threadsList {
            for index in 0..<threadsCount {
                var threadInfo = thread_basic_info()
                var threadInfoCount = mach_msg_type_number_t(THREAD_INFO_MAX)
                let infoResult = withUnsafeMutablePointer(to: &threadInfo) {
                    $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                        thread_info(threadsList[Int(index)], thread_flavor_t(THREAD_BASIC_INFO), $0, &threadInfoCount)
                    }
                }
                
                guard infoResult == KERN_SUCCESS else {
                    continue
                }
                
                let threadBasicInfo = threadInfo
                if threadBasicInfo.flags & TH_FLAGS_IDLE == 0 {
                    totalUsageOfCPU += (Double(threadBasicInfo.cpu_usage) / Double(TH_USAGE_SCALE)) * 100.0
                }
            }
            
            vm_deallocate(mach_task_self_, vm_address_t(UInt(bitPattern: threadsList)), vm_size_t(Int(threadsCount) * MemoryLayout<thread_t>.stride))
        }
        
        return totalUsageOfCPU
    }
    
    // MARK: - Memory Usage
    
    private func getMemoryUsage() -> Double {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4
        
        let kerr: kern_return_t = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }
        
        if kerr == KERN_SUCCESS {
            return Double(info.resident_size) / 1024.0 / 1024.0 // Convert to MB
        }
        
        return 0
    }
}
