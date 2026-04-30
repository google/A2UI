package com.amap.agenui.render.component.view;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.view.View;

import com.amap.agenui.render.style.StyleHelper;

/**
 * Custom CheckBox view
 * Implements a rounded-rectangle background with a checkmark icon
 * Supports configurable style properties
 *
 */
public class CustomCheckBoxView extends View {

    private Paint rectPaint;
    private Paint checkPaint;
    private Paint borderPaint;
    private Path checkPath;
    private RectF rectF;
    private boolean isChecked = false;

    // Configurable style properties
    private int size;
    private float cornerRadius;
    private float borderWidth;
    private float checkMarkSize;
    private int checkedBackgroundColor;
    private int checkedBorderColor;
    private int uncheckedBackgroundColor;
    private int uncheckedBorderColor;
    private int disabledBackgroundColor; // disabled state background color
    private int disabledBorderColor; // disabled state border color

    // Default color constants
    private static final int DEFAULT_CHECKED_BG_COLOR = 0xFF2E82FF; // checked background color #2E82FF
    private static final int DEFAULT_CHECKED_BORDER_COLOR = 0xFF2E82FF; // checked border color #2E82FF
    private static final int DEFAULT_UNCHECKED_BG_COLOR = Color.TRANSPARENT; // unchecked background color: transparent
    private static final int DEFAULT_UNCHECKED_BORDER_COLOR = 0x1A000000; // unchecked border: black at 10% opacity
    private static final int CHECK_COLOR = 0xFFFFFFFF; // white checkmark

    public CustomCheckBoxView(Context context) {
        super(context);
        init();
    }

    private void init() {
        // Set dimensions per spec (design unit px)
        size = StyleHelper.standardUnitToPx(getContext(), 32); // design spec 32px
        cornerRadius = StyleHelper.standardUnitToPx(getContext(), 12); // design spec 12px
        borderWidth = StyleHelper.standardUnitToPx(getContext(), 3); // design spec 3px
        checkMarkSize = StyleHelper.standardUnitToPx(getContext(), 18); // design spec 18px

        // Initialize colors to defaults
        checkedBackgroundColor = DEFAULT_CHECKED_BG_COLOR;
        checkedBorderColor = DEFAULT_CHECKED_BORDER_COLOR;
        uncheckedBackgroundColor = DEFAULT_UNCHECKED_BG_COLOR;
        uncheckedBorderColor = DEFAULT_UNCHECKED_BORDER_COLOR;

        // Initialize fill paint
        rectPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        rectPaint.setStyle(Paint.Style.FILL);

        // Initialize border paint
        borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(borderWidth);

        // Initialize checkmark paint
        checkPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        checkPaint.setStyle(Paint.Style.STROKE);
        checkPaint.setStrokeWidth(borderWidth * 0.8f); // slightly thinner than border
        checkPaint.setColor(CHECK_COLOR);
        checkPaint.setStrokeCap(Paint.Cap.ROUND);
        checkPaint.setStrokeJoin(Paint.Join.ROUND);

        // Initialize checkmark path
        checkPath = new Path();

        // Initialize rect bounds
        rectF = new RectF();
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        // Use fixed size
        setMeasuredDimension(size, size);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        float padding = borderWidth / 2f;

        // Set rect bounds accounting for border width
        rectF.set(padding, padding, getWidth() - padding, getHeight() - padding);

        float centerX = getWidth() / 2f;
        float centerY = getHeight() / 2f;

        // Check if disabled
        if (!isEnabled()) {
            // Disabled: use disabled colors, skip checkmark
            rectPaint.setColor(disabledBackgroundColor);
            canvas.drawRoundRect(rectF, cornerRadius, cornerRadius, rectPaint);
            borderPaint.setColor(disabledBorderColor);
            canvas.drawRoundRect(rectF, cornerRadius, cornerRadius, borderPaint);
        } else if (isChecked) {
            // Enabled and checked: use configured checked background
            rectPaint.setColor(checkedBackgroundColor);
            canvas.drawRoundRect(rectF, cornerRadius, cornerRadius, rectPaint);

            // Draw border only if it differs from background
            if (checkedBorderColor != checkedBackgroundColor) {
                borderPaint.setColor(checkedBorderColor);
                canvas.drawRoundRect(rectF, cornerRadius, cornerRadius, borderPaint);
            }

            // Draw white checkmark
            drawCheckMark(canvas, centerX, centerY);
        } else {
            // Enabled and unchecked: use configured unchecked colors
            rectPaint.setColor(uncheckedBackgroundColor);
            canvas.drawRoundRect(rectF, cornerRadius, cornerRadius, rectPaint);
            borderPaint.setColor(uncheckedBorderColor);
            canvas.drawRoundRect(rectF, cornerRadius, cornerRadius, borderPaint);
        }
    }

