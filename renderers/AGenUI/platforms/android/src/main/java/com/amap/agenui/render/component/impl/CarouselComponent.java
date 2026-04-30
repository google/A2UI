package com.amap.agenui.render.component.impl;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Outline;
import android.graphics.drawable.ColorDrawable;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewOutlineProvider;
import android.view.animation.DecelerateInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import androidx.viewpager2.widget.ViewPager2;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.style.ComponentStyleConfig;
import com.amap.agenui.render.style.StyleHelper;
import com.squareup.picasso.Picasso;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Carousel component implementation - image slideshow component
 * <p>
 * Supported properties:
 * - content:       Array of image URLs (required)
 * - autoplay:      Whether to auto-advance (default false)
 * - autoplaySpeed: Auto-advance interval in milliseconds (default 3000)
 * - draggable:     Whether drag-to-switch is enabled (default false)
 * <p>
 * Features:
 * - Smooth slideshow based on ViewPager2
 * - Page indicator (horizontal bar) displayed inside the image at the bottom
 * - Supports auto-play and manual drag
 * - Loads network images using Picasso
 *
 */
public class CarouselComponent extends A2UIComponent {

    private static final String TAG = "CarouselComponent";

    private Context context;

    // UI components
    private FrameLayout rootLayout;
    private ViewPager2 viewPager;
    private LinearLayout indicatorLayout;
    private CarouselAdapter adapter;

    // Auto-play
    private Handler autoPlayHandler;
    private Runnable autoPlayRunnable;
    private boolean autoplay = false;
    private int autoplaySpeed = 3000;

    // Configuration
    private boolean draggable = false;
    private List<String> imageUrls = new ArrayList<>();

    // Indicator dots
    private List<View> indicatorDots = new ArrayList<>();

    // Style configuration
    private int indicatorDotSpacing;
    private int indicatorInactiveDotWidth;
    private int indicatorActiveDotWidth;
    private int indicatorContainerHeight;
    private int indicatorBottomOffset;
    private int indicatorBackgroundColor;
    private int indicatorActiveDotColor;
    private int indicatorInactiveDotColor;
    private int indicatorActiveCornerRadius;
    private int indicatorAnimationDuration;
    private int imagePlaceholderColor;

    public CarouselComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Carousel");
        Log.d(TAG, "Constructor called - id: " + id);

        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        Log.d(TAG, "onCreateView called - id: " + getId());

        // Apply style configuration
        applyCarouselStyles();

