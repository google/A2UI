package com.amap.agenui.render.image;

import android.graphics.drawable.Drawable;

import androidx.annotation.NonNull;

/**
 * Image loading result.
 *
 * <p>Encapsulates the result of a successful image load, including the Drawable,
 * cache status, and image format.
 */
public final class ImageLoadResult {

    /**
     * Image format enumeration.
     */
    public enum Format {
        /**
         * Unknown format
         */
        UNKNOWN,
        /** Static bitmap (jpg / png / webp, etc.) */
        BITMAP,
        /** Animated GIF */
        GIF,
        /** SVG vector image */
        SVG,
        /** Lottie animation */
        LOTTIE
    }

    /** The loaded image */
    @NonNull
    public final Drawable drawable;

    /** Whether the image was served from cache */
    public final boolean isFromCache;

    /** Image format (reserved field) */
    @NonNull
    public final Format format;

    public ImageLoadResult(@NonNull Drawable drawable, boolean isFromCache) {
        this(drawable, isFromCache, Format.UNKNOWN);
    }

    public ImageLoadResult(@NonNull Drawable drawable, boolean isFromCache, @NonNull Format format) {
        this.drawable = drawable;
        this.isFromCache = isFromCache;
        this.format = format;
    }

    /**
     * Creates a result with BITMAP format.
     */
    public static ImageLoadResult bitmap(@NonNull Drawable drawable, boolean isFromCache) {
        return new ImageLoadResult(drawable, isFromCache, Format.BITMAP);
    }

    /**
     * Creates a result with GIF format.
     */
    public static ImageLoadResult gif(@NonNull Drawable drawable, boolean isFromCache) {
        return new ImageLoadResult(drawable, isFromCache, Format.GIF);
    }
}
