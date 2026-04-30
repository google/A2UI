package com.amap.agenui.render.layout;

import android.content.Context;
import android.util.AttributeSet;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import androidx.constraintlayout.widget.ConstraintLayout;

import com.google.android.flexbox.FlexDirection;
import com.google.android.flexbox.FlexWrap;
import com.google.android.flexbox.FlexboxLayout;

/**
 * Flex container layout (ConstraintLayout lazy-loading optimized version)
 * <p>
 * Wraps a three-layer structure to support:
 * 1. Normal document flow: child elements added to FlexboxLayout (created immediately)
 * 2. Absolute positioning: child elements added to ConstraintLayout (lazy-loaded, out of flow,
 *    supports constraints in all four directions)
 * <p>
 * Structure:
 * FlexContainerLayout (FrameLayout)
 * ├── FlexboxLayout (normal flow, fills the entire space) - created immediately
 * └── ConstraintLayout (absolute positioning layer, fills the entire space) - lazy-loaded
 * <p>
 * Optimization features:
 * - FlexboxLayout is created immediately for direct use (required in most scenarios)
 * - ConstraintLayout is lazy-loaded and only created when absolute positioning is needed (rare)
 * - When only normal flow is used, ConstraintLayout is never created, saving memory
 * <p>
 * Use cases:
 * - Row component (horizontal layout)
 * - Column component (vertical layout)
 * - Other Flex containers that need to support absolute positioning
 *
 */
public class FlexContainerLayout extends FrameLayout {

    private static final String TAG = "FlexContainerLayout";

    private FlexboxLayout flexboxLayout;
    private ConstraintLayout constraintLayout;

    public FlexContainerLayout(Context context) {
        super(context);
        init(context);
    }

    public FlexContainerLayout(Context context, AttributeSet attrs) {
        super(context, attrs);
        init(context);
    }

    public FlexContainerLayout(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init(context);
    }

