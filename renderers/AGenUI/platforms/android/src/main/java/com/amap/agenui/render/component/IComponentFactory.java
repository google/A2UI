package com.amap.agenui.render.component;

import android.content.Context;

import java.util.Map;

/**
 * Component factory interface
 *
 * Responsibilities:
 * 1. Defines the standard interface for component creation
 * 2. Each component type corresponds to one factory implementation
 * 3. Supports creating component instances via a properties Map
 *
 * Usage example:
 * <pre>
 * public class TextComponentFactory implements IComponentFactory {
 *     @Override
 *     public A2UIComponent createComponent(String id, Map<String, Object> properties) {
 *         return new TextComponent(id);
 *     }
 *
 *     @Override
 *     public String getComponentType() {
 *         return "Text";
 *     }
 * }
 * </pre>
 *
 */
public interface IComponentFactory {

    /**
     * Creates a component instance
     *
     * @param context    Android Context
     * @param id         Unique component identifier
     * @param properties Initial component properties
     * @return Created component instance
     */
    A2UIComponent createComponent(Context context, String id, Map<String, Object> properties);

    /**
     * Returns the component type
     *
     * @return Component type name (e.g. "Text", "Button", "Row")
     */
    String getComponentType();
}
