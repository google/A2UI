package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.style.ComponentStyleConfig;
import com.amap.agenui.render.style.StyleHelper;

import java.util.Map;

/**
 * Button component implementation (compliant with A2UI v0.9 protocol)
 *
 * Supported properties:
 * - child: child component ID (typically a Text or Icon component) - required
 * - variant: button style (primary, borderless)
 * - action: click action definition - required
 * - value: optional boolean value (inherited from Checkable)
 *
 * Design notes:
 * - Button is a container component that can hold one child component (Text or Icon)
 * - Uses FrameLayout as the container to support adding child components
 * - Child components are added via Surface.addComponent() and are not created inside Button
 *
 */
public class ButtonComponent extends A2UIComponent {

    private static final String TAG = "ButtonComponent";

    private Context context;
    private LinearLayout buttonContainer;
    private String childComponentId;

    public ButtonComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Button");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        // Use FrameLayout as the button container to support child components
        buttonContainer = new LinearLayout(context);
        buttonContainer.setOrientation(LinearLayout.VERTICAL);
        buttonContainer.setGravity(Gravity.CENTER);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        );
        lp.gravity = Gravity.CENTER;
        buttonContainer.setLayoutParams(lp);

        // Note: click listener is automatically set by the base class A2UIComponent
        // No need to set it manually here

        // Important: if properties already has attributes, apply them immediately here
        if (!properties.isEmpty()) {
            applyProperties();
        }

        return buttonContainer;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        if (buttonContainer == null) {
            return;
        }
        applyProperties();
    }

    /**
     * Apply properties to the Button
     */
    private void applyProperties() {
        if (buttonContainer == null) {
            return;
        }

        // Update child component ID
        if (properties.containsKey("child")) {
            childComponentId = String.valueOf(properties.get("child"));
            // Note: the child component's View is automatically added via Surface.addComponent()
            // No manual handling needed here
        }

        // Note: the action property is handled by the base class A2UIComponent
        // No need to save actionDef here

        // checks adaptation
        if (properties.containsKey("checks")) {
            Object checksValue = properties.get("checks");
            if (checksValue instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> checksMap = (Map<String, Object>) checksValue;
                Object resultObj = checksMap.get("result");
                boolean result = resultObj instanceof Boolean ? (Boolean) resultObj : true;

                // Control clickability and enabled state
                buttonContainer.setClickable(result);
                buttonContainer.setEnabled(result);
            }
        }

        // disable property adaptation
        boolean isDisabled = false;  // default is enabled (not disabled)
        if (properties.containsKey("disable")) {
            Object disableValue = properties.get("disable");
            if (disableValue instanceof Boolean) {
                isDisabled = (Boolean) disableValue;
            }
        }

        // Set the button's clickable state
        buttonContainer.setClickable(!isDisabled);
        buttonContainer.setEnabled(!isDisabled);

        // Apply styles (including disabled state styles)
        if (properties.containsKey("styles")) {
            Object stylesValue = properties.get("styles");
            if (stylesValue instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> styles = (Map<String, Object>) stylesValue;
                applyStyles(styles, isDisabled);
            }
        }
    }

    // Note: handleClick() method has been removed; using the generic implementation from base class A2UIComponent

    /**
     * dp to px conversion
     */
    private int dpToPx(float dp) {
        return (int) (dp * context.getResources().getDisplayMetrics().density);
    }

    /**
     * Override shouldAutoAddChildView to return true.
     * Button component needs to automatically add child component Views.
     */
    @Override
    public boolean shouldAutoAddChildView() {
        return true;
    }

    /**
     * Apply styles
     *
     * @param styles     style Map
     * @param isDisabled whether in disabled state
     */
    private void applyStyles(Map<String, Object> styles, boolean isDisabled) {
        if (styles == null || styles.isEmpty()) {
            return;
        }

        if (isDisabled) {

            // Apply disabled state opacity
            ComponentStyleConfig config = ComponentStyleConfig.getInstance(context);
            String opacityStr = config.getStyleValue("Button", "disabled-opacity", "0.5");

            try {
                float opacity = Float.parseFloat(opacityStr);
                // Ensure opacity is between 0.0 and 1.0
                opacity = Math.max(0.0f, Math.min(1.0f, opacity));
                buttonContainer.setAlpha(opacity);
            } catch (NumberFormatException e) {
                // Parse failed, use default value 0.5
                Log.w(TAG, "Failed to parse disabled-opacity, using default 0.5");
                buttonContainer.setAlpha(0.5f);
            }
        } else {
            // Enabled state, restore full opacity
            buttonContainer.setAlpha(1.0f);

            if (styles.containsKey("background-color")) {
                String colorStr = String.valueOf(styles.get("background-color"));
                int color = StyleHelper.parseColor(colorStr);
                if (color != 0) {
                    setButtonColor(color);
                } else {
                    setButtonColor(Color.TRANSPARENT);
                }
            } else {
                // If no background-color, set to transparent
                setButtonColor(Color.TRANSPARENT);
            }
        }
    }

    private void setButtonColor(int color) {
        Drawable drawable = buttonContainer.getBackground();
        if (drawable instanceof GradientDrawable) {
            ((GradientDrawable) drawable).setColor(color);
            buttonContainer.setBackground(drawable);
        }
    }
}
