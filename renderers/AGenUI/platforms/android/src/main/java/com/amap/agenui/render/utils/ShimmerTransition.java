package com.amap.agenui.render.utils;

import android.animation.ValueAnimator;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Shader;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.ImageView;

/**
 * Shimmer skeleton screen loading animation.
 * <p>
 * Effect description:
 * The image area displays a solid placeholder with a slightly dark gray color (#E5E5EA).
 * On top of this base color, a soft light band (highlight color #F8F8FA) sweeps gently
 * from left to right, repeating every 1.2 seconds using an easeInEaseOut interpolation curve.
 * The edges of the light band transition smoothly with no hard edges.
 */
public class ShimmerTransition {

    private static final long SHIMMER_DURATION = 1200; // 1.2-second loop
    private static final int BASE_COLOR = 0xFFE5E5EA;  // Base color: slightly dark gray
    private static final int HIGHLIGHT_COLOR = 0xFFF8F8FA; // Highlight color

    private ValueAnimator shimmerAnimator;
    private ShimmerView shimmerView;
    private ViewGroup shimmerParent; // Holds a reference to the parent

    /**
     * Starts the shimmer loading animation on an ImageView.
     * Uses ViewGroupOverlay so the View hierarchy is not altered.
     *
     * @param imageView Target ImageView
     * @return ShimmerView instance used to stop the animation later
     */
    public ShimmerView startShimmer(ImageView imageView) {
        // Remove any existing shimmer
        stopShimmer();

        // Get the parent container
        ViewGroup parent = (ViewGroup) imageView.getParent();
        if (parent == null) {
            return null;
        }

        // Create ShimmerView
        shimmerView = new ShimmerView(imageView.getContext());

        // Set the size to match the imageView
        shimmerView.layout(
                imageView.getLeft(),
                imageView.getTop(),
                imageView.getRight(),
                imageView.getBottom()
        );

        // Add to parent container via ViewGroupOverlay
        parent.getOverlay().add(shimmerView);
        shimmerParent = parent;

        // Listen for layout changes to keep the shimmerView size correct
        imageView.addOnLayoutChangeListener((v, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) -> {
            if (shimmerView != null) {
                shimmerView.layout(left, top, right, bottom);
            }
        });

        // Start the shimmer animation
        startShimmerAnimation();

        return shimmerView;
    }

    /**
     * Stops the shimmer animation.
     */
    public void stopShimmer() {
        if (shimmerAnimator != null) {
            shimmerAnimator.cancel();
            shimmerAnimator = null;
        }

        if (shimmerView != null && shimmerParent != null) {
            shimmerParent.getOverlay().remove(shimmerView);
            shimmerView = null;
            shimmerParent = null;
        }
    }

    /**
     * Starts the shimmer animation.
     */
    private void startShimmerAnimation() {
        if (shimmerView == null) return;

        shimmerAnimator = ValueAnimator.ofFloat(0f, 1f);
        shimmerAnimator.setDuration(SHIMMER_DURATION);
        shimmerAnimator.setRepeatCount(ValueAnimator.INFINITE);
        shimmerAnimator.setRepeatMode(ValueAnimator.RESTART);
        shimmerAnimator.setInterpolator(new AccelerateDecelerateInterpolator());

        shimmerAnimator.addUpdateListener(animation -> {
            float progress = (float) animation.getAnimatedValue();
            shimmerView.setShimmerProgress(progress);
        });

        shimmerAnimator.start();
    }

    /**
     * Shimmer view - responsible for drawing the skeleton screen effect.
     */
    public static class ShimmerView extends View {

        private Paint shimmerPaint;
        private LinearGradient shimmerGradient;
        private Matrix gradientMatrix;
        private float shimmerProgress = 0f;

        public ShimmerView(android.content.Context context) {
            super(context);
            init();
        }

        private void init() {
            shimmerPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            gradientMatrix = new Matrix();

            // Set the background color
            setBackgroundColor(BASE_COLOR);
        }

        /**
         * Sets the shimmer progress (0.0 - 1.0).
         */
        public void setShimmerProgress(float progress) {
            this.shimmerProgress = progress;
            invalidate();
        }

        @Override
        protected void onSizeChanged(int w, int h, int oldw, int oldh) {
            super.onSizeChanged(w, h, oldw, oldh);
            createShimmerGradient(w, h);
        }

        /**
         * Creates the shimmer gradient.
         */
        private void createShimmerGradient(int width, int height) {
            // Light band width is approximately 30% of the view width
            float shimmerWidth = width * 0.3f;

            int[] colors = new int[]{
                    BASE_COLOR,           // Start: base color
                    BASE_COLOR,           // Pre-transition
                    HIGHLIGHT_COLOR,      // Highlight
                    BASE_COLOR,           // Post-transition
                    BASE_COLOR            // End: base color
            };

            float[] positions = new float[]{
                    0f,
                    0.35f,
                    0.5f,
                    0.65f,
                    1f
            };

            shimmerGradient = new LinearGradient(
                    -shimmerWidth, 0,
                    width + shimmerWidth, 0,
                    colors,
                    positions,
                    Shader.TileMode.CLAMP
            );

            shimmerPaint.setShader(shimmerGradient);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);

            if (shimmerGradient == null) return;

            // Move the gradient based on progress
            int width = getWidth();
            float translationX = (width * 1.3f) * shimmerProgress - (width * 0.3f);

            gradientMatrix.setTranslate(translationX, 0);
            shimmerGradient.setLocalMatrix(gradientMatrix);

            canvas.drawRect(0, 0, getWidth(), getHeight(), shimmerPaint);
        }
    }
}
