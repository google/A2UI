package com.amap.agenui.render.component;

import android.content.Context;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.RestrictTo;

import com.amap.agenui.render.layout.FlexContainerLayout;
import com.amap.agenui.render.style.StyleHelper;
import com.google.android.flexbox.FlexDirection;
import com.google.android.flexbox.FlexboxLayout;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * A2UI component abstract base class
 *
 * Responsibilities:
 * 1. Defines basic component properties (id, type, properties)
 * 2. Manages the component lifecycle (create, update, destroy)
 * 3. Manages parent-child relationships
 * 4. Provides abstract methods for subclasses to implement specific UI logic
 *
 */
public abstract class A2UIComponent {

    private static final String TAG = "A2UIComponent";

    protected final String id;
    protected final String componentType;
    protected final Map<String, Object> properties = new HashMap<>();
    protected View view;
    protected A2UIComponent parent;
    protected final List<A2UIComponent> children = new ArrayList<>();

    /**
     * The Surface ID this component belongs to.
     * Set by Surface.addComponent().
     *
     */
    protected String surfaceId;

    /**
     * Bridge between the component and the Native layer.
     * Set by Surface.addComponent() and used to sync UI actions and data to the Native layer.
     *
     */
    private ComponentEventDispatcher componentEventDispatcher;

    /**
     * Constructor
     *
     * @param id            Unique component identifier
     * @param componentType Component type (Text, Button, Row, Column, etc.)
     */
    public A2UIComponent(String id, String componentType) {
        this.id = id;
        this.componentType = componentType;
    }

    /**
     * Creates the Android View.
     * Returns the existing View if it already exists, otherwise calls onCreateView to create it.
     *
     * @param context Android Context
     * @param parent  Parent container (optional)
     * @return Created View
     */
    public View createView(Context context, ViewGroup parent) {
        if (view == null) {
            view = onCreateView(context);

            // Apply initial styles immediately after the View is created.
            // If properties have already been set (updateProperties was called before createView),
            // apply styles now.
            if (view != null && properties != null && !properties.isEmpty()) {
                applyCommonStyles(view, properties, parent);
            }

            // Handle the weight property (A2UI v0.9 protocol: CatalogComponentCommon.weight).
            // weight must be set as FlexboxLayout.LayoutParams right after the View is created
            // so that the LayoutParams are correctly configured when the child is added to its parent.
            if (view != null && parent instanceof FlexContainerLayout) {
                applyFlexChildStyles(view, this);
                applyWeightToLayoutParams(view, parent);
                // Apply Position styles (after Flex styles; can override LayoutParams)
                applyPositionStyles(view, this);
            }

            // Set a generic click listener (A2UI v0.9 protocol: all components support the action property).
            // If the component has an action property, set a click listener automatically.
            if (view != null) {
                setupClickListener(view);
            }
        }
        return view;
    }

