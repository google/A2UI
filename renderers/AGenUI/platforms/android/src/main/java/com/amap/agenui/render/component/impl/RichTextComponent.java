package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.text.Html;
import android.text.Spanned;
import android.text.method.LinkMovementMethod;
import android.util.Log;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.style.StyleHelper;
import com.squareup.picasso.Picasso;
import com.squareup.picasso.Target;

import java.lang.ref.WeakReference;
import java.util.Map;

/**
 * RichText component implementation - based on Android native Html.fromHtml() + Picasso ImageGetter
 * <p>
 * Supported properties:
 * - text:        HTML-formatted rich text content (required)
 * - fontSize:    Font size in sp (optional, default 16)
 * - variant:     Text style preset (h1, h2, h3, h4, h5, caption, body) (optional)
 * - linksEnable: Whether link clicks are enabled (default true)
 * <p>
 * Note: fontSize takes precedence over variant. If both are specified, fontSize will be used.
 * <p>
 * Supported HTML tags:
 * - Text style:  <b>, <strong>, <i>, <em>, <u>, <strike>, <del>
 * - Text color:  <font color="#xxx">
 * - Links:       <a href="...">
 * - Images:      <img src="..."> (supports network images loaded via Picasso)
 * - Paragraphs:  <p>, <br>, <div>
 * - Lists:       <ul>, <ol>, <li>
 * - Headings:    <h1> ~ <h6>
 * <p>
 * Usage example:
 * {
 * "id": "richtext1",
 * "component": "RichText",
 * "text": "<p>This is <b>bold</b> and <i>italic</i> text</p>",
 * "fontSize": 20
 * }
 * <p>
 * Or using a preset style:
 * {
 * "id": "richtext2",
 * "component": "RichText",
 * "text": "<p>This is heading-style text</p>",
 * "variant": "h3"
 * }
 *
 */
public class RichTextComponent extends A2UIComponent {

    private static final String TAG = "RichTextComponent";

    private Context context;
    private TextView textView;

