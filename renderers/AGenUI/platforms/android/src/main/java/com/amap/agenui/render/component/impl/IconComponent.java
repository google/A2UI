package com.amap.agenui.render.component.impl;

import android.content.Context;
import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.style.StyleHelper;

import java.util.Map;

/**
 * Icon component implementation - compliant with A2UI v0.9 protocol
 *
 * Supported properties:
 * - name: icon name (standard icon or custom path)
 *
 * Standard icons include:
 * accountCircle, add, arrowBack, arrowForward, attachFile, calendarToday, call, camera,
 * check, close, delete, download, edit, event, error, fastForward, favorite, favoriteOff,
 * folder, help, home, info, locationOn, lock, lockOpen, mail, menu, moreVert, moreHoriz,
 * notificationsOff, notifications, pause, payment, person, phone, photo, play, print,
 * refresh, rewind, search, send, settings, share, shoppingCart, skipNext, skipPrevious,
 * star, starHalf, starOff, stop, upload, visibility, visibilityOff, volumeDown,
 * volumeMute, volumeOff, volumeUp, warning
 *
 */
public class IconComponent extends A2UIComponent {

    private Context context;

    private ImageView imageView;

    public IconComponent(Context context, String id, Map<String, Object> properties) {
        super(id, "Icon");
        this.context = context;
        if (properties != null) {
            this.properties.putAll(properties);
        }
    }

    @Override
    protected View onCreateView(Context context) {
        imageView = new ImageView(context);

        // Default icon size 24dp
        int size = (int) (24 * context.getResources().getDisplayMetrics().density);
        imageView.setLayoutParams(new ViewGroup.LayoutParams(size, size));

        // Default color
        imageView.setColorFilter(Color.BLACK);

        // ⚠️ Important: apply initial properties
        onUpdateProperties(this.properties);

        return imageView;
    }

    @Override
    protected void onUpdateProperties(Map<String, Object> properties) {
        if (imageView == null) {
            return;
        }

        // Update icon name
        if (properties.containsKey("name")) {
            Object nameObj = properties.get("name");
            String iconName = null;

            // name can be a string or an object containing a path
            if (nameObj instanceof String) {
                iconName = (String) nameObj;
            } else if (nameObj instanceof Map) {
                Map<String, Object> nameMap = (Map<String, Object>) nameObj;
                if (nameMap.containsKey("path")) {
                    iconName = String.valueOf(nameMap.get("path"));
                }
            }

            if (iconName != null) {
                loadIcon(iconName);
            }
        }

        // Update icon size
        if (properties.containsKey("size")) {
            Object sizeObj = properties.get("size");
            int sizeDp = 24; // default size

            if (sizeObj instanceof Number) {
                sizeDp = ((Number) sizeObj).intValue();
            } else if (sizeObj instanceof String) {
                try {
                    sizeDp = Integer.parseInt((String) sizeObj);
                } catch (NumberFormatException e) {
                    // use default value
                }
            }

            int sizePx = (int) (sizeDp * context.getResources().getDisplayMetrics().density);
            ViewGroup.LayoutParams params = imageView.getLayoutParams();
            if (params != null) {
                params.width = sizePx;
                params.height = sizePx;
                imageView.setLayoutParams(params);
            }
        }

        // Update icon color
        if (properties.containsKey("color")) {
            Object colorObj = properties.get("color");
            if (colorObj instanceof String) {
                try {
                    int color = Color.parseColor((String) colorObj);
                    imageView.setColorFilter(color);
                } catch (IllegalArgumentException e) {
                    // Color parsing failed, keep default
                }
            }
        }
    }

    /**
     * Load icon.
     * Uses StyleHelper's static method to get the icon resource.
     */
    private void loadIcon(String iconName) {
        // Use StyleHelper's static method to get the standard icon resource ID
        int resId = StyleHelper.getIconResourceId(iconName);

        if (resId != 0) {
            imageView.setImageResource(resId);
        } else {
            // Try loading from a custom path
        }
    }
}
