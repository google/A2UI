package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.graphics.Color;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.view.CustomCheckBoxView;
import com.amap.agenui.render.style.ComponentStyleConfig;
import com.amap.agenui.render.style.StyleHelper;

import java.util.Map;

/**
 * CheckBox component implementation - compliant with A2UI v0.9 protocol
 * Uses a custom View to implement a rounded-rectangle CheckBox style
 *
 * Layout specification:
 * - checkbox on the left, text area on the right
 * - checkbox size: 16dp x 16dp (design spec: 32px x 32px)
 * - checkbox corner radius: 6dp (design spec: 12px)
 * - checkbox border width: 1.5dp (design spec: 3px)
 * - spacing between text and checkbox: 8dp (design spec: 16px)
 * - text font size: 16dp (design spec: 32px)
 * - text font color: black #000000
 * - overall height: wrap_content
 * - supports multi-line text
 *
 * Color specification:
 * - checked state background color: #2E82FF
 * - checked state checkmark color: white #FFFFFF
 * - unchecked state background color: transparent
 * - unchecked state border color: rgba(0, 0, 0, 0.1) i.e. #1A000000
 *
 * Supported properties:
 * - label: checkbox label text
 * - value: checkbox state (true/false)
 * - supports two-way data binding
 * 
 */
public class CheckBoxComponent extends A2UIComponent {

    private Context context;
    private LinearLayout outerContainer;
    private LinearLayout checkBoxContainer;
    private CustomCheckBoxView customCheckBox;
    private TextView labelTextView;
    private TextView errorTextView;
    private String dataPath;
    
