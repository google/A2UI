package com.amap.agenui.render.component.view;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.view.MotionEvent;
import android.view.View;
import android.view.animation.LinearInterpolator;

import com.amap.agenui.render.style.StyleHelper;

/**
 * Custom audio player view
 * Implements a circular play/pause button with configurable style
 *
 */
public class CustomAudioPlayerView extends View {

    // Player state
    public enum State {
        IDLE,       // idle
        LOADING,    // loading
        READY,      // ready
        PLAYING,    // playing
        PAUSED,     // paused
        ERROR       // error
    }

    private Paint bgPaint;
    private Paint ringPaint;
    private Paint iconPaint;
    private Path iconPath;
    private RectF bgRect;

    // Configurable style properties
    private int size;
    private int playIconSize;
    private int pauseIconSize;
    private int ringWidth;
    private int playBgColor;
    private int pauseBgColor;
    private int ringColor;
    private int playIconColor;
    private int pauseIconColor;
    private int loadingColor;
    private int errorBgColor;

    // State
    private State state = State.IDLE;

    // Loading animation
    private ValueAnimator loadingAnimator;
    private float loadingAngle = 0f;

    // Playback progress (0.0 ~ 1.0)
    private float playProgress = 0f;

    public CustomAudioPlayerView(Context context) {
        super(context);
        init();
    }

    private void init() {
        // Initialize defaults (design spec units)
        size = StyleHelper.standardUnitToPx(getContext(), 80);
        playIconSize = StyleHelper.standardUnitToPx(getContext(), 40);
        pauseIconSize = StyleHelper.standardUnitToPx(getContext(), 35);
        ringWidth = StyleHelper.standardUnitToPx(getContext(), 8);
        playBgColor = 0xFF2273F7; // #2273F7
        pauseBgColor = 0xFFFFFFFF; // #FFFFFF
        ringColor = 0xFF2273F7; // #2273F7
        playIconColor = 0xFFFFFFFF; // #FFFFFF
        pauseIconColor = 0xFF2273F7; // #2273F7
        loadingColor = 0xFF2273F7; // #2273F7
        errorBgColor = 0xFFCCCCCC; // #CCCCCC

        // Initialize paints
        bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bgPaint.setStyle(Paint.Style.FILL);

        ringPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        ringPaint.setStyle(Paint.Style.STROKE);
        ringPaint.setStrokeWidth(ringWidth);

        iconPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        iconPaint.setStyle(Paint.Style.FILL);

        iconPath = new Path();
        bgRect = new RectF();

        // Add shadow effect
        bgPaint.setShadowLayer(8, 0, 2, 0x33000000);
        setLayerType(LAYER_TYPE_SOFTWARE, null);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        setMeasuredDimension(size, size);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        int width = getWidth();
        int height = getHeight();
        float centerX = width / 2f;
        float centerY = height / 2f;
        float radius = Math.min(width, height) / 2f;

        switch (state) {
            case LOADING:
                drawLoadingState(canvas, centerX, centerY, radius);
                break;
            case PLAYING:
                drawPlayingState(canvas, centerX, centerY, radius);
                break;
            case ERROR:
                drawErrorState(canvas, centerX, centerY, radius);
                break;
            case IDLE:
            case READY:
            case PAUSED:
            default:
                drawIdleState(canvas, centerX, centerY, radius);
                break;
        }
    }

    /**
     * Draws idle/ready/paused state (play button)
     */
    private void drawIdleState(Canvas canvas, float centerX, float centerY, float radius) {
        // Draw solid blue circle background
        bgPaint.setColor(playBgColor);
        canvas.drawCircle(centerX, centerY, radius, bgPaint);

        // Draw white play icon (triangle)
        iconPaint.setColor(playIconColor);
        drawPlayIcon(canvas, centerX, centerY, playIconSize);
    }

    /**
     * Draws playing state (pause button)
     */
    private void drawPlayingState(Canvas canvas, float centerX, float centerY, float radius) {
        // Draw solid white circle background
        bgPaint.setColor(pauseBgColor);
        canvas.drawCircle(centerX, centerY, radius, bgPaint);

        // Draw blue progress ring
        ringPaint.setColor(ringColor);
        ringPaint.setStrokeWidth(ringWidth);

        // Draw clockwise from top (-90°), sweep angle based on playback progress
        float startAngle = -90f;
        float sweepAngle = 360f * playProgress;

        canvas.drawArc(
                centerX - radius + ringWidth / 2f,
                centerY - radius + ringWidth / 2f,
                centerX + radius - ringWidth / 2f,
                centerY + radius - ringWidth / 2f,
                startAngle,
                sweepAngle,
                false,
                ringPaint
        );

        // Draw blue pause icon (two vertical bars)
        iconPaint.setColor(pauseIconColor);
        drawPauseIcon(canvas, centerX, centerY, pauseIconSize);
    }

    /**
     * Draws loading state
     */
    private void drawLoadingState(Canvas canvas, float centerX, float centerY, float radius) {
        // Draw solid white circle background
        bgPaint.setColor(pauseBgColor);
        canvas.drawCircle(centerX, centerY, radius, bgPaint);

        // Draw rotating loading ring
        ringPaint.setColor(loadingColor);
        ringPaint.setStrokeWidth(ringWidth);

        float sweepAngle = 270f; // arc sweep angle
        canvas.drawArc(
                centerX - radius + ringWidth / 2f,
                centerY - radius + ringWidth / 2f,
                centerX + radius - ringWidth / 2f,
                centerY + radius - ringWidth / 2f,
                loadingAngle,
                sweepAngle,
                false,
                ringPaint
        );
    }

