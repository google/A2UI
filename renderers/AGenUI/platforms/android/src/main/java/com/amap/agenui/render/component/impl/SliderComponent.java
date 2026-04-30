package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.graphics.Color;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.view.CustomSliderView;
import com.amap.agenui.render.style.ComponentStyleConfig;
import com.amap.agenui.render.style.StyleHelper;

import java.util.Map;

/**
 * Slider component implementation - compliant with A2UI v0.9 protocol
 *
 * Supported properties:
 * - label: slider label text
 * - min: minimum value
 * - max: maximum value
 * - value: current value
 * - supports two-way data binding
 *
 * Supported style properties (read from component_styles.json):
 * - slider-height: overall slider height
 * - track-height: track height
 * - track-corner-radius: track corner radius
 * - minimum-track-color: color of the track portion already passed
 * - maximum-track-color: color of the track portion not yet passed
 * - thumb-outer-diameter: outer circle diameter of the thumb
 * - thumb-outer-color: outer circle color of the thumb
 * - thumb-inner-diameter: inner circle diameter of the thumb
 * - thumb-inner-color: inner circle color of the thumb
 *
 */
public class SliderComponent extends A2UIComponent {

    private Context context;

    private LinearLayout containerLayout;
    private TextView labelTextView;
    private CustomSliderView sliderView;
    private TextView errorTextView;
    private String dataPath;
    private float minValue = 0;
    private float maxValue = 100;
    private Map<String, String> styleConfig;

    public SliderComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Slider");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        // Load style configuration
        styleConfig = ComponentStyleConfig.getInstance(context).getComponentStyle("Slider");

        // Create vertical layout container
        containerLayout = new LinearLayout(context);
        containerLayout.setOrientation(LinearLayout.VERTICAL);
        containerLayout.setPadding(0, StyleHelper.standardUnitToPx(context, 8), 0, StyleHelper.standardUnitToPx(context, 8));

        // Create label
        labelTextView = new TextView(context);
        labelTextView.setTextSize(14);
        labelTextView.setVisibility(View.GONE);
        containerLayout.addView(labelTextView);

        // Create custom slider
        sliderView = new CustomSliderView(context);

        // Apply style configuration
        applySliderStyles(context);

        // Set slider change listener (two-way binding)
        sliderView.setOnProgressChangeListener(new CustomSliderView.OnProgressChangeListener() {
            @Override
            public void onProgressChanged(float progress, boolean fromUser) {
                if (fromUser) {
                    // Convert progress to actual value
                    float actualValue = minValue + progress * (maxValue - minValue);
                    sendDataChangeToNative(actualValue);
                }
            }
        });

        containerLayout.addView(sliderView);

        // Create error message TextView
        errorTextView = new TextView(context);
        errorTextView.setTextColor(Color.RED);
        errorTextView.setTextSize(12);
        errorTextView.setVisibility(View.GONE);
        int errorPaddingH = StyleHelper.standardUnitToPx(context, 8);
        int errorPaddingV = StyleHelper.standardUnitToPx(context, 4);
        errorTextView.setPadding(errorPaddingH, errorPaddingV, errorPaddingH, 0);
        containerLayout.addView(errorTextView);

