package com.amap.agenuiplayground.component.impl;

import android.content.Context;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;

import com.airbnb.lottie.LottieAnimationView;
import com.airbnb.lottie.LottieDrawable;
import com.amap.agenui.render.component.A2UIComponent;

import java.util.Map;

/**
 * Lottie component implementation - conforms to the A2UI v0.9 protocol
 * <p>
 * Supported properties:
 * - url:      URL of the Lottie JSON file (required; supports DynamicString)
 * - autoPlay: Whether to auto-play (optional, default true)
 * - loop:     Whether to loop (optional, default true)
 * - variant:  Size hint (optional: icon, small, medium, large)
 * <p>
 * Supported URL formats:
 * - Network URL:  http://... or https://...
 * - Local resource: res://animation_name (loaded from raw resources)
 * - Local file:   file:///path/to/animation.json
 * <p>
 * Usage example:
 * {
 * "id": "loading_animation",
 * "component": "Lottie",
 * "url": "https://assets9.lottiefiles.com/packages/lf20_loading.json",
 * "autoPlay": true,
 * "loop": true,
 * "variant": "medium"
 * }
 *
 */
public class LottieComponent extends A2UIComponent {

    private static final String TAG = "LottieComponent";

    private Context context;
    private LottieAnimationView lottieView;

    public LottieComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Lottie");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
        Log.d(TAG, "🎬 [CONSTRUCTOR] Lottie " + id + " created with properties: " + properties);
    }

    @Override
    protected View onCreateView(Context context) {
        Log.d(TAG, "🎬 [CREATE_VIEW] Lottie " + getId() + " creating view");

        lottieView = new LottieAnimationView(context);

        // Set LayoutParams
        lottieView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        int width = context.getResources().getDisplayMetrics().widthPixels;
        int height = context.getResources().getDisplayMetrics().heightPixels;
        lottieView.setMaxWidth(width);
        lottieView.setMaxHeight(height);
        lottieView.setScaleType(ImageView.ScaleType.FIT_CENTER);
        lottieView.setAdjustViewBounds(true);

        // Default settings
        lottieView.setRepeatCount(LottieDrawable.INFINITE); // Loop by default

        // Apply initial properties
        if (!properties.isEmpty()) {
            onUpdateProperties(properties);
        }

        Log.d(TAG, "🎬 [CREATE_VIEW] Lottie " + getId() + " view created");
        return lottieView;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        if (lottieView == null) {
            Log.w(TAG, "⚠️ [UPDATE_PROPS] Lottie " + getId() + " - lottieView is null");
            return;
        }

        Log.d(TAG, "🎬 [UPDATE_PROPS] Lottie " + getId() + " updating properties: " + properties);

        // Handle URL (required property)
        if (properties.containsKey("url")) {
            String url = extractStringValue(properties.get("url"));
            Log.d(TAG, "🎬 [UPDATE_PROPS] Lottie " + getId() + " loading animation from: " + url);
            loadAnimation(url);
        }

        // Handle autoPlay (optional, default true)
        boolean autoPlay = true;
        if (properties.containsKey("autoPlay")) {
            autoPlay = Boolean.parseBoolean(String.valueOf(properties.get("autoPlay")));
            Log.d(TAG, "🎬 [UPDATE_PROPS] Lottie " + getId() + " autoPlay: " + autoPlay);
        }

        // Handle loop (optional, default true)
        boolean loop = true;
        if (properties.containsKey("loop")) {
            loop = Boolean.parseBoolean(String.valueOf(properties.get("loop")));
            Log.d(TAG, "🎬 [UPDATE_PROPS] Lottie " + getId() + " loop: " + loop);
        }

        // Set loop mode
        if (loop) {
            lottieView.setRepeatCount(LottieDrawable.INFINITE);
        } else {
            lottieView.setRepeatCount(0);
        }

        // Start animation if auto-play is enabled
        if (autoPlay) {
            lottieView.playAnimation();
            Log.d(TAG, "🎬 [UPDATE_PROPS] Lottie " + getId() + " animation started");
        }
    }

    /**
     * Load Lottie animation
     */
    private void loadAnimation(String url) {
        if (url == null || url.isEmpty()) {
            Log.w(TAG, "⚠️ [LOAD_ANIM] Lottie " + getId() + " - url is null or empty");
            return;
        }

        try {
            if (url.startsWith("http://") || url.startsWith("https://")) {
                // Network URL - use setAnimationFromUrl
                Log.d(TAG, "🌐 [LOAD_ANIM] Lottie " + getId() + " loading from network: " + url);
                lottieView.setAnimationFromUrl(url);
            } else if (url.startsWith("res://")) {
                // Local resource - load from raw resources
                String resName = url.substring(6); // Remove "res://" prefix
                Log.d(TAG, "📦 [LOAD_ANIM] Lottie " + getId() + " loading from resource: " + resName);
                int resId = context.getResources().getIdentifier(
                        resName, "raw", context.getPackageName()
                );
                if (resId != 0) {
                    lottieView.setAnimation(resId);
                } else {
                    Log.e(TAG, "❌ [LOAD_ANIM] Lottie " + getId() + " - resource not found: " + resName);
                }
            } else if (url.startsWith("file://")) {
                // Local file
                String filePath = url.substring(7); // Remove "file://" prefix
                Log.d(TAG, "📁 [LOAD_ANIM] Lottie " + getId() + " loading from file: " + filePath);
                lottieView.setAnimation(new java.io.FileInputStream(filePath), null);
            } else {
                // Try loading as a resource name
                Log.d(TAG, "📦 [LOAD_ANIM] Lottie " + getId() + " trying as resource name: " + url);
                int resId = context.getResources().getIdentifier(
                        url, "raw", context.getPackageName()
                );
                if (resId != 0) {
                    lottieView.setAnimation(resId);
                } else {
                    // Last attempt: try as a network URL
                    Log.d(TAG, "🌐 [LOAD_ANIM] Lottie " + getId() + " trying as network URL: " + url);
                    lottieView.setAnimationFromUrl(url);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ [LOAD_ANIM] Lottie " + getId() + " - failed to load animation: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Extract string value (supports DynamicString)
     */
    private String extractStringValue(Object value) {
        if (value instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> valueMap = (Map<String, Object>) value;

            // Support literalString
            if (valueMap.containsKey("literalString")) {
                return String.valueOf(valueMap.get("literalString"));
            }

            // Support path (data binding)
            if (valueMap.containsKey("path")) {
                return String.valueOf(valueMap.get("path"));
            }
        }

        return String.valueOf(value);
    }

    /**
     * Play animation (public method)
     */
    public void play() {
        if (lottieView != null) {
            lottieView.playAnimation();
            Log.d(TAG, "▶️ [PLAY] Lottie " + getId() + " animation started");
        }
    }

    /**
     * Pause animation (public method)
     */
    public void pause() {
        if (lottieView != null) {
            lottieView.pauseAnimation();
            Log.d(TAG, "⏸️ [PAUSE] Lottie " + getId() + " animation paused");
        }
    }

    /**
     * Stop animation (public method)
     */
    public void stop() {
        if (lottieView != null) {
            lottieView.cancelAnimation();
            Log.d(TAG, "⏹️ [STOP] Lottie " + getId() + " animation stopped");
        }
    }

    @Override
    protected void onDestroy() {
        if (lottieView != null) {
            lottieView.cancelAnimation();
            lottieView = null;
        }
        Log.d(TAG, "🗑️ [DESTROY] Lottie " + getId() + " destroyed");
    }
}