    /**
     * Initialization.
     * FlexboxLayout is created immediately; ConstraintLayout is lazy-loaded.
     *
     * Note: clipChildren is not set during initialization. Instead it is controlled
     * dynamically via setClipChildren() to support both overflow:visible and overflow:hidden.
     */
    private void init(Context context) {
        // 1. Create FlexboxLayout immediately (normal flow)
//        flexboxLayout = new FlexboxLayout(context);
        flexboxLayout = new FlexboxLayout(context) {

            @Override
            protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
                if (getFlexDirection() == FlexDirection.ROW || getFlexDirection() == FlexDirection.ROW_REVERSE) {

                    // Fix: when FlexWrap is WRAP, use UNSPECIFIED height so that
                    // FlexboxLayout can freely calculate its height based on content,
                    // avoiding the internal algorithm compressing the last row.
                    if (getFlexWrap() == FlexWrap.WRAP) {
                        int heightMode = MeasureSpec.getMode(heightMeasureSpec);
                        if (heightMode == MeasureSpec.EXACTLY || heightMode == MeasureSpec.AT_MOST) {
                            // Use UNSPECIFIED so content can fully adapt
                            heightMeasureSpec = MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED);
                        }
                        // Fix width calculation issues caused by flex-basis
                        if (MeasureSpec.getMode(widthMeasureSpec) == MeasureSpec.AT_MOST) {
                            widthMeasureSpec = MeasureSpec.makeMeasureSpec(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.EXACTLY);
                        }
                    }
                }
                super.onMeasure(widthMeasureSpec, heightMeasureSpec);
            }
        };
        FrameLayout.LayoutParams flexParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        );
        super.addView(flexboxLayout, 0, flexParams);

        Log.d(TAG, "FlexboxLayout created (normal flow)");

        // 2. ConstraintLayout is lazy-loaded.
        // constraintLayout is initialized to null and created via ensureConstraintLayout() when needed.
        Log.d(TAG, "FlexContainerLayout initialized (ConstraintLayout lazy-loaded)");
    }

    public void setFlexBasisPercent(View view, float percent) {
        // 1. Get LayoutParams and cast
        if (view.getLayoutParams() instanceof FlexboxLayout.LayoutParams) {
            FlexboxLayout.LayoutParams params = (FlexboxLayout.LayoutParams) view.getLayoutParams();

            // 2. Set the percentage (range 0.0 - 1.0)
            params.setFlexBasisPercent(percent);

            // 3. (Optional but recommended) Set the main-axis dimension to 0
            // Assuming main axis is row (horizontal), set width to 0
            params.width = 0;

            // 4. Apply params
            view.setLayoutParams(params);

            // 5. Request layout
            view.requestLayout();
        } else {
            throw new IllegalArgumentException("View's parent must be a FlexboxLayout");
        }
    }

    /**
     * Lazy-loads the ConstraintLayout.
     * Creates the ConstraintLayout only the first time an absolute-positioned element needs to be added.
     *
     * @return ConstraintLayout instance
     */
    private ConstraintLayout ensureConstraintLayout() {
        if (constraintLayout == null) {
            constraintLayout = new ConstraintLayout(getContext());
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
            );
            // Ensure ConstraintLayout is above FlexboxLayout
            // so that absolute-positioned elements appear on top of normal-flow elements
            super.addView(constraintLayout, 1, params);

            // Inherit the parent container's clipChildren setting
            constraintLayout.setClipChildren(getClipChildren());
            constraintLayout.setClipToPadding(getClipToPadding());

            Log.d(TAG, "ConstraintLayout lazy-loaded (absolute positioning layer)");
        }
        return constraintLayout;
    }

    /**
     * Returns the inner FlexboxLayout
     *
     * @return FlexboxLayout instance (already created in init)
     */
    public FlexboxLayout getFlexboxLayout() {
        return flexboxLayout;
    }

    /**
     * Overrides setClipChildren to synchronize the setting to all child containers.
     * This supports both overflow:visible and overflow:hidden.
     *
     * @param clipChildren true to clip children (overflow:hidden), false to not clip (overflow:visible)
     */
    @Override
    public void setClipChildren(boolean clipChildren) {
        super.setClipChildren(clipChildren);

        // Sync to FlexboxLayout
        if (flexboxLayout != null) {
            flexboxLayout.setClipChildren(clipChildren);
        }

        // Sync to ConstraintLayout (if already created)
        if (constraintLayout != null) {
            constraintLayout.setClipChildren(clipChildren);
        }

        Log.d(TAG, "setClipChildren: " + clipChildren + " (synced to all layers)");
    }

    /**
     * Overrides setClipToPadding to synchronize the setting to all child containers.
     *
     * @param clipToPadding true to clip to the padding boundary, false to not clip
     */
    @Override
    public void setClipToPadding(boolean clipToPadding) {
        super.setClipToPadding(clipToPadding);

        // Sync to FlexboxLayout
        if (flexboxLayout != null) {
            flexboxLayout.setClipToPadding(clipToPadding);
        }

        // Sync to ConstraintLayout (if already created)
        if (constraintLayout != null) {
            constraintLayout.setClipToPadding(clipToPadding);
        }

        Log.d(TAG, "setClipToPadding: " + clipToPadding + " (synced to all layers)");
    }

    @Override
    public void addView(View child) {
        addChildView(child, -1);
    }

    @Override
    public void addView(View child, int index) {
        addChildView(child, index);
    }

    /**
     * Adds a child View (smart version)
     * <p>
     * Automatically determines the target container based on the View's LayoutParams type:
     * - ConstraintLayout.LayoutParams → lazy-load ConstraintLayout and add (absolute positioning)
     * - Other types → add to FlexboxLayout (normal flow)
     *
     * @param child Child View
     * @param index Insertion index (only effective for normal flow)
     */
    public void addChildView(View child, int index) {
        if (child == null) {
            Log.w(TAG, "addChildView: child is null");
            return;
        }

        ViewGroup.LayoutParams params = child.getLayoutParams();

        // Determine the target container based on LayoutParams type
        if (params instanceof ConstraintLayout.LayoutParams) {
            // Absolute positioning: lazy-load ConstraintLayout and add
            // Absolute elements are not part of the normal flow, so just add directly
            ConstraintLayout layout = ensureConstraintLayout();
            layout.addView(child);
            Log.d(TAG, "Added absolute positioned child to ConstraintLayout (lazy-loaded)");
        } else {
            // Normal flow: add to FlexboxLayout (already created)
            // Add in order: if index is valid and does not exceed the current child count, use it;
            // otherwise append to the end, preserving normal-flow insertion order
            int currentCount = flexboxLayout.getChildCount();

            if (index >= 0 && index <= currentCount) {
                flexboxLayout.addView(child, index);
                Log.d(TAG, "Added normal flow child to FlexboxLayout at index " + index);
            } else {
                flexboxLayout.addView(child);
                Log.d(TAG, "Added normal flow child to FlexboxLayout at end (currentCount=" + currentCount + ")");
            }
        }
    }

    /**
     * Removes a child View
     *
     * @param child The child View to remove
     */
    @Override
    public void removeView(View child) {
        if (child == null) {
            Log.w(TAG, "removeView: child is null");
            return;
        }

        // Try to remove from ConstraintLayout (if already created)
        if (constraintLayout != null && child.getParent() == constraintLayout) {
            constraintLayout.removeView(child);
            Log.d(TAG, "Removed child from ConstraintLayout");
            return;
        }

        // Try to remove from FlexboxLayout
        if (flexboxLayout != null && child.getParent() == flexboxLayout) {
            flexboxLayout.removeView(child);
            Log.d(TAG, "Removed child from FlexboxLayout");
            return;
        }

        // Try to remove from FrameLayout
        if (child.getParent() == this) {
            super.removeView(child);
            Log.d(TAG, "Removed child from FrameLayout");
        }
    }


}
