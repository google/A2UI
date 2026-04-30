package com.amap.agenui.render.utils;

/**
 * Image loading animation manager.
 * <p>
 * Manages the global default image loading transition animation.
 * <p>
 * Usage example:
 * ```java
 * // Set the global default animation to MagicReveal
 * ImageTransitionManager.setDefaultTransition(new MagicRevealTransition());
 *
 * // Set the animation duration
 * ImageTransitionManager.setDefaultDuration(1200);
 *
 * // Disable animation
 * ImageTransitionManager.setDefaultTransition(new NoneTransition());
 * ```
 */
public class ImageTransitionManager {

    private static ImageTransition defaultTransition = new MagicRevealTransition();
    private static long defaultDuration = 1000; // Default: 1 second

    /**
     * Returns the default transition animation.
     */
    public static ImageTransition getDefaultTransition() {
        return defaultTransition;
    }

    /**
     * Sets the default transition animation.
     *
     * @param transition Transition animation implementation
     */
    public static void setDefaultTransition(ImageTransition transition) {
        if (transition != null) {
            defaultTransition = transition;
        }
    }

    /**
     * Returns the default animation duration in milliseconds.
     */
    public static long getDefaultDuration() {
        return defaultDuration;
    }

    /**
     * Sets the default animation duration in milliseconds.
     *
     * @param duration Animation duration
     */
    public static void setDefaultDuration(long duration) {
        defaultDuration = duration;
    }
}
