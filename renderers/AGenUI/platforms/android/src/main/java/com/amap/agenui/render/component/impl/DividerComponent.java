package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BitmapShader;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Shader;
import android.os.AsyncTask;
import android.util.Log;
import android.view.View;
import android.widget.LinearLayout;

import com.amap.agenui.render.component.A2UIComponent;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

/**
 * Divider component implementation - compliant with A2UI v0.9 protocol
 *
 * Supported properties:
 * - axis: divider direction (horizontal or vertical)
 * - styles: style object
 *   - thickness: line thickness (only effective when no image is specified)
 *   - img: image URL (tiled in repeat mode)
 *
 */
public class DividerComponent extends A2UIComponent {

    private static final String TAG = "DividerComponent";

    private Context context;

    private View dividerView;
    private String currentAxis = "horizontal";
    private float currentThickness = 1.0f; // default 1dp
    private String currentImgUrl = null;

    public DividerComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Divider");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        dividerView = new DividerView(context);

        // Read initial styles from properties
        Map<String, Object> styles = extractStyles(properties);
        String axis = String.valueOf(properties.get("axis"));
        float thickness = parseThickness(styles);
        String imgUrl = parseImgUrl(styles);

        currentAxis = axis;
        currentThickness = thickness;
        currentImgUrl = imgUrl;

        // Update the divider
        updateDivider(axis, thickness, imgUrl);

        return dividerView;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        if (dividerView == null) {
            return;
        }

        // Read styles from properties
        Map<String, Object> styles = extractStyles(properties);

        String axis = properties.containsKey("axis") ? String.valueOf(properties.get("axis")) : currentAxis;
        float thickness = parseThickness(styles);
        String imgUrl = parseImgUrl(styles);

        // Check if there are changes
        boolean needsUpdate = !axis.equals(currentAxis)
                || thickness != currentThickness
                || !isSameUrl(imgUrl, currentImgUrl);

        if (needsUpdate) {
            currentAxis = axis;
            currentThickness = thickness;
            currentImgUrl = imgUrl;
            updateDivider(axis, thickness, imgUrl);
        }
    }

    /**
     * Parse the thickness value
     */
    private float parseThickness(Map<String, Object> styles) {
        if (styles == null || !styles.containsKey("thickness")) {
            return 1.0f; // default 1dp
        }

        Object thicknessObj = styles.get("thickness");
        try {
            if (thicknessObj instanceof Number) {
                return ((Number) thicknessObj).floatValue();
            } else if (thicknessObj instanceof String) {
                String thicknessStr = (String) thicknessObj;
                // Remove possible units (px, dp, etc.)
                thicknessStr = thicknessStr.replaceAll("[^0-9.]", "");
                return Float.parseFloat(thicknessStr);
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to parse thickness: " + thicknessObj, e);
        }

        return 1.0f;
    }

    /**
     * Parse the img URL
     */
    private String parseImgUrl(Map<String, Object> styles) {
        if (styles == null || !styles.containsKey("img")) {
            return null;
        }

        Object imgObj = styles.get("img");
        if (imgObj == null) {
            return null;
        }

        String imgUrl = String.valueOf(imgObj).trim();
        return imgUrl.isEmpty() ? null : imgUrl;
    }

    /**
     * Compare whether two URLs are the same
     */
    private boolean isSameUrl(String url1, String url2) {
        if (url1 == null && url2 == null) {
            return true;
        }
        if (url1 == null || url2 == null) {
            return false;
        }
        return url1.equals(url2);
    }

    /**
     * Update the divider
     */
    private void updateDivider(String axis, float thickness, String imgUrl) {
        Log.d(TAG, "updateDivider: axis=" + axis + ", thickness=" + thickness + ", imgUrl=" + imgUrl);

        int width, height;
        float density = context.getResources().getDisplayMetrics().density;
        int thicknessPx = (int) (thickness * density);

        if ("vertical".equalsIgnoreCase(axis)) {
            // Vertical divider
            width = thicknessPx;
            height = LinearLayout.LayoutParams.MATCH_PARENT;
        } else {
            // Horizontal divider
            width = LinearLayout.LayoutParams.MATCH_PARENT;
            height = thicknessPx;
        }

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(width, height);
        dividerView.setLayoutParams(params);

        // If there is an image URL, load the image
        if (imgUrl != null && !imgUrl.isEmpty()) {
            loadImage(imgUrl, axis);
        } else {
            // Use default color
            ((DividerView) dividerView).setImageBitmap(null);
//            dividerView.setBackgroundColor(Color.parseColor("#E0E0E0"));
        }

        dividerView.invalidate();
    }

    /**
     * Load image
     */
    private void loadImage(final String imgUrl, final String axis) {
        Log.d(TAG, "loadImage: " + imgUrl);

        new AsyncTask<Void, Void, Bitmap>() {
            @Override
            protected Bitmap doInBackground(Void... voids) {
                try {
                    URL url = new URL(imgUrl);
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setDoInput(true);
                    connection.connect();
                    InputStream input = connection.getInputStream();
                    Bitmap bitmap = BitmapFactory.decodeStream(input);
                    input.close();
                    return bitmap;
                } catch (Exception e) {
                    Log.e(TAG, "Failed to load image: " + imgUrl, e);
                    return null;
                }
            }

            @Override
            protected void onPostExecute(Bitmap bitmap) {
                if (bitmap != null && dividerView != null) {
                    Log.d(TAG, "Image loaded successfully, size: " + bitmap.getWidth() + "x" + bitmap.getHeight());
                    ((DividerView) dividerView).setImageBitmap(bitmap);
                    ((DividerView) dividerView).setAxis(axis);
                    dividerView.setBackgroundColor(Color.TRANSPARENT);
                    dividerView.invalidate();
                } else {
                    Log.w(TAG, "Failed to load image, using default color");
                    ((DividerView) dividerView).setImageBitmap(null);
//                    dividerView.setBackgroundColor(Color.parseColor("#E0E0E0"));
                }
            }
        }.execute();
    }

    /**
     * Custom View for drawing a repeat-tiled image
     */
    private static class DividerView extends View {
        private Bitmap imageBitmap;
        private Paint paint;
        private String axis = "horizontal";

        public DividerView(Context context) {
            super(context);
            paint = new Paint();
            paint.setAntiAlias(true);
        }

        public void setImageBitmap(Bitmap bitmap) {
            this.imageBitmap = bitmap;
        }

        public void setAxis(String axis) {
            this.axis = axis;
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);

            if (imageBitmap != null) {
                // Use BitmapShader to achieve the repeat effect
                BitmapShader shader = new BitmapShader(imageBitmap,
                        Shader.TileMode.REPEAT,
                        Shader.TileMode.REPEAT);
                paint.setShader(shader);

                // Draw the entire View area
                canvas.drawRect(0, 0, getWidth(), getHeight(), paint);
            }
        }
    }
}
