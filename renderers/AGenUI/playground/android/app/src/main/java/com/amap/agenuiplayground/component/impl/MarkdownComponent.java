package com.amap.agenuiplayground.component.impl;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Paint;
import android.text.style.LineHeightSpan;
import android.util.Log;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.impl.span.CustomBackgroundSpan;
import com.amap.agenui.render.style.StyleHelper;

import org.commonmark.node.Heading;
import org.commonmark.node.Paragraph;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

import io.noties.markwon.AbstractMarkwonPlugin;
import io.noties.markwon.Markwon;
import io.noties.markwon.MarkwonConfiguration;
import io.noties.markwon.MarkwonSpansFactory;
import io.noties.markwon.RenderProps;
import io.noties.markwon.SpanFactory;
import io.noties.markwon.ext.tables.TablePlugin;
import io.noties.markwon.html.HtmlPlugin;
import io.noties.markwon.html.HtmlTag;
import io.noties.markwon.html.tag.SimpleTagHandler;

/**
 * Markdown component implementation
 * <p>
 * Based on io.noties.markwon:core for rendering Markdown-formatted text
 * <p>
 * Supported properties:
 * - content: Markdown text content (required; defaults to streaming incremental append)
 * <p>
 * Usage example:
 * {
 * "id": "markdown1",
 * "component": "Markdown",
 * "content": "# Hello World"
 * }
 * <p>
 * Streaming incremental append example (multiple content updates are automatically appended):
 * {
 * "id": "markdown1",
 * "content": "\n\nThis is "
 * }
 * {
 * "id": "markdown1",
 * "content": "**bold** "
 * }
 * {
 * "id": "markdown1",
 * "content": "and *italic* text."
 * }
 * <p>
 * Supported Markdown syntax:
 * - Headings:    # H1, ## H2, ### H3, etc.
 * - Bold:        **bold** or __bold__
 * - Italic:      *italic* or _italic_
 * - Lists:       - item or * item or 1. item
 * - Links:       [text](url)
 * - Images:      ![alt](url)
 * - Code:        `code` or ```code block```
 * - Blockquote:  > quote
 * - Divider:     ---
 *
 */
public class MarkdownComponent extends A2UIComponent {

    private static final String TAG = "MarkdownComponent";

    private Context context;
    private TextView textView;
    private Markwon markwon;
    private StringBuilder currentText = new StringBuilder(); // Stores the current full text

    // MARK: - Line height configuration (reference iOS implementation)
    /**
     * Normal text line height (in dp)
     * Reference iOS: normalTextLineHeight = 25 points
     */
    private static final float NORMAL_TEXT_LINE_HEIGHT_DP = 50f;

    /**
     * Heading line height (in dp)
     * Reference iOS: fixedLineHeight = 52 points
     */
    private static final float HEADING_LINE_HEIGHT_DP = 104f;

    public MarkdownComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Markdown");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        // Create TextView
        textView = new TextView(context);

        // Set LayoutParams
        textView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        // Set default text size and color
        textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        textView.setTextColor(Color.BLACK);

        // Initialize Markwon and enable plugins
        markwon = Markwon.builder(context)
                .usePlugin(new AbstractMarkwonPlugin() {
                    @Override
                    public void configureSpansFactory(@NonNull MarkwonSpansFactory.Builder builder) {
                        // Convert dp to px (reference iOS: fixedLineHeight=52, normalTextLineHeight=25)
                        final int headingLineHeightPx = StyleHelper.parseDimension(HEADING_LINE_HEIGHT_DP, context);
                        final int normalTextLineHeightPx = StyleHelper.parseDimension(NORMAL_TEXT_LINE_HEIGHT_DP, context);

                        // Set fixed line height for headings (reference iOS: CustomMarkdownHeader.fixedLineHeight = 52)
                        builder.appendFactory(Heading.class, new SpanFactory() {
                            @Override
                            public Object getSpans(@NonNull MarkwonConfiguration configuration, @NonNull RenderProps props) {
                                return new LineHeightSpanWithBaseline(headingLineHeightPx);
                            }
                        });

                        // Set fixed line height for paragraphs (reference iOS: normalTextLineHeight = 25)
                        builder.appendFactory(Paragraph.class, new SpanFactory() {
                            @Override
                            public Object getSpans(@NonNull MarkwonConfiguration configuration, @NonNull RenderProps props) {
                                return new LineHeightSpanWithBaseline(normalTextLineHeightPx);
                            }
                        });
                    }
                })
                .usePlugin(TablePlugin.create(context))
                .usePlugin(HtmlPlugin.create(plugin -> {
                    plugin.addHandler(new HalfHeightBackgroundTagHandler(context));
                }))
                .build();

