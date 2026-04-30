package com.amap.agenui.render.image;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.Map;

/**
 * Pluggable image loader interface for A2UI.
 *
 * <h3>Implementation contract</h3>
 * <ul>
 *   <li>All callbacks must be triggered on the <b>main thread</b>.</li>
 *   <li>{@link #loadImage} returns a requestId; pass it to {@link #cancel} to abort a specific request.</li>
 *   <li>No callbacks are triggered after cancellation.</li>
 * </ul>
 *
 * <h3>Injection</h3>
 * <pre>{@code
 * // Application.onCreate()
 * ImageLoaderConfig.getInstance().setLoader(new GlideImageLoader());
 * }</pre>
 *
 */
public interface ImageLoader {

    /**
     * Loads an image with options.
     *
     * @param url      Image URL (http / https / file:// / res:// etc.)
     * @param options  Load options; keys defined in {@link ImageLoadOptionsKey}, may be null
     * @param callback Result callback (main thread)
     * @return requestId identifying this load task; pass to {@link #cancel} to abort it
     */
    String loadImage(@NonNull String url, @Nullable Map<String, Object> options,
                     @NonNull ImageCallback callback);

    /**
     * Loads an image without options.
     *
     * <p>Equivalent to {@code loadImage(url, null, callback)}.
     *
     * @param url      Image URL
     * @param callback Result callback (main thread)
     * @return requestId identifying this load task; pass to {@link #cancel} to abort it
     */
    default String loadImage(@NonNull String url, @NonNull ImageCallback callback) {
        return loadImage(url, null, callback);
    }

    /**
     * Cancels the load task identified by the given requestId.
     * No callback is triggered after cancellation.
     *
     * @param requestId the requestId returned by {@link #loadImage}
     */
    void cancel(@NonNull String requestId);

    /**
     * Clears all cached images (memory and disk).
     * Default implementation is a no-op; override if the underlying loader supports cache clearing.
     */
    default void clearCache() {
    }
}
