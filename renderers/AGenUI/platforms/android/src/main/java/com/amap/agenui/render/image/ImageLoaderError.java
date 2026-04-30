package com.amap.agenui.render.image;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Image loading error type.
 *
 * <p>Provides error categories to allow callers to handle failures differently.
 */
public final class ImageLoaderError extends Exception {

    /**
     * Error type enumeration.
     */
    public enum Type {
        /**
         * Invalid URL
         */
        INVALID_URL,
        /** Network error */
        NETWORK_ERROR,
        /** Invalid data (cannot be decoded as an image) */
        INVALID_DATA,
        /** Image decompression failed */
        DECOMPRESSION_FAILED,
        /** Task was cancelled */
        CANCELLED,
        /** path:// resource loading failed */
        PATH_RESOURCE_ERROR
    }

    /** Error type */
    @NonNull
    public final Type type;

    /** Original exception (may be null) */
    @Nullable
    public final Throwable cause;

    public ImageLoaderError(@NonNull Type type, @NonNull String message) {
        super(message);
        this.type = type;
        this.cause = null;
    }

    public ImageLoaderError(@NonNull Type type, @NonNull String message, @Nullable Throwable cause) {
        super(message, cause);
        this.type = type;
        this.cause = cause;
    }

    /**
     * Returns whether this is a cancellation error.
     *
     * @return true if the task was cancelled
     */
    public boolean isCancelled() {
        return type == Type.CANCELLED;
    }

    /**
     * Creates an invalid URL error.
     */
    public static ImageLoaderError invalidUrl(@NonNull String url) {
        return new ImageLoaderError(Type.INVALID_URL, "Invalid URL: " + url);
    }

    /**
     * Creates a network error.
     */
    public static ImageLoaderError networkError(@NonNull String url, @Nullable Throwable cause) {
        return new ImageLoaderError(Type.NETWORK_ERROR, "Network error: " + url, cause);
    }

    /**
     * Creates an invalid data error.
     */
    public static ImageLoaderError invalidData(@NonNull String url) {
        return new ImageLoaderError(Type.INVALID_DATA, "Invalid image data: " + url);
    }

    /**
     * Creates an invalid data error.
     */
    public static ImageLoaderError invalidData(@NonNull String url, @Nullable Throwable cause) {
        return new ImageLoaderError(Type.INVALID_DATA, "Invalid image data: " + url, cause);
    }

    /**
     * Creates a cancellation error.
     */
    public static ImageLoaderError cancelled() {
        return new ImageLoaderError(Type.CANCELLED, "Image loading was cancelled");
    }

    /**
     * Creates a path:// resource loading error.
     */
    public static ImageLoaderError pathResourceError(@NonNull String url) {
        return new ImageLoaderError(Type.PATH_RESOURCE_ERROR, "Failed to load path:// resource: " + url);
    }

    /**
     * Creates a path:// resource loading error.
     */
    public static ImageLoaderError pathResourceError(@NonNull String url, @Nullable Throwable cause) {
        return new ImageLoaderError(Type.PATH_RESOURCE_ERROR, "Failed to load path:// resource: " + url, cause);
    }
}