    /**
     * Draws error state
     */
    private void drawErrorState(Canvas canvas, float centerX, float centerY, float radius) {
        // Draw solid grey circle background
        bgPaint.setColor(errorBgColor);
        canvas.drawCircle(centerX, centerY, radius, bgPaint);

        // Draw white play icon
        iconPaint.setColor(playIconColor);
        drawPlayIcon(canvas, centerX, centerY, playIconSize);
    }

    /**
     * Draws the play icon (triangle)
     */
    private void drawPlayIcon(Canvas canvas, float centerX, float centerY, int iconSize) {
        iconPath.reset();

        // Triangle pointing right
        float halfSize = iconSize / 2f;

        iconPath.moveTo(centerX - halfSize * 0.5f, centerY - halfSize);
        iconPath.lineTo(centerX - halfSize * 0.5f, centerY + halfSize);
        iconPath.lineTo(centerX + halfSize, centerY);
        iconPath.close();

        canvas.drawPath(iconPath, iconPaint);
    }

    /**
     * Draws the pause icon (two vertical bars)
     */
    private void drawPauseIcon(Canvas canvas, float centerX, float centerY, int iconSize) {
        float halfSize = iconSize / 2f;
        float barWidth = iconSize * 0.25f; // bar width
        float gap = iconSize * 0.2f; // gap between bars

        // Left bar
        canvas.drawRect(
                centerX - gap / 2f - barWidth,
                centerY - halfSize,
                centerX - gap / 2f,
                centerY + halfSize,
                iconPaint
        );

        // Right bar
        canvas.drawRect(
                centerX + gap / 2f,
                centerY - halfSize,
                centerX + gap / 2f + barWidth,
                centerY + halfSize,
                iconPaint
        );
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (!isEnabled()) {
            return false;
        }

        if (event.getAction() == MotionEvent.ACTION_UP) {
            performClick();
            return true;
        }

        return super.onTouchEvent(event);
    }

    @Override
    public boolean performClick() {
        super.performClick();
        return true;
    }


    public void setState(State state) {
        if (this.state != state) {
            this.state = state;

            // Handle loading animation
            if (state == State.LOADING) {
                startLoadingAnimation();
            } else {
                stopLoadingAnimation();
            }

            // Reset playback progress
            if (state != State.PLAYING) {
                playProgress = 0f;
            }

            invalidate();
        }
    }

    public State getState() {
        return state;
    }

    /**
     * Starts the loading animation
     */
    private void startLoadingAnimation() {
        if (loadingAnimator != null) {
            loadingAnimator.cancel();
        }

        loadingAnimator = ValueAnimator.ofFloat(0f, 360f);
        loadingAnimator.setDuration(1000);
        loadingAnimator.setRepeatCount(ValueAnimator.INFINITE);
        loadingAnimator.setInterpolator(new LinearInterpolator());
        loadingAnimator.addUpdateListener(animation -> {
            loadingAngle = (float) animation.getAnimatedValue();
            invalidate();
        });
        loadingAnimator.start();
    }

    /**
     * Stops the loading animation
     */
    private void stopLoadingAnimation() {
        if (loadingAnimator != null) {
            loadingAnimator.cancel();
            loadingAnimator = null;
        }
    }


    public void setSize(int size) {
        if (this.size != size) {
            this.size = size;
            requestLayout();
        }
    }

    public void setPlayIconSize(int size) {
        if (this.playIconSize != size) {
            this.playIconSize = size;
            invalidate();
        }
    }

    public void setPauseIconSize(int size) {
        if (this.pauseIconSize != size) {
            this.pauseIconSize = size;
            invalidate();
        }
    }

    public void setRingWidth(int width) {
        if (this.ringWidth != width) {
            this.ringWidth = width;
            ringPaint.setStrokeWidth(width);
            invalidate();
        }
    }

    public void setPlayBgColor(int color) {
        if (this.playBgColor != color) {
            this.playBgColor = color;
            invalidate();
        }
    }

    public void setPauseBgColor(int color) {
        if (this.pauseBgColor != color) {
            this.pauseBgColor = color;
            invalidate();
        }
    }

    public void setRingColor(int color) {
        if (this.ringColor != color) {
            this.ringColor = color;
            invalidate();
        }
    }

    public void setPlayIconColor(int color) {
        if (this.playIconColor != color) {
            this.playIconColor = color;
            invalidate();
        }
    }

    public void setPauseIconColor(int color) {
        if (this.pauseIconColor != color) {
            this.pauseIconColor = color;
            invalidate();
        }
    }

    public void setLoadingColor(int color) {
        if (this.loadingColor != color) {
            this.loadingColor = color;
            invalidate();
        }
    }

    public void setErrorBgColor(int color) {
        if (this.errorBgColor != color) {
            this.errorBgColor = color;
            invalidate();
        }
    }

    /**
     * Sets the playback progress (0.0 ~ 1.0)
     */
    public void setPlayProgress(float progress) {
        if (this.playProgress != progress) {
            this.playProgress = Math.max(0f, Math.min(1f, progress));
            if (state == State.PLAYING) {
                invalidate();
            }
        }
    }

    /**
     * Returns the playback progress
     */
    public float getPlayProgress() {
        return playProgress;
    }
}
