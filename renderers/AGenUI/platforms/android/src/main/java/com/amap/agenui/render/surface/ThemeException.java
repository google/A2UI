package com.amap.agenui.render.surface;

/**
 * Theme registration exception.
 * Thrown when registerDefaultTheme fails to register the theme or DesignToken.
 *
 */
public class ThemeException extends Exception {

    public ThemeException(String message) {
        super(message);
    }

    public ThemeException(String message, Throwable cause) {
        super(message, cause);
    }
}