    public CheckBoxComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "CheckBox");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }
    
    @Override
    protected View onCreateView(Context context) {
        this.context = context;
        // Load default style configuration
        Map<String, String> defaultStyles = ComponentStyleConfig.getInstance(context).getCheckBoxStyle();
        
        // Create outer vertical layout container
        outerContainer = new LinearLayout(context);
        outerContainer.setOrientation(LinearLayout.VERTICAL);

        // Create horizontal layout container (holds custom CheckBox and text)
        checkBoxContainer = new LinearLayout(context);
        checkBoxContainer.setOrientation(LinearLayout.HORIZONTAL);
        checkBoxContainer.setGravity(Gravity.CENTER_VERTICAL);
        // Overall height: wrap_content

        // Create custom CheckBox (on the left)
        customCheckBox = new CustomCheckBoxView(context);

        // Apply default styles to CheckBox
        applyCheckBoxDefaultStyles(customCheckBox, defaultStyles);

        // Create text label (on the right)
        labelTextView = new TextView(context);
        // Support multi-line
        labelTextView.setMaxLines(Integer.MAX_VALUE);
        labelTextView.setSingleLine(false);

        // Read text color from configuration
        String textColorStr = defaultStyles.get("text-color");
        if (textColorStr != null) {
            int textColor = StyleHelper.parseColor(textColorStr);
            labelTextView.setTextColor(textColor);
        }

        // Read text size from configuration
        String textSizeStr = defaultStyles.get("text-size");
        if (textSizeStr != null) {
            int textSizePx = StyleHelper.parseDimension(textSizeStr, context);
            labelTextView.setTextSize(TypedValue.COMPLEX_UNIT_PX, textSizePx);
        }

        // Text-to-checkbox spacing: read from configuration
        String textMarginStr = defaultStyles.get("text-margin");
        if (textMarginStr != null) {
            int textLeftMargin = StyleHelper.parseDimension(textMarginStr, context);
            labelTextView.setPadding(textLeftMargin, 0, 0, 0);
        }

        // Set text layout params to fill remaining space
        LinearLayout.LayoutParams textParams = new LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        textParams.weight = 1;
        labelTextView.setLayoutParams(textParams);

        // Add to horizontal container (checkbox first, then text)
        checkBoxContainer.addView(customCheckBox);
        checkBoxContainer.addView(labelTextView);
        
        // Set click listener (clicking anywhere in the row toggles the state)
        checkBoxContainer.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (customCheckBox.isEnabled()) {
                    customCheckBox.toggle();
                    sendDataChangeToNative(customCheckBox.isChecked());
                }
            }
        });
        
        outerContainer.addView(checkBoxContainer);

        // Create error message TextView
        errorTextView = new TextView(context);
        errorTextView.setTextColor(Color.RED);
        errorTextView.setTextSize(12);
        errorTextView.setVisibility(View.GONE);
        int errorPaddingH = StyleHelper.standardUnitToPx(context, 16);
        int errorPaddingV = StyleHelper.standardUnitToPx(context, 8);
        errorTextView.setPadding(errorPaddingH, errorPaddingV, errorPaddingH, 0);
        outerContainer.addView(errorTextView);
        
        // If properties already has values (updateProperties was called before onCreateView)
        // apply them immediately here
        if (!properties.isEmpty()) {
            applyProperties();
        }

        return outerContainer;
    }
    
    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        if (customCheckBox == null) {
            return;
        }
        applyProperties();
    }

    /**
     * Apply default styles to CheckBox
     */
    private void applyCheckBoxDefaultStyles(CustomCheckBoxView checkBox, Map<String, String> styles) {
        if (checkBox == null || styles == null || styles.isEmpty()) {
            return;
        }

        // checkbox-size
        if (styles.containsKey("checkbox-size")) {
            int size = StyleHelper.parseDimension(styles.get("checkbox-size"), context);
            checkBox.setSize(size);
        }

        // checkbox-background-color-selected
        if (styles.containsKey("checkbox-background-color-selected")) {
            int color = StyleHelper.parseColor(styles.get("checkbox-background-color-selected"));
            checkBox.setCheckedBackgroundColor(color);
        }

        // checkbox-border-color-selected
        if (styles.containsKey("checkbox-border-color-selected")) {
            int color = StyleHelper.parseColor(styles.get("checkbox-border-color-selected"));
            checkBox.setCheckedBorderColor(color);
        }

        // checkbox-background-color
        if (styles.containsKey("checkbox-background-color")) {
            int color = StyleHelper.parseColor(styles.get("checkbox-background-color"));
            checkBox.setUncheckedBackgroundColor(color);
        }

        // checkbox-border-color
        if (styles.containsKey("checkbox-border-color")) {
            int color = StyleHelper.parseColor(styles.get("checkbox-border-color"));
            checkBox.setUncheckedBorderColor(color);
        }

        // checkbox-border-width
        if (styles.containsKey("checkbox-border-width")) {
            float width = StyleHelper.parseDimension(styles.get("checkbox-border-width"), context);
            checkBox.setBorderWidth(width);
        }

        // checkbox-border-radius
        if (styles.containsKey("checkbox-border-radius")) {
            float radius = StyleHelper.parseDimension(styles.get("checkbox-border-radius"), context);
            checkBox.setCornerRadius(radius);
        }

        // checkbox-background-color-disabled
        if (styles.containsKey("checkbox-background-color-disabled")) {
            int color = StyleHelper.parseColor(styles.get("checkbox-background-color-disabled"));
            checkBox.setDisabledBackgroundColor(color);
        }

        // checkbox-border-color-disabled
        if (styles.containsKey("checkbox-border-color-disabled")) {
            int color = StyleHelper.parseColor(styles.get("checkbox-border-color-disabled"));
            checkBox.setDisabledBorderColor(color);
        }
    }
    
    /**
     * Apply properties to CheckBox
     */
    private void applyProperties() {
        if (customCheckBox == null) {
            return;
        }

        // Handle styles property (custom styles)
        if (properties.containsKey("styles")) {
            Object stylesValue = properties.get("styles");
            if (stylesValue instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> stylesMap = (Map<String, Object>) stylesValue;
                applyCustomStyles(stylesMap);
            }
        }
        
        // Update label text
        if (properties.containsKey("label")) {
            Object labelObj = properties.get("label");
            String label = extractStringValue(labelObj);
            if (label != null) {
                labelTextView.setText(label);
            }
        }
        
        // Update checkbox state (A2UI v0.9 protocol: value)
        if (properties.containsKey("value")) {
            Object valueObj = properties.get("value");
            boolean checked = extractBooleanValue(valueObj);
            
            // Set checked state (without triggering data change event)
            customCheckBox.setChecked(checked);
            
            // Extract data path for two-way binding
            if (valueObj instanceof Map) {
                Map<String, Object> valueMap = (Map<String, Object>) valueObj;
                if (valueMap.containsKey("path")) {
                    dataPath = String.valueOf(valueMap.get("path"));
                }
            }
        }

        // checks adapter - show red error text below CheckBox
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
                    // Disable CheckBox (CustomCheckBoxView.setEnabled automatically applies disabled color and opacity)
                    customCheckBox.setEnabled(false);
                    checkBoxContainer.setEnabled(false);

                    // Apply disabled state text color
                    Map<String, String> defaultStyles = ComponentStyleConfig.getInstance(context).getCheckBoxStyle();
                    String textColorDisabledStr = defaultStyles.get("text-color-disabled");
                    if (textColorDisabledStr != null) {
                        int textColorDisabled = StyleHelper.parseColor(textColorDisabledStr);
                        labelTextView.setTextColor(textColorDisabled);
                    }
                } else {
                    errorTextView.setVisibility(View.GONE);
                    // Enable CheckBox (CustomCheckBoxView.setEnabled automatically restores normal color and opacity)
                    customCheckBox.setEnabled(true);
                    checkBoxContainer.setEnabled(true);

                    // Restore normal state text color
                    Map<String, String> defaultStyles = ComponentStyleConfig.getInstance(context).getCheckBoxStyle();
                    String textColorStr = defaultStyles.get("text-color");
                    if (textColorStr != null) {
                        int textColor = StyleHelper.parseColor(textColorStr);
                        labelTextView.setTextColor(textColor);
                    }
                }
            }
        }
    }

    /**
     * Apply custom styles
     */
    private void applyCustomStyles(Map<String, Object> styles) {
        if (styles == null || styles.isEmpty()) {
            return;
        }

        // Handle CheckBox style properties
        if (styles.containsKey("checkbox-size")) {
            int size = StyleHelper.parseDimension(styles.get("checkbox-size"), context);
            customCheckBox.setSize(size);
        }

        if (styles.containsKey("checkbox-background-color-selected")) {
            int color = StyleHelper.parseColor(styles.get("checkbox-background-color-selected"));
            customCheckBox.setCheckedBackgroundColor(color);
        }

        if (styles.containsKey("checkbox-border-color-selected")) {
            int color = StyleHelper.parseColor(styles.get("checkbox-border-color-selected"));
            customCheckBox.setCheckedBorderColor(color);
        }

        if (styles.containsKey("checkbox-background-color")) {
            int color = StyleHelper.parseColor(styles.get("checkbox-background-color"));
            customCheckBox.setUncheckedBackgroundColor(color);
        }

        if (styles.containsKey("checkbox-border-color")) {
            int color = StyleHelper.parseColor(styles.get("checkbox-border-color"));
            customCheckBox.setUncheckedBorderColor(color);
        }

        if (styles.containsKey("checkbox-border-width")) {
            float width = StyleHelper.parseDimension(styles.get("checkbox-border-width"), context);
            customCheckBox.setBorderWidth(width);
        }

        if (styles.containsKey("checkbox-border-radius")) {
            float radius = StyleHelper.parseDimension(styles.get("checkbox-border-radius"), context);
            customCheckBox.setCornerRadius(radius);
        }

        // checkbox-background-color-disabled
        if (styles.containsKey("checkbox-background-color-disabled")) {
            int color = StyleHelper.parseColor(styles.get("checkbox-background-color-disabled"));
            customCheckBox.setDisabledBackgroundColor(color);
        }

        // checkbox-border-color-disabled
        if (styles.containsKey("checkbox-border-color-disabled")) {
            int color = StyleHelper.parseColor(styles.get("checkbox-border-color-disabled"));
            customCheckBox.setDisabledBorderColor(color);
        }

        // Handle text-margin
        if (styles.containsKey("text-margin")) {
            int margin = StyleHelper.parseDimension(styles.get("text-margin"), context);
            labelTextView.setPadding(margin, 0, 0, 0);
        }

        // Handle text-color
        if (styles.containsKey("text-color")) {
            int color = StyleHelper.parseColor(styles.get("text-color"));
            labelTextView.setTextColor(color);
        }

        // Handle text-size
        if (styles.containsKey("text-size")) {
            int size = StyleHelper.parseDimension(styles.get("text-size"), context);
            labelTextView.setTextSize(TypedValue.COMPLEX_UNIT_PX, size);
        }

        // Apply text styles (using StyleHelper.applyTextStyles)
        StyleHelper.applyTextStyles(labelTextView, styles, context);
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
     * Extract boolean value
     */
    private boolean extractBooleanValue(Object obj) {
        if (obj instanceof Boolean) {
            return (Boolean) obj;
        } else if (obj instanceof String) {
            return Boolean.parseBoolean((String) obj);
        } else if (obj instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) obj;
            if (map.containsKey("literalBoolean")) {
                Object value = map.get("literalBoolean");
                if (value instanceof Boolean) {
                    return (Boolean) value;
                }
                return Boolean.parseBoolean(String.valueOf(value));
            } else if (map.containsKey("path")) {
                return false;
            }
        }
        return false;
    }

    /**
     * Send data change to native
     */
    private void sendDataChangeToNative(boolean checked) {
        syncState("{\"checked\": " + checked + "}");
    }

}
