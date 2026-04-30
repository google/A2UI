package com.amap.agenui.render.utils;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ValueAnimator;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Shader;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.widget.ImageView;

/**
 * Magic Reveal - frosted glass lens reveal animation.
 * <p>
 * Effect inspired by iOS 26 Liquid Glass:
 * 1. A gradient mask controls a diagonal progressive reveal of the image (top-left → bottom-right).
 * 2. A multi-color light band simulating frosted glass refraction is overlaid on the parent container.
 * 3. The light band slightly leads the reveal edge, creating a "lens first, content follows" effect.
 * 4. Throughout the animation, the image micro-scales from 0.98 to 1.0 for a "floating up" 3D feel.
 * <p>
 * Color composition (from revealed side → unrevealed side):
 * Transparent → light warm white (refracted warm edge) → bright white (glass highlight) → light cool blue (refracted cool edge) → Transparent
 * This warm-to-cool color separation simulates the chromatic dispersion of real glass.
 * <p>
 * Usage example:
 * ```java
 * ImageTransitionManager.setDefaultTransition(new MagicRevealTransition());
 * ImageTransitionManager.setDefaultTransition(new MagicRevealTransition(0.6f, 0.98f));
 * ```
 */
public class MagicRevealTransition implements ImageTransition {

    private static final long DEFAULT_DURATION = 1000; // 1 second
    private static final float GLASS_OPACITY = 0.5f;
    private static final float INITIAL_SCALE = 0.98f;

    // Color definitions
    private static final int WARM_TINT = 0x59FFF2E0;      // rgba(255, 242, 224, 0.35 * 0.5)
    private static final int PEAK_WHITE = 0x80FFFFFF;      // rgba(255, 255, 255, 0.5)
    private static final int COOL_TINT = 0x4DD9EBFF;       // rgba(217, 235, 255, 0.3 * 0.5)
    private static final int SUBTLE_EDGE = 0x1FFFFFFF;     // rgba(255, 255, 255, 0.12 * 0.5)

    private float glassOpacity;
    private float initialScale;

    public MagicRevealTransition() {
        this(GLASS_OPACITY, INITIAL_SCALE);
    }

    public MagicRevealTransition(float glassOpacity, float initialScale) {
        this.glassOpacity = glassOpacity;
        this.initialScale = initialScale;
    }

    @Override
    public void animate(ImageView imageView, long duration, Runnable completion) {
        int width = imageView.getWidth();
        int height = imageView.getHeight();

        if (width <= 0 || height <= 0) {
            // If dimensions are not available yet, wait for layout to complete
            imageView.post(() -> animate(imageView, duration, completion));
            return;
        }

        // Get the parent container
        ViewGroup parent = (ViewGroup) imageView.getParent();
        if (parent == null) {
            if (completion != null) {
                completion.run();
            }
            return;
        }

        // Set initial state
        imageView.setAlpha(1f);
        imageView.setScaleX(initialScale);
        imageView.setScaleY(initialScale);

        // Create the reveal mask view
        RevealMaskView maskView = new RevealMaskView(imageView.getContext());

        // Create the frosted glass light band view
        GlassLightBandView glassView = new GlassLightBandView(
                imageView.getContext(),
                glassOpacity
        );

        // Add to the parent container via ViewGroupOverlay
        maskView.layout(
                imageView.getLeft(),
                imageView.getTop(),
                imageView.getRight(),
                imageView.getBottom()
        );
        glassView.layout(
                imageView.getLeft(),
                imageView.getTop(),
                imageView.getRight(),
                imageView.getBottom()
        );

        parent.getOverlay().add(maskView);
        parent.getOverlay().add(glassView);

        // Listen for layout changes to keep overlay sizes correct
        imageView.addOnLayoutChangeListener((v, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) -> {
            maskView.layout(left, top, right, bottom);
            glassView.layout(left, top, right, bottom);
        });

        // Execute the animation
        executeRevealAnimation(imageView, maskView, glassView, duration, completion, parent);
    }

    @Override
    public long getDefaultDuration() {
        return DEFAULT_DURATION;
    }

