package com.amap.agenui.render.image;

import android.graphics.drawable.Drawable;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Global configuration for the A2UI image loader (singleton).
 *
 * <h3>Usage</h3>
 * <pre>{@code
 * // Use the default implementation (no configuration needed)
 *
 * // Replace with a custom loader
 * ImageLoaderConfig.getInstance().setLoader(new GlideImageLoader());
 *
 * // Set a global default placeholder (optional)
 * ImageLoaderConfig.getInstance().setDefaultPlaceholder(drawable);
 * }</pre>
 *
 */
public final class ImageLoaderConfig {

    private static volatile ImageLoaderConfig sInstance;

    @NonNull
    private ImageLoader loader = new DefaultImageLoader();

    @Nullable
    private Drawable defaultPlaceholder;

    private ImageLoaderConfig() {
    }

    /**
     * Returns the singleton instance.
     *
     * @return ImageLoaderConfig singleton
     */
    public static ImageLoaderConfig getInstance() {
        if (sInstance == null) {
            synchronized (ImageLoaderConfig.class) {
                if (sInstance == null) {
                    sInstance = new ImageLoaderConfig();
                }
            }
        }
        return sInstance;
    }

    /**
     * Replaces the image loader. Recommended to call in {@code Application.onCreate()}.
     *
     * @param loader Custom loader, must not be null
     */
    public void setLoader(@NonNull ImageLoader loader) {
        this.loader = loader;
    }

    /**
     * Returns the current image loader.
     *
     * @return Current loader instance
     */
    @NonNull
    public ImageLoader getLoader() {
        return loader;
    }

    /**
     * Sets the global default placeholder drawable.
     *
     * @param placeholder Placeholder Drawable, may be null
     */
    public void setDefaultPlaceholder(@Nullable Drawable placeholder) {
        this.defaultPlaceholder = placeholder;
    }

    /**
     * Returns the global default placeholder drawable.
     *
     * @return Placeholder Drawable, may be null
     */
    @Nullable
    public Drawable getDefaultPlaceholder() {
        return defaultPlaceholder;
    }
}
