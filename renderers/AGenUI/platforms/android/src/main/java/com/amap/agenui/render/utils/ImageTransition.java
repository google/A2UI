package com.amap.agenui.render.utils;

import android.widget.ImageView;

/**
 * Transition animation interface invoked after an image finishes loading.
 * <p>
 * Implement this interface to define any custom transition effect, then set it
 * as the global default via ImageTransitionManager.setDefaultTransition().
 * <p>
 * Usage example:
 * ```java
 * // Switch the global animation
 * ImageTransitionManager.setDefaultTransition(new MagicRevealTransition());
 * ImageTransitionManager.setDefaultTransition(new NoneTransition());   // Disable animation
 * ```
 */
public interface ImageTransition {
    /**
     * Runs the transition animation on an ImageView.
     *
     * @param imageView  Target ImageView (image has already been loaded at this point)
     * @param duration   Animation duration in milliseconds
     * @param completion Callback invoked when the animation ends
     */
    void animate(ImageView imageView, long duration, Runnable completion);

    /**
     * Default animation duration in milliseconds.
     */
    default long getDefaultDuration() {
        return 800;
    }
}
