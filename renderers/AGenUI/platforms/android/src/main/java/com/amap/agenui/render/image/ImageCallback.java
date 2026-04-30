package com.amap.agenui.render.image;

import androidx.annotation.MainThread;
import androidx.annotation.NonNull;

/**
 * Callback interface for image loading results.
 *
 * <p>All methods are called on the <b>main thread</b>; implementors do not need to switch threads manually.
 *
 */
public interface ImageCallback {

    /**
     * Image loaded successfully.
     *
     * @param result Load result containing the Drawable, cache status, and image format
     */
    @MainThread
    void onSuccess(@NonNull ImageLoadResult result);

    /**
     * Image loading failed.
     *
     * @param error Failure reason, including error type and details
     */
    @MainThread
    void onFailure(@NonNull ImageLoaderError error);
}
