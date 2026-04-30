package com.amap.agenui.render.style;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.TextUtils;
import android.util.Log;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;

import com.amap.a2ui_sdk.R;
import com.amap.agenui.render.image.ImageCallback;
import com.amap.agenui.render.image.ImageLoadOptionsKey;
import com.amap.agenui.render.image.ImageLoadResult;
import com.amap.agenui.render.image.ImageLoaderConfig;
import com.amap.agenui.render.image.ImageLoaderError;
import com.amap.agenui.render.layout.FlexContainerLayout;
import com.google.android.flexbox.AlignItems;
import com.google.android.flexbox.AlignSelf;
import com.google.android.flexbox.FlexWrap;
import com.google.android.flexbox.FlexboxLayout;
import com.google.android.flexbox.JustifyContent;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * A2UI style helper utility class.
 *
 * Responsible for parsing and applying W3C CSS style properties to Android Views.
 * Supported styles include: dimensions, spacing, display, background, border, shadow, filter, etc.
 *
 */
public class StyleHelper {

    private static final String TAG = "StyleHelper";


    /**
     * Applies dimension styles (with parent container parameter).
     * Supports: width, height, max-width, max-height, min-width, min-height.
     *
     * @param view       View to apply styles to
     * @param properties Style properties
     * @param parent     Parent container (optional, used to determine whether FlexboxLayout.LayoutParams is needed)
     */
    public static void applyDimensions(View view, Map<String, Object> properties, ViewGroup parent) {
        if (view == null || properties == null) {
            Log.d(TAG, "applyDimensions: view or properties is null");
            return;
        }

        Log.d(TAG, "applyDimensions: view=" + view.getClass().getSimpleName() + ", properties=" + properties);
        Context context = view.getContext();

        // If parent is not provided, try to get it from the view
        if (parent == null && view.getParent() instanceof ViewGroup) {
            parent = (ViewGroup) view.getParent();
        }

        // Only create and set LayoutParams when width or height has a value
        boolean hasWidth = properties.containsKey("width");
        boolean hasHeight = properties.containsKey("height");

        if (hasWidth || hasHeight) {
            ViewGroup.LayoutParams params = view.getLayoutParams();
            boolean isFlexboxParent = parent instanceof FlexContainerLayout;

            // Create or convert to the correct LayoutParams type based on the parent container type
            if (params == null) {
                params = isFlexboxParent
                        ? new FlexboxLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
                        : new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                Log.d(TAG, "applyDimensions: created " + (isFlexboxParent ? "FlexboxLayout" : "ViewGroup") + ".LayoutParams");
            } else if (isFlexboxParent) {
                params = ensureFlexLayoutParams(params);
            }

            // width
            if (hasWidth) {
                int width = parseDimension(properties.get("width"), context);
                Log.d(TAG, "applyDimensions: width=" + properties.get("width") + " -> " + width + "px");

                // If the parent is a FlexboxLayout and a fixed width is set, special handling is required
                if (isFlexboxParent && width > 0) {
                    // Ensure LayoutParams is of type FlexboxLayout.LayoutParams
                    if (!(params instanceof FlexboxLayout.LayoutParams)) {
                        FlexboxLayout.LayoutParams flexParams = new FlexboxLayout.LayoutParams(
                            width,
                            params.height
                        );
                        params = flexParams;
                        Log.d(TAG, "applyDimensions: converted to FlexboxLayout.LayoutParams for fixed width");
                    } else {
                        params.width = width;
                        ((FlexboxLayout.LayoutParams) params).setMaxWidth(width);
                    }

                    // Fix: a fixed size semantically means "non-stretchable", so enforce flexShrink=0 and flexGrow=0.
                    // Even if the user sets flex-grow/flex-shrink, a fixed size should take priority
                    // because fixed size and stretchability are semantically contradictory.
                    FlexboxLayout.LayoutParams flexParams = (FlexboxLayout.LayoutParams) params;
                    flexParams.setFlexShrink(0.0f);
                    flexParams.setFlexGrow(0.0f);
                    Log.d(TAG, "applyDimensions: fixed width set, enforcing flexShrink=0, flexGrow=0");
                } else {
                    params.width = width;
                }
            }

            // height
            if (hasHeight) {
                int height = parseDimension(properties.get("height"), context);
                Log.d(TAG, "applyDimensions: height=" + properties.get("height") + " -> " + height + "px");

                // If the parent is a FlexboxLayout and a fixed height is set, special handling is required
                if (isFlexboxParent && height > 0) {
                    // Ensure LayoutParams is of type FlexboxLayout.LayoutParams
                    if (!(params instanceof FlexboxLayout.LayoutParams)) {
                        FlexboxLayout.LayoutParams flexParams = new FlexboxLayout.LayoutParams(
                            params.width,
                            height
                        );
                        params = flexParams;
                        Log.d(TAG, "applyDimensions: converted to FlexboxLayout.LayoutParams for fixed height");
                    } else {
                        params.height = height;
                    }

                    // Fix: a fixed size semantically means "non-stretchable", so enforce flexShrink=0 and flexGrow=0.
                    // Even if the user sets flex-grow/flex-shrink, a fixed size should take priority
                    // because fixed size and stretchability are semantically contradictory.
                    FlexboxLayout.LayoutParams flexParams = (FlexboxLayout.LayoutParams) params;
                    flexParams.setFlexShrink(0.0f);
                    flexParams.setFlexGrow(0.0f);
                    Log.d(TAG, "applyDimensions: fixed height set, enforcing flexShrink=0, flexGrow=0");
                } else {
                    params.height = height;
                }
            }

            view.setLayoutParams(params);
        }

        // min/max dimensions (requires API 16+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            boolean isFlexboxParent = parent instanceof FlexContainerLayout;

            // When the parent is a FlexboxParent, min/max dimensions are set via FlexboxLayout.LayoutParams methods
            if (isFlexboxParent) {
                FlexboxLayout.LayoutParams flexParams = ensureFlexLayoutParams(view.getLayoutParams());

                // min-width mapped to FlexboxLayout.LayoutParams.setMinWidth
                if (properties.containsKey("min-width")) {
                    int minWidth = parseDimension(properties.get("min-width"), context);
                    if (minWidth > 0) {
                        flexParams.setMinWidth(minWidth);
                        Log.d(TAG, "applyDimensions: min-width=" + properties.get("min-width") + " -> " + minWidth + "px (FlexboxLayout.LayoutParams)");
                    }
                }

                // min-height mapped to FlexboxLayout.LayoutParams.setMinHeight
                if (properties.containsKey("min-height")) {
                    int minHeight = parseDimension(properties.get("min-height"), context);
                    if (minHeight > 0) {
                        flexParams.setMinHeight(minHeight);
                        Log.d(TAG, "applyDimensions: min-height=" + properties.get("min-height") + " -> " + minHeight + "px (FlexboxLayout.LayoutParams)");
                    }
                }

                // max-width and max-height handling
                if (properties.containsKey("max-width")) {
                    int maxWidth = parseDimension(properties.get("max-width"), context);
                    if (maxWidth > 0) {
                        flexParams.setMaxWidth(maxWidth);
                        Log.d(TAG, "applyDimensions: max-width=" + properties.get("max-width") + " -> " + maxWidth + "px");
                    }
                }

                if (properties.containsKey("max-height")) {
                    int maxHeight = parseDimension(properties.get("max-height"), context);
                    if (maxHeight > 0) {
                        flexParams.setMaxHeight(maxHeight);
                        Log.d(TAG, "applyDimensions: max-height=" + properties.get("max-height") + " -> " + maxHeight + "px");
                    }
                }

                view.setLayoutParams(flexParams);
            } else {
                // When the parent is not a FlexboxParent, use View.setMinimumWidth/Height
                if (properties.containsKey("min-width")) {
                    int minWidth = parseDimension(properties.get("min-width"), context);
                    if (minWidth > 0) {
                        view.setMinimumWidth(minWidth);
                        Log.d(TAG, "applyDimensions: min-width=" + properties.get("min-width") + " -> " + minWidth + "px");
                    }
                }

                if (properties.containsKey("min-height")) {
                    int minHeight = parseDimension(properties.get("min-height"), context);
                    if (minHeight > 0) {
                        view.setMinimumHeight(minHeight);
                        Log.d(TAG, "applyDimensions: min-height=" + properties.get("min-height") + " -> " + minHeight + "px");
                    }
                }
            }
        }
    }

    /**
     * Parses a dimension value.
     * Supports: px, %, auto, match_parent, wrap_content.
     * Note: the px unit is converted following dp conversion rules.
     */
    public static int parseDimension(Object value, Context context) {
        if (value == null) {
            Log.d(TAG, "parseDimension: value is null, returning WRAP_CONTENT");
            return ViewGroup.LayoutParams.WRAP_CONTENT;
        }

        String strValue = String.valueOf(value).trim().toLowerCase();
        Log.d(TAG, "parseDimension: parsing '" + strValue + "'");

        // Special values
        if (strValue.equals("auto") || strValue.equals("wrap_content")) {
            Log.d(TAG, "parseDimension: '" + strValue + "' -> WRAP_CONTENT");
            return ViewGroup.LayoutParams.WRAP_CONTENT;
        }
        if (strValue.equals("match_parent") || strValue.equals("100%")) {
            Log.d(TAG, "parseDimension: '" + strValue + "' -> MATCH_PARENT");
            return ViewGroup.LayoutParams.MATCH_PARENT;
        }

        // Numeric parsing
        try {
            if (strValue.endsWith("px")) {
                // px unit is converted following dp conversion rules
                float value_num = Float.parseFloat(strValue.replace("px", ""));
                int px = standardUnitToPx(context, value_num);
                Log.d(TAG, "parseDimension: '" + strValue + "' -> " + px + "px (converted as dp)");
                return px;
            } else {
                // Treat as standard unit by default
                float value_num = Float.parseFloat(strValue);
                int px = standardUnitToPx(context, value_num);
                Log.d(TAG, "parseDimension: '" + strValue + "' (as standard unit) -> " + px + "px");
                return px;
            }
        } catch (NumberFormatException e) {
            Log.w(TAG, "Failed to parse dimension: " + value, e);
            return ViewGroup.LayoutParams.WRAP_CONTENT;
        }
    }


    /**
     * Applies spacing styles.
     * Supports: margin, padding (and their inline/block variants).
     * Supports CSS multi-value format:
     * - 1 value:  applies to all sides (top right bottom left)
     * - 2 values: first applies to top/bottom, second applies to left/right
     * - 3 values: first applies to top, second applies to left/right, third applies to bottom
     * - 4 values: applied in order to top right bottom left
     */
    public static void applySpacing(View view, Map<String, Object> properties) {
        if (view == null || properties == null) {
            Log.d(TAG, "applySpacing: view or properties is null");
            return;
        }

        Log.d(TAG, "applySpacing: view=" + view.getClass().getSimpleName() + ", properties=" + properties);
        Context context = view.getContext();

        // Padding
        int paddingLeft = view.getPaddingLeft();
        int paddingTop = view.getPaddingTop();
        int paddingRight = view.getPaddingRight();
        int paddingBottom = view.getPaddingBottom();

        if (properties.containsKey("padding")) {
            int[] paddings = parseSpacingValues(properties.get("padding"), context);
            paddingTop = paddings[0];
            paddingRight = paddings[1];
            paddingBottom = paddings[2];
            paddingLeft = paddings[3];
            Log.d(TAG, "applySpacing: padding=" + properties.get("padding") +
                    " -> top=" + paddingTop + ", right=" + paddingRight +
                ", bottom=" + paddingBottom + ", left=" + paddingLeft);
        }

        // Prefer CSS logical properties, fall back to traditional directional properties
        if (properties.containsKey("padding-inline-start")) {
            paddingLeft = parseDimension(properties.get("padding-inline-start"), context);
        } else if (properties.containsKey("padding-left")) {
            paddingLeft = parseDimension(properties.get("padding-left"), context);
        }

        if (properties.containsKey("padding-inline-end")) {
            paddingRight = parseDimension(properties.get("padding-inline-end"), context);
        } else if (properties.containsKey("padding-right")) {
            paddingRight = parseDimension(properties.get("padding-right"), context);
        }

        if (properties.containsKey("padding-block-start")) {
            paddingTop = parseDimension(properties.get("padding-block-start"), context);
        } else if (properties.containsKey("padding-top")) {
            paddingTop = parseDimension(properties.get("padding-top"), context);
        }

        if (properties.containsKey("padding-block-end")) {
            paddingBottom = parseDimension(properties.get("padding-block-end"), context);
        } else if (properties.containsKey("padding-bottom")) {
            paddingBottom = parseDimension(properties.get("padding-bottom"), context);
        }

        view.setPadding(paddingLeft, paddingTop, paddingRight, paddingBottom);

        // Margin - check whether any margin-related properties are present
        boolean hasMargin = properties.containsKey("margin")
            || properties.containsKey("margin-inline-start")
            || properties.containsKey("margin-inline-end")
            || properties.containsKey("margin-block-start")
                || properties.containsKey("margin-block-end")
                || properties.containsKey("margin-left")
                || properties.containsKey("margin-right")
                || properties.containsKey("margin-top")
                || properties.containsKey("margin-bottom");

        if (hasMargin) {
            ViewGroup.LayoutParams params = view.getLayoutParams();
            ViewGroup.MarginLayoutParams marginParams;

            // If the current LayoutParams is already a MarginLayoutParams, use it directly
            if (params instanceof ViewGroup.MarginLayoutParams) {
                marginParams = (ViewGroup.MarginLayoutParams) params;
            } else {
                // If it is not a MarginLayoutParams, create a new one
                if (params != null) {
                    marginParams = new ViewGroup.MarginLayoutParams(params);
                } else {
                    marginParams = new ViewGroup.MarginLayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    );
                }
            }

            if (properties.containsKey("margin")) {
                int[] margins = parseSpacingValues(properties.get("margin"), context);
                marginParams.topMargin = margins[0];
                marginParams.rightMargin = margins[1];
                marginParams.bottomMargin = margins[2];
                marginParams.leftMargin = margins[3];
                Log.d(TAG, "applySpacing: margin=" + properties.get("margin") +
                        " -> top=" + margins[0] + ", right=" + margins[1] +
                    ", bottom=" + margins[2] + ", left=" + margins[3]);
            }

            // Prefer CSS logical properties, fall back to traditional directional properties
            if (properties.containsKey("margin-inline-start")) {
                marginParams.leftMargin = parseDimension(properties.get("margin-inline-start"), context);
            } else if (properties.containsKey("margin-left")) {
                marginParams.leftMargin = parseDimension(properties.get("margin-left"), context);
            }

            if (properties.containsKey("margin-inline-end")) {
                marginParams.rightMargin = parseDimension(properties.get("margin-inline-end"), context);
            } else if (properties.containsKey("margin-right")) {
                marginParams.rightMargin = parseDimension(properties.get("margin-right"), context);
            }

            if (properties.containsKey("margin-block-start")) {
                marginParams.topMargin = parseDimension(properties.get("margin-block-start"), context);
            } else if (properties.containsKey("margin-top")) {
                marginParams.topMargin = parseDimension(properties.get("margin-top"), context);
            }

            if (properties.containsKey("margin-block-end")) {
                marginParams.bottomMargin = parseDimension(properties.get("margin-block-end"), context);
            } else if (properties.containsKey("margin-bottom")) {
                marginParams.bottomMargin = parseDimension(properties.get("margin-bottom"), context);
            }

            view.setLayoutParams(marginParams);
        }
    }

    /**
     * Parses CSS multi-value spacing.
     * Supported formats:
     * - "10px"              -> [10, 10, 10, 10] (all sides)
     * - "10px 20px"         -> [10, 20, 10, 20] (vertical horizontal)
     * - "10px 20px 30px"    -> [10, 20, 30, 20] (top horizontal bottom)
     * - "10px 20px 30px 40px" -> [10, 20, 30, 40] (top right bottom left)
     *
     * @param value   Spacing value (single value or space-separated multiple values)
     * @param context Android Context
     * @return int array [top, right, bottom, left]
     */
    private static int[] parseSpacingValues(Object value, Context context) {
        if (value == null) {
            return new int[]{0, 0, 0, 0};
        }

        String strValue = String.valueOf(value).trim();
        Log.d(TAG, "parseSpacingValues: parsing '" + strValue + "'");

        // Split by whitespace
        String[] parts = strValue.split("\\s+");
        int[] result = new int[4]; // [top, right, bottom, left]

        switch (parts.length) {
            case 1:
                // 1 value: applies to all sides
                int all = parseDimension(parts[0], context);
                result[0] = result[1] = result[2] = result[3] = all;
                Log.d(TAG, "parseSpacingValues: 1 value -> all=" + all);
                break;

            case 2:
                // 2 values: first applies to top/bottom, second applies to left/right
                int vertical = parseDimension(parts[0], context);
                int horizontal = parseDimension(parts[1], context);
                result[0] = result[2] = vertical;   // top, bottom
                result[1] = result[3] = horizontal; // right, left
                Log.d(TAG, "parseSpacingValues: 2 values -> vertical=" + vertical + ", horizontal=" + horizontal);
                break;

            case 3:
                // 3 values: top, horizontal, bottom
                result[0] = parseDimension(parts[0], context); // top
                result[1] = result[3] = parseDimension(parts[1], context); // right, left
                result[2] = parseDimension(parts[2], context); // bottom
                Log.d(TAG, "parseSpacingValues: 3 values -> top=" + result[0] +
                    ", horizontal=" + result[1] + ", bottom=" + result[2]);
                break;

            case 4:
            default:
                // 4 values: top, right, bottom, left
                result[0] = parseDimension(parts[0], context); // top
                result[1] = parseDimension(parts[1], context); // right
                result[2] = parseDimension(parts[2], context); // bottom
                result[3] = parseDimension(parts[3], context); // left
                Log.d(TAG, "parseSpacingValues: 4 values -> top=" + result[0] +
                    ", right=" + result[1] + ", bottom=" + result[2] + ", left=" + result[3]);
                break;
        }

        return result;
    }


    /**
     * Applies display styles.
     * Supports: display, visibility, opacity.
     */
    public static void applyDisplay(View view, Map<String, Object> properties) {
        if (view == null || properties == null) return;

        // display
        if (properties.containsKey("display")) {
            String display = String.valueOf(properties.get("display")).toLowerCase();
            switch (display) {
                case "none":
                    view.setVisibility(View.GONE);
                    break;
                case "flex":
                case "block":
                case "inline-block":
                default:
                    view.setVisibility(View.VISIBLE);
                    break;
            }
        }

        // visibility
        if (properties.containsKey("visibility")) {
            String visibility = String.valueOf(properties.get("visibility")).toLowerCase();
            switch (visibility) {
                case "hidden":
                    view.setVisibility(View.INVISIBLE);
                    break;
                case "visible":
                default:
                    view.setVisibility(View.VISIBLE);
                    break;
            }
        }

        // opacity
        if (properties.containsKey("opacity")) {
            float opacity = parseFloat(properties.get("opacity"));
            view.setAlpha(opacity);
        }
    }


    /**
     * Applies background styles.
     * Supports: background-color, background (background-image not yet supported).
     */
    public static void applyBackground(View view, Map<String, Object> properties) {
        if (view == null || properties == null) {
            Log.d(TAG, "applyBackground: view or properties is null");
            return;
        }

        Log.d(TAG, "applyBackground: view=" + view.getClass().getSimpleName() + ", properties=" + properties);

        // background-color
        if (properties.containsKey("background-color")) {
            int color = parseColor(properties.get("background-color"));
            Log.d(TAG, "applyBackground: background-color=" + properties.get("background-color") + " -> #" + Integer.toHexString(color));
            view.setBackgroundColor(color);
        } else if (properties.containsKey("background")) {
            // Simplified handling: apply if the background value is a color
            int color = parseColor(properties.get("background"));
            if (color != 0) {
                Log.d(TAG, "applyBackground: background=" + properties.get("background") + " -> #" + Integer.toHexString(color));
                view.setBackgroundColor(color);
            }
        } else if (properties.containsKey("background-image")) {
            String imgUrl = StyleHelper.extractUrlsFromCss(String.valueOf(properties.get("background-image")));
            if (imgUrl == null) {
                return;
            }

            view.post(() -> {
                final int width = view.getWidth();
                final int height = view.getHeight();

                Log.d(TAG, "applyBackground background-image"
                        + ", url=" + imgUrl
                        + ", view=" + view.getClass().getSimpleName()
                        + ", width=" + width
                        + ", height=" + height);

                ImageLoaderConfig.getInstance().getLoader().loadImage(imgUrl, buildOptions(width, height), new ImageCallback() {
                    @Override
                    public void onSuccess(@NonNull ImageLoadResult result) {
                        view.setBackground(result.drawable);
                    }

                    @Override
                    public void onFailure(@NonNull ImageLoaderError error) {
                        Log.w(TAG, "background-image load failed, url=" + imgUrl, error);
                        view.setBackground(getErrorDrawable());
                    }
                });
            });
        }
    }

    /**
     * Builds background image load options including target width and height for downsampling.
     */
    private static Map<String, Object> buildOptions(int width, int height) {
        if (width <= 0 && height <= 0) return null;
        Map<String, Object> options = new HashMap<>();
        if (width > 0) options.put(ImageLoadOptionsKey.WIDTH, (float) width);
        if (height > 0) options.put(ImageLoadOptionsKey.HEIGHT, (float) height);
        return options;
    }


    /**
     * Applies border styles.
     * Supports: border-radius, border-color, border-width.
     * Note: border-style is not yet supported (Android limitation).
     */
    public static void applyBorder(View view, Map<String, Object> properties) {
        if (view == null || properties == null) {
            Log.d(TAG, "applyBorder: view or properties is null");
            return;
        }

        Log.d(TAG, "applyBorder: view=" + view.getClass().getSimpleName() + ", properties=" + properties);
        Context context = view.getContext();

        // Create a GradientDrawable to implement border effects
        GradientDrawable drawable = new GradientDrawable();
        drawable.setShape(GradientDrawable.RECTANGLE);

        boolean hasBorder = false;

        // border-radius
        if (properties.containsKey("border-radius")) {
            int radius = parseDimension(properties.get("border-radius"), context);
            Log.d(TAG, "applyBorder: border-radius=" + properties.get("border-radius") + " -> " + radius + "px");
            drawable.setCornerRadius(radius);
            hasBorder = true;
        }

        // border-width and border-color
        if (properties.containsKey("border-width")) {
            int width = parseDimension(properties.get("border-width"), context);
            int color = Color.BLACK; // Default: black

            if (properties.containsKey("border-color")) {
                color = parseColor(properties.get("border-color"));
                Log.d(TAG, "applyBorder: border-color=" + properties.get("border-color") + " -> #" + Integer.toHexString(color));
            }

            Log.d(TAG, "applyBorder: border-width=" + properties.get("border-width") + " -> " + width + "px");
            drawable.setStroke(width, color);
            hasBorder = true;
        }

        // If border styles are present, apply them to the View
        if (hasBorder) {
            // Preserve the original background color
            if (properties.containsKey("background-color")) {
                int bgColor = parseColor(properties.get("background-color"));
                Log.d(TAG, "applyBorder: setting background-color on drawable -> #" + Integer.toHexString(bgColor));
                drawable.setColor(bgColor);
            }
            Log.d(TAG, "applyBorder: applying GradientDrawable to view");
            view.setBackground(drawable);
        }
    }


    /**
     * Applies filter styles: currently only drop-shadow is supported.
     * Supports: filter (drop-shadow).
     */
    public static void applyFilter(View view, Map<String, Object> properties) {
        if (view == null || properties == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            if (properties.containsKey("filter")) {
                String filter = String.valueOf(properties.get("filter")).trim();

                // Parse drop-shadow
                if (filter.startsWith("drop-shadow(")) {
                    Context context = view.getContext();
                    try {
                        // Format: drop-shadow(offset-x offset-y blur-radius color)
                        // Example: drop-shadow(2px 2px 4px rgba(0,0,0,0.3))
                        String params = filter.substring(12, filter.length() - 1).trim();
                        String[] parts = params.split("\\s+");

                        if (parts.length >= 3) {
                            // Parse offset and blur radius
                            float dx = parseDimensionFloat(parts[0], context);
                            float dy = parseDimensionFloat(parts[1], context);
                            float radius = parseDimensionFloat(parts[2], context);

                            // Note: Android's View.setElevation() does not support custom shadow colors;
                            // shadow color is determined by the system theme, so the color parameter is
                            // not parsed or used here. To use a custom shadow color, a custom Drawable
                            // or Canvas drawing approach is needed.

                            // Apply shadow (use elevation to approximate blur-radius)
                            // elevation should be the blur-radius value, not radius directly
                            view.setElevation(radius / 4f);

                            // Use translation to simulate shadow offset.
                            // Note: translation affects the actual position of the View and may not be ideal.
                            // A better approach is to reserve space for the shadow via padding or margin.
                            view.setTranslationX(dx);
                            view.setTranslationY(dy);

                            // To prevent the shadow from being clipped, ensure the parent container
                            // does not clip child Views. This typically requires setting
                            // clipChildren=false and clipToPadding=false on the parent.
                            if (view.getParent() instanceof ViewGroup) {
                                ViewGroup parent = (ViewGroup) view.getParent();
                                parent.setClipChildren(false);
                                parent.setClipToPadding(false);
                            }

                            Log.d(TAG, "applyFilter: drop-shadow applied - dx=" + dx + ", dy=" + dy + ", radius=" + radius);
                        }
                    } catch (Exception e) {
                        Log.w(TAG, "Failed to parse drop-shadow: " + filter, e);
                    }
                }
            }
        }
    }

    /**
     * Parses a dimension value as a float (used for shadow offsets, etc.).
     * Note: the px unit is converted following dp conversion rules.
     */
    private static float parseDimensionFloat(String value, Context context) {
        if (value == null || value.isEmpty()) return 0f;

        value = value.trim().toLowerCase();
        try {
            if (value.endsWith("px")) {
                // px unit is converted following dp conversion rules
                float value_num = Float.parseFloat(value.replace("px", ""));
                return standardUnitToPx(context, value_num);
            } else {
                // Treat as standard unit by default
                return standardUnitToPx(context, Float.parseFloat(value));
            }
        } catch (NumberFormatException e) {
            Log.w(TAG, "Failed to parse dimension float: " + value, e);
            return 0f;
        }
    }


    /**
     * Applies aspect-ratio styles.
     * Supports: aspect-ratio.
     * Note: requires a custom View or ConstraintLayout.
     */
    public static void applyAspectRatio(View view, Map<String, Object> properties) {
        if (view == null || properties == null) return;

        // Implementing aspect-ratio requires a custom View or ConstraintLayout;
        // left unimplemented here for future extension.
    }

    /**
     * Parses an aspect ratio value.
     * Supported formats: "16:9", "16/9", "1.78", 1.78.
     *
     * @param value Aspect ratio value
     * @return Ratio (width/height); returns 0 if parsing fails
     */
    public static float parseAspectRatio(Object value) {
        if (value == null) {
            Log.d(TAG, "parseAspectRatio: value is null, returning 0");
            return 0f;
        }

        String strValue = String.valueOf(value).trim();
        Log.d(TAG, "parseAspectRatio: parsing '" + strValue + "'");

        try {
            // Supports "16:9" format
            if (strValue.contains(":")) {
                String[] parts = strValue.split(":");
                float width = Float.parseFloat(parts[0].trim());
                float height = Float.parseFloat(parts[1].trim());
                float ratio = width / height;
                Log.d(TAG, "parseAspectRatio: '" + strValue + "' -> " + ratio);
                return ratio;
            }

            // Supports "16/9" format
            if (strValue.contains("/")) {
                String[] parts = strValue.split("/");
                float width = Float.parseFloat(parts[0].trim());
                float height = Float.parseFloat(parts[1].trim());
                float ratio = width / height;
                Log.d(TAG, "parseAspectRatio: '" + strValue + "' -> " + ratio);
                return ratio;
            }

            // Supports a direct numeric value such as "1.78" or 1.78
            float ratio = Float.parseFloat(strValue);
            Log.d(TAG, "parseAspectRatio: '" + strValue + "' (direct number) -> " + ratio);
            return ratio;
        } catch (Exception e) {
            Log.w(TAG, "Failed to parse aspect-ratio: " + value, e);
            return 0f;
        }
    }


    /**
     * Applies Flexbox container styles.
     * Supports: flex-direction, justify-content, align-items, flex-wrap, align-content.
     */
    public static void applyFlexContainer(ViewGroup viewGroup, Map<String, Object> properties) {
        if (!(viewGroup instanceof FlexContainerLayout)) return;

        Log.d(TAG, "applyFlexContainer: viewGroup=" + viewGroup.getClass().getSimpleName() + ", properties=" + properties);

        FlexboxLayout flexbox = ((FlexContainerLayout) viewGroup).getFlexboxLayout();

        // flex-wrap
        if (properties.containsKey("flex-wrap")) {
            String wrap = String.valueOf(properties.get("flex-wrap")).toLowerCase();
            switch (wrap) {
                case "nowrap":
                    flexbox.setFlexWrap(FlexWrap.NOWRAP);
                    break;
                case "wrap":
                    flexbox.setFlexWrap(FlexWrap.WRAP);
                    break;
                case "wrap-reverse":
                    flexbox.setFlexWrap(FlexWrap.WRAP_REVERSE);
                    break;
            }
        }

        // align-content (multi-line alignment)
        // todo: setting alignContent in FlexboxLayout is complex; not yet implemented
    }

    /**
     * Applies Flexbox child element styles.
     * Supports: align-self, flex-grow, flex-shrink, flex-basis.
     */
    public static void applyFlexChild(FlexboxLayout.LayoutParams params, Map<String, Object> properties) {
        if (params == null || properties == null) {
            Log.d(TAG, "applyFlexChild: params or properties is null");
            return;
        }

        Log.d(TAG, "applyFlexChild: properties=" + properties);

        // flex-grow
        if (properties.containsKey("flex-grow")) {
            float grow = parseFloat(properties.get("flex-grow"));
            params.setFlexGrow(grow);
            Log.d(TAG, "applyFlexChild: flex-grow=" + properties.get("flex-grow") + " -> " + grow);
        }

        // flex-shrink
        if (properties.containsKey("flex-shrink")) {
            float shrink = parseFloat(properties.get("flex-shrink"));
            params.setFlexShrink(shrink);
            Log.d(TAG, "applyFlexChild: flex-shrink=" + properties.get("flex-shrink") + " -> " + shrink);
        }

        // flex-basis
        if (properties.containsKey("flex-basis")) {
            // flex-basis can be a length value or a percentage.
            // Simplified handling: use flexBasisPercent.
            String basis = String.valueOf(properties.get("flex-basis"));
            if (basis.endsWith("%")) {
                float percent = Float.parseFloat(basis.replace("%", "")) / 100f;
                params.setFlexBasisPercent(percent);
                Log.d(TAG, "applyFlexChild: flex-basis=" + basis + " -> " + percent + " (percent)");
            } else {
                Log.d(TAG, "applyFlexChild: flex-basis=" + basis + " (not percentage, skipped)");
            }
        }

        // align-self
        if (properties.containsKey("align-self")) {
            String alignSelf = String.valueOf(properties.get("align-self")).toLowerCase();
            int alignSelfValue = parseAlignSelf(alignSelf);
            params.setAlignSelf(alignSelfValue);
            Log.d(TAG, "applyFlexChild: align-self=" + alignSelf + " -> " + alignSelfValue);
        }

        Log.d(TAG, "applyFlexChild: completed - flexGrow=" + params.getFlexGrow() +
                ", flexShrink=" + params.getFlexShrink() +
                ", flexBasisPercent=" + params.getFlexBasisPercent() +
                          ", alignSelf=" + params.getAlignSelf());
    }


    /**
     * Applies positioning styles.
     * Supports: position: absolute, inset-inline-start/end, inset-block-start/end.
     *
     * Note:
     * - Internally checks whether position is "absolute".
     * - If absolute, automatically creates and sets ConstraintLayout.LayoutParams (overriding any previous LayoutParams).
     * - Supports stretching when all four directions are set simultaneously.
     * - If not absolute, no action is taken.
     *
     * @param view       View to apply positioning to
     * @param properties Style properties
     */
    public static void applyPosition(View view, Map<String, Object> properties) {
        if (view == null || properties == null) {
            Log.d(TAG, "applyPosition: view or properties is null");
            return;
        }

        // Internal check: only handle position: absolute
        if (!properties.containsKey("position")) {
            return;
        }

        String position = String.valueOf(properties.get("position")).toLowerCase();
        if (!position.equals("absolute")) {
            Log.d(TAG, "applyPosition: position=" + position + " (not absolute, skipped)");
            return;
        }

        Log.d(TAG, "applyPosition: applying absolute positioning with ConstraintLayout");
        Context context = view.getContext();

        // Create ConstraintLayout.LayoutParams (overrides any previous LayoutParams)
        androidx.constraintlayout.widget.ConstraintLayout.LayoutParams params =
                new androidx.constraintlayout.widget.ConstraintLayout.LayoutParams(
                        androidx.constraintlayout.widget.ConstraintLayout.LayoutParams.WRAP_CONTENT,
                        androidx.constraintlayout.widget.ConstraintLayout.LayoutParams.WRAP_CONTENT
                );

        // Parse offset values (prefer new properties, fall back to legacy ones)
        Integer top = null;
        if (properties.containsKey("inset-block-start")) {
            top = parseDimension(properties.get("inset-block-start"), context);
        } else if (properties.containsKey("top")) {
            top = parseDimension(properties.get("top"), context);
        }

        Integer bottom = null;
        if (properties.containsKey("inset-block-end")) {
            bottom = parseDimension(properties.get("inset-block-end"), context);
        } else if (properties.containsKey("bottom")) {
            bottom = parseDimension(properties.get("bottom"), context);
        }

        Integer left = null;
        if (properties.containsKey("inset-inline-start")) {
            left = parseDimension(properties.get("inset-inline-start"), context);
        } else if (properties.containsKey("left")) {
            left = parseDimension(properties.get("left"), context);
        }

        Integer right = null;
        if (properties.containsKey("inset-inline-end")) {
            right = parseDimension(properties.get("inset-inline-end"), context);
        } else if (properties.containsKey("right")) {
            right = parseDimension(properties.get("right"), context);
        }

        // Default value: if no direction is set, default to top-left corner (0, 0)
        boolean hasAnyPosition = (left != null || top != null || right != null || bottom != null);
        if (!hasAnyPosition) {
            left = 0;
            top = 0;
            Log.d(TAG, "applyPosition: no position set, using default left=0, top=0");
        }

        // Set constraints relative to the parent
        if (left != null) {
            params.leftToLeft = androidx.constraintlayout.widget.ConstraintLayout.LayoutParams.PARENT_ID;
            params.leftMargin = left;
            Log.d(TAG, "applyPosition: leftToLeft=PARENT, leftMargin=" + left);
        }
        if (top != null) {
            params.topToTop = androidx.constraintlayout.widget.ConstraintLayout.LayoutParams.PARENT_ID;
            params.topMargin = top;
            Log.d(TAG, "applyPosition: topToTop=PARENT, topMargin=" + top);
        }
        if (right != null) {
            params.rightToRight = androidx.constraintlayout.widget.ConstraintLayout.LayoutParams.PARENT_ID;
            params.rightMargin = right;
            Log.d(TAG, "applyPosition: rightToRight=PARENT, rightMargin=" + right);
        }
        if (bottom != null) {
            params.bottomToBottom = androidx.constraintlayout.widget.ConstraintLayout.LayoutParams.PARENT_ID;
            params.bottomMargin = bottom;
            Log.d(TAG, "applyPosition: bottomToBottom=PARENT, bottomMargin=" + bottom);
        }

        // If both horizontal directions are set, use MATCH_CONSTRAINT to stretch
        if (left != null && right != null) {
            params.width = androidx.constraintlayout.widget.ConstraintLayout.LayoutParams.MATCH_CONSTRAINT;
            Log.d(TAG, "applyPosition: both left and right set, width=MATCH_CONSTRAINT");
        }

        // If both vertical directions are set, use MATCH_CONSTRAINT to stretch
        if (top != null && bottom != null) {
            params.height = androidx.constraintlayout.widget.ConstraintLayout.LayoutParams.MATCH_CONSTRAINT;
            Log.d(TAG, "applyPosition: both top and bottom set, height=MATCH_CONSTRAINT");
        }

        // Set LayoutParams (overrides any previous LayoutParams)
        view.setLayoutParams(params);

        Log.d(TAG, "applyPosition: absolute positioning applied with ConstraintLayout.LayoutParams");
    }


    /**
     * Applies overflow styles.
     * Supports: overflow.
     */
    public static void applyOverflow(ViewGroup viewGroup, Map<String, Object> properties) {
        if (viewGroup == null || properties == null) return;

        Log.d(TAG, "applyOverflow: viewGroup=" + viewGroup.getClass().getSimpleName() + ", properties=" + properties);

        if (properties.containsKey("overflow")) {
            String overflow = String.valueOf(properties.get("overflow")).toLowerCase();
            Log.d(TAG, "applyOverflow: overflow=" + overflow);
            switch (overflow) {
                case "hidden":
                    viewGroup.setClipChildren(true);
                    viewGroup.setClipToPadding(true);
                    break;
                case "visible":
                    viewGroup.setClipChildren(false);
                    viewGroup.setClipToPadding(false);
                    break;
                case "scroll":
                case "auto":
                    // Requires wrapping in a ScrollView; not yet implemented
                    break;
            }
        }
    }


    /**
     * todo: Applies gap styles — not yet supported.
     * Supports: gap (spacing between Flexbox children).
     * Note: FlexboxLayout does not directly support gap; it must be simulated via margin.
     */
    public static void applyGap(ViewGroup viewGroup, Map<String, Object> properties) {
        // FlexboxLayout does not directly support the gap property.
        // It needs to be simulated by setting margin on child Views when they are added.
        // Left unimplemented here for future extension.
    }


    /**
     * Applies text styles to a TextView.
     * Supports all style properties of TextComponent.
     *
     * @param textView TextView to apply styles to
     * @param styles   Style property map
     * @param context  Android Context
     */
    public static void applyTextStyles(TextView textView, Map<String, Object> styles, Context context) {
        if (textView == null || styles == null || styles.isEmpty()) {
            return;
        }

        Log.d(TAG, "applyTextStyles: applying styles to TextView");

        // 1. Handle font-related properties (Typeface must be composed together)
        Typeface currentTypeface = textView.getTypeface();
        Typeface baseTypeface = currentTypeface != null ? currentTypeface : Typeface.DEFAULT;

        // font-family: font family
        if (styles.containsKey("font-family")) {
            Object fontFamilyValue = styles.get("font-family");
            baseTypeface = parseFontFamily(fontFamilyValue, context);
        }

        // font-weight: weight handling (only "bold" is supported)
        if (styles.containsKey("font-weight")) {
            Object fontWeightValue = styles.get("font-weight");
            String fontWeight = String.valueOf(fontWeightValue).trim().toLowerCase();

            if (fontWeight.equals("bold")) {
                textView.setTypeface(baseTypeface, Typeface.BOLD);
            } else {
                textView.setTypeface(baseTypeface, Typeface.NORMAL);
            }
        } else if (styles.containsKey("font-family")) {
            // Only font-family is set, no weight
            textView.setTypeface(baseTypeface);
        }

        // 2. font-size: font size (only px is supported)
        if (styles.containsKey("font-size")) {
            Object fontSizeValue = styles.get("font-size");
            String sizeStr = String.valueOf(fontSizeValue).trim().toLowerCase();

            float size = 0;
            if (sizeStr.endsWith("px")) {
                size = Float.parseFloat(sizeStr.replace("px", ""));
            } else if (sizeStr.matches("^\\d+(\\.\\d+)?$")) {
                size = Float.parseFloat(sizeStr);
            }

            if (size > 0) {
                textView.setTextSize(TypedValue.COMPLEX_UNIT_PX, standardUnitToPx(context, size));
            }
        }

        // 3. color: text color
        if (styles.containsKey("color")) {
            Object colorValue = styles.get("color");
            int color = parseColor(colorValue);
            if (color != 0) {
                textView.setTextColor(color);
            } else {
                textView.setTextColor(Color.BLACK);
            }
        }

        // 4. line-height: line height (supports multiplier or pixel value)
        if (styles.containsKey("line-height")) {
            Object lineHeightValue = styles.get("line-height");
            String lineHeightStr = String.valueOf(lineHeightValue).trim().toLowerCase();

            // Check first whether it is a plain number (multiplier)
            if (lineHeightStr.matches("^\\d+(\\.\\d+)?$")) {
                // Syntax 1: line-height:0.5; — 0.5x the normal line height
                float multiplier = Float.parseFloat(lineHeightStr);
                textView.setLineSpacing(0, multiplier);
            } else if (lineHeightStr.endsWith("px")) {
                // Syntax 2: line-height:10px; — explicit line height value
                // (Note: multi-line scenarios are not supported; a multiplier must be used instead)
                int lineHeightPx = parseDimension(lineHeightValue, context);
                if (lineHeightPx > 0) {
                    float currentTextSize = textView.getTextSize();
                    float extraSpacing = lineHeightPx - currentTextSize;
                    textView.setLineSpacing(extraSpacing, 1.0f);
                }
            }
        }

        // 5. line-clamp: maximum number of lines (<=0 means unlimited)
        if (styles.containsKey("line-clamp")) {
            Object lineClampValue = styles.get("line-clamp");
            int maxLines = parseInteger(lineClampValue);
            if (maxLines > 0) {
                textView.setMaxLines(maxLines);
            } else {
                // <=0 means unlimited
                textView.setMaxLines(Integer.MAX_VALUE);
            }
        }

        // 6. text-overflow: text overflow handling
        if (styles.containsKey("text-overflow")) {
            Object textOverflowValue = styles.get("text-overflow");
            String textOverflow = String.valueOf(textOverflowValue).toLowerCase();

            // Get the current line-clamp setting
            int currentMaxLines = textView.getMaxLines();

            switch (textOverflow) {
                case "ellipsis":
                    // ellipsis is treated as clip if line-clamp=1 is not set
                    if (currentMaxLines == 1) {
                        textView.setEllipsize(TextUtils.TruncateAt.END);
                    } else {
                        textView.setEllipsize(null);
                    }
                    break;
                case "head":
                    // head requires line-clamp=1 to take effect
                    if (currentMaxLines == 1) {
                        textView.setEllipsize(TextUtils.TruncateAt.START);
                    }
                    break;
                case "middle":
                    // middle requires line-clamp=1 to take effect
                    if (currentMaxLines == 1) {
                        textView.setEllipsize(TextUtils.TruncateAt.MIDDLE);
                    }
                    break;
                case "clip":
                default:
                    textView.setEllipsize(null);
                    break;
            }
        }

        // 7. text-align: text alignment
        if (styles.containsKey("text-align")) {
            Object textAlignValue = styles.get("text-align");
            String textAlign = String.valueOf(textAlignValue).toLowerCase();
            int gravity = parseTextAlign(textAlign);
            if (gravity != -1) {
                textView.setGravity(gravity);
            }
        }

        // 8. Text decoration properties (text-decoration series)
        applyTextDecoration(textView, styles, context);
    }

    /**
     * Applies text decoration properties.
     *
     * @param textView TextView
     * @param styles   Style map
     * @param context  Android Context
     */
    private static void applyTextDecoration(TextView textView, Map<String, Object> styles, Context context) {
        // Decoration properties
        String decorationLine = null;      // underline or line-through
        String decorationStyle = "solid";  // solid, dashed, dotted, double, wavy
        String decorationColor = null;     // color value
        String decorationThickness = "1px"; // thickness

        // 1. Parse shorthand property text-decoration (lower priority)
        if (styles.containsKey("text-decoration")) {
            Object textDecorationValue = styles.get("text-decoration");
            String textDecoration = String.valueOf(textDecorationValue).trim();

            // Parse format: line style color (e.g. "underline dashed #FF0000")
            String[] parts = textDecoration.split("\\s+");
            if (parts.length >= 1) {
                decorationLine = parts[0].toLowerCase();
            }
            if (parts.length >= 2) {
                decorationStyle = parts[1].toLowerCase();
            }
            if (parts.length >= 3) {
                decorationColor = parts[2];
            }
        }

        // 2. Parse individual properties (higher priority, overrides shorthand)
        if (styles.containsKey("text-decoration-line")) {
            decorationLine = String.valueOf(styles.get("text-decoration-line")).trim().toLowerCase();
        }
        if (styles.containsKey("text-decoration-style")) {
            decorationStyle = String.valueOf(styles.get("text-decoration-style")).trim().toLowerCase();
        }
        if (styles.containsKey("text-decoration-color")) {
            decorationColor = String.valueOf(styles.get("text-decoration-color")).trim();
        }
        if (styles.containsKey("text-decoration-thickness")) {
            decorationThickness = String.valueOf(styles.get("text-decoration-thickness")).trim();
        }

        // 3. If no decoration line type is set, return early
        if (decorationLine == null || decorationLine.isEmpty() || decorationLine.equals("none")) {
            return;
        }

        // 4. Parse decoration line parameters
        int color = parseColor(decorationColor);
        int thickness = parseDimension(decorationThickness, context);
        if (thickness <= 0) {
            thickness = 1; // Default: 1px
        }

        // 5. Get the TextView's gravity
        int gravity = textView.getGravity();

        // 6. Create a SpannableString and apply decoration
        CharSequence text = textView.getText();
        if (text == null || text.length() == 0) {
            return;
        }

        SpannableString spannableString = new SpannableString(text);

        // Create the appropriate Span based on decoration line type and style (passing gravity)
        if (decorationLine.equals("underline")) {
            com.amap.agenui.render.component.impl.span.CustomUnderlineSpan.Style style = parseUnderlineStyle(decorationStyle);
            com.amap.agenui.render.component.impl.span.CustomUnderlineSpan span =
                    new com.amap.agenui.render.component.impl.span.CustomUnderlineSpan(color, thickness, style, gravity);
            spannableString.setSpan(span, 0, text.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        } else if (decorationLine.equals("line-through")) {
            com.amap.agenui.render.component.impl.span.CustomStrikethroughSpan.Style style = parseStrikethroughStyle(decorationStyle);
            com.amap.agenui.render.component.impl.span.CustomStrikethroughSpan span =
                    new com.amap.agenui.render.component.impl.span.CustomStrikethroughSpan(color, thickness, style, gravity);
            spannableString.setSpan(span, 0, text.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }

        // 7. Apply the SpannableString
        textView.setText(spannableString);
    }

    /**
     * Parses the decoration line style (for underline).
     *
     * @param styleStr Style string
     * @return CustomUnderlineSpan.Style
     */
    private static com.amap.agenui.render.component.impl.span.CustomUnderlineSpan.Style parseUnderlineStyle(String styleStr) {
        if (styleStr == null) {
            return com.amap.agenui.render.component.impl.span.CustomUnderlineSpan.Style.SOLID;
        }

        switch (styleStr.toLowerCase()) {
            case "dashed":
                return com.amap.agenui.render.component.impl.span.CustomUnderlineSpan.Style.DASHED;
            case "dotted":
                return com.amap.agenui.render.component.impl.span.CustomUnderlineSpan.Style.DOTTED;
            case "double":
                return com.amap.agenui.render.component.impl.span.CustomUnderlineSpan.Style.DOUBLE;
            case "wavy":
                return com.amap.agenui.render.component.impl.span.CustomUnderlineSpan.Style.WAVY;
            case "solid":
            default:
                return com.amap.agenui.render.component.impl.span.CustomUnderlineSpan.Style.SOLID;
        }
    }

    /**
     * Parses the decoration line style (for strikethrough).
     *
     * @param styleStr Style string
     * @return CustomStrikethroughSpan.Style
     */
    private static com.amap.agenui.render.component.impl.span.CustomStrikethroughSpan.Style parseStrikethroughStyle(String styleStr) {
        if (styleStr == null) {
            return com.amap.agenui.render.component.impl.span.CustomStrikethroughSpan.Style.SOLID;
        }

        switch (styleStr.toLowerCase()) {
            case "dashed":
                return com.amap.agenui.render.component.impl.span.CustomStrikethroughSpan.Style.DASHED;
            case "dotted":
                return com.amap.agenui.render.component.impl.span.CustomStrikethroughSpan.Style.DOTTED;
            case "double":
                return com.amap.agenui.render.component.impl.span.CustomStrikethroughSpan.Style.DOUBLE;
            case "wavy":
                return com.amap.agenui.render.component.impl.span.CustomStrikethroughSpan.Style.WAVY;
            case "solid":
            default:
                return com.amap.agenui.render.component.impl.span.CustomStrikethroughSpan.Style.SOLID;
        }
    }

    /**
     * Parses a font family (supports system fonts and custom fonts).
     *
     * @param value   Font family name
     * @param context Android Context
     * @return Typeface
     */
    private static Typeface parseFontFamily(Object value, Context context) {
        if (value == null) {
            return Typeface.DEFAULT;
        }

        // Custom font loading is not yet supported
        return Typeface.DEFAULT;
    }

    /**
     * Parses a text alignment value (supports combined horizontal + vertical).
     *
     * @param textAlign Alignment value (e.g. "left top", "center center", "right bottom")
     * @return Gravity value; returns -1 if parsing fails
     */
    private static int parseTextAlign(String textAlign) {
        if (textAlign == null) {
            return -1;
        }

        String[] parts = textAlign.toLowerCase().trim().split("\\s+");
        int horizontal = Gravity.START;
        int vertical = Gravity.CENTER_VERTICAL;

        // Parse the first argument (horizontal alignment)
        String h = parts[0];
        if (h.equals("left") || h.equals("start")) {
            horizontal = Gravity.START;
        } else if (h.equals("center")) {
            horizontal = Gravity.CENTER_HORIZONTAL;
        } else if (h.equals("right") || h.equals("end")) {
            horizontal = Gravity.END;
        }

        // Parse the second argument (vertical alignment)
        if (parts.length > 1) {
            String v = parts[1];
            if (v.equals("top")) {
                vertical = Gravity.TOP;
            } else if (v.equals("center")) {
                vertical = Gravity.CENTER_VERTICAL;
            } else if (v.equals("bottom")) {
                vertical = Gravity.BOTTOM;
            }
        }
        // Note: if only one argument is given, vertical defaults to CENTER_VERTICAL

        return horizontal | vertical;
    }

    /**
     * Parses an integer value.
     *
     * @param value Integer value
     * @return Integer; returns 0 if parsing fails
     */
    private static int parseInteger(Object value) {
        if (value == null) {
            return 0;
        }

        try {
            if (value instanceof Number) {
                return ((Number) value).intValue();
            }
            return Integer.parseInt(String.valueOf(value).trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }


    /**
     * Converts a standard unit value to pixels.
     * Divides the value by 2 then converts using dp rules.
     *
     * @param context Android Context
     * @param value   Value in standard units
     * @return Converted pixel value
     */
    public static int standardUnitToPx(Context context, float value) {
        // Standard unit must be divided by 2 before converting to dp
        float dipValue = value / 2;
        float density = context.getResources().getDisplayMetrics().density;

        try {
            float pixelFloat = dipValue * density;
            // Special case: if value > 0 but the converted result < 1, return 1
            if (dipValue > 0 && pixelFloat < 1) {
                return 1;
            }
            // Round to nearest integer
            return (int) (pixelFloat + 0.5f);
        } catch (Exception ignored) {
        }

        return (int) dipValue;
    }

    /**
     * Parses a color value.
     * Supports: #RRGGBB, #RRGGBBAA, rgba(r,g,b,a).
     */
    public static int parseColor(Object value) {
        if (value == null) {
            Log.d(TAG, "parseColor: value is null, returning TRANSPARENT");
            return Color.TRANSPARENT;
        }

        String strValue = String.valueOf(value).trim();
        Log.d(TAG, "parseColor: parsing '" + strValue + "'");

        try {
            // Hex color
            if (strValue.startsWith("#")) {
                // If it is an 8-digit hex (#RRGGBBAA), convert to Android's #AARRGGBB format
                if (strValue.length() == 9) {
                    // Extract RR GG BB AA
                    String rr = strValue.substring(1, 3);
                    String gg = strValue.substring(3, 5);
                    String bb = strValue.substring(5, 7);
                    String aa = strValue.substring(7, 9);
                    // Reassemble as #AARRGGBB
                    strValue = "#" + aa + rr + gg + bb;
                    Log.d(TAG, "parseColor: converted #RRGGBBAA to #AARRGGBB: " + strValue);
                }
                int color = Color.parseColor(strValue);
                Log.d(TAG, "parseColor: hex color '" + strValue + "' -> #" + Integer.toHexString(color));
                return color;
            }

            // rgba color
            if (strValue.startsWith("rgba(")) {
                String[] parts = strValue.substring(5, strValue.length() - 1).split(",");
                int r = Integer.parseInt(parts[0].trim());
                int g = Integer.parseInt(parts[1].trim());
                int b = Integer.parseInt(parts[2].trim());
                float a = Float.parseFloat(parts[3].trim());
                int color = Color.argb((int) (a * 255), r, g, b);
                Log.d(TAG, "parseColor: rgba color -> #" + Integer.toHexString(color));
                return color;
            }

            // rgb color
            if (strValue.startsWith("rgb(")) {
                String[] parts = strValue.substring(4, strValue.length() - 1).split(",");
                int r = Integer.parseInt(parts[0].trim());
                int g = Integer.parseInt(parts[1].trim());
                int b = Integer.parseInt(parts[2].trim());
                int color = Color.rgb(r, g, b);
                Log.d(TAG, "parseColor: rgb color -> #" + Integer.toHexString(color));
                return color;
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed to parse color: " + value, e);
        }

        Log.w(TAG, "parseColor: unrecognized format '" + strValue + "', returning TRANSPARENT");
        return Color.TRANSPARENT;
    }

    /**
     * Parses a float value.
     */
    private static float parseFloat(Object value) {
        if (value == null) return 0f;

        try {
            if (value instanceof Number) {
                return ((Number) value).floatValue();
            }
            return Float.parseFloat(String.valueOf(value));
        } catch (NumberFormatException e) {
            Log.w(TAG, "Failed to parse float: " + value, e);
            return 0f;
        }
    }

    /**
     * Parses an align-self value.
     */
    private static int parseAlignSelf(String value) {
        switch (value) {
            case "center":
                return AlignSelf.CENTER;
            case "flex-end":
            case "end":
                return AlignSelf.FLEX_END;
            case "stretch":
                return AlignSelf.STRETCH;
            case "baseline":
                return AlignSelf.BASELINE;
            case "flex-start":
            case "start":
            default:
                return AlignSelf.FLEX_START;
        }
    }

    /**
     * Returns the resource ID for a standard icon.
     * <p>
     * Maps A2UI v0.9 standard icons to Lucide Icons (46 high-quality SVG icons),
     * listed in the order defined by the A2UI catalog.
     * <p>
     * Note: the following 11 media control icons are not implemented:
     * fastForward, pause, play, rewind, skipNext, skipPrevious, stop,
     * volumeDown, volumeMute, volumeOff, volumeUp.
     *
     * @param iconName Icon name (case-insensitive)
     * @return Icon resource ID; returns the default icon if not found
     */
    public static int getIconResourceId(String iconName) {
        if (iconName == null) {
            return R.drawable.ic_circle_question_mark;
        }

        switch (iconName.toLowerCase()) {
            // 1. accountCircle
            case "accountcircle":
                return R.drawable.ic_circle_user;

            // 2. add
            case "add":
                return R.drawable.ic_plus;

            // 3. arrowBack
            case "arrowback":
                return R.drawable.ic_arrow_left;

            // 4. arrowForward
            case "arrowforward":
                return R.drawable.ic_arrow_right;

            // 5. attachFile
            case "attachfile":
                return R.drawable.ic_paperclip;

            // 6. calendarToday
            case "calendartoday":
                return R.drawable.ic_calendar;

            // 7. call
            case "call":
                return R.drawable.ic_phone;

            // 8. camera
            case "camera":
                return R.drawable.ic_camera;

            // 9. check
            case "check":
                return R.drawable.ic_check;

            // 10. close
            case "close":
                return R.drawable.ic_x;

            // 11. delete
            case "delete":
                return R.drawable.ic_trash;

            // 12. download
            case "download":
                return R.drawable.ic_download;

            // 13. edit
            case "edit":
                return R.drawable.ic_pencil;

            // 14. event
            case "event":
                return R.drawable.ic_calendar;

            // 15. error
            case "error":
                return R.drawable.ic_circle_alert;

            // 16. fastForward - not implemented

            // 17. favorite
            case "favorite":
                return R.drawable.ic_heart;

            // 18. favoriteOff
            case "favoriteoff":
                return R.drawable.ic_heart_off;

            // 19. folder
            case "folder":
                return R.drawable.ic_folder;

            // 20. help
            case "help":
                return R.drawable.ic_circle_question_mark;

            // 21. home
            case "home":
                return R.drawable.ic_house;

            // 22. info
            case "info":
                return R.drawable.ic_info;

            // 23. locationOn
            case "locationon":
                return R.drawable.ic_map_pin;

            // 24. lock
            case "lock":
                return R.drawable.ic_lock;

            // 25. lockOpen
            case "lockopen":
                return R.drawable.ic_lock_open;

            // 26. mail
            case "mail":
                return R.drawable.ic_mail;

            // 27. menu
            case "menu":
                return R.drawable.ic_menu;

            // 28. moreVert
            case "morevert":
                return R.drawable.ic_ellipsis_vertical;

            // 29. moreHoriz
            case "morehoriz":
                return R.drawable.ic_ellipsis;

            // 30. notificationsOff
            case "notificationsoff":
                return R.drawable.ic_bell_off;

            // 31. notifications
            case "notifications":
                return R.drawable.ic_bell;

            // 32. pause - not implemented

            // 33. payment
            case "payment":
                return R.drawable.ic_credit_card;

            // 34. person
            case "person":
                return R.drawable.ic_user;

            // 35. phone
            case "phone":
                return R.drawable.ic_phone;

            // 36. photo
            case "photo":
                return R.drawable.ic_image;

            // 37. play - not implemented

            // 38. print
            case "print":
                return R.drawable.ic_printer;

            // 39. refresh
            case "refresh":
                return R.drawable.ic_refresh_cw;

            // 40. rewind - not implemented

            // 41. search
            case "search":
                return R.drawable.ic_search;

            // 42. send
            case "send":
                return R.drawable.ic_send;

            // 43. settings
            case "settings":
                return R.drawable.ic_settings;

            // 44. share
            case "share":
                return R.drawable.ic_share;

            // 45. shoppingCart
            case "shoppingcart":
                return R.drawable.ic_shopping_cart;

            // 46. skipNext - not implemented

            // 47. skipPrevious - not implemented

            // 48. star
            case "star":
                return R.drawable.ic_star;

            // 49. starHalf
            case "starhalf":
                return R.drawable.ic_star_half;

            // 50. starOff
            case "staroff":
                return R.drawable.ic_star_off;

            // 51. stop - not implemented

            // 52. upload
            case "upload":
                return R.drawable.ic_upload;

            // 53. visibility
            case "visibility":
                return R.drawable.ic_eye;

            // 54. visibilityOff
            case "visibilityoff":
                return R.drawable.ic_eye_off;

            // 55. volumeDown - not implemented

            // 56. volumeMute - not implemented

            // 57. volumeOff - not implemented

            // 58. volumeUp - not implemented

            // 59. warning
            case "warning":
                return R.drawable.ic_triangle_alert;

            default:
                // Return the default icon (help)
                return R.drawable.ic_circle_question_mark;
        }
    }

    /**
     * Extracts all URLs from CSS url() functions in the given text.
     * Supports quoted and unquoted forms, for example:
     * url("http://example.com/img.png")
     * url('http://example.com/img.png')
     * url(http://example.com/img.png)
     *
     * @param text Text containing CSS url() functions
     * @return The first extracted URL (without quotes), or null if not found
     */
    public static String extractUrlsFromCss(String text) {
        if (text == null || text.isEmpty()) {
            return null;
        }

        // Regex explanation:
        // url\\(          : matches literal "url("
        // ['"]?           : matches an optional single or double quote
        // (               : start of capture group — the content we want to extract
        // [^)]*           : matches any character except ")" (non-greedy via exclusion)
        // )               : end of capture group
        // ['"]?           : matches an optional closing single or double quote
        // \\)             : matches literal ")"
        String regex = "url\\(['\"]?([^)'\"]*)['\"]?\\)";

        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(text);

        while (matcher.find()) {
            // group(1) is the first capture group — the clean URL inside the parentheses without quotes
            String url = matcher.group(1);
            if (url != null && !url.isEmpty()) {
                return url.trim();
            }
        }

        return null;
    }

    public static Drawable getPlaceholderDrawable() {
        return new ColorDrawable(Color.parseColor("#D9E9F6"));
    }

    public static Drawable getErrorDrawable() {
        return new ColorDrawable(Color.parseColor("#D9E9F6"));
    }

    /**
     * Ensures a FlexboxLayout.LayoutParams is returned:
     * - If params is already a FlexboxLayout.LayoutParams, it is returned as-is.
     * - Otherwise, a new one is created copying width/height (WRAP_CONTENT is used when params is null).
     * <p>Note: when params is not a FlexboxLayout.LayoutParams, only width and height are copied.
     * Other Flexbox-specific properties (e.g. flexGrow, flexShrink, flexBasis, alignSelf) will be lost.
     * </p>
     */
    private static FlexboxLayout.LayoutParams ensureFlexLayoutParams(ViewGroup.LayoutParams params) {
        if (params instanceof FlexboxLayout.LayoutParams) {
            return (FlexboxLayout.LayoutParams) params;
        }
        int w = params != null ? params.width : ViewGroup.LayoutParams.WRAP_CONTENT;
        int h = params != null ? params.height : ViewGroup.LayoutParams.WRAP_CONTENT;
        return new FlexboxLayout.LayoutParams(w, h);
    }
}
