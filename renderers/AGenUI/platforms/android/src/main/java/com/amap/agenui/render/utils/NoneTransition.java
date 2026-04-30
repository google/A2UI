package com.amap.agenui.render.utils;

import android.widget.ImageView;

/**
 * No animation - displays the image immediately after loading.
 * <p>
 * Usage example:
 * ```java
 * ImageTransitionManager.setDefaultTransition(new NoneTransition());
 * ```
 */
public class NoneTransition implements ImageTransition {

    @Override
    public void animate(ImageView imageView, long duration, Runnable completion) {
        // Show immediately, no animation
        imageView.setAlpha(1f);
        imageView.setScaleX(1f);
        imageView.setScaleY(1f);

        if (completion != null) {
            completion.run();
        }
    }

    @Override
    public long getDefaultDuration() {
        return 0;
    }
}
