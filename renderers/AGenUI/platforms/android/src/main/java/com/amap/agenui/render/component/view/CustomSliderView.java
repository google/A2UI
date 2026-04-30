package com.amap.agenui.render.component.view;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.view.MotionEvent;
import android.view.View;

import com.amap.agenui.render.style.StyleHelper;

/**
 * Custom Slider view
 * Implements a configurable-style slider component
 *
 */
public class CustomSliderView extends View {

    private Paint trackPaint;
    private Paint thumbOuterPaint;
    private Paint thumbInnerPaint;
    private RectF trackRect;

    // Configurable style properties
    private int sliderHeight;
    private int trackHeight;
    private float trackCornerRadius;
    private int minimumTrackColor;
    private int maximumTrackColor;
    private int thumbOuterDiameter;
    private int thumbOuterColor;
    private int thumbInnerDiameter;
    private int thumbInnerColor;

    // Slider state
    private float progress = 0f; // 0.0 ~ 1.0
    private boolean isDragging = false;

    // Listener
    private OnProgressChangeListener listener;

    public interface OnProgressChangeListener {
        void onProgressChanged(float progress, boolean fromUser);
    }

    public CustomSliderView(Context context) {
        super(context);
        init();
    }

    private void init() {
        // Initialize defaults (design spec units)
        sliderHeight = StyleHelper.standardUnitToPx(getContext(), 48);
        trackHeight = StyleHelper.standardUnitToPx(getContext(), 4);
        trackCornerRadius = StyleHelper.standardUnitToPx(getContext(), 2);
        minimumTrackColor = 0xFF1A66FF; // #1A66FF
        maximumTrackColor = 0xFFEEF0F4; // #EEF0F4
        thumbOuterDiameter = StyleHelper.standardUnitToPx(getContext(), 48);
        thumbOuterColor = 0xFFFFFFFF; // #FFFFFF
        thumbInnerDiameter = StyleHelper.standardUnitToPx(getContext(), 16);
        thumbInnerColor = 0xFF1A66FF; // #1A66FF

        // Initialize paints
        trackPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        trackPaint.setStyle(Paint.Style.FILL);

        thumbOuterPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        thumbOuterPaint.setStyle(Paint.Style.FILL);
        thumbOuterPaint.setColor(thumbOuterColor);
        // Add shadow effect
        thumbOuterPaint.setShadowLayer(8, 0, 2, 0x33000000);

        thumbInnerPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        thumbInnerPaint.setStyle(Paint.Style.FILL);
        thumbInnerPaint.setColor(thumbInnerColor);

        trackRect = new RectF();

        // Enable software layer to support shadow
        setLayerType(LAYER_TYPE_SOFTWARE, null);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int width = MeasureSpec.getSize(widthMeasureSpec);
        setMeasuredDimension(width, sliderHeight);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        int width = getWidth();
        int height = getHeight();

        // Calculate vertical center position of the track
        float trackTop = (height - trackHeight) / 2f;
        float trackBottom = trackTop + trackHeight;

        // Calculate horizontal position of the thumb
        float thumbCenterX = thumbOuterDiameter / 2f + (width - thumbOuterDiameter) * progress;
        float thumbCenterY = height / 2f;

        // Draw track
        // 1. Draw maximum track (unplayed portion) — full width
        trackPaint.setColor(maximumTrackColor);
        trackRect.set(0, trackTop, width, trackBottom);
        canvas.drawRoundRect(trackRect, trackCornerRadius, trackCornerRadius, trackPaint);

        // 2. Draw minimum track (played portion) — overlaid on top
        if (progress > 0) {
            trackPaint.setColor(minimumTrackColor);
            trackRect.set(0, trackTop, thumbCenterX, trackBottom);
            canvas.drawRoundRect(trackRect, trackCornerRadius, trackCornerRadius, trackPaint);
        }

        // Draw thumb
        // 1. Draw outer circle (white, with shadow)
        canvas.drawCircle(thumbCenterX, thumbCenterY, thumbOuterDiameter / 2f, thumbOuterPaint);

        // 2. Draw inner circle (blue)
        canvas.drawCircle(thumbCenterX, thumbCenterY, thumbInnerDiameter / 2f, thumbInnerPaint);
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (!isEnabled()) {
            return false;
        }

        float x = event.getX();
        int width = getWidth();

        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN:
                // Check if touch is on the thumb
                float thumbCenterX = thumbOuterDiameter / 2f + (width - thumbOuterDiameter) * progress;
                float distance = Math.abs(x - thumbCenterX);

                if (distance <= thumbOuterDiameter / 2f) {
                    isDragging = true;
                    getParent().requestDisallowInterceptTouchEvent(true);
                    return true;
                }
                break;

            case MotionEvent.ACTION_MOVE:
                if (isDragging) {
                    updateProgress(x, width, true);
                    return true;
                }
                break;

            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                if (isDragging) {
                    isDragging = false;
                    getParent().requestDisallowInterceptTouchEvent(false);
                    return true;
                }
                break;
        }

        return super.onTouchEvent(event);
    }

    private void updateProgress(float x, int width, boolean fromUser) {
        // Calculate effective sliding range (accounting for thumb radius)
        float halfThumb = thumbOuterDiameter / 2f;
        float effectiveWidth = width - thumbOuterDiameter;

        // Clamp x to effective range
        float clampedX = Math.max(halfThumb, Math.min(x, width - halfThumb));

        // Calculate progress
        float newProgress = (clampedX - halfThumb) / effectiveWidth;
        newProgress = Math.max(0f, Math.min(1f, newProgress));

        if (newProgress != progress) {
            progress = newProgress;
            invalidate();

            if (listener != null) {
                listener.onProgressChanged(progress, fromUser);
            }
        }
    }


    public void setProgress(float progress) {
        this.progress = Math.max(0f, Math.min(1f, progress));
        invalidate();
    }

    public float getProgress() {
        return progress;
    }

    public void setOnProgressChangeListener(OnProgressChangeListener listener) {
        this.listener = listener;
    }


    public void setSliderHeight(int height) {
        if (this.sliderHeight != height) {
            this.sliderHeight = height;
            requestLayout();
        }
    }

    public void setTrackHeight(int height) {
        if (this.trackHeight != height) {
            this.trackHeight = height;
            invalidate();
        }
    }

    public void setTrackCornerRadius(float radius) {
        if (this.trackCornerRadius != radius) {
            this.trackCornerRadius = radius;
            invalidate();
        }
    }

    public void setMinimumTrackColor(int color) {
        if (this.minimumTrackColor != color) {
            this.minimumTrackColor = color;
            invalidate();
        }
    }

    public void setMaximumTrackColor(int color) {
        if (this.maximumTrackColor != color) {
            this.maximumTrackColor = color;
            invalidate();
        }
    }

    public void setThumbOuterDiameter(int diameter) {
        if (this.thumbOuterDiameter != diameter) {
            this.thumbOuterDiameter = diameter;
            invalidate();
        }
    }

    public void setThumbOuterColor(int color) {
        if (this.thumbOuterColor != color) {
            this.thumbOuterColor = color;
            thumbOuterPaint.setColor(color);
            invalidate();
        }
    }

    public void setThumbInnerDiameter(int diameter) {
        if (this.thumbInnerDiameter != diameter) {
            this.thumbInnerDiameter = diameter;
            invalidate();
        }
    }

    public void setThumbInnerColor(int color) {
        if (this.thumbInnerColor != color) {
            this.thumbInnerColor = color;
            thumbInnerPaint.setColor(color);
            invalidate();
        }
    }
}
