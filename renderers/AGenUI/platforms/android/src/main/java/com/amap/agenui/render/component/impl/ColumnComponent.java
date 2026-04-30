package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.A2UILayoutComponent;
import com.amap.agenui.render.layout.FlexContainerLayout;
import com.google.android.flexbox.AlignItems;
import com.google.android.flexbox.FlexDirection;
import com.google.android.flexbox.FlexWrap;
import com.google.android.flexbox.FlexboxLayout;
import com.google.android.flexbox.JustifyContent;

import java.util.Map;

/**
 * Column component implementation (vertical layout) - compliant with A2UI v0.9 protocol
 *
 * Uses FlexContainerLayout (wraps FrameLayout + FlexboxLayout)
 *
 * Supported properties:
 * - children: list of child components (explicitList or template)
 * - justify: main-axis alignment (vertical) - start, center, end, spaceBetween, spaceAround, spaceEvenly, stretch
 * - align: cross-axis alignment (horizontal) - center, end, start, stretch
 *
 */
public class ColumnComponent extends A2UILayoutComponent {

    private static final String TAG = "ColumnComponent";

    private Context context;

    private FlexContainerLayout container;
    private FlexboxLayout flexboxLayout;

    public ColumnComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Column");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        // Use FlexContainerLayout (wraps the two-layer FrameLayout + FlexboxLayout structure)
        container = new FlexContainerLayout(context);

        // Get the internal FlexboxLayout
        flexboxLayout = container.getFlexboxLayout();

        // Set to vertical layout
        flexboxLayout.setFlexDirection(FlexDirection.COLUMN);
        flexboxLayout.setFlexWrap(FlexWrap.NOWRAP);

        // Default alignment
        flexboxLayout.setJustifyContent(JustifyContent.FLEX_START);
        flexboxLayout.setAlignItems(AlignItems.STRETCH);

        // 🔧 Key fix: apply existing properties immediately after creating the View,
        // because updateProperties may have been called before createView,
        // at which point flexboxLayout is null and styles cannot be applied.
        if (properties != null && !properties.isEmpty()) {
            onUpdateProperties(properties);
        }

        return container;
    }

    @Override
    public View createView(Context context, ViewGroup parent) {
        View view = super.createView(context, parent);

        // Key fix: disable clipping on the parent container to prevent child item shadows from being cut off.
        // This must be done immediately after the View is created, while the parent parameter is available.
        if (parent != null) {
            parent.setClipChildren(false);
            parent.setClipToPadding(false);
        }

        return view;
    }

    @Override
    public void onUpdateProperties(Map<String, Object> properties) {
        if (flexboxLayout == null) {
            return;
        }

        // Update main-axis alignment (A2UI v0.9 protocol: justify)
        if (properties.containsKey("justify")) {
            String justify = String.valueOf(properties.get("justify"));
            flexboxLayout.setJustifyContent(parseJustify(justify));
        }

        // Update cross-axis alignment (A2UI v0.9 protocol: align)
        if (properties.containsKey("align")) {
            String align = String.valueOf(properties.get("align"));
            flexboxLayout.setAlignItems(parseAlign(align));
        }

        // Handle child component list (children)
        if (properties.containsKey("children")) {
            // This part needs to be implemented in cooperation with Surface
        }
    }

    /**
     * Add a child component
     *
     * Supports two positioning modes:
     * 1. Normal document flow: add to FlexboxLayout
     * 2. absolute positioning: add to FrameLayout (out of document flow)
     *
     * Notes:
     * - LayoutParams have already been set in A2UILayoutComponent.addChild()
     * - FlexContainerLayout automatically determines the insertion target based on LayoutParams type
     * - All positioning style applications are handled by A2UILayoutComponent.addChild()
     */
    @Override
    public void addChild(A2UIComponent child) {
        super.addChild(child);  // Base class automatically sets the correct LayoutParams and applies styles

        if (child == null || child.getView() == null || container == null) {
            return;
        }

        // Add the child View using FlexContainerLayout's simplified method.
        // FlexContainerLayout automatically determines whether to add to FrameLayout or FlexboxLayout based on LayoutParams type.
        int index = getChildren().indexOf(child);
        container.addChildView(child.getView(), index);

        Log.d(TAG, "Added child: " + child.getId());
    }

    /**
     * Remove a child component
     */
    @Override
    public void removeChild(A2UIComponent child) {
        super.removeChild(child);
        if (container != null && child.getView() != null) {
            container.removeView(child.getView());
        }
    }

    /**
     * Parse justify (main-axis alignment)
     * A2UI v0.9 protocol values: start, center, end, spaceBetween, spaceAround, spaceEvenly, stretch
     */
    private int parseJustify(String value) {
        switch (value.toLowerCase()) {
            case "center":
                return JustifyContent.CENTER;
            case "end":
                return JustifyContent.FLEX_END;
            case "spacebetween":
                return JustifyContent.SPACE_BETWEEN;
            case "spacearound":
                return JustifyContent.SPACE_AROUND;
            case "spaceevenly":
                return JustifyContent.SPACE_EVENLY;
            case "stretch":
                // FlexboxLayout's JustifyContent has no STRETCH; use SPACE_BETWEEN as a fallback
                return JustifyContent.SPACE_BETWEEN;
            case "start":
            default:
                return JustifyContent.FLEX_START;
        }
    }

    /**
     * Parse align (cross-axis alignment)
     * A2UI v0.9 protocol values: center, end, start, stretch
     */
    private int parseAlign(String value) {
        switch (value.toLowerCase()) {
            case "center":
                return AlignItems.CENTER;
            case "end":
                return AlignItems.FLEX_END;
            case "stretch":
                return AlignItems.STRETCH;
            case "start":
            default:
                return AlignItems.FLEX_START;
        }
    }
}