        applyProperties();
        return containerLayout;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        applyProperties();
    }

    /**
     * Apply slider style configuration
     */
    private void applySliderStyles(Context context) {
        if (styleConfig == null || sliderView == null) {
            return;
        }

        // 1. slider-height
        String sliderHeightStr = styleConfig.get("slider-height");
        if (sliderHeightStr != null) {
            int height = StyleHelper.parseDimension(sliderHeightStr, context);
            sliderView.setSliderHeight(height);
        }

        // 2. track-height
        String trackHeightStr = styleConfig.get("track-height");
        if (trackHeightStr != null) {
            int height = StyleHelper.parseDimension(trackHeightStr, context);
            sliderView.setTrackHeight(height);
        }

        // 3. track-corner-radius
        String trackCornerRadiusStr = styleConfig.get("track-corner-radius");
        if (trackCornerRadiusStr != null) {
            float radius = StyleHelper.parseDimension(trackCornerRadiusStr, context);
            sliderView.setTrackCornerRadius(radius);
        }

        // 4. minimum-track-color
        String minimumTrackColorStr = styleConfig.get("minimum-track-color");
        if (minimumTrackColorStr != null) {
            int color = StyleHelper.parseColor(minimumTrackColorStr);
            sliderView.setMinimumTrackColor(color);
        }

        // 5. maximum-track-color
        String maximumTrackColorStr = styleConfig.get("maximum-track-color");
        if (maximumTrackColorStr != null) {
            int color = StyleHelper.parseColor(maximumTrackColorStr);
            sliderView.setMaximumTrackColor(color);
        }

        // 6. thumb-outer-diameter
        String thumbOuterDiameterStr = styleConfig.get("thumb-outer-diameter");
        if (thumbOuterDiameterStr != null) {
            int diameter = StyleHelper.parseDimension(thumbOuterDiameterStr, context);
            sliderView.setThumbOuterDiameter(diameter);
        }

        // 7. thumb-outer-color
        String thumbOuterColorStr = styleConfig.get("thumb-outer-color");
        if (thumbOuterColorStr != null) {
            int color = StyleHelper.parseColor(thumbOuterColorStr);
            sliderView.setThumbOuterColor(color);
        }

        // 8. thumb-inner-diameter
        String thumbInnerDiameterStr = styleConfig.get("thumb-inner-diameter");
        if (thumbInnerDiameterStr != null) {
            int diameter = StyleHelper.parseDimension(thumbInnerDiameterStr, context);
            sliderView.setThumbInnerDiameter(diameter);
        }

        // 9. thumb-inner-color
        String thumbInnerColorStr = styleConfig.get("thumb-inner-color");
        if (thumbInnerColorStr != null) {
            int color = StyleHelper.parseColor(thumbInnerColorStr);
            sliderView.setThumbInnerColor(color);
        }
    }

    private void applyProperties() {
        if (containerLayout == null) {
            return;
        }

        // Update label
        if (properties.containsKey("label")) {
            Object labelObj = properties.get("label");
            String label = extractStringValue(labelObj);
            if (label != null) {
                labelTextView.setText(label);
            }
        }

        // Update minimum value
        if (properties.containsKey("min")) {
            Object minObj = properties.get("min");
            minValue = extractNumberValue(minObj);
        }

        // Update maximum value
        if (properties.containsKey("max")) {
            Object maxObj = properties.get("max");
            maxValue = extractNumberValue(maxObj);
        }

        // Update current value
        if (properties.containsKey("value")) {
            Object valueObj = properties.get("value");
            float value = extractNumberValue(valueObj);

            // Convert actual value to progress (0.0-1.0)
            float progress = (value - minValue) / (maxValue - minValue);
            sliderView.setProgress(progress);

            // Extract data path for two-way binding
            if (valueObj instanceof Map) {
                Map<String, Object> valueMap = (Map<String, Object>) valueObj;
                if (valueMap.containsKey("path")) {
                    dataPath = String.valueOf(valueMap.get("path"));
                }
            }
        }

        // checks adaptation - display red error text below the slider
        if (properties.containsKey("checks")) {
            Object checksValue = properties.get("checks");
            if (checksValue instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> checksMap = (Map<String, Object>) checksValue;
                Object resultObj = checksMap.get("result");
                boolean result = resultObj instanceof Boolean ? (Boolean) resultObj : true;
                String message = checksMap.containsKey("message") ?
                        String.valueOf(checksMap.get("message")) : "";

                if (!result && message != null && !message.isEmpty()) {
                    errorTextView.setText(message);
                    errorTextView.setVisibility(View.VISIBLE);
                    // Optional: disable the slider
                    sliderView.setEnabled(false);
                    sliderView.setAlpha(0.5f);
                } else {
                    errorTextView.setVisibility(View.GONE);
                    sliderView.setEnabled(true);
                    sliderView.setAlpha(1.0f);
                }
            }
        }
    }

    /**
     * Extract string value
     */
    private String extractStringValue(Object obj) {
        if (obj instanceof String) {
            return (String) obj;
        } else if (obj instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) obj;
            if (map.containsKey("literalString")) {
                return String.valueOf(map.get("literalString"));
            } else if (map.containsKey("path")) {
                return String.valueOf(map.get("path"));
            }
        }
        return null;
    }

    /**
     * Extract numeric value
     */
    private float extractNumberValue(Object obj) {
        if (obj instanceof Number) {
            return ((Number) obj).floatValue();
        } else if (obj instanceof String) {
            try {
                return Float.parseFloat((String) obj);
            } catch (NumberFormatException e) {
                return 0;
            }
        } else if (obj instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) obj;
            if (map.containsKey("literalNumber")) {
                Object value = map.get("literalNumber");
                if (value instanceof Number) {
                    return ((Number) value).floatValue();
                }
                try {
                    return Float.parseFloat(String.valueOf(value));
                } catch (NumberFormatException e) {
                    return 0;
                }
            } else if (map.containsKey("path")) {
                return 0;
            }
        }
        return 0;
    }

    /**
     * Send data change to Native
     */
    private void sendDataChangeToNative(float value) {
        syncState("{\"value\": " + value + "}");
    }

}