        // Apply initial properties
        onUpdateProperties(this.properties);

        return textView;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        if (textView == null || markwon == null) {
            return;
        }

        // Handle text update (defaults to incremental append)
        if (properties.containsKey("content")) {
            Object textValue = properties.get("content");
            currentText = new StringBuilder(extractTextValue(textValue));
            // Render the complete Markdown using Markwon
            markwon.setMarkdown(textView, currentText.toString());
            Log.d(TAG, "➕ [TEXT] Markdown " + getId() +
                    " total text length: " + currentText.length());
        } else if (properties.containsKey("appendContent")) {
            Object textValue = properties.get("appendContent");
            String markdownText = extractTextValue(textValue);
            if (markdownText != null) {
                // Incrementally append text
                currentText.append(markdownText);
                // Render the incremented Markdown using Markwon
                markwon.setMarkdown(textView, currentText.toString());
                Log.d(TAG, "➕ [TEXT_APPEND] Markdown " + getId() +
                        " appended text, append length: " + markdownText.length() +
                        ", total length: " + currentText.length());
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
     * Append Markdown text (public method, callable externally)
     *
     * @param text Text to append
     */
    public void appendText(String text) {
        if (text == null || text.isEmpty()) {
            return;
        }

        currentText.append(text);

        if (textView != null && markwon != null) {
            // Update UI on the main thread
            textView.post(new Runnable() {
                @Override
                public void run() {
                    markwon.setMarkdown(textView, currentText.toString());
                    Log.d(TAG, "➕ [TEXT_APPEND_API] Markdown " + getId() +
                            " appended text, append length: " + text.length() +
                            ", total length: " + currentText.length());
                }
            });
        }
    }

    /**
     * Set Markdown text (public method, callable externally)
     *
     * @param text Text to set
     */
    public void setText(String text) {
        if (text == null) {
            text = "";
        }

        final String finalText = text; // Create a final variable for use in inner class

        currentText.setLength(0);
        currentText.append(finalText);

        if (textView != null && markwon != null) {
            // Update UI on the main thread
            textView.post(new Runnable() {
                @Override
                public void run() {
                    markwon.setMarkdown(textView, currentText.toString());
                    Log.d(TAG, "📝 [TEXT_SET_API] Markdown " + getId() +
                            " text set, length: " + finalText.length());
                }
            });
        }
    }

    /**
     * Get the current full text
     *
     * @return Current text content
     */
    public String getCurrentText() {
        return currentText.toString();
    }

    /**
     * Clear text
     */
    public void clearText() {
        currentText.setLength(0);

        if (textView != null && markwon != null) {
            textView.post(new Runnable() {
                @Override
                public void run() {
                    textView.setText("");
                    Log.d(TAG, "🗑️ [TEXT_CLEAR] Markdown " + getId() + " text cleared");
                }
            });
        }
    }

    /**
     * Custom line height Span (reference iOS ParagraphStyle implementation)
     * <p>
     * iOS implementation:
     * - Uses NSMutableParagraphStyle.minimumLineHeight and maximumLineHeight to force line height
     * - Computes baselineOffset = (targetLineHeight - font.lineHeight) / 2 to vertically center text
     * <p>
     * Android implementation:
     * - Uses LineHeightSpan.chooseHeight() to control line height
     * - Achieves the same line height effect by adjusting FontMetricsInt ascent/descent
     * - descent occupies 1/4 of the line height, ascent occupies 3/4, ensuring text is vertically
     *   centered and not clipped
     */
    private static class LineHeightSpanWithBaseline implements LineHeightSpan {
        private final int targetLineHeight;

        public LineHeightSpanWithBaseline(int targetLineHeight) {
            this.targetLineHeight = targetLineHeight;
        }

        @Override
        public void chooseHeight(CharSequence text, int start, int end,
                                 int spanstartv, int lineHeight,
                                 Paint.FontMetricsInt fm) {
            // descent occupies 1/4 of the line height, ascent occupies 3/4
            // This ensures the text is vertically centered within the line height and not clipped
            fm.descent = targetLineHeight / 4;
            fm.ascent = -(targetLineHeight - fm.descent);
            fm.bottom = fm.descent;
            fm.top = fm.ascent;
        }
    }

    @Override
    protected void onDestroy() {
        currentText.setLength(0);
        markwon = null;
        textView = null;
    }

    /**
     * Half-height background tag handler
     * <p>
     * Supported HTML tags:
     * <halfbg>text</halfbg>
     * <halfbg color="#FFE4E1">text</halfbg>
     * <halfbg color="#FFE4E1" height="0.5" position="bottom">text</halfbg>
     * <halfbg color="#FFE4E1" height="0.5" position="bottom" radius="4" padding="2">text</halfbg>
     * <p>
     * Attribute descriptions:
     * - color:    Background color (supports #RRGGBB or #AARRGGBB format, default #FFE4E1)
     * - height:   Background height ratio (0.0 ~ 1.0, default 0.5)
     * - position: Background position (top/center/bottom, default bottom)
     * - radius:   Corner radius in px (default 0)
     * - padding:  Horizontal padding in px (default 0)
     */
    private static class HalfHeightBackgroundTagHandler extends SimpleTagHandler {

        private final Context context;

        public HalfHeightBackgroundTagHandler(Context context) {
            this.context = context;
        }

        @Override
        public Object getSpans(
                @NonNull MarkwonConfiguration configuration,
                @NonNull RenderProps renderProps,
                @NonNull HtmlTag tag) {

            // Parse attributes
            String colorStr = tag.attributes().get("color");
            String heightStr = tag.attributes().get("height");
            String positionStr = tag.attributes().get("position");
            String radiusStr = tag.attributes().get("radius");
            String paddingStr = tag.attributes().get("padding");

            // Background color (default light pink)
            int color;
            try {
                color = colorStr != null ? Color.parseColor(colorStr) : Color.parseColor("#FFE4E1");
            } catch (IllegalArgumentException e) {
                color = Color.parseColor("#FFE4E1");
                Log.w(TAG, "⚠️ [HALFBG] Invalid color value: " + colorStr + ", using default color");
            }

            // Background height ratio (default 0.5)
            float height = 0.5f;
            if (heightStr != null) {
                try {
                    height = Float.parseFloat(heightStr);
                    height = Math.max(0f, Math.min(1f, height)); // Clamp to 0~1
                } catch (NumberFormatException e) {
                    Log.w(TAG, "⚠️ [HALFBG] Invalid height value: " + heightStr + ", using default 0.5");
                }
            }

            // Background position (default bottom)
            int position = CustomBackgroundSpan.POSITION_BOTTOM;
            if (positionStr != null) {
                switch (positionStr.toLowerCase()) {
                    case "top":
                        position = CustomBackgroundSpan.POSITION_TOP;
                        break;
                    case "center":
                        position = CustomBackgroundSpan.POSITION_CENTER;
                        break;
                    case "bottom":
                    default:
                        position = CustomBackgroundSpan.POSITION_BOTTOM;
                        break;
                }
            }

            // Corner radius (default 0)
            float radius = 0f;
            if (radiusStr != null) {
                try {
                    radius = Float.parseFloat(radiusStr);
                    // Convert to px
                    radius = TypedValue.applyDimension(
                            TypedValue.COMPLEX_UNIT_DIP,
                            radius,
                            context.getResources().getDisplayMetrics()
                    );
                } catch (NumberFormatException e) {
                    Log.w(TAG, "⚠️ [HALFBG] Invalid radius value: " + radiusStr + ", using default 0");
                }
            }

            // Horizontal padding (default 0)
            float padding = 0f;
            if (paddingStr != null) {
                try {
                    padding = Float.parseFloat(paddingStr);
                    // Convert to px
                    padding = TypedValue.applyDimension(
                            TypedValue.COMPLEX_UNIT_DIP,
                            padding,
                            context.getResources().getDisplayMetrics()
                    );
                } catch (NumberFormatException e) {
                    Log.w(TAG, "⚠️ [HALFBG] Invalid padding value: " + paddingStr + ", using default 0");
                }
            }

            Log.d(TAG, "🎨 [HALFBG] Creating half-height background Span: color=" + String.format("#%08X", color) +
                    ", height=" + height + ", position=" + position +
                    ", radius=" + radius + ", padding=" + padding);

            return new CustomBackgroundSpan(color, height, position, radius, padding);
        }

        @NonNull
        @Override
        public Collection<String> supportedTags() {
            return Collections.singleton("halfbg");
        }
    }
}
