package com.amap.agenui.render.component.impl.span;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.text.style.ReplacementSpan;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Custom background Span - supports partial-height background effects
 *
 * Features:
 * - Customizable background height ratio (e.g. 0.5 for half height)
 * - Configurable background position (top, bottom, center)
 * - Custom background color
 * - Optional rounded-corner background
 *
 * Use cases:
 * - Text highlight marking
 * - Partial-height background decoration
 * - Special text effects
 *
 */
public class CustomBackgroundSpan extends ReplacementSpan {

    /**
     * Background position: top
     */
    public static final int POSITION_TOP = 0;

    /**
     * Background position: bottom
     */
    public static final int POSITION_BOTTOM = 1;

    /**
     * Background position: center
     */
    public static final int POSITION_CENTER = 2;

    private final int backgroundColor;
    private final float heightRatio;  // background height ratio (0.0 ~ 1.0)
    private final int position;       // background position
    private final float cornerRadius; // corner radius (px)
    private final float paddingHorizontal; // horizontal padding (px)

    /**
     * Constructor (basic)
     *
     * @param backgroundColor background color
     * @param heightRatio background height ratio (0.0 ~ 1.0, e.g. 0.5 for half height)
     * @param position background position (POSITION_TOP, POSITION_BOTTOM, POSITION_CENTER)
     */
    public CustomBackgroundSpan(int backgroundColor, float heightRatio, int position) {
        this(backgroundColor, heightRatio, position, 0f, 0f);
    }

    /**
     * Constructor (full)
     *
     * @param backgroundColor background color
     * @param heightRatio background height ratio (0.0 ~ 1.0)
     * @param position background position
     * @param cornerRadius corner radius (px)
     * @param paddingHorizontal horizontal padding (px)
     */
    public CustomBackgroundSpan(int backgroundColor, float heightRatio, int position,
                               float cornerRadius, float paddingHorizontal) {
        this.backgroundColor = backgroundColor;
        this.heightRatio = Math.max(0f, Math.min(1f, heightRatio)); // clamp to 0~1
        this.position = position;
        this.cornerRadius = cornerRadius;
        this.paddingHorizontal = paddingHorizontal;
    }

    @Override
    public int getSize(@NonNull Paint paint, CharSequence text,
                       int start, int end, @Nullable Paint.FontMetricsInt fm) {
        // Return text width plus horizontal padding
        float textWidth = paint.measureText(text, start, end);
        return Math.round(textWidth + paddingHorizontal * 2);
    }

    @Override
    public void draw(@NonNull Canvas canvas, CharSequence text,
                     int start, int end, float x, int top, int y,
                     int bottom, @NonNull Paint paint) {

        // 1. Calculate font metrics
        Paint.FontMetrics fm = paint.getFontMetrics();
        float textHeight = fm.descent - fm.ascent;
        float textWidth = paint.measureText(text, start, end);

        // 2. Calculate background height
        float bgHeight = textHeight * heightRatio;

        // 3. Calculate background top and bottom based on position
        float bgTop, bgBottom;
        switch (position) {
            case POSITION_TOP:
                bgTop = y + fm.ascent;
                bgBottom = bgTop + bgHeight;
                break;
            case POSITION_CENTER:
                float center = y + (fm.ascent + fm.descent) / 2;
                bgTop = center - bgHeight / 2;
                bgBottom = center + bgHeight / 2;
                break;
            case POSITION_BOTTOM:
            default:
                bgBottom = y + fm.descent;
                bgTop = bgBottom - bgHeight;
                break;
        }

        // 4. Calculate background left and right (including horizontal padding)
        float bgLeft = x - paddingHorizontal;
        float bgRight = x + textWidth + paddingHorizontal;

        // 5. Draw background
        Paint bgPaint = new Paint();
        bgPaint.setColor(backgroundColor);
        bgPaint.setStyle(Paint.Style.FILL);
        bgPaint.setAntiAlias(true);

        if (cornerRadius > 0) {
            // Draw rounded-rect background
            canvas.drawRoundRect(bgLeft, bgTop, bgRight, bgBottom,
                               cornerRadius, cornerRadius, bgPaint);
        } else {
            // Draw rectangular background
            canvas.drawRect(bgLeft, bgTop, bgRight, bgBottom, bgPaint);
        }

        // 6. Draw text (on top of the background)
        canvas.drawText(text, start, end, x, y, paint);
    }

    /**
     * Returns the background color
     */
    public int getBackgroundColor() {
        return backgroundColor;
    }

    /**
     * Returns the height ratio
     */
    public float getHeightRatio() {
        return heightRatio;
    }

    /**
     * Returns the position
     */
    public int getPosition() {
        return position;
    }

    /**
     * Returns the corner radius
     */
    public float getCornerRadius() {
        return cornerRadius;
    }

    /**
     * Returns the horizontal padding
     */
    public float getPaddingHorizontal() {
        return paddingHorizontal;
    }
}
