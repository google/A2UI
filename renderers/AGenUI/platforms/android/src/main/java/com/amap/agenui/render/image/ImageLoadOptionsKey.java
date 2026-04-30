package com.amap.agenui.render.image;

/**
 * Built-in image loading option keys for the SDK.
 *
 * <p>Used together with the {@code options} parameter of {@link ImageLoader#loadImage}.
 * Callers pass key-value pairs via {@code Map<String, Object>}, and the loader uses
 * them for optimizations such as downsampling and cache strategy.
 *
 * <p>Host apps may also define custom keys to pass private parameters to a custom
 * loader without modifying the interface signature.
 *
 * <h3>Usage example</h3>
 * <pre>{@code
 * Map<String, Object> options = new HashMap<>();
 * options.put(ImageLoadOptionsKey.WIDTH, 200f);
 * options.put(ImageLoadOptionsKey.HEIGHT, 200f);
 * loader.loadImage(url, options, callback);
 * }</pre>
 *
 */
public final class ImageLoadOptionsKey {

    private ImageLoadOptionsKey() {
        // Not instantiable
    }

    /**
     * Target width (Float). The loader may use this for downsampling to save memory.
     */
    public static final String WIDTH = "width";

    /**
     * Target height (Float). The loader may use this for downsampling to save memory.
     */
    public static final String HEIGHT = "height";

    /**
     * Component ID (String). Identifies the component that initiated the load request.
     */
    public static final String COMPONENT_ID = "componentId";

    /**
     * Surface ID (String). Identifies the render surface that initiated the load request.
     */
    public static final String SURFACE_ID = "surfaceId";
}
