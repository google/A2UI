package com.amap.agenui.render.component;

import android.content.Context;
import android.util.Log;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Component registry (global static)
 * <p>
 * Responsibilities:
 * 1. Manages the registration of all component factories
 * 2. Provides a component creation interface
 * 3. Supports custom component registration
 * <p>
 * Component factories are stateless and all Surfaces share the same factory registry.
 * Built-in components are registered once via {@link #registerBuiltInComponents()};
 * custom components can be appended at any time via {@link #registerFactory(String, ComponentFactory)}.
 *
 */
public class ComponentRegistry {

    private static final String TAG = "ComponentRegistry";

    private static final Map<String, IComponentFactory> factories = new ConcurrentHashMap<>();
    private static volatile boolean initialized = false;

    private ComponentRegistry() {
    } // Prevent instantiation
    /**
     * Registers a component factory
     *
     * @param componentType Component type
     * @param factory       Component factory instance
     */
    public static void registerComponent(String componentType, IComponentFactory factory) {
        Log.d(TAG, "registerComponent: componentType=" + componentType);
        factories.put(componentType, factory);
    }

    /**
     * Unregisters a component factory
     *
     * @param componentType Component type
     */
    public static void unregisterComponent(String componentType) {
        Log.d(TAG, "unregisterComponent: componentType=" + componentType);
        factories.remove(componentType);
    }

    /**
     * Returns the component factory for the given type
     *
     * @param componentType Component type
     * @return Component factory instance, or null if not found
     */
    public static IComponentFactory getFactory(String componentType) {
        return factories.get(componentType);
    }

    /**
     * Creates a component
     *
     * @param context       Android Context
     * @param componentType Component type
     * @param id            Component ID
     * @param properties    Component properties
     * @return Created component instance, or null if no factory is registered
     */
    public static A2UIComponent createComponent(
            Context context,
            String componentType,
            String id,
            Map<String, Object> properties) {
        Log.d(TAG, "========== createComponent ==========");
        Log.d(TAG, "type=" + componentType + ", id=" + id);
        Log.d(TAG, "properties=" + (properties != null ? properties.keySet() : "null"));

        IComponentFactory factory = factories.get(componentType);
        if (factory != null) {
            Log.d(TAG, "✓ Factory found: " + factory.getClass().getSimpleName());
            A2UIComponent component = factory.createComponent(context, id, properties);
            if (component != null) {
                Log.d(TAG, "✓ Component created: " + component.getClass().getSimpleName());
            } else {
                Log.e(TAG, "❌ Factory returned null component!");
            }
            return component;
        }
        Log.e(TAG, "❌ No factory found for componentType: " + componentType);
        Log.d(TAG, "Available factories: " + factories.keySet());
        return null;
    }

    /**
     * Registers all built-in components (executed only once).
     * Includes: basic components, layout components, and interaction components.
     */
    public static synchronized void registerBuiltInComponents() {
        if (initialized) {
            Log.d(TAG, "registerBuiltInComponents: already initialized, skip");
            return;
        }
        initialized = true;
        Log.d(TAG, "registerBuiltInComponents");

        registerComponent("Text", new com.amap.agenui.render.component.factory.TextComponentFactory());
        registerComponent("Image", new com.amap.agenui.render.component.factory.ImageComponentFactory());
        registerComponent("Icon", new com.amap.agenui.render.component.factory.IconComponentFactory());
        registerComponent("Divider", new com.amap.agenui.render.component.factory.DividerComponentFactory());
        registerComponent("Video", new com.amap.agenui.render.component.factory.VideoComponentFactory());
        registerComponent("AudioPlayer", new com.amap.agenui.render.component.factory.AudioPlayerComponentFactory());

        registerComponent("Row", new com.amap.agenui.render.component.factory.RowComponentFactory());
        registerComponent("Column", new com.amap.agenui.render.component.factory.ColumnComponentFactory());
        registerComponent("Card", new com.amap.agenui.render.component.factory.CardComponentFactory());
        registerComponent("List", new com.amap.agenui.render.component.factory.ListComponentFactory());
        registerComponent("Tabs", new com.amap.agenui.render.component.factory.TabsComponentFactory());
        registerComponent("Modal", new com.amap.agenui.render.component.factory.ModalComponentFactory());

        registerComponent("Button", new com.amap.agenui.render.component.factory.ButtonComponentFactory());
        registerComponent("TextField", new com.amap.agenui.render.component.factory.TextFieldComponentFactory());
        registerComponent("CheckBox", new com.amap.agenui.render.component.factory.CheckBoxComponentFactory());
        registerComponent("Slider", new com.amap.agenui.render.component.factory.SliderComponentFactory());
        registerComponent("ChoicePicker", new com.amap.agenui.render.component.factory.ChoicePickerComponentFactory());
        registerComponent("DateTimeInput", new com.amap.agenui.render.component.factory.DateTimeInputComponentFactory());

        registerComponent("Table", new com.amap.agenui.render.component.factory.TableComponentFactory());
        registerComponent("Carousel", new com.amap.agenui.render.component.factory.CarouselComponentFactory());
        registerComponent("Web", new com.amap.agenui.render.component.factory.WebComponentFactory());
        registerComponent("RichText", new com.amap.agenui.render.component.factory.RichTextComponentFactory());

        Log.d(TAG, "Built-in components registered: " + factories.size() + "/22 ✅ All done");
    }

    /**
     * Returns the number of registered component types
     *
     * @return Number of registered component types
     */
    public static int getRegisteredComponentCount() {
        return factories.size();
    }

}
