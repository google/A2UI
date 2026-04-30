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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * ChoicePicker component implementation
 *
 * Corresponds to the ChoicePicker component in the A2UI protocol.
 * Supports single-selection and multiple-selection modes.
 *
 * Supported properties:
 * - variant: variant type (String)
 *   - "mutuallyExclusive": single-selection mode (uses CustomCheckBoxView)
 *   - "multipleSelection": multiple-selection mode (uses CustomCheckBoxView)
 * - options: list of options (List<Map>)
 *   - label: option label (String)
 *   - value: option value (String)
 * - value: currently selected value (String or List<String>)
 * - styles: style configuration (Map)
 *   - orientation: layout orientation (String)
 *     - "vertical": vertical arrangement (default)
 *     - "horizontal": horizontal arrangement
 * - dataBinding: data binding path (String)
 *
 */
public class ChoicePickerComponent extends A2UIComponent {

    private LinearLayout containerLayout;
    private LinearLayout choiceContainer;
    private TextView errorTextView;
    private String variant = "mutuallyExclusive"; // default single-selection
    private String orientation = "vertical"; // default vertical arrangement
    private List<Map<String, Object>> options;
    private List<View> radioButtons;
    private List<View> checkBoxes;
    private String selectedRadioValue; // track the currently selected single-selection value
    private Map<String, String> styleConfig; // style configuration

    public ChoicePickerComponent(String id, Map<String, Object> properties) {
        super(id, "ChoicePicker");
        this.checkBoxes = new ArrayList<>();
        this.radioButtons = new ArrayList<>();
    }

    @Override
    public View onCreateView(Context context) {
        containerLayout = new LinearLayout(context);
        containerLayout.setOrientation(LinearLayout.VERTICAL);
        // Remove container padding

        // Load style configuration
        styleConfig = ComponentStyleConfig.getInstance(context).getComponentStyle("ChoicePicker");

        // Parse properties
        parseProperties();

        // Create selection container
        choiceContainer = new LinearLayout(context);
        int layoutOrientation = "horizontal".equals(orientation) ?
                LinearLayout.HORIZONTAL : LinearLayout.VERTICAL;
        choiceContainer.setOrientation(layoutOrientation);
        containerLayout.addView(choiceContainer);

        // Create different selection UIs based on variant
        if ("multipleSelection".equals(variant)) {
            createMultipleSelection(context);
        } else {
            createMutuallyExclusive(context);
        }

        // Create error message TextView
        errorTextView = new TextView(context);
        errorTextView.setTextColor(Color.RED);
        errorTextView.setTextSize(12);
        errorTextView.setVisibility(View.GONE);
        int errorPaddingH = StyleHelper.standardUnitToPx(context, 16);
        int errorPaddingV = StyleHelper.standardUnitToPx(context, 8);
        errorTextView.setPadding(errorPaddingH, errorPaddingV, errorPaddingH, 0);
        containerLayout.addView(errorTextView);

        // Apply checks property
        applyChecksProperty();

        return containerLayout;
    }

    /**
     * Parse component properties
     */
    private void parseProperties() {
        // Get variant
        if (properties.containsKey("variant")) {
            variant = (String) properties.get("variant");
        }

        // Get options
        if (properties.containsKey("options")) {
            Object optionsObj = properties.get("options");
            if (optionsObj instanceof List) {
                options = (List<Map<String, Object>>) optionsObj;
            }
        }

        // Get orientation from styles
        if (properties.containsKey("styles")) {
            Object stylesObj = properties.get("styles");
            if (stylesObj instanceof Map) {
                Map<String, Object> stylesMap = (Map<String, Object>) stylesObj;
                if (stylesMap.containsKey("orientation")) {
                    orientation = (String) stylesMap.get("orientation");
                }
            }
        }
    }

    /**
     * Apply the checks property
     */
    private void applyChecksProperty() {
        // checks adaptation - display red error text below the option group
        if (properties.containsKey("checks")) {
            Object checksValue = properties.get("checks");
            if (checksValue instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> checksMap = (Map<String, Object>) checksValue;
                Object resultObj = checksMap.get("result");
                boolean result = resultObj instanceof Boolean ? (Boolean) resultObj : true;
                String message = checksMap.containsKey("message") ?
                        String.valueOf(checksMap.get("message")) : "";

                if (errorTextView != null) {
                    errorTextView.setText(result ? "" : message);
                    errorTextView.setVisibility(result ? View.GONE : View.VISIBLE);
                }
                if (choiceContainer != null) {
                    choiceContainer.setEnabled(result);
                    choiceContainer.setAlpha(result ? 1.0f : 0.5f);
                }
            }
        }
    }

