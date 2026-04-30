package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.style.StyleHelper;

import java.util.Map;

/**
 * Text component implementation (compliant with A2UI v0.9 protocol)
 *
 * Supported properties:
 * - text: text content (supports literalString or path)
 * - variant: text style hint (h1, h2, h3, h4, h5, caption, body)
 * - styles: W3C standard style properties
 *   - line-clamp: maximum number of lines (unlimited when <= 0)
 *   - line-height: line height (supports multiplier like 0.5, or pixel value like 10px;
 *     note: px is not supported in multi-line scenarios, must use multiplier)
 *   - text-overflow: text overflow handling (clip, ellipsis, head, middle)
 *     * ellipsis: tail ellipsis (requires line-clamp=1, otherwise treated as clip)
 *     * head: head ellipsis (requires line-clamp=1)
 *     * middle: middle ellipsis (requires line-clamp=1)
 *   - text-align: text alignment (supports horizontal + vertical combinations,
 *     e.g. "left top", "center center", "right bottom")
 *   - color: text color (supports hex color or color token such as "f_c_2")
 *   - font-size: font size (px only)
 *   - font-weight: font weight (bold only)
 *   - font-family: font family (supports system default fonts and custom fonts:
 *     Oswald-Regular, AlibabaSans-HeavyItalic, Eurostile-BoldOblique,
 *     AlibabaSans102-Bold, AlibabaSans102-Regular, AmapNumber-Medium, AmapNumber-Bold)
 *   - text-decoration: text decoration shorthand (e.g. "underline dashed #FF0000")
 *   - text-decoration-line: decoration line type (underline, line-through)
 *   - text-decoration-style: decoration line style (solid, dashed, dotted, double, wavy)
 *   - text-decoration-thickness: decoration line thickness (e.g. "1px", "2px", "3px")
 *   - text-decoration-color: decoration line color (supports hex color)
 *
 */
public class TextComponent extends A2UIComponent {

    private static final String TAG = "TextComponent";

    private Context context;

    private TextView textView;

    private StringBuilder currentText = new StringBuilder(); // stores the current full text

    public TextComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Text");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        if (this.context == null) {
            this.context = context;
        }
        textView = new TextView(context);
        textView.setLayoutParams(new ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        // ⚠️ Important: apply initial properties
        onUpdateProperties(this.properties);

        return textView;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        if (textView == null) {
            return;
        }

        // Handle text update (overwrite existing content)
        if (properties.containsKey("text")) {
            Object textValue = properties.get("text");
            String text = extractTextValue(textValue);
            currentText = new StringBuilder(text);
            textView.setText(currentText.toString());
        }
        // Handle text append
        else if (properties.containsKey("textChunk")) {
            Object textValue = properties.get("textChunk");
            String textChunk = extractTextValue(textValue);
            if (textChunk != null) {
                // Incrementally append text
                currentText.append(textChunk);
                textView.setText(currentText.toString());
            }
        }

        // Apply custom styles (override variant preset styles)
        if (properties.containsKey("styles")) {
            try {
                Object stylesValue = properties.get("styles");
                if (stylesValue instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> styles = (Map<String, Object>) stylesValue;
                    applyStyles(styles);
                }
            } catch (Exception e) {
                Log.e(TAG, "Failed to apply styles", e);
            }

        }
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
                return String.valueOf(textMap.get("path"));
            }
        }

        // Direct string
        return String.valueOf(textValue);
    }

    /**
     * Apply W3C standard style properties.
     * Uses StyleHelper.applyTextStyles for unified text style handling.
     *
     * @param styles style Map
     */
    private void applyStyles(Map<String, Object> styles) {
        if (styles == null || styles.isEmpty()) {
            return;
        }

        // Use StyleHelper for unified text style handling
        StyleHelper.applyTextStyles(textView, styles, context);
    }

    @Override
    protected void onDestroy() {
        currentText.setLength(0);
        textView = null;
    }

}