    /**
     * Applies the weight property to LayoutParams.
     *
     * weight is analogous to CSS flex-grow and controls the relative weight of a child component
     * along the main axis of its parent container.
     *
     * @param view   The child component's View
     * @param parent The parent container (must be a FlexContainerLayout)
     */
    private void applyWeightToLayoutParams(View view, ViewGroup parent) {
        if (!(parent instanceof FlexContainerLayout)) {
            return;
        }

        FlexboxLayout flexboxLayout =
                ((FlexContainerLayout) parent).getFlexboxLayout();

        // Get the weight property value
        Object weightObj = properties.get("weight");
        if (weightObj == null) {
            return;
        }

        float weight = 0f;
        if (weightObj instanceof Number) {
            weight = ((Number) weightObj).floatValue();
        } else if (weightObj instanceof String) {
            try {
                weight = Float.parseFloat((String) weightObj);
            } catch (NumberFormatException e) {
                Log.w(TAG, "Invalid weight value: " + weightObj, e);
                return;
            }
        }

        if (weight <= 0) {
            return;
        }

        // Get or create FlexboxLayout.LayoutParams
        ViewGroup.LayoutParams params = view.getLayoutParams();
        FlexboxLayout.LayoutParams flexParams;

        if (params instanceof FlexboxLayout.LayoutParams) {
            // Already FlexboxLayout.LayoutParams; use directly (preserving existing width/height)
            flexParams = (FlexboxLayout.LayoutParams) params;
        } else if (params != null) {
            // Other LayoutParams type: create new FlexboxLayout.LayoutParams and preserve width/height
            flexParams = new FlexboxLayout.LayoutParams(
                params.width,
                params.height
            );
        } else {
            // No LayoutParams: determine default dimensions based on the parent's flex direction
            int flexDirection = flexboxLayout.getFlexDirection();
            boolean isRow = (flexDirection == FlexDirection.ROW ||
                    flexDirection == FlexDirection.ROW_REVERSE);

            if (isRow) {
                // Row: width is 0 (controlled by flex-grow), height is WRAP_CONTENT
                flexParams = new FlexboxLayout.LayoutParams(
                    0,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                );
            } else {
                // Column: width is MATCH_PARENT, height is 0 (controlled by flex-grow)
                flexParams = new FlexboxLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    0
                );
            }
        }

        // Set flex-grow to achieve the weight effect
        flexParams.setFlexGrow(weight);

        // When weight is set, the main-axis dimension should be 0 to let flex-grow control
        // the actual size. However, if the user has explicitly set width/height via styles,
        // preserve those values.
        int flexDirection = flexboxLayout.getFlexDirection();
        boolean isRow = (flexDirection == FlexDirection.ROW ||
                flexDirection == FlexDirection.ROW_REVERSE);

        // Check for explicit width/height settings
        Map<String, Object> styles = extractStyles(properties);
        boolean hasExplicitWidth = styles != null && styles.containsKey("width");
        boolean hasExplicitHeight = styles != null && styles.containsKey("height");

        if (isRow) {
            // Row's main axis is horizontal.
            // Set width to 0 only if no explicit width is specified.
            if (!hasExplicitWidth) {
                flexParams.width = 0;
            }
        } else {
            // Column's main axis is vertical.
            // Set height to 0 only if no explicit height is specified.
            if (!hasExplicitHeight) {
                flexParams.height = 0;
            }
        }

        view.setLayoutParams(flexParams);