    public RichTextComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "RichText");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        textView = new TextView(context);

        // Set LayoutParams to ensure content is displayed correctly
        textView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        // Set default text size and color
        textView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        textView.setTextColor(Color.BLACK);

        // Apply initial properties
        onUpdateProperties(this.properties);

        return textView;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        if (textView == null) {
            return;
        }

        // Handle font size (priority: styles.fontSize > variant > default)
        Float fontSize = null;

        // Read fontSize from styles
        if (properties.containsKey("styles")) {
            Object stylesValue = properties.get("styles");
            if (stylesValue instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> styles = (Map<String, Object>) stylesValue;
                if (styles.containsKey("fontSize")) {
                    Object fontSizeValue = styles.get("fontSize");
                    if (fontSizeValue instanceof Number) {
                        fontSize = ((Number) fontSizeValue).floatValue();
                    } else {
                        try {
                            fontSize = Float.parseFloat(String.valueOf(fontSizeValue));
                        } catch (NumberFormatException e) {
                            Log.w(TAG, "⚠️ [FONT_SIZE] Invalid fontSize value: " + fontSizeValue);
                        }
                    }
                }
            }
        }

        if (fontSize != null) {
            textView.setTextSize(TypedValue.COMPLEX_UNIT_PX, StyleHelper.standardUnitToPx(context, fontSize));
        }

        // Handle link click setting (must be set before setting content)
        boolean linksEnable = true;
        if (properties.containsKey("linksEnable")) {
            linksEnable = Boolean.parseBoolean(String.valueOf(properties.get("linksEnable")));
        }

        if (linksEnable) {
            textView.setMovementMethod(LinkMovementMethod.getInstance());
        } else {
            textView.setMovementMethod(null);
        }

        // Handle HTML content update (placed last to ensure styles are applied first)
        if (properties.containsKey("text")) {
            Object textValue = properties.get("text");
            String htmlContent = extractTextValue(textValue);

            if (htmlContent != null && !htmlContent.isEmpty()) {
                setHtmlContent(htmlContent);
                Log.d(TAG, "📝 [CONTENT_SET] RichText " + getId() +
                        " content set, length: " + htmlContent.length());
            }
        }
    }

    /**
     * Set HTML content
     */
    private void setHtmlContent(String htmlContent) {
        if (textView == null || htmlContent == null) {
            return;
        }

        // Use custom ImageGetter to load images
        PicassoImageGetter imageGetter = new PicassoImageGetter(textView, context);

        // Parse HTML
        Spanned spanned;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            spanned = Html.fromHtml(htmlContent, Html.FROM_HTML_MODE_LEGACY, imageGetter, null);
        } else {
            spanned = Html.fromHtml(htmlContent, imageGetter, null);
        }

        textView.setText(spanned);
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
     * Set HTML content (public method, callable externally)
     *
     * @param htmlContent HTML-formatted content
     */
    public void setContent(String htmlContent) {
        if (htmlContent == null) {
            htmlContent = "";
        }

        final String finalContent = htmlContent;

        if (textView != null) {
            // Update UI on the main thread
            textView.post(new Runnable() {
                @Override
                public void run() {
                    setHtmlContent(finalContent);
                    Log.d(TAG, "📝 [CONTENT_SET_API] RichText " + getId() +
                            " content set, length: " + finalContent.length());
                }
            });
        }
    }

    /**
     * Get current content
     *
     * @return Current text content
     */
    public String getCurrentContent() {
        if (textView != null) {
            return textView.getText().toString();
        }
        return "";
    }

    @Override
    protected void onDestroy() {
        textView = null;
    }

    /**
     * Custom ImageGetter - loads network images using Picasso
     */
    private static class PicassoImageGetter implements Html.ImageGetter {

        private final WeakReference<TextView> textViewRef;
        private final Context context;

        public PicassoImageGetter(TextView textView, Context context) {
            this.textViewRef = new WeakReference<>(textView);
            this.context = context;
        }

        @Override
        public Drawable getDrawable(String source) {
            // Create a placeholder Drawable
            final UrlDrawable urlDrawable = new UrlDrawable();

            // Load image asynchronously using Picasso
            Picasso.get()
                    .load(source)
                    .into(new ImageTarget(urlDrawable, textViewRef));

            return urlDrawable;
        }
    }

    /**
     * Placeholder Drawable - used for asynchronous image loading
     */
    private static class UrlDrawable extends BitmapDrawable {
        private Drawable drawable;

        @Override
        public void draw(Canvas canvas) {
            if (drawable != null) {
                drawable.draw(canvas);
            }
        }

        public void setDrawable(Drawable drawable) {
            this.drawable = drawable;
            if (drawable != null) {
                int width = drawable.getIntrinsicWidth();
                int height = drawable.getIntrinsicHeight();
                drawable.setBounds(0, 0, width, height);
                setBounds(0, 0, width, height);
            }
        }
    }

    /**
     * Picasso Target - handles image load completion
     */
    private static class ImageTarget implements Target {

        private final UrlDrawable urlDrawable;
        private final WeakReference<TextView> textViewRef;

        public ImageTarget(UrlDrawable urlDrawable, WeakReference<TextView> textViewRef) {
            this.urlDrawable = urlDrawable;
            this.textViewRef = textViewRef;
        }

        @Override
        public void onBitmapLoaded(Bitmap bitmap, Picasso.LoadedFrom from) {
            TextView textView = textViewRef.get();
            if (textView == null) {
                return;
            }

            // Create BitmapDrawable
            BitmapDrawable drawable = new BitmapDrawable(textView.getResources(), bitmap);

            // Set image dimensions (limit maximum width to TextView width)
            int maxWidth = textView.getWidth();
            if (maxWidth == 0) {
                maxWidth = textView.getResources().getDisplayMetrics().widthPixels;
            }

            int width = bitmap.getWidth();
            int height = bitmap.getHeight();

            if (width > maxWidth) {
                float ratio = (float) maxWidth / width;
                width = maxWidth;
                height = (int) (height * ratio);
            }

            drawable.setBounds(0, 0, width, height);

            // Update UrlDrawable
            urlDrawable.setDrawable(drawable);

            // Refresh TextView
            textView.setText(textView.getText());
            textView.invalidate();
        }

        @Override
        public void onBitmapFailed(Exception e, Drawable errorDrawable) {
            Log.e(TAG, "Image load failed: " + e.getMessage());
        }

        @Override
        public void onPrepareLoad(Drawable placeHolderDrawable) {
            // Placeholder image can be set here
        }
    }
}
