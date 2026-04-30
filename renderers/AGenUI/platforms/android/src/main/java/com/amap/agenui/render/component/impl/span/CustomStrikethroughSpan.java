package com.amap.agenui.render.component.impl.span;

import android.graphics.Canvas;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Path;
import android.text.style.LineBackgroundSpan;
import android.view.Gravity;

import androidx.annotation.NonNull;

/**
 * Custom strikethrough Span, supporting multiple line styles
 * <p>
 * Supported styles:
 * - solid: solid line
 * - dashed: dashed line
 * - dotted: dotted line
 * - double: double line
 * - wavy: wavy line
 *
 */
public class CustomStrikethroughSpan implements LineBackgroundSpan {

    /**
     * Decoration line style
     */
    public enum Style {
        SOLID,      // solid line
        DASHED,     // dashed line
        DOTTED,     // dotted line
        DOUBLE,     // double line
        WAVY        // wavy line
    }

    private final int color;           // decoration line color
    private final float thickness;     // decoration line thickness (pixels)
    private final Style style;         // decoration line style
    private final int gravity;         // text alignment

    /**
     * Constructor
     *
     * @param color     decoration line color
     * @param thickness decoration line thickness (pixels)
     * @param style     decoration line style
     * @param gravity   text alignment
     */
    public CustomStrikethroughSpan(int color, float thickness, Style style, int gravity) {
        this.color = color;
        this.thickness = thickness;
        this.style = style;
        this.gravity = gravity;
    }

    @Override
    public void drawBackground(
            @NonNull Canvas canvas,
            @NonNull Paint paint,
            int left,
            int right,
            int top,
            int baseline,
            int bottom,
            @NonNull CharSequence text,
            int start,
            int end,
            int lineNumber) {

        // Create a Paint for drawing the decoration line
        Paint linePaint = new Paint(paint);
        linePaint.setColor(color);
        linePaint.setStrokeWidth(thickness);
        linePaint.setStyle(Paint.Style.STROKE);
        linePaint.setAntiAlias(true);

        // Calculate the actual text width
        float textWidth = paint.measureText(text, start, end);

        // Calculate the starting position of the decoration line based on text alignment
        float textStart;
        int horizontalGravity = gravity & Gravity.HORIZONTAL_GRAVITY_MASK;
        if (horizontalGravity == Gravity.CENTER_HORIZONTAL) {
            // Center alignment: decoration line is also centered
            textStart = left + (right - left - textWidth) / 2;
        } else if (horizontalGravity == Gravity.END || horizontalGravity == Gravity.RIGHT) {
            // Right alignment: decoration line starts from the right
            textStart = right - textWidth;
        } else {
            // Left alignment (default): decoration line starts from the left
            textStart = left;
        }

        // Calculate strikethrough position (slightly above the text middle)
        float lineY = baseline - (baseline - top) * 0.4f;

        // Draw the decoration line starting from the actual text position
        switch (style) {
            case SOLID:
                drawSolidLine(canvas, linePaint, textStart, lineY, textStart + textWidth, lineY);
                break;
            case DASHED:
                drawDashedLine(canvas, linePaint, textStart, lineY, textStart + textWidth, lineY);
                break;
            case DOTTED:
                drawDottedLine(canvas, linePaint, textStart, lineY, textStart + textWidth, lineY);
                break;
            case DOUBLE:
                drawDoubleLine(canvas, linePaint, textStart, lineY, textStart + textWidth, lineY);
                break;
            case WAVY:
                drawWavyLine(canvas, linePaint, textStart, lineY, textStart + textWidth, lineY);
                break;
        }
    }

    /**
     * Draw solid line
     */
    private void drawSolidLine(Canvas canvas, Paint paint, float startX, float startY,
                               float endX, float endY) {
        canvas.drawLine(startX, startY, endX, endY, paint);
    }

    /**
     * Draw dashed line
     */
    private void drawDashedLine(Canvas canvas, Paint paint, float startX, float startY,
                                float endX, float endY) {
        // Dashed effect: segment length 10, gap 5
        paint.setPathEffect(new DashPathEffect(new float[]{10, 5}, 0));
        canvas.drawLine(startX, startY, endX, endY, paint);
        paint.setPathEffect(null);
    }

    /**
     * Draw dotted line
     */
    private void drawDottedLine(Canvas canvas, Paint paint, float startX, float startY,
                                float endX, float endY) {
        // Dotted effect: dot length 2, gap 3
        paint.setPathEffect(new DashPathEffect(new float[]{2, 3}, 0));
        canvas.drawLine(startX, startY, endX, endY, paint);
        paint.setPathEffect(null);
    }

    /**
     * Draw double line
     */
    private void drawDoubleLine(Canvas canvas, Paint paint, float startX, float startY,
                                float endX, float endY) {
        // Draw two parallel lines, spaced 2x the thickness apart
        float offset = thickness * 2;
        canvas.drawLine(startX, startY - offset / 2, endX, endY - offset / 2, paint);
        canvas.drawLine(startX, startY + offset / 2, endX, endY + offset / 2, paint);
    }

    /**
     * Draw wavy line
     */
    private void drawWavyLine(Canvas canvas, Paint paint, float startX, float startY,
                              float endX, float endY) {
        Path path = new Path();
        path.moveTo(startX, startY);

        // Wave parameters
        float wavelength = 10;  // wavelength
        float amplitude = 3;    // amplitude

        float x = startX;
        while (x < endX) {
            float nextX = Math.min(x + wavelength / 2, endX);
            float controlY = startY + ((int) ((x - startX) / wavelength) % 2 == 0 ? -amplitude : amplitude);
            path.quadTo(x + wavelength / 4, controlY, nextX, startY);
            x = nextX;
        }

        paint.setStyle(Paint.Style.STROKE);
        canvas.drawPath(path, paint);
    }
}