    /**
     * Create single-selection mode (uses CustomRadioButtonView)
     */
    private void createMutuallyExclusive(Context context) {
        radioButtons.clear();

        if (options != null) {
            String currentValue = getCurrentValue();
            selectedRadioValue = currentValue;

            for (int i = 0; i < options.size(); i++) {
                Map<String, Object> option = options.get(i);
                String label = (String) option.get("label");
                String value = (String) option.get("value");

                // Create horizontal layout container
                LinearLayout itemLayout = new LinearLayout(context);
                itemLayout.setOrientation(LinearLayout.HORIZONTAL);
                itemLayout.setGravity(Gravity.CENTER_VERTICAL);
                // Set option padding: 22px top/bottom, 24px left/right
                int paddingH = StyleHelper.standardUnitToPx(context, 24);
                int paddingV = StyleHelper.standardUnitToPx(context, 22);
                itemLayout.setPadding(paddingH, paddingV, paddingH, paddingV);
                itemLayout.setTag(value);

                // Create custom selection view
                CustomCheckBoxView radioView = new CustomCheckBoxView(context);
                applyCheckBoxStyle(context, radioView);
                radioView.setChecked(value != null && value.equals(currentValue));

                // Create text label
                TextView textView = new TextView(context);
                textView.setText(label);
                // Text size: read from style configuration
                String textSizeStr = styleConfig.get("text-size");
                int textSizePx = textSizeStr != null ?
                        StyleHelper.parseDimension(textSizeStr, context) :
                        StyleHelper.standardUnitToPx(context, 32);
                textView.setTextSize(TypedValue.COMPLEX_UNIT_PX, textSizePx);
                // Text color: read from style configuration
                String textColorStr = styleConfig.get("text-color");
                int textColor = textColorStr != null ?
                        StyleHelper.parseColor(textColorStr) :
                        Color.BLACK;
                textView.setTextColor(textColor);
                // Text-to-checkbox spacing: read from style configuration
                String textMarginStr = styleConfig.get("text-margin");
                int textLeftMargin = textMarginStr != null ?
                        StyleHelper.parseDimension(textMarginStr, context) :
                        StyleHelper.standardUnitToPx(context, 16);
                textView.setPadding(textLeftMargin, 0, 0, 0);
                LinearLayout.LayoutParams textParams = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                );
                textView.setLayoutParams(textParams);

                // Add to container
                itemLayout.addView(radioView);
                itemLayout.addView(textView);

                // Click the entire area to toggle selection state
                itemLayout.setOnClickListener(v -> {
                    String clickedValue = (String) v.getTag();
                    // Deselect all other options
                    for (View item : radioButtons) {
                        LinearLayout layout = (LinearLayout) item;
                        CustomCheckBoxView radio = (CustomCheckBoxView) layout.getChildAt(0);
                        String itemValue = (String) layout.getTag();
                        radio.setChecked(itemValue != null && itemValue.equals(clickedValue));
                    }
                    selectedRadioValue = clickedValue;
                    updateValue(clickedValue);
                });

                radioButtons.add(itemLayout);

                // Set layout params, apply choice-gap
                LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                );

                // Apply choice-gap (no gap needed for the first option)
                if (i > 0) {
                    String choiceGapStr = styleConfig.get("choice-gap");
                    if (choiceGapStr != null && !choiceGapStr.isEmpty()) {
                        int choiceGap = StyleHelper.parseDimension(choiceGapStr, context);
                        if ("horizontal".equals(orientation)) {
                            params.leftMargin = choiceGap;
                        } else {
                            params.topMargin = choiceGap;
                        }
                    }
                }

                itemLayout.setLayoutParams(params);

                choiceContainer.addView(itemLayout);
            }
        }
    }

    /**
     * Create multiple-selection mode (uses CustomCheckBoxView)
     */
    private void createMultipleSelection(Context context) {
        checkBoxes.clear();

        if (options != null) {
            List<String> currentValues = getCurrentValues();

            for (Map<String, Object> option : options) {
                String label = (String) option.get("label");
                String value = (String) option.get("value");

                // Create horizontal layout container
                LinearLayout itemLayout = new LinearLayout(context);
                itemLayout.setOrientation(LinearLayout.HORIZONTAL);
                itemLayout.setGravity(Gravity.CENTER_VERTICAL);
                // Set option padding: 22px top/bottom, 24px left/right
                int paddingH = StyleHelper.standardUnitToPx(context, 24);
                int paddingV = StyleHelper.standardUnitToPx(context, 22);
                itemLayout.setPadding(paddingH, paddingV, paddingH, paddingV);
                itemLayout.setTag(value);

                // Create custom CheckBox
                CustomCheckBoxView checkBoxView = new CustomCheckBoxView(context);
                applyCheckBoxStyle(context, checkBoxView);
                checkBoxView.setChecked(currentValues != null && currentValues.contains(value));

                // Create text label
                TextView textView = new TextView(context);
                textView.setText(label);
                // Text size: read from style configuration
                String textSizeStr = styleConfig.get("text-size");
                int textSizePx = textSizeStr != null ?
                        StyleHelper.parseDimension(textSizeStr, context) :
                        StyleHelper.standardUnitToPx(context, 32);
                textView.setTextSize(TypedValue.COMPLEX_UNIT_PX, textSizePx);
                // Text color: read from style configuration
                String textColorStr = styleConfig.get("text-color");
                int textColor = textColorStr != null ?
                        StyleHelper.parseColor(textColorStr) :
                        Color.BLACK;
                textView.setTextColor(textColor);
                // Text-to-checkbox spacing: read from style configuration
                String textMarginStr = styleConfig.get("text-margin");
                int textLeftMargin = textMarginStr != null ?
                        StyleHelper.parseDimension(textMarginStr, context) :
                        StyleHelper.standardUnitToPx(context, 16);
                textView.setPadding(textLeftMargin, 0, 0, 0);
                LinearLayout.LayoutParams textParams = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                );
                textView.setLayoutParams(textParams);

                // Add to container
                itemLayout.addView(checkBoxView);
                itemLayout.addView(textView);

                // Click the entire area to toggle selection state
                itemLayout.setOnClickListener(v -> {
                    checkBoxView.toggle();
                    updateMultipleValues();
                });

                checkBoxes.add(itemLayout);

                // Set layout params, apply choice-gap
                LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                );

                // Apply choice-gap (no gap needed for the first option)
                int index = checkBoxes.size() - 1;
                if (index > 0) {
                    String choiceGapStr = styleConfig.get("choice-gap");
                    if (choiceGapStr != null && !choiceGapStr.isEmpty()) {
                        int choiceGap = StyleHelper.parseDimension(choiceGapStr, context);
                        if ("horizontal".equals(orientation)) {
                            params.leftMargin = choiceGap;
                        } else {
                            params.topMargin = choiceGap;
                        }
                    }
                }

                itemLayout.setLayoutParams(params);

                choiceContainer.addView(itemLayout);
            }
        }
    }

    /**
     * Apply CheckBox style configuration
     */
    private void applyCheckBoxStyle(Context context, CustomCheckBoxView checkBoxView) {
        // 1. checkbox-size
        String sizeStr = styleConfig.get("checkbox-size");
        if (sizeStr != null) {
            int size = StyleHelper.parseDimension(sizeStr, context);
            checkBoxView.setSize(size);
        }

        // 2. checkbox-background-color-selected
        String bgColorSelectedStr = styleConfig.get("checkbox-background-color-selected");
        if (bgColorSelectedStr != null) {
            int color = StyleHelper.parseColor(bgColorSelectedStr);
            checkBoxView.setCheckedBackgroundColor(color);
        }

        // 3. checkbox-border-color-selected
        String borderColorSelectedStr = styleConfig.get("checkbox-border-color-selected");
        if (borderColorSelectedStr != null) {
            int color = StyleHelper.parseColor(borderColorSelectedStr);
            checkBoxView.setCheckedBorderColor(color);
        }

        // 4. checkbox-background-color
        String bgColorStr = styleConfig.get("checkbox-background-color");
        if (bgColorStr != null) {
            int color = StyleHelper.parseColor(bgColorStr);
            checkBoxView.setUncheckedBackgroundColor(color);
        }

        // 5. checkbox-border-color
        String borderColorStr = styleConfig.get("checkbox-border-color");
        if (borderColorStr != null) {
            int color = StyleHelper.parseColor(borderColorStr);
            checkBoxView.setUncheckedBorderColor(color);
        }

        // 6. checkbox-border-width
        String borderWidthStr = styleConfig.get("checkbox-border-width");
        if (borderWidthStr != null) {
            float borderWidth = StyleHelper.parseDimension(borderWidthStr, context);
            checkBoxView.setBorderWidth(borderWidth);
        }

        // 7. checkbox-border-radius
        String borderRadiusStr = styleConfig.get("checkbox-border-radius");
        if (borderRadiusStr != null) {
            float borderRadius = StyleHelper.parseDimension(borderRadiusStr, context);
            checkBoxView.setCornerRadius(borderRadius);
        }
    }

    /**
     * Get the current single-selection value
     */
    private String getCurrentValue() {
        if (properties.containsKey("value")) {
            Object value = properties.get("value");
            if (value instanceof String) {
                return (String) value;
            }
        }
        return null;
    }

    /**
     * Get the current multiple-selection value list
     */
    private List<String> getCurrentValues() {
        if (properties.containsKey("value")) {
            Object value = properties.get("value");
            if (value instanceof List) {
                return (List<String>) value;
            }
        }
        return new ArrayList<>();
    }

    /**
     * Update single-selection value
     */
    private void updateValue(String newValue) {
        properties.put("value", newValue);

        // Send data change to Native
        sendDataChangeToNative(newValue);
    }

    /**
     * Update multiple-selection values
     */
    private void updateMultipleValues() {
        List<String> selectedValues = new ArrayList<>();

        for (View item : checkBoxes) {
            LinearLayout layout = (LinearLayout) item;
            CustomCheckBoxView checkBoxView = (CustomCheckBoxView) layout.getChildAt(0);
            if (checkBoxView.isChecked()) {
                String value = (String) layout.getTag();
                if (value != null) {
                    selectedValues.add(value);
                }
            }
        }

        properties.put("value", selectedValues);

        // Send data change to Native
        sendDataChangeToNative(selectedValues);
    }


    @Override
    public void onUpdateProperties(Map<String, Object> properties) {
        // Recreate the view
        if (containerLayout != null && choiceContainer != null) {
            Context context = containerLayout.getContext();
            containerLayout.removeAllViews();

            // Reload style configuration
            styleConfig = ComponentStyleConfig.getInstance(context).getComponentStyle("ChoicePicker");

            // Parse properties
            parseProperties();

            // Recreate selection container
            choiceContainer = new LinearLayout(context);
            int layoutOrientation = "horizontal".equals(orientation) ?
                    LinearLayout.HORIZONTAL : LinearLayout.VERTICAL;
            choiceContainer.setOrientation(layoutOrientation);
            containerLayout.addView(choiceContainer);

            // Create different selection UIs based on variant
            if ("multipleSelection".equals(variant)) {
                createMultipleSelection(context);
            } else {
                createMutuallyExclusive(context);
            }

            // Recreate error message TextView
            errorTextView = new TextView(context);
            errorTextView.setTextColor(Color.RED);
            errorTextView.setTextSize(12);
            errorTextView.setVisibility(View.GONE);
            int errorPaddingH = StyleHelper.standardUnitToPx(context, 16);
            int errorPaddingV = StyleHelper.standardUnitToPx(context, 8);
            errorTextView.setPadding(errorPaddingH, errorPaddingV, errorPaddingH, 0);
            containerLayout.addView(errorTextView);

            // Apply checks property
            applyChecksProperty();
        }
    }

    /**
     * Send data change to Native (single-selection)
     */
    private void sendDataChangeToNative(String value) {
        syncState("{\"value\": \"" + value + "\"}");
    }

    /**
     * Send data change to Native (multiple-selection)
     */
    private void sendDataChangeToNative(List<String> values) {
        // Build JSON array string
        StringBuilder jsonArray = new StringBuilder("[");
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) jsonArray.append(",");
            jsonArray.append("\"").append(values.get(i)).append("\"");
        }
        jsonArray.append("]");
        syncState("{\"value\": " + jsonArray.toString() + "}");
    }

}