        // Create root container
        rootLayout = new FrameLayout(context);
        rootLayout.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                dpToPx(200) // Default height 200dp
        ));

        // Create ViewPager2
        viewPager = new ViewPager2(context);
        viewPager.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));

        // Apply rounded corners
        applyRoundedCorners(viewPager, 7);

        rootLayout.addView(viewPager);

        // Create indicator container
        indicatorLayout = new LinearLayout(context);
        indicatorLayout.setOrientation(LinearLayout.HORIZONTAL);
        indicatorLayout.setGravity(Gravity.CENTER);

        // Indicator layout params: centered at the bottom
        FrameLayout.LayoutParams indicatorParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                indicatorContainerHeight
        );
        indicatorParams.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        indicatorParams.bottomMargin = indicatorBottomOffset;
        indicatorLayout.setLayoutParams(indicatorParams);

        // Indicator background color
        indicatorLayout.setPadding(dpToPx(8), dpToPx(4), dpToPx(8), dpToPx(4));
        indicatorLayout.setBackgroundColor(indicatorBackgroundColor);

        // Apply rounded corners to the indicator
        applyRoundedCorners(indicatorLayout, 12);

        rootLayout.addView(indicatorLayout);

        // Initialize Handler
        autoPlayHandler = new Handler(Looper.getMainLooper());

        // If properties already contain attributes, apply them immediately
        if (!properties.isEmpty()) {
            onUpdateProperties(properties);
        }

        return rootLayout;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        Log.d(TAG, "onUpdateProperties called - id: " + getId());

        if (viewPager == null) {
            Log.w(TAG, "viewPager is NULL, skipping update");
            return;
        }

        // Update image URL list
        if (properties.containsKey("content")) {
            Object contentObj = properties.get("content");
            if (contentObj instanceof List) {
                imageUrls.clear();
                List<?> contentList = (List<?>) contentObj;
                for (Object item : contentList) {
                    if (item instanceof String) {
                        imageUrls.add((String) item);
                    }
                }
                Log.d(TAG, "Updated image URLs: " + imageUrls.size() + " images");

                // Update adapter
                updateAdapter();

                // Update indicator
                updateIndicatorDots();
            }
        }

        // Update auto-play configuration
        if (properties.containsKey("autoplay")) {
            Object autoplayObj = properties.get("autoplay");
            if (autoplayObj instanceof Boolean) {
                autoplay = (Boolean) autoplayObj;
            } else if (autoplayObj instanceof String) {
                autoplay = Boolean.parseBoolean((String) autoplayObj);
            }
            Log.d(TAG, "autoplay: " + autoplay);

            // Start or stop auto-play based on configuration
            if (autoplay) {
                startAutoPlay();
            } else {
                stopAutoPlay();
            }
        }

        // Update auto-play speed
        if (properties.containsKey("autoplaySpeed")) {
            Object speedObj = properties.get("autoplaySpeed");
            if (speedObj instanceof Number) {
                autoplaySpeed = ((Number) speedObj).intValue();
            } else if (speedObj instanceof String) {
                try {
                    autoplaySpeed = Integer.parseInt((String) speedObj);
                } catch (NumberFormatException e) {
                    Log.w(TAG, "Invalid autoplaySpeed: " + speedObj);
                }
            }
            Log.d(TAG, "autoplaySpeed: " + autoplaySpeed);

            // If auto-play is running, restart it to apply the new speed
            if (autoplay) {
                stopAutoPlay();
                startAutoPlay();
            }
        }

        // Update draggable configuration
        if (properties.containsKey("draggable")) {
            Object draggableObj = properties.get("draggable");
            if (draggableObj instanceof Boolean) {
                draggable = (Boolean) draggableObj;
            } else if (draggableObj instanceof String) {
                draggable = Boolean.parseBoolean((String) draggableObj);
            }
            viewPager.setUserInputEnabled(draggable);
            Log.d(TAG, "draggable: " + draggable);
        }
    }

    /**
     * Update adapter
     */
    private void updateAdapter() {
        if (adapter == null) {
            adapter = new CarouselAdapter();
            viewPager.setAdapter(adapter);

            // Register page change callback
            viewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
                @Override
                public void onPageSelected(int position) {
                    updateIndicatorSelection(position);

                    // If auto-play is running, reset the timer
                    if (autoplay) {
                        stopAutoPlay();
                        startAutoPlay();
                    }
                }
            });
        } else {
            adapter.notifyDataSetChanged();
        }
    }

    /**
     * Update indicator (horizontal indicator bars)
     */
    private void updateIndicatorDots() {
        indicatorLayout.removeAllViews();
        indicatorDots.clear();

        // If there is only one image or no images, hide the indicator
        if (imageUrls.size() <= 1) {
            indicatorLayout.setVisibility(View.GONE);
            return;
        }

        indicatorLayout.setVisibility(View.VISIBLE);

        // Create horizontal indicator bars
        for (int i = 0; i < imageUrls.size(); i++) {
            View indicator = new View(context);

            // Indicator bar size: use style configuration
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                    indicatorInactiveDotWidth,
                    indicatorContainerHeight
            );

            // Set indicator bar spacing
            if (i > 0) {
                params.leftMargin = indicatorDotSpacing;
            }

            indicator.setLayoutParams(params);
            indicator.setBackgroundColor(indicatorInactiveDotColor);

            // Apply rounded corners
            applyRoundedCorners(indicator, pxToDp(indicatorActiveCornerRadius));

            indicatorDots.add(indicator);
            indicatorLayout.addView(indicator);
        }

        // Update selection state
        updateIndicatorSelection(0);
    }

    /**
     * Update indicator selection state (horizontal indicator bars)
     */
    private void updateIndicatorSelection(int position) {
        for (int i = 0; i < indicatorDots.size(); i++) {
            final View indicator = indicatorDots.get(i);
            final LinearLayout.LayoutParams params = (LinearLayout.LayoutParams) indicator.getLayoutParams();
            final int currentWidth = params.width;

            if (i == position) {
                // Selected state: width becomes activeDotWidth, color becomes activeDotColor
                final int targetWidth = indicatorActiveDotWidth;
                final int targetColor = indicatorActiveDotColor;

                // Width animation
                ValueAnimator widthAnimator = ValueAnimator.ofInt(currentWidth, targetWidth);
                widthAnimator.setDuration(indicatorAnimationDuration);
                widthAnimator.setInterpolator(new DecelerateInterpolator());
                widthAnimator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
                    @Override
                    public void onAnimationUpdate(ValueAnimator animation) {
                        params.width = (int) animation.getAnimatedValue();
                        indicator.setLayoutParams(params);
                    }
                });
                widthAnimator.start();

                // Color animation
                indicator.animate()
                        .alpha(1.0f)
                        .setDuration(indicatorAnimationDuration)
                        .start();
                indicator.setBackgroundColor(targetColor);

            } else {
                // Unselected state: width becomes inactiveDotWidth, color becomes inactiveDotColor
                final int targetWidth = indicatorInactiveDotWidth;
                final int targetColor = indicatorInactiveDotColor;

                // Width animation
                ValueAnimator widthAnimator = ValueAnimator.ofInt(currentWidth, targetWidth);
                widthAnimator.setDuration(indicatorAnimationDuration);
                widthAnimator.setInterpolator(new DecelerateInterpolator());
                widthAnimator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
                    @Override
                    public void onAnimationUpdate(ValueAnimator animation) {
                        params.width = (int) animation.getAnimatedValue();
                        indicator.setLayoutParams(params);
                    }
                });
                widthAnimator.start();

                // Color animation
                indicator.animate()
                        .alpha(1.0f)
                        .setDuration(indicatorAnimationDuration)
                        .start();
                indicator.setBackgroundColor(targetColor);
            }
        }
    }

    /**
     * Start auto-play
     */
    private void startAutoPlay() {
        // Do not start auto-play if there is only one image or no images
        if (imageUrls.size() <= 1) {
            return;
        }

        stopAutoPlay(); // Stop any existing timer first

        autoPlayRunnable = new Runnable() {
            @Override
            public void run() {
                if (viewPager != null && autoplay) {
                    int currentItem = viewPager.getCurrentItem();
                    int nextItem = (currentItem + 1) % imageUrls.size();
                    viewPager.setCurrentItem(nextItem, true);
                    autoPlayHandler.postDelayed(this, autoplaySpeed);
                }
            }
        };

        autoPlayHandler.postDelayed(autoPlayRunnable, autoplaySpeed);
        Log.d(TAG, "Auto-play started with interval: " + autoplaySpeed + "ms");
    }

    /**
     * Stop auto-play
     */
    private void stopAutoPlay() {
        if (autoPlayRunnable != null) {
            autoPlayHandler.removeCallbacks(autoPlayRunnable);
            autoPlayRunnable = null;
            Log.d(TAG, "Auto-play stopped");
        }
    }

    /**
     * Apply rounded corners
     */
    private void applyRoundedCorners(View view, float radiusDp) {
        final float radiusPx = dpToPx(radiusDp);

        view.setOutlineProvider(new ViewOutlineProvider() {
            @Override
            public void getOutline(View v, Outline outline) {
                outline.setRoundRect(0, 0, v.getWidth(), v.getHeight(), radiusPx);
            }
        });
        view.setClipToOutline(true);
    }

    /**
     * Apply Carousel style configuration
     */
    private void applyCarouselStyles() {
        ComponentStyleConfig config = ComponentStyleConfig.getInstance(context);
        ComponentStyleConfig.StyleHashMap<String, String> styles = config.getCarouselStyles();

        // Indicator dot spacing
        indicatorDotSpacing = StyleHelper.parseDimension(
                styles.getOrDefault("indicator-dot-spacing", "8px"), context);

        // Inactive indicator dot width
        indicatorInactiveDotWidth = StyleHelper.parseDimension(
                styles.getOrDefault("indicator-inactive-dot-width", "6px"), context);

        // Active indicator dot width
        indicatorActiveDotWidth = StyleHelper.parseDimension(
                styles.getOrDefault("indicator-active-dot-width", "24px"), context);

        // Indicator container height
        indicatorContainerHeight = StyleHelper.parseDimension(
                styles.getOrDefault("indicator-container-height", "6px"), context);

        // Indicator offset from the bottom
        indicatorBottomOffset = StyleHelper.parseDimension(
                styles.getOrDefault("indicator-bottom-offset", "12px"), context);

        // Indicator container background color
        indicatorBackgroundColor = StyleHelper.parseColor(
                styles.getOrDefault("indicator-background-color", "#00000000"));

        // Active indicator dot color
        indicatorActiveDotColor = StyleHelper.parseColor(
                styles.getOrDefault("indicator-active-dot-color", "#00000099"));

        // Inactive indicator dot color
        indicatorInactiveDotColor = StyleHelper.parseColor(
                styles.getOrDefault("indicator-inactive-dot-color", "#0000001a"));

        // Active indicator corner radius
        indicatorActiveCornerRadius = StyleHelper.parseDimension(
                styles.getOrDefault("indicator-active-corner-radius", "3px"), context);

        // Indicator switch animation duration (default 300ms)
        indicatorAnimationDuration = 300;

        // Image placeholder background color
        imagePlaceholderColor = StyleHelper.parseColor(
                styles.getOrDefault("image-placeholder-color", "#F2F2F7"));

        Log.d(TAG, "Applied Carousel styles - " +
                "dotSpacing: " + indicatorDotSpacing + "px, " +
                "inactiveDotWidth: " + indicatorInactiveDotWidth + "px, " +
                "activeDotWidth: " + indicatorActiveDotWidth + "px, " +
                "containerHeight: " + indicatorContainerHeight + "px, " +
                "bottomOffset: " + indicatorBottomOffset + "px, " +
                "bgColor: #" + Integer.toHexString(indicatorBackgroundColor) + ", " +
                "activeDotColor: #" + Integer.toHexString(indicatorActiveDotColor) + ", " +
                "inactiveDotColor: #" + Integer.toHexString(indicatorInactiveDotColor) + ", " +
                "cornerRadius: " + indicatorActiveCornerRadius + "px, " +
                "indicatorAnimDuration: " + indicatorAnimationDuration + "ms, " +
                "placeholderColor: #" + Integer.toHexString(imagePlaceholderColor));
    }

    /**
     * Convert dp to px
     */
    private int dpToPx(float dp) {
        return (int) (dp * context.getResources().getDisplayMetrics().density);
    }

    /**
     * Convert px to dp
     */
    private float pxToDp(int px) {
        return px / context.getResources().getDisplayMetrics().density;
    }

    @Override
    protected void onDestroy() {
        stopAutoPlay();
        if (viewPager != null) {
            viewPager.unregisterOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            });
        }
    }

    /**
     * Carousel adapter
     */
    private class CarouselAdapter extends RecyclerView.Adapter<CarouselViewHolder> {

        @NonNull
        @Override
        public CarouselViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            ImageView imageView = new ImageView(context);
            imageView.setLayoutParams(new ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
            ));
            imageView.setScaleType(ImageView.ScaleType.CENTER_CROP);

            return new CarouselViewHolder(imageView);
        }

        @Override
        public void onBindViewHolder(@NonNull CarouselViewHolder holder, int position) {
            String url = imageUrls.get(position);

            // Create a solid-color placeholder drawable
            ColorDrawable placeholder = new ColorDrawable(imagePlaceholderColor);

            // Load image using Picasso
            Picasso.get()
                    .load(url)
                    .fit()
                    .centerCrop()
                    .placeholder(placeholder)
                    .error(StyleHelper.getErrorDrawable())
                    .into(holder.imageView);
        }

        @Override
        public int getItemCount() {
            return imageUrls.size();
        }
    }

    /**
     * ViewHolder
     */
    private static class CarouselViewHolder extends RecyclerView.ViewHolder {
        ImageView imageView;

        CarouselViewHolder(@NonNull View itemView) {
            super(itemView);
            imageView = (ImageView) itemView;
        }
    }
}
