package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.util.Log;
import android.view.ContextThemeWrapper;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.LinearLayout;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.style.StyleHelper;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Map;

/**
 * TextField component implementation (compliant with A2UI v0.9 protocol, supports two-way data binding)
 *
 * Supported properties:
 * - label: label text (displayed as hint)
 * - value: text value (supports literalString or path for data binding)
 * - variant: input type (longText, number, shortText, obscured)
 *
 */
public class TextFieldComponent extends A2UIComponent {

    private static final String TAG = "TextFieldComponent";

    private Context context;

    private TextInputLayout textInputLayout;
    private EditText editText;
    private String dataBindingPath;
    private boolean isUpdatingFromNative = false;
    private TextWatcher textWatcher = new TextWatcher() {
        @Override
        public void beforeTextChanged(CharSequence s, int start, int count, int after) {
        }

        @Override
        public void onTextChanged(CharSequence s, int start, int before, int count) {
        }

        @Override
        public void afterTextChanged(Editable s) {
            // Only send data changes to C++ when the user is typing
            if (!isUpdatingFromNative /*&& dataBindingPath != null && !dataBindingPath.isEmpty()*/) {
                String newValue = s.toString();
                sendDataChangeToNative(newValue);
            }
        }
    };

    public TextFieldComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "TextField");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        this.context = context;
        Context themeWrapper = new ContextThemeWrapper(context, androidx.appcompat.R.style.Theme_AppCompat_Light);
        // Create TextInputLayout container
        textInputLayout = new TextInputLayout(themeWrapper, null, com.google.android.material.R.attr.textInputOutlinedDenseStyle);
        textInputLayout.setBoxBackgroundMode(TextInputLayout.BOX_BACKGROUND_NONE);
        textInputLayout.setHintEnabled(false);
        textInputLayout.post(() -> textInputLayout.setShapeAppearanceModel(
                textInputLayout.getShapeAppearanceModel().toBuilder()
                        .setAllCornerSizes(0f) // set all corner sizes to 0
                        .build()
        ));

        // Create TextInputEditText (replacing the original EditText)
        editText = new TextInputEditText(textInputLayout.getContext());
        // Remove fixed style settings; use styles to set dynamically
        editText.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        editText.setBackground(null);

        textInputLayout.addView(editText);

        applyProperties();

        // Return TextInputLayout as the root View
        return textInputLayout;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        applyProperties();

        // Apply styles
        if (properties.containsKey("styles")) {
            Object stylesValue = properties.get("styles");
            if (stylesValue instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> styles = (Map<String, Object>) stylesValue;
                applyStyles(styles);
            }
        }
    }

    private void applyProperties() {
        if (editText == null) {
            return;
        }

        editText.removeTextChangedListener(textWatcher);

        // Update label (displayed as hint)
        if (properties.containsKey("label")) {
            Object labelValue = properties.get("label");
            String label = extractTextValue(labelValue);
            editText.setHint(label);
        }

        // Update text value (data update from C++)
        if (properties.containsKey("value")) {
            Object textValue = properties.get("value");

            // Extract data binding path
            if (textValue instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> textMap = (Map<String, Object>) textValue;
                if (textMap.containsKey("path")) {
                    dataBindingPath = String.valueOf(textMap.get("path"));
                }
            }

            // Update text content
            isUpdatingFromNative = true;
            String text = extractTextValue(textValue);
            if (!editText.getText().toString().equals(text)) {
                editText.setText(text);
                editText.setSelection(text.length()); // move cursor to the end
            }
            isUpdatingFromNative = false;
        }

        // Update input type (A2UI v0.9 protocol: variant)
        if (properties.containsKey("variant")) {
            String variant = String.valueOf(properties.get("variant"));
            editText.setInputType(parseVariant(variant));
        }

        // checks adaptation - use Android native setError() to display errors
        if (properties.containsKey("checks")) {
            Object checksValue = properties.get("checks");
            if (checksValue instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> checksMap = (Map<String, Object>) checksValue;
                Object resultObj = checksMap.get("result");
                boolean result = resultObj instanceof Boolean ? (Boolean) resultObj : true;
                String message = checksMap.containsKey("message") ?
                        String.valueOf(checksMap.get("message")) : "";

                if (!result && !message.isEmpty()) {
                    textInputLayout.setError(message);
                    textInputLayout.setErrorEnabled(true);
                } else {
                    textInputLayout.setError(null);
                    textInputLayout.setErrorEnabled(false);
                }
            }
        }

        // Set text change listener (for two-way binding)
        editText.addTextChangedListener(textWatcher);
    }

    /**
     * Extract text value (supports literalString or path)
     */
    private String extractTextValue(Object textValue) {
        if (textValue instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> textMap = (Map<String, Object>) textValue;

            // Support literalString
            if (textMap.containsKey("literalString")) {
                return String.valueOf(textMap.get("literalString"));
            }

            // Support path (data binding)
            if (textMap.containsKey("path")) {
                // Temporarily return the path itself as a placeholder
                return "";
            }
        }

        // Direct string
        return String.valueOf(textValue);
    }

    /**
     * Parse input type variant.
     * A2UI v0.9 protocol values: longText, number, shortText, obscured
     */
    private int parseVariant(String variant) {
        switch (variant.toLowerCase()) {
            case "number":
                return InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL | InputType.TYPE_NUMBER_FLAG_SIGNED;
            case "longtext":
                return InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE;
            case "obscured":
                return InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD;
            case "shorttext":
            default:
                return InputType.TYPE_CLASS_TEXT;
        }
    }

    /**
     * Send data change to the C++ DataBinding Module
     */
    private void sendDataChangeToNative(String value) {
        try {
            JSONObject json = new JSONObject();
            json.put("value", value);
            syncState(json.toString());
        } catch (JSONException e) {
            Log.e(TAG, "sendDataChangeToNative: failed to build JSON", e);
        }
    }

    /**
     * Apply styles (compatible with all style properties from TextComponent).
     * Uses StyleHelper.applyTextStyles for unified text style handling.
     */
    private void applyStyles(Map<String, Object> styles) {
        if (styles == null || styles.isEmpty() || editText == null) {
            return;
        }

        editText.removeTextChangedListener(textWatcher);

        // Get the current variant to determine if we are in longText mode
        String variant = properties.containsKey("variant") ?
                String.valueOf(properties.get("variant")).toLowerCase() : "shorttext";

        // 1. Use StyleHelper for unified text style handling
        StyleHelper.applyTextStyles(editText, styles, context);

        // 2. TextField specific: handle hint color
        if (styles.containsKey("color")) {
            Object colorValue = styles.get("color");
            int color = StyleHelper.parseColor(colorValue);
            if (color != 0) {
                // Use the same color with reduced alpha for the hint
                editText.setHintTextColor(Color.argb(128, Color.red(color), Color.green(color), Color.blue(color)));
            } else {
                editText.setHintTextColor(Color.GRAY);
            }
        }

        // 3. TextField specific: handle line-clamp and text-overflow based on variant mode
        if (variant.equals("longtext")) {
            // longText mode: support multiple lines (StyleHelper already handles line-clamp)
            // No additional processing needed
        } else {
            // Other modes: force single line
            editText.setMaxLines(1);
            editText.setSingleLine(true);
            // text-overflow is already handled by StyleHelper
        }

        // 4. TextField specific: apply border color
        if (styles.containsKey("border-color") && textInputLayout != null) {
            Object value = styles.get("border-color");
            if (value != null) {
                try {
                    String colorStr = String.valueOf(value).trim();
                    setDefaultStrokeColorOnly(Color.parseColor(colorStr));
                } catch (Exception e) {
                    Log.w(TAG, "Failed to parse color: " + value, e);
                }
            }
        }

        editText.addTextChangedListener(textWatcher);
    }

    private void setDefaultStrokeColorOnly(int newDefaultColor) {

        // getBoxStrokeColor() source directly returns focusedStrokeColor
        int focusedColor = textInputLayout.getBoxStrokeColor();

        int[][] states = new int[][]{
                new int[]{android.R.attr.state_focused, android.R.attr.state_enabled},
                new int[]{}  // default
        };

        int[] colors = new int[]{
                focusedColor,   // keep the original focused color
                newDefaultColor // only change the default color
        };

        textInputLayout.setBoxStrokeColorStateList(new ColorStateList(states, colors));
    }


}