    /**
     * Draws the checkmark icon
     */
    private void drawCheckMark(Canvas canvas, float centerX, float centerY) {
        checkPath.reset();

        // Checkmark size per spec (design spec 18px)
        float checkSize = checkMarkSize;

        // Start point (lower-left)
        float startX = centerX - checkSize * 0.3f;
        float startY = centerY;

        // Mid point
        float midX = centerX - checkSize * 0.1f;
        float midY = centerY + checkSize * 0.25f;

        // End point (upper-right)
        float endX = centerX + checkSize * 0.35f;
        float endY = centerY - checkSize * 0.3f;

        // Draw checkmark path
        checkPath.moveTo(startX, startY);
        checkPath.lineTo(midX, midY);
        checkPath.lineTo(endX, endY);

        canvas.drawPath(checkPath, checkPaint);
    }

    /**
     * Sets the checked state
     */
    public void setChecked(boolean checked) {
        if (this.isChecked != checked) {
            this.isChecked = checked;
            invalidate();
        }
    }

    /**
     * Returns the checked state
     */
    public boolean isChecked() {
        return isChecked;
    }

    /**
     * Toggles the checked state
     */
    public void toggle() {
        setChecked(!isChecked);
    }


    /**
     * Sets the checkbox size
     */
    public void setSize(int size) {
        if (this.size != size) {
            this.size = size;
            requestLayout();
        }
    }

    /**
     * Sets the corner radius
     */
    public void setCornerRadius(float cornerRadius) {
        if (this.cornerRadius != cornerRadius) {
            this.cornerRadius = cornerRadius;
            invalidate();
        }
    }

    /**
     * Sets the border width
     */
    public void setBorderWidth(float borderWidth) {
        if (this.borderWidth != borderWidth) {
            this.borderWidth = borderWidth;
            borderPaint.setStrokeWidth(borderWidth);
            checkPaint.setStrokeWidth(borderWidth * 0.8f);
            invalidate();
        }
    }

    /**
     * Sets the checkmark size
     */
    public void setCheckMarkSize(float checkMarkSize) {
        if (this.checkMarkSize != checkMarkSize) {
            this.checkMarkSize = checkMarkSize;
            invalidate();
        }
    }

    /**
     * Sets the checked state background color
     */
    public void setCheckedBackgroundColor(int color) {
        if (this.checkedBackgroundColor != color) {
            this.checkedBackgroundColor = color;
            if (isChecked) {
                invalidate();
            }
        }
    }

    /**
     * Sets the checked state border color
     */
    public void setCheckedBorderColor(int color) {
        if (this.checkedBorderColor != color) {
            this.checkedBorderColor = color;
            if (isChecked) {
                invalidate();
            }
        }
    }

    /**
     * Sets the unchecked state background color
     */
    public void setUncheckedBackgroundColor(int color) {
        if (this.uncheckedBackgroundColor != color) {
            this.uncheckedBackgroundColor = color;
            if (!isChecked) {
                invalidate();
            }
        }
    }

    /**
     * Sets the unchecked state border color
     */
    public void setUncheckedBorderColor(int color) {
        if (this.uncheckedBorderColor != color) {
            this.uncheckedBorderColor = color;
            if (!isChecked) {
                invalidate();
            }
        }
    }

    /**
     * Sets the disabled state background color
     */
    public void setDisabledBackgroundColor(int color) {
        if (this.disabledBackgroundColor != color) {
            this.disabledBackgroundColor = color;
            if (!isEnabled()) {
                invalidate();
            }
        }
    }

    /**
     * Sets the disabled state border color
     */
    public void setDisabledBorderColor(int color) {
        if (this.disabledBorderColor != color) {
            this.disabledBorderColor = color;
            if (!isEnabled()) {
                invalidate();
            }
        }
    }
}