        Log.d(TAG, "Applied weight=" + weight + " to component " + id +
                " (flexDirection=" + (isRow ? "ROW" : "COLUMN") +
                          ", width=" + flexParams.width + ", height=" + flexParams.height + ")");
    }

    /**
     * Updates component properties (template method).
     *
     * Execution order:
     * 1. Save properties
     * 2. Automatically apply common styles (required for all components)
     * 3. Update click listener (if an action property is present)
     * 4. Call the subclass's onUpdateProperties (handle component-specific logic)
     *
     * Note: This method is final; subclasses cannot override it.
     * Subclasses should implement onUpdateProperties to handle type-specific styles.
     *
     * @param properties Properties Map
     */
    public final void updateProperties(Map<String, Object> properties) {
        this.properties.putAll(properties);

        if (view != null) {
            applyCommonStyles(view, properties);
            onUpdateProperties(properties);
            // The action property may arrive after createView; set the listener here as a catch-up
            if (properties.containsKey("action")) {
                setupClickListener(view);
            }
        }
    }

    /**
     * Applies styles common to all components.
     * Called automatically by the base class; subclasses do not need to handle this.
     *
     * Styles are read from the "styles" field in properties (JSON String or Map).
     *
     * Supported styles:
     * - Dimensions: width, height, max-width, max-height, min-width, min-height
     * - Spacing:    margin, padding (and their inline/block variants)
     * - Display:    display, opacity
     * - Background: background-color, background
     * - Border:     border-radius, border-color, border-width
     * - Shadow:     box-shadow
     * - Filter:     filter
     * - Aspect ratio: aspect-ratio
     *
     * @param view       The component's View
     * @param properties Properties Map
     * @param parent     Parent container (optional)
     */
    private void applyCommonStyles(View view, Map<String, Object> properties, ViewGroup parent) {
        // Get the styles object from properties
        Map<String, Object> styles = extractStyles(properties);
        if (styles == null || styles.isEmpty()) {
            return;
        }

        StyleHelper.applyDimensions(view, styles, parent);
        StyleHelper.applySpacing(view, styles);
        StyleHelper.applyDisplay(view, styles);
        StyleHelper.applyBackground(view, styles);
        StyleHelper.applyBorder(view, styles);
        StyleHelper.applyFilter(view, styles);
        StyleHelper.applyAspectRatio(view, styles);
    }

    /**
     * Applies common styles without a parent parameter (used by updateProperties)
     */
    private void applyCommonStyles(View view, Map<String, Object> properties) {
        applyCommonStyles(view, properties, null);
    }

    /**
     * Extracts the styles object from properties.
     *
     * styles may be:
     * 1. Map<String, Object> - used directly
     * 2. String (JSON)       - parsed first
     * 3. null                - returns an empty Map
     *
     * @param properties Properties Map
     * @return Styles Map
     */
    protected Map<String, Object> extractStyles(Map<String, Object> properties) {
        Object stylesObj = properties.get("styles");
        if (stylesObj == null) {
            return new HashMap<>();
        }

        // If it's already a Map, return it directly
        if (stylesObj instanceof Map) {
            return (Map<String, Object>) stylesObj;
        }

        // If it's a JSON String, parse it into a Map
        if (stylesObj instanceof String) {
            try {
                String jsonStr = (String) stylesObj;
                // Simple JSON parsing (using org.json or another JSON library available in the project)
                return parseJsonToMap(jsonStr);
            } catch (Exception e) {
                Log.e(TAG, "Failed to parse styles JSON: " + stylesObj, e);
                return new HashMap<>();
            }
        }

        return new HashMap<>();
    }

    /**
     * Parses a JSON string into a Map
     *
     * @param jsonStr JSON string
     * @return Map object
     */
    protected Map<String, Object> parseJsonToMap(String jsonStr) {
        try {
            JSONObject jsonObject = new JSONObject(jsonStr);
            Map<String, Object> map = new HashMap<>();

            Iterator<String> keys = jsonObject.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                Object value = jsonObject.get(key);
                map.put(key, value);
            }

            return map;
        } catch (JSONException e) {
            Log.e(TAG, "JSON parse error: " + jsonStr, e);
            return new HashMap<>();
        }
    }

    /**
     * Applies positioning styles to a child component.
     * Extracts styles internally and delegates to StyleHelper.applyPosition.
     *
     * @param childView      The child component's View
     * @param childComponent The child component instance
     */
    protected void applyPositionStyles(View childView, A2UIComponent childComponent) {
        if (childView == null || childComponent == null) {
            return;
        }

        // Extract styles
        Map<String, Object> styles = extractStyles(childComponent.getProperties());
        if (styles != null && !styles.isEmpty()) {
            // Delegate to StyleHelper to apply positioning styles.
            // applyPosition internally checks whether position is absolute, and if so,
            // automatically overrides LayoutParams.
            StyleHelper.applyPosition(childView, styles);
        }
    }

    /**
     * Applies Flex child element styles to a child component.
     *
     * Supported styles:
     * - align-self:  alignment of the child along the cross axis
     * - flex-grow:   grow factor of the child
     * - flex-shrink: shrink factor of the child
     * - flex-basis:  base size of the child
     *
     * @param childView      The child component's View
     * @param childComponent The child component instance
     */
    protected void applyFlexChildStyles(View childView, A2UIComponent childComponent) {
        if (childView == null || childComponent == null) return;

        ViewGroup.LayoutParams params = childView.getLayoutParams();
        FlexboxLayout.LayoutParams flexParams;

        // Critical fix: if LayoutParams is null, explicitly construct a FlexboxLayout.LayoutParams
        if (params == null) {
            flexParams = new FlexboxLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            Log.d(TAG, "applyFlexChildStyles: created FlexboxLayout.LayoutParams for " + childComponent.getId());
        } else if (params instanceof FlexboxLayout.LayoutParams) {
            // Already FlexboxLayout.LayoutParams; use directly
            flexParams = (FlexboxLayout.LayoutParams) params;
        } else {
            // Other LayoutParams type: convert to FlexboxLayout.LayoutParams
            flexParams = new FlexboxLayout.LayoutParams(
                params.width,
                params.height
            );
            Log.d(TAG, "applyFlexChildStyles: converted to FlexboxLayout.LayoutParams for " + childComponent.getId());
        }
        // Set default FlexLayoutParams values
        flexParams.setFlexShrink(1);

        Map<String, Object> childProps = childComponent.getProperties();

        // Critical fix: extract styles object from properties.
        // Flex child styles (align-self, flex-grow, etc.) are inside the styles field.
        Map<String, Object> styles = extractStyles(childProps);

        // Apply Flex child properties
        StyleHelper.applyFlexChild(flexParams, styles);

        // Update LayoutParams
        childView.setLayoutParams(flexParams);
    }

    /**
     * Adds a child component
     *
     * @param child Child component
     */
    public void addChild(A2UIComponent child) {
        children.add(child);
        child.parent = this;
    }

    /**
     * Removes a child component
     *
     * @param child Child component instance
     */
    public void removeChild(A2UIComponent child) {
        children.remove(child);
        if (child != null) {
            child.parent = null;
            if (child.getView() != null && this.getView() instanceof ViewGroup) {
                ((ViewGroup) this.getView()).removeView(child.getView());
            }
        }
    }

    /**
     * Removes a child component by ID
     *
     * @param childId Child component ID
     */
    public void removeChildById(String childId) {
        A2UIComponent childToRemove = null;
        for (A2UIComponent child : children) {
            if (child.getId().equals(childId)) {
                childToRemove = child;
                break;
            }
        }
        if (childToRemove != null) {
            removeChild(childToRemove);
        } else {
            Log.w(TAG, "removeChildById: child not found, id=" + childId);
        }
    }

    /**
     * Destroys the component, recursively destroying all child components.
     * Execution order: recursively destroy children → onDestroy() (subclass releases resources)
     * → remove View from parent container.
     * Subclasses must not override this method; implement onDestroy() to release their own resources.
     */
    public final void destroy() {
        Log.d(TAG, "destroy: " + this.getId() + " (" + this.getComponentType() + ")");

        // 1. Recursively destroy child components
        for (A2UIComponent child : children) {
            child.destroy();
        }
        children.clear();

        // 2. Subclass releases its own resources (MediaPlayer, Handler, etc.)
        onDestroy();

        // 3. Remove View from parent container
        if (view != null) {
            if (view.getParent() instanceof ViewGroup) {
                ((ViewGroup) view.getParent()).removeView(view);
            }
            view = null;
        }
    }

    /**
     * Subclass resource-release hook, called by destroy() after children are cleaned up
     * and before the View is removed.
     * Subclasses override this method to release resources such as MediaPlayer and Handler.
     */
    protected void onDestroy() {
        // Default empty implementation
    }

    /**
     * Whether child component Views should be automatically added to the parent container.
     *
     * Returns true by default, meaning child Views are added automatically.
     * Special components (e.g. TabsComponent, ModalComponent) that manage their child Views
     * themselves can override this method to return false.
     *
     * @return true to auto-add child Views, false if the component manages them internally
     */
    public boolean shouldAutoAddChildView() {
        return true;
    }

    /**
     * Callback when a child View has been created (for special parent components such as
     * TabsComponent and ModalComponent to override).
     *
     * @param child The child component whose View has been created
     */
    public void onChildViewCreated(A2UIComponent child) {
        // Default empty implementation; subclasses override as needed
    }


    /**
     * Creates the concrete Android View.
     * Subclasses implement this method to create the corresponding View
     * (TextView, Button, LinearLayout, etc.).
     *
     * @param context Android Context
     * @return Created View
     */
    protected abstract View onCreateView(Context context);

    /**
     * Handles the concrete logic for updating component properties.
     * Subclasses implement this method to process property and style updates
     * (e.g. text, color, fontSize, backgroundColor, padding, etc.).
     *
     * @param properties Properties Map (includes style properties)
     */
    protected abstract void onUpdateProperties(Map<String, Object> properties);


    public String getId() {
        return id;
    }

    public String getComponentType() {
        return componentType;
    }

    public View getView() {
        return view;
    }

    public A2UIComponent getParent() {
        return parent;
    }

    public List<A2UIComponent> getChildren() {
        return new ArrayList<>(children);
    }

    public Map<String, Object> getProperties() {
        return new HashMap<>(properties);
    }

    /**
     * Sets the Surface ID this component belongs to.
     *
     * Design notes:
     * - Called by Surface.addComponent()
     * - Set immediately after the component is created; does not change during its lifetime
     * - Used to identify the owning Surface when the component interacts with the Native engine
     *
     * @param surfaceId Unique Surface identifier
     */
    public void setSurfaceId(String surfaceId) {
        this.surfaceId = surfaceId;
    }

    /**
     * Returns the Surface ID this component belongs to
     *
     * @return Surface ID, or null if not set
     */
    public String getSurfaceId() {
        return surfaceId;
    }

    /**
     * Sets the bridge between this component and the Native layer
     *
     * @param componentEventDispatcher The bridge instance
     */
    @RestrictTo(RestrictTo.Scope.LIBRARY_GROUP)
    public void setComponentBridge(ComponentEventDispatcher componentEventDispatcher) {
        this.componentEventDispatcher = componentEventDispatcher;
    }

    /**
     * Sets a click listener when the component has an action property defined.
     * Pure display components (Text, Image, etc.) without an action do not intercept touch events.
     *
     * @param view The component's View
     */
    private void setupClickListener(View view) {
        if (properties.containsKey("action")) {
            view.setOnClickListener(v -> handleClick());
            view.setClickable(true);
            view.setFocusable(true);
        }
    }

    /**
     * Handles the component click event.
     *
     * Common click handling logic:
     * 1. Check whether an action is defined
     * 2. Check whether surfaceId is set
     * 3. Build JSON and dispatch to the Native layer
     *
     * Subclasses can override this method to implement custom click handling.
     *
     */
    protected void handleClick() {
        triggerAction();
    }


    /**
     * Triggers the component's Action event.
     * <p>
     * Equivalent to the Action triggered by a user click.
     * Custom components can call this proactively when needed
     * (e.g. for gestures, long press, or other interactions).
     *
     */
    public final void triggerAction() {
        Log.d(TAG, "Component action triggered: " + id + " (type: " + componentType + ")");

        if (surfaceId == null) {
            Log.w(TAG, "SurfaceId is null, cannot dispatch action for component: " + id);
            return;
        }
        if (componentEventDispatcher == null) {
            Log.w(TAG, "ComponentEventDispatcher is null, cannot dispatch action for component: " + id);
            return;
        }

        componentEventDispatcher.submitUIAction(surfaceId, id, "");
    }

    /**
     * Synchronizes a component UI state change to the Native data model.
     * <p>
     * Custom components should call this when their UI state changes
     * (e.g. text input, checkbox toggle, slider movement) to sync the change
     * to the C++ DataBinding Module.
     *
     * @param jsonData Changed content (JSON format, e.g. {"value": "hello"})
     */
    public final void syncState(String jsonData) {
        if (surfaceId == null) {
            Log.w(TAG, "SurfaceId is null, cannot syncState for component: " + id);
            return;
        }
        if (componentEventDispatcher == null) {
            Log.w(TAG, "ComponentEventDispatcher is null, cannot syncState for component: " + id);
            return;
        }
        componentEventDispatcher.submitUIDataModel(surfaceId, id, jsonData);
    }
}
