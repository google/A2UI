package com.amap.agenuiplayground;

import android.os.Handler;
import android.os.Looper;
import android.view.Choreographer;

import java.util.ArrayList;
import java.util.List;

/**
 * Performance Monitor
 * Monitor FPS, Memory and other performance metrics
 * 
 */
public class PerformanceMonitor {
    
    private static final String TAG = "PerformanceMonitor";
    private static final int UPDATE_INTERVAL_MS = 500; // Update every 500ms
    private static final int AVG_WINDOW_SIZE = 10; // Calculate average over 10 samples
    
    private PerformanceCallback callback;
    private Handler handler;
    private Choreographer choreographer;
    
    // FPS tracking
    private long lastFrameTime = 0;
    private int frameCount = 0;
    private int currentFps = 0;
    
    // Average FPS tracking
    private List<Integer> fpsHistory = new ArrayList<>();
    private int avgFps = 0;
    
    // Memory tracking
    private float currentMemoryMB = 0f;
    
    private boolean isMonitoring = false;
    
    public interface PerformanceCallback {
        void onPerformanceUpdate(int fps, float memoryMB, int avgFps);
    }
    
    public PerformanceMonitor(PerformanceCallback callback) {
        this.callback = callback;
        this.handler = new Handler(Looper.getMainLooper());
        this.choreographer = Choreographer.getInstance();
    }
    
    /**
     * Start monitoring
     */
    public void start() {
        if (isMonitoring) {
            return;
        }
        
        isMonitoring = true;
        lastFrameTime = System.currentTimeMillis();
        frameCount = 0;
        fpsHistory.clear();
        
        // Start FPS monitoring
        choreographer.postFrameCallback(frameCallback);
        
        // Start periodic updates
        handler.post(updateRunnable);
    }
    
    /**
     * Stop monitoring
     */
    public void stop() {
        isMonitoring = false;
        choreographer.removeFrameCallback(frameCallback);
        handler.removeCallbacks(updateRunnable);
    }
    
    /**
     * Frame callback for FPS calculation
     */
    private final Choreographer.FrameCallback frameCallback = new Choreographer.FrameCallback() {
        @Override
        public void doFrame(long frameTimeNanos) {
            if (!isMonitoring) {
                return;
            }
            
            frameCount++;
            long currentTime = System.currentTimeMillis();
            
            // Calculate FPS every second
            if (currentTime - lastFrameTime >= 1000) {
                currentFps = frameCount;
                frameCount = 0;
                lastFrameTime = currentTime;
                
                // Update FPS history for average calculation
                fpsHistory.add(currentFps);
                if (fpsHistory.size() > AVG_WINDOW_SIZE) {
                    fpsHistory.remove(0);
                }
                
                // Calculate average FPS
                int sum = 0;
                for (int fps : fpsHistory) {
                    sum += fps;
                }
                avgFps = fpsHistory.isEmpty() ? 0 : sum / fpsHistory.size();
            }
            
            // Continue monitoring
            choreographer.postFrameCallback(this);
        }
    };
    
    /**
     * Periodic update runnable
     */
    private final Runnable updateRunnable = new Runnable() {
        @Override
        public void run() {
            if (!isMonitoring) {
                return;
            }
            
            // Update memory info
            updateMemoryInfo();
            
            // Notify callback
            if (callback != null) {
                callback.onPerformanceUpdate(currentFps, currentMemoryMB, avgFps);
            }
            
            // Schedule next update
            handler.postDelayed(this, UPDATE_INTERVAL_MS);
        }
    };
    
    /**
     * Update memory information
     */
    private void updateMemoryInfo() {
        Runtime runtime = Runtime.getRuntime();
        long usedMemory = runtime.totalMemory() - runtime.freeMemory();
        currentMemoryMB = usedMemory / 1024 / 1024;
    }
    
    /**
     * Get current FPS
     */
    public int getCurrentFps() {
        return currentFps;
    }
    
    /**
     * Get current memory usage in MB
     */
    public float getCurrentMemoryMB() {
        return currentMemoryMB;
    }
    
    /**
     * Get average FPS
     */
    public int getAvgFps() {
        return avgFps;
    }
    
    /**
     * Check if monitoring is active
     */
    public boolean isMonitoring() {
        return isMonitoring;
    }
}