package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Outline;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewOutlineProvider;
import android.widget.ImageView;

import androidx.annotation.NonNull;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.image.ImageCallback;
import com.amap.agenui.render.image.ImageLoadOptionsKey;
import com.amap.agenui.render.image.ImageLoadResult;
import com.amap.agenui.render.image.ImageLoaderConfig;
import com.amap.agenui.render.image.ImageLoaderError;
import com.amap.agenui.render.style.StyleHelper;
import com.amap.agenui.render.utils.ImageTransition;
import com.amap.agenui.render.utils.ImageTransitionManager;
import com.amap.agenui.render.utils.ShimmerTransition;

import java.util.HashMap;
import java.util.Map;

/**
 * Image component implementation - compliant with A2UI v0.9 protocol
 *
 * Supported properties:
 * - url: image URL (DynamicString)
 * - fit: scale mode (contain, cover, fill, none, scale-down)
 * - variant: size hint (icon, avatar, smallFeature, mediumFeature, largeFeature, header)
 *
 */
public class ImageComponent extends A2UIComponent {

    private static final String TAG = "ImageComponent";

    private Context context;

    private BorderImageView imageView;

    private float aspectRatio = 0f; // 0 means aspect ratio is not used

    // Animation toggle - controlled by Surface
    private boolean animationEnabled = true;

    // Shimmer animation management
    private ShimmerTransition shimmerTransition;
    private ShimmerTransition.ShimmerView currentShimmerView;

    // Currently loading URL, used for cancellation
    private String currentLoadUrl;

    public ImageComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Image");
        Log.d(TAG, "[ImageComponent] Constructor called - id: " + id);
        Log.d(TAG, "[ImageComponent] Constructor - properties: " + properties);

        // Store only the ApplicationContext to avoid holding a strong reference to Activity and causing leaks
        this.context = context.getApplicationContext();
        if (properties != null) {
            this.properties.putAll(properties);
            Log.d(TAG, "[ImageComponent] Constructor - properties saved to base class");
        }
    }

    @Override
    protected View onCreateView(Context context) {
        Log.d(TAG, "[ImageComponent] onCreateView called - id: " + getId());
        Log.d(TAG, "[ImageComponent] onCreateView - properties: " + properties);

        // Use the passed Activity context to create the View (ensures correct Theme)
        imageView = new BorderImageView(context);

        // Default scale type
        imageView.setScaleType(ImageView.ScaleType.CENTER_CROP);

        // Important: if properties already has attributes, apply them immediately here
        if (!properties.isEmpty()) {
            Log.d(TAG, "[ImageComponent] onCreateView - applying properties immediately");
            onUpdateProperties(properties);
        } else {
            Log.w(TAG, "[ImageComponent] onCreateView - properties is EMPTY!");
        }

        Log.d(TAG, "[ImageComponent] onCreateView - BorderImageView created");
        return imageView;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        Log.d(TAG, "[ImageComponent] onUpdateProperties called - id: " + getId());
        Log.d(TAG, "[ImageComponent] onUpdateProperties - properties: " + properties);
        Log.d(TAG, "[ImageComponent] onUpdateProperties - imageView is null: " + (imageView == null));

        if (imageView == null) {
            Log.w(TAG, "[ImageComponent] onUpdateProperties - imageView is NULL, skipping update");
            return;
        }

        // Update image URL (A2UI v0.9 protocol: url)
        if (properties.containsKey("url")) {
            String url = extractStringValue(properties.get("url"));
            Log.d(TAG, "[ImageComponent] onUpdateProperties - loading image url: " + url);
            loadImage(url);
        } else {
            Log.w(TAG, "[ImageComponent] onUpdateProperties - NO 'url' property found!");
        }

        // Update scale mode (A2UI v0.9 protocol: fit)
        if (properties.containsKey("fit")) {
            String fit = String.valueOf(properties.get("fit"));
            Log.d(TAG, "[ImageComponent] onUpdateProperties - setting fit: " + fit);
            imageView.setScaleType(parseFit(fit));
        }

        // Handle styles (read from styles)
        if (properties.containsKey("styles")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> styles = (Map<String, Object>) properties.get("styles");
            if (styles != null) {
                // Parse style properties
                int radiusPx = 0;
                int borderWidth = 0;
                int borderColor = Color.TRANSPARENT;

                // Handle border-radius
                if (styles.containsKey("border-radius")) {
                    Log.d(TAG, "[ImageComponent] onUpdateProperties - border-radius: " + styles.get("border-radius"));
                    radiusPx = StyleHelper.parseDimension(styles.get("border-radius"), context);
                    Log.d(TAG, "[ImageComponent] Parsed border-radius: " + radiusPx + "px");
                }

                // Handle border-width
                if (styles.containsKey("border-width")) {
                    Log.d(TAG, "[ImageComponent] onUpdateProperties - border-width: " + styles.get("border-width"));
                    borderWidth = StyleHelper.parseDimension(styles.get("border-width"), context);
                    Log.d(TAG, "[ImageComponent] Parsed border-width: " + borderWidth + "px");
                }

                // Handle border-color
                if (styles.containsKey("border-color")) {
                    Log.d(TAG, "[ImageComponent] onUpdateProperties - border-color: " + styles.get("border-color"));
                    borderColor = StyleHelper.parseColor(styles.get("border-color"));
                    Log.d(TAG, "[ImageComponent] Parsed border-color: #" + Integer.toHexString(borderColor));
                }

                // Apply border-radius and border
                if (radiusPx > 0 || borderWidth > 0) {
                    applyBorderAndCorners(radiusPx, borderWidth, borderColor);
                    Log.d(TAG, "[ImageComponent] Applied border and corners - radius: " +
                            radiusPx + "px, borderWidth: " + borderWidth + "px");
                }

                // Handle aspect-ratio
                if (styles.containsKey("aspect-ratio")) {
                    String aspectRatioStr = String.valueOf(styles.get("aspect-ratio"));
                    float aspectRatio = parseAspectRatio(aspectRatioStr);
                    Log.d(TAG, "[ImageComponent] aspect-ratio string: " + aspectRatioStr +
                            ", parsed value: " + aspectRatio);

                    if (aspectRatio > 0) {
                        imageView.setAspectRatio(aspectRatio);
                        Log.d(TAG, "[ImageComponent] Applied aspect ratio from styles: " +
                                aspectRatio);
                    }
                }
            }
        }
    }

    /**
     * Load the image.
     * Uses a pluggable ImageLoader to load network images and local resources.
     * Integrates Shimmer loading animation and transition animation.
     */
    private void loadImage(String src) {
        Log.d(TAG, "[ImageComponent] loadImage called - src: " + src);

        if (src == null || src.isEmpty()) {
            Log.w(TAG, "[ImageComponent] loadImage - src is null or empty, clearing image");
            imageView.setImageDrawable(null);
            return;
        }

        // Cancel the previous loading task
        if (currentLoadUrl != null) {
            ImageLoaderConfig.getInstance().getLoader().cancel(currentLoadUrl);
        }
        currentLoadUrl = src;

        // Start Shimmer animation based on animation toggle
        if (animationEnabled) {
            if (shimmerTransition == null) {
                shimmerTransition = new ShimmerTransition();
            }
            currentShimmerView = shimmerTransition.startShimmer(imageView);
        }

        // Delegate to the pluggable Loader, build options
        Map<String, Object> options = buildLoadOptions();
        ImageLoaderConfig.getInstance().getLoader().loadImage(src, options, new ImageCallback() {
            @Override
            public void onSuccess(@NonNull ImageLoadResult result) {
                currentLoadUrl = null;
                imageView.setImageDrawable(result.drawable);
                onImageLoadComplete(result.isFromCache);
            }

            @Override
            public void onFailure(@NonNull ImageLoaderError error) {
                currentLoadUrl = null;
                Log.e(TAG, "[ImageComponent] Image load failed: " + error.getMessage());
                if (shimmerTransition != null) {
                    shimmerTransition.stopShimmer();
                }
                // Set the global default placeholder
                Drawable placeholder = ImageLoaderConfig.getInstance().getDefaultPlaceholder();
                if (placeholder != null) {
                    imageView.setImageDrawable(placeholder);
                }
            }
        });
    }

    /**
     * Build image loading options based on component properties and layout information.
     *
     * <p>When the layout explicitly specifies width and height, pass options to the loader
     * for downsampling optimization.
     *
     * @return options map, or null if no valid options are present
     */
    private Map<String, Object> buildLoadOptions() {
        Map<String, Object> options = new HashMap<>();

        // Extract width and height from properties
        Object widthObj = properties.get("width");
        if (widthObj instanceof Number) {
            options.put(ImageLoadOptionsKey.WIDTH, ((Number) widthObj).floatValue());
        }
        Object heightObj = properties.get("height");
        if (heightObj instanceof Number) {
            options.put(ImageLoadOptionsKey.HEIGHT, ((Number) heightObj).floatValue());
        }

        // Component ID
        options.put(ImageLoadOptionsKey.COMPONENT_ID, getId());

        return options.size() > 1 ? options : null; // don't pass options if only componentId is present
    }

    /**
     * Called when image loading is complete.
     *
     * @param isFromCache whether the image came from cache (skip entrance animation on cache hit)
     */
    private void onImageLoadComplete(boolean isFromCache) {
        // Remove the Shimmer overlay
        if (shimmerTransition != null) {
            shimmerTransition.stopShimmer();
        }

        // Execute reveal animation based on animation toggle (skip on cache hit)
        if (animationEnabled && !isFromCache) {
            executeTransition();
        }
    }

    /**
     * Cancel the loading task when the component is destroyed.
     */
    public void onDestroy() {
        if (currentLoadUrl != null) {
            ImageLoaderConfig.getInstance().getLoader().cancel(currentLoadUrl);
            currentLoadUrl = null;
        }
    }

    /**
     * Execute the transition animation after image loading completes.
     */
    private void executeTransition() {
        ImageTransition transition = ImageTransitionManager.getDefaultTransition();
        long duration = ImageTransitionManager.getDefaultDuration();

        if (transition != null) {
            transition.animate(imageView, duration, null);
        }
    }

    /**
     * Set animation toggle.
     *
     * @param enabled true to enable animation, false to disable
     */
    public void setAnimationEnabled(boolean enabled) {
        this.animationEnabled = enabled;
    }

    /**
     * Extract string value (supports DynamicString)
     */
    private String extractStringValue(Object value) {
        if (value instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> valueMap = (Map<String, Object>) value;
            if (valueMap.containsKey("literalString")) {
                return String.valueOf(valueMap.get("literalString"));
            }
            if (valueMap.containsKey("path")) {
                return "";
            }
        }
        return String.valueOf(value);
    }

    /**
     * Parse scale mode.
     * A2UI v0.9 protocol values: contain, cover, fill, none, scale-down
     */
    private ImageView.ScaleType parseFit(String fit) {
        switch (fit.toLowerCase()) {
            case "contain":
                return ImageView.ScaleType.FIT_CENTER;
            case "cover":
                return ImageView.ScaleType.CENTER_CROP;
            case "fill":
                return ImageView.ScaleType.FIT_XY;
            case "none":
                return ImageView.ScaleType.CENTER;
            case "scale-down":
                // scale-down is similar to contain but does not enlarge the image
                return ImageView.ScaleType.CENTER_INSIDE;
            default:
                return ImageView.ScaleType.FIT_CENTER;
        }
    }

    /**
     * Parse an aspect-ratio string.
     * Supported formats:
     * - "4 / 3" - ratio format
     * - "16 / 9" - ratio format
     * - "1.333" - decimal format
     *
     * @param aspectRatioStr aspect-ratio string
     * @return aspect ratio value (width/height), 0 if parsing fails
     */
    private float parseAspectRatio(String aspectRatioStr) {
        if (aspectRatioStr == null || aspectRatioStr.trim().isEmpty()) {
            return 0f;
        }

        try {
            aspectRatioStr = aspectRatioStr.trim();

            // Check if it contains "/" (ratio format)
            if (aspectRatioStr.contains("/")) {
                String[] parts = aspectRatioStr.split("/");
                if (parts.length == 2) {
                    float width = Float.parseFloat(parts[0].trim());
                    float height = Float.parseFloat(parts[1].trim());
                    if (height > 0) {
                        return width / height;
                    }
                }
            } else {
                // Parse directly as a decimal
                return Float.parseFloat(aspectRatioStr);
            }
        } catch (NumberFormatException e) {
            Log.e(TAG, "[ImageComponent] Failed to parse aspect-ratio: " + aspectRatioStr, e);
        }

        return 0f;
    }

    /**
     * Apply border and corner effects.
     *
     * @param radiusPx    corner radius (px)
     * @param borderWidth border width (px)
     * @param borderColor border color
     */
    private void applyBorderAndCorners(final float radiusPx, int borderWidth, int borderColor) {
        // Set corner radius
        imageView.setCornerRadius(radiusPx);

        // Set border
        imageView.setBorder(borderWidth, borderColor);

        // If there are rounded corners, set corner clipping
        if (radiusPx > 0) {
            imageView.setOutlineProvider(new ViewOutlineProvider() {
                @Override
                public void getOutline(View view, Outline outline) {
                    outline.setRoundRect(0, 0, view.getWidth(), view.getHeight(), radiusPx);
                }
            });
            imageView.setClipToOutline(true);
        } else {
            imageView.setClipToOutline(false);
        }

        Log.d(TAG, "[ImageComponent] Applied border and corners - radius: " +
                radiusPx + "px, borderWidth: " + borderWidth + "px, borderColor: #" +
                Integer.toHexString(borderColor));
    }

    /**
     * Custom BorderImageView - supports border, rounded corners, and aspect ratio
     */
    private static class BorderImageView extends ImageView {
        private float aspectRatio = 0f;

        // Border-related properties
        private Paint borderPaint;
        private int borderWidth = 0;
        private int borderColor = Color.TRANSPARENT;
        private float cornerRadius = 0f;

        // Path for drawing the rounded border
        private Path borderPath;
        private RectF borderRect;

        public BorderImageView(Context context) {
            super(context);
            init();
        }

        private void init() {
            // Initialize border paint
            borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            borderPaint.setStyle(Paint.Style.STROKE);

            borderPath = new Path();
            borderRect = new RectF();
        }

        /**
         * Set aspect ratio.
         *
         * @param ratio aspect ratio value (width/height), 0 means no aspect ratio constraint
         */
        public void setAspectRatio(float ratio) {
            this.aspectRatio = ratio;
            requestLayout();
        }

        /**
         * Set border.
         *
         * @param width border width (px)
         * @param color border color
         */
        public void setBorder(int width, int color) {
            this.borderWidth = width;
            this.borderColor = color;

            if (width > 0) {
                borderPaint.setStrokeWidth(width);
                borderPaint.setColor(color);
            }

            invalidate(); // redraw
        }

        /**
         * Set corner radius.
         *
         * @param radius corner radius (px)
         */
        public void setCornerRadius(float radius) {
            this.cornerRadius = radius;
            invalidate(); // redraw
        }

        @Override
        protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {

            int widthMode = MeasureSpec.getMode(widthMeasureSpec);
            int widthSize = MeasureSpec.getSize(widthMeasureSpec);
            int heightMode = MeasureSpec.getMode(heightMeasureSpec);
            int heightSize = MeasureSpec.getSize(heightMeasureSpec);
            boolean isWidthExactly = widthMode == MeasureSpec.EXACTLY || getLayoutParams().width != ViewGroup.LayoutParams.WRAP_CONTENT;
            boolean isHeightExactly = heightMode == MeasureSpec.EXACTLY || getLayoutParams().height != ViewGroup.LayoutParams.WRAP_CONTENT;

            if (aspectRatio > 0 && (isWidthExactly || isHeightExactly)) {
                if (isWidthExactly && !isHeightExactly) {
                    int height = (int) (widthSize / aspectRatio);
                    setMeasuredDimension(widthSize, height);
                } else if (!isWidthExactly && isHeightExactly) {
                    int width = (int) (heightSize * aspectRatio);
                    setMeasuredDimension(width, heightSize);
                } else {
                    super.onMeasure(widthMeasureSpec, heightMeasureSpec);
                }
            } else {
                super.onMeasure(widthMeasureSpec, heightMeasureSpec);
            }
        }

        @Override
        protected void onDraw(Canvas canvas) {
            // 1. Draw image content first (will be clipped by rounded corners)
            super.onDraw(canvas);

            // 2. Draw border (around the image)
            if (borderWidth > 0 && borderColor != Color.TRANSPARENT) {
                // Calculate the border rectangle (border center line position)
                // Half of the border is on the inside, half on the outside
                float halfBorder = borderWidth / 2f;
                borderRect.set(
                        halfBorder,
                        halfBorder,
                        getWidth() - halfBorder,
                        getHeight() - halfBorder
                );

                // Draw rounded rectangle border
                if (cornerRadius > 0) {
                    canvas.drawRoundRect(borderRect, cornerRadius, cornerRadius, borderPaint);
                } else {
                    canvas.drawRect(borderRect, borderPaint);
                }
            }
        }
    }

}