    /**
     * Executes the reveal animation.
     */
    private void executeRevealAnimation(ImageView imageView, RevealMaskView maskView,
                                        GlassLightBandView glassView, long duration,
                                        Runnable completion, ViewGroup parent) {
        // Mask animation: diagonal sweep
        ValueAnimator maskAnimator = ValueAnimator.ofFloat(0f, 1f);
        maskAnimator.setDuration(duration);
        maskAnimator.setInterpolator(new AccelerateDecelerateInterpolator());
        maskAnimator.addUpdateListener(animation -> {
            float progress = (float) animation.getAnimatedValue();
            maskView.setRevealProgress(progress);
        });

        // Light band animation: slightly ahead of the mask
        ValueAnimator glassAnimator = ValueAnimator.ofFloat(0f, 1f);
        glassAnimator.setDuration(duration);
        glassAnimator.setInterpolator(new AccelerateDecelerateInterpolator());
        glassAnimator.addUpdateListener(animation -> {
            float progress = (float) animation.getAnimatedValue();
            // Light band leads by 20%
            glassView.setLightBandProgress(Math.min(1f, progress + 0.2f));
        });

        // Micro-scale animation: slowly zooms from initialScale to 1.0
        ValueAnimator scaleAnimator = ValueAnimator.ofFloat(initialScale, 1f);
        scaleAnimator.setDuration(duration);
        scaleAnimator.setInterpolator(new DecelerateInterpolator());
        scaleAnimator.addUpdateListener(animation -> {
            float scale = (float) animation.getAnimatedValue();
            imageView.setScaleX(scale);
            imageView.setScaleY(scale);
        });

        // Clean up when animation ends
        maskAnimator.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                // Remove the mask and light band views from the Overlay
                parent.getOverlay().remove(maskView);
                parent.getOverlay().remove(glassView);

                // Restore the imageView state
                imageView.setScaleX(1f);
                imageView.setScaleY(1f);
                imageView.setAlpha(1f);

                if (completion != null) {
                    completion.run();
                }
            }
        });

        // Start all animations simultaneously
        maskAnimator.start();
        glassAnimator.start();
        scaleAnimator.start();
    }

    /**
     * Reveal mask view - controls the progressive reveal of the image.
     * Uses a simple gradient alpha to achieve the reveal effect.
     */
    private static class RevealMaskView extends View {

        private Paint revealPaint;
        private LinearGradient revealGradient;
        private Matrix gradientMatrix;
        private float revealProgress = 0f;

        public RevealMaskView(android.content.Context context) {
            super(context);
            init();
        }

        private void init() {
            revealPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            gradientMatrix = new Matrix();
        }

        public void setRevealProgress(float progress) {
            this.revealProgress = progress;
            invalidate();
        }

        @Override
        protected void onSizeChanged(int w, int h, int oldw, int oldh) {
            super.onSizeChanged(w, h, oldw, oldh);
            createRevealGradient(w, h);
        }

        private void createRevealGradient(int width, int height) {
            // Diagonal direction: top-left to bottom-right
            float diagonal = (float) Math.sqrt(width * width + height * height);

            int placeholderColor = 0xFFF2F2F7; // Placeholder color

            int[] colors = new int[]{
                    Color.TRANSPARENT,      // Revealed area (transparent, shows the image below)
                    Color.TRANSPARENT,
                    placeholderColor,       // Unrevealed area (placeholder color, hides the image)
                    placeholderColor
            };

            float[] positions = new float[]{
                    0f,
                    0.55f,
                    0.85f,
                    1f
            };

            // Initial position: outside the view to the top-left
            float startX = -diagonal * 0.8f;
            float startY = -diagonal * 0.8f;
            float endX = startX + diagonal * 1.5f;
            float endY = startY + diagonal * 1.5f;

            revealGradient = new LinearGradient(
                    startX, startY,
                    endX, endY,
                    colors,
                    positions,
                    Shader.TileMode.CLAMP
            );

            revealPaint.setShader(revealGradient);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);

            if (revealGradient == null) return;

            // Move the gradient based on progress
            int width = getWidth();
            int height = getHeight();
            float diagonal = (float) Math.sqrt(width * width + height * height);

            float translationX = diagonal * 1.5f * revealProgress;
            float translationY = translationX;

            gradientMatrix.setTranslate(translationX, translationY);
            revealGradient.setLocalMatrix(gradientMatrix);

            // Draw the mask layer (opaque area covers the image)
            canvas.drawRect(0, 0, width, height, revealPaint);
        }
    }

    /**
     * Frosted glass light band view - simulates the Liquid Glass refraction effect.
     */
    private static class GlassLightBandView extends View {

        private Paint glassPaint;
        private LinearGradient glassGradient;
        private Matrix gradientMatrix;
        private float lightBandProgress = 0f;
        private float glassOpacity;

        public GlassLightBandView(android.content.Context context, float glassOpacity) {
            super(context);
            this.glassOpacity = glassOpacity;
            init();
        }

        private void init() {
            glassPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            gradientMatrix = new Matrix();

            // Update color opacity
            updateColors();
        }

        private void updateColors() {
            int warmTint = applyOpacity(0xFFFFF2E0, glassOpacity * 0.35f);
            int peakWhite = applyOpacity(Color.WHITE, glassOpacity);
            int coolTint = applyOpacity(0xFFD9EBFF, glassOpacity * 0.3f);
            int subtleEdge = applyOpacity(Color.WHITE, glassOpacity * 0.12f);

            int[] colors = new int[]{
                    Color.TRANSPARENT,  // Revealed area
                    subtleEdge,         // Very faint leading light
                    warmTint,           // Warm-edge refraction
                    peakWhite,          // Glass highlight peak
                    coolTint,           // Cool-edge refraction
                    subtleEdge,         // Very faint trailing light
                    Color.TRANSPARENT   // Unrevealed area
            };

            float[] positions = new float[]{
                    0f, 0.25f, 0.38f, 0.50f, 0.62f, 0.75f, 1f
            };
        }

        private int applyOpacity(int color, float opacity) {
            int alpha = Math.round(Color.alpha(color) * opacity);
            return Color.argb(alpha, Color.red(color), Color.green(color), Color.blue(color));
        }

        public void setLightBandProgress(float progress) {
            this.lightBandProgress = progress;
            invalidate();
        }

        @Override
        protected void onSizeChanged(int w, int h, int oldw, int oldh) {
            super.onSizeChanged(w, h, oldw, oldh);
            createGlassGradient(w, h);
        }

        private void createGlassGradient(int width, int height) {
            int warmTint = applyOpacity(0xFFFFF2E0, glassOpacity * 0.35f);
            int peakWhite = applyOpacity(Color.WHITE, glassOpacity);
            int coolTint = applyOpacity(0xFFD9EBFF, glassOpacity * 0.3f);
            int subtleEdge = applyOpacity(Color.WHITE, glassOpacity * 0.12f);

            int[] colors = new int[]{
                    Color.TRANSPARENT,  // Revealed area
                    subtleEdge,         // Very faint leading light
                    warmTint,           // Warm-edge refraction
                    peakWhite,          // Glass highlight peak
                    coolTint,           // Cool-edge refraction
                    subtleEdge,         // Very faint trailing light
                    Color.TRANSPARENT   // Unrevealed area
            };

            float[] positions = new float[]{
                    0f, 0.25f, 0.38f, 0.50f, 0.62f, 0.75f, 1f
            };

            float diagonal = (float) Math.sqrt(width * width + height * height);
            float startX = -diagonal * 0.6f;
            float startY = -diagonal * 0.6f;
            float endX = startX + diagonal * 1.4f;
            float endY = startY + diagonal * 1.4f;

            glassGradient = new LinearGradient(
                    startX, startY,
                    endX, endY,
                    colors,
                    positions,
                    Shader.TileMode.CLAMP
            );

            glassPaint.setShader(glassGradient);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);

            if (glassGradient == null) return;

            // Move the gradient based on progress
            int width = getWidth();
            int height = getHeight();
            float diagonal = (float) Math.sqrt(width * width + height * height);

            float translationX = diagonal * 1.4f * lightBandProgress;
            float translationY = translationX;

            gradientMatrix.setTranslate(translationX, translationY);
            glassGradient.setLocalMatrix(gradientMatrix);

            canvas.drawRect(0, 0, width, height, glassPaint);
        }
    }
}
