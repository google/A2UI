package com.amap.agenui.render.surface;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;

import com.amap.agenui.IAGenUIMessageListener;
import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.ComponentRegistry;
import com.amap.agenui.render.component.ParentChildResolver;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * JNI Bridge - receives events from the C++ EventDispatcher
 * <p>
 * Responsibilities:
 * 1. Receives createSurface, updateComponents, updateDataModel, and destroySurface events from C++
 * 2. Forwards events to SurfaceManager for processing
 * 3. Parses JSON data and updates components
 * 4. Supports progressive rendering (components may arrive in any order)
 *
 */
public class NativeEventBridge implements IAGenUIMessageListener {

    private static final String TAG = "NativeEventBridge";

    private final SurfaceManager surfaceManager;
    private final int engineId;
    private final Gson gson = new Gson();
    private final ParentChildResolver resolver = new ParentChildResolver();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public NativeEventBridge(@NonNull SurfaceManager surfaceManager, int engineId) {
        this.surfaceManager = surfaceManager;
        this.engineId = engineId;
    }

    @Override
    public void onCreateSurface(String surfaceId, String catalogId, Map<String, String> theme, boolean sendDataModel, boolean animated) {
        Log.i(TAG, "========== onCreateSurface ==========");
        Log.i(TAG, "surfaceId=" + surfaceId);
        Log.i(TAG, "catalogId=" + catalogId);

        mainHandler.post(() -> {
            // 1. Create Surface (without container)
            Surface surface = surfaceManager.createSurface(surfaceId);
            if (surface != null) {
                surface.setAnimationEnabled(animated);
                Log.d(TAG, "✓ Surface created");
            } else {
                Log.e(TAG, "Surface created failed");
            }

            Log.i(TAG, "========== onCreateSurface END ==========");
        });
    }

    @Override
    public void onUpdateComponents(String surfaceId, String[] components) {
        Log.i(TAG, "onUpdateComponents: surfaceId=" + surfaceId + ", components count=" + (components != null ? components.length : 0) + ", components=" + (components != null ? Arrays.toString(components) : "null"));

        // Convert component array to JSON array
        JSONArray array = new JSONArray();
        for (String component : components) {
            try {
                JSONObject object = new JSONObject(component);
                array.put(object);
            } catch (JSONException e) {
                Log.e(TAG, "Failed to parse component JSON", e);
            }
        }
        String componentsJson = array.toString();
        mainHandler.post(() -> NativeEventBridge.this.onUpdateComponents(surfaceId, componentsJson));
    }

    @Override
    public void onDeleteSurface(String surfaceId) {
        Log.i(TAG, "onDeleteSurface: surfaceId=" + surfaceId);
        mainHandler.post(() -> surfaceManager.destroySurface(surfaceId));
    }

    @Override
    public void onInteractionStatusEvent(int eventType, String content) {
        Log.i(TAG, "onInteractionStatusEvent: eventType=" + eventType + ",content=" + content);
    }

    @Override
    public void onActionEventRouted(String content) {
        Log.i(TAG, "onActionEventRouted: content=" + content);
        mainHandler.post(() -> surfaceManager.notifyActionEvent(content));
    }



    /**
     * Called from C++: updates multiple components
     *
     * @param surfaceId      Surface ID
     * @param componentsJson Component JSON data (array format)
     */
    public void onUpdateComponents(String surfaceId, String componentsJson) {
        Log.d(TAG, "========== onUpdateComponents START (Optimized) ==========");
        Log.d(TAG, "surfaceId=" + surfaceId);
        Log.d(TAG, "componentsJson length=" + (componentsJson != null ? componentsJson.length() : 0));

        try {
            // Parse component JSON data
            JsonElement element = JsonParser.parseString(componentsJson);
            Log.d(TAG, "JSON parsed successfully, isJsonArray=" + element.isJsonArray());

            if (element.isJsonArray()) {
                Surface surface = surfaceManager.getSurface(surfaceId);
                if (surface == null) {
                    Log.e(TAG, "❌ Surface not found: " + surfaceId);
                    return;
                }
                Log.d(TAG, "✓ Surface found: " + surfaceId);

                // Parse component array
                List<Map<String, Object>> components = gson.fromJson(element, List.class);
                Log.d(TAG, "✓ Components parsed, count=" + components.size());


                // 1. Build parent-child relationship map (O(n))
                Log.d(TAG, "--- Step 1: Building parent-child map ---");
                Map<String, String> parentMap = resolver.buildParentMap(components);

                // 2. Validate component tree integrity (optional, for debugging)
                resolver.validateComponentTree(components, parentMap);

                // 3. Find root component
                String rootId = resolver.findRootComponent(components);

                // 4. Topological sort (O(n))
                Log.d(TAG, "--- Step 2: Topological sorting ---");
                List<String> sortedIds = resolver.topologicalSort(components, parentMap);

                // 5. Build a map from component ID to component data
                Map<String, Map<String, Object>> componentMap = new HashMap<>();
                for (Map<String, Object> comp : components) {
                    componentMap.put((String) comp.get("id"), comp);
                }

                // 6. Check whether the container is already bound
                Log.d(TAG, "Container always available (internal FrameLayout)");

                // 7. Create and add components in topological order (O(n))
                Log.d(TAG, "--- Step 3: Creating and adding components in order ---");
                int addedCount = 0;
                for (String componentId : sortedIds) {
                    Map<String, Object> componentData = componentMap.get(componentId);
                    if (componentData == null) {
                        Log.w(TAG, "⚠ Component data not found: " + componentId);
                        continue;
                    }

                    String parentId = parentMap.get(componentId);

                    // Streaming render fix: if parentMap has no parent info for this component,
                    // try to find it in the componentTree (a component there may already reference
                    // the current component as a child)
                    if (parentId == null) {
                        Log.d(TAG, "  → parentMap has no parent info for: " + componentId);
                        Log.d(TAG, "  → Searching in componentTree...");
                        parentId = findParentInComponentTree(surface, componentId);
                        if (parentId != null) {
                            Log.d(TAG, "  ✓ Found parent in componentTree: " + parentId + " for child: " + componentId);
                        } else {
                            Log.d(TAG, "  ⚠ No parent found in componentTree for: " + componentId);
                        }
                    } else {
                        Log.d(TAG, "  ✓ Parent from parentMap: " + parentId + " for child: " + componentId);
                    }

                    // Process component using the shared method
                    boolean added = processComponent(surface, componentData, parentId);
                    if (added) {
                        addedCount++;
                    }
                }

                Log.d(TAG, "Step 3 complete: " + addedCount + " new components added");

                // 7.5. Detect and log orphaned nodes (non-root components with no parent)
                detectAndLogOrphanedComponents(surface);

                // 8. If the container is already bound, the whole component tree's Views need to
                //    be created manually, since processComponent only created component objects and
                //    parent-child relationships without creating Views.

                // 9. Handle special Modal component linking (kept for compatibility)
                Log.d(TAG, "--- Step 4: Linking Modal components ---");
                surface.linkModalComponents();

                Log.d(TAG, "✓ Components updated for surface: " + surfaceId);
                Log.d(TAG, "========== onUpdateComponents END ==========");
            } else {
                Log.e(TAG, "❌ JSON is not an array!");
            }

        } catch (Exception e) {
            Log.e(TAG, "❌❌❌ Error updating components", e);
        }
    }

    /**
     * Processes the creation and addition of a single component.
     * This is a shared method reused by onUpdateComponent and onUpdateComponents.
     *
     * @param surface          Surface instance
     * @param componentData    Component data (contains id, type, properties, etc.)
     * @param explicitParentId Explicitly specified parent component ID (optional; if null, obtained
     *                         from componentData)
     * @return true if the component was successfully added; false if it already exists or is
     *         waiting for its parent
     */
    private boolean processComponent(Surface surface, Map<String, Object> componentData, String explicitParentId) {
        try {
            // 1. Extract basic component info
            String componentId = (String) componentData.get("id");
            String componentType = (String) componentData.get("type");
            if (componentType == null) {
                componentType = (String) componentData.get("component");
            }

            if (componentId == null || componentType == null) {
                Log.e(TAG, "❌ Component missing id or type");
                return false;
            }

            Log.d(TAG, "  Processing component: id=" + componentId + ", type=" + componentType);

            // 2. Critical fix: look up the component in Surface.componentTree, not in ComponentRegistry,
            //    because components are added to componentTree via Surface.addComponent()
            A2UIComponent existingComponent = surface.getComponent(componentId);
            if (existingComponent != null) {
                Log.w(TAG, "  ⚠ Component already exists: " + componentId);
                Log.d(TAG, "  → Updating component properties only (not recreating)...");

                // Critical fix: when a component already exists, extract and update its properties
                // (same logic as below)
                Map<String, Object> updateProperties = (Map<String, Object>) componentData.get("properties");
                if (updateProperties == null) {
                    // No "properties" field: use the entire componentData as properties
                    updateProperties = new HashMap<>(componentData);
                    updateProperties.remove("id");
                    updateProperties.remove("type");
                    updateProperties.remove("component");
                    updateProperties.remove("parent");
                    Log.d(TAG, "  ✓ Extracted properties from top-level: " + updateProperties.keySet());
                } else {
                    Log.d(TAG, "  ✓ Extracted properties from 'properties' field: " + updateProperties.keySet());
                }

                // Update component properties
                if (updateProperties != null && !updateProperties.isEmpty()) {
                    existingComponent.updateProperties(updateProperties);
                    Log.d(TAG, "  ✓ Component properties updated: " + updateProperties.keySet());
                } else {
                    Log.d(TAG, "  ⚠ No properties to update");
                }

                // Critical fix: do not call surface.addComponent() to avoid duplicate View creation.
                // surface.addComponent() creates a new View and adds it to the parent, causing duplicates.
                Log.d(TAG, "  ✓ Skipped surface.addComponent() to avoid duplicate view creation");

                return true;  // Return true to indicate successful processing
            }

            // 3. Determine parent component ID (prefer explicit over componentData's "parent" field)
            String parentId = explicitParentId;
            if (parentId == null) {
                // Try to get the "parent" field from the top-level componentData
                Object parentObj = componentData.get("parent");
                if (parentObj instanceof String) {
                    parentId = (String) parentObj;
                    Log.d(TAG, "  ✓ Parent ID extracted from componentData: " + parentId);
                }
            }

            // 4. Extract component properties.
            // Properties may be in the "properties" field or directly at the component object's top level.
            Map<String, Object> properties = (Map<String, Object>) componentData.get("properties");
            if (properties == null) {
                // No "properties" field: use the entire componentData as properties,
                // excluding metadata fields (id, type, component, parent)
                properties = new HashMap<>(componentData);
                properties.remove("id");
                properties.remove("type");
                properties.remove("component");
                properties.remove("parent");

                Log.d(TAG, "  ✓ Extracted properties from top-level: " + properties.keySet());
            } else {
                Log.d(TAG, "  ✓ Extracted properties from 'properties' field: " + properties.keySet());
            }

            Log.d(TAG, "  Parent ID: " + (parentId != null ? parentId : "ROOT"));

            // 5. Create component
            Context componentContext = surfaceManager.getContext();
            if (componentContext == null) {
                Log.e(TAG, "  ❌ Cannot create component: Activity context is null (Activity may have been destroyed)");
                return false;
            }
            A2UIComponent component = ComponentRegistry.createComponent(componentContext, componentType, componentId, properties);
            if (component == null) {
                Log.e(TAG, "  ❌ Failed to create component: " + componentType);
                return false;
            }

            Log.d(TAG, "  ✓ Component created: " + componentId);

            // 9. Critical fix: call Surface.addComponent() only; do not register separately.
            // Surface.addComponent() internally:
            // 1. Adds the component to componentTree
            // 2. Sets surfaceId
            // 3. Establishes the parent-child relationship
            // 4. Creates and adds the View if the container is already bound
            // This avoids duplicate registration and duplicate View creation.
            surface.addComponent(parentId, component);

            // 10. Update component properties (critical fix: ensures onUpdateProperties is called)
            // This makes properties like justify and align take effect.
            if (properties != null && !properties.isEmpty()) {
                component.updateProperties(properties);
                Log.d(TAG, "  ✓ Component properties updated: " + properties.keySet());
            }

            // 11. If this is the root component, set it on the Surface
            if (parentId == null) {
                // Critical fix: only a component with ID "root" is the true root component
                if ("root".equals(componentId)) {
                    surface.setRootComponent(component);
                    Log.d(TAG, "  ✓ Set as TRUE root component (id=root)");
                } else {
                    Log.d(TAG, "  ⚠ Orphaned component (no parent yet): " + componentId);
                    Log.d(TAG, "  ⚠ Will be linked when parent arrives");
                    // Do not set as root; it has already been added to componentTree above
                }
            }

            Log.d(TAG, "  ✓ Component added successfully: " + componentId);
            return true;

        } catch (Exception e) {
            Log.e(TAG, "❌ Error processing component", e);
            return false;
        }
    }

    /**
     * Finds the parent component in the componentTree that references the given component as a child.
     *
     * Use case: during streaming rendering a child arrives before its parent. When processing
     * the child, its parent may already be in the componentTree but not yet recorded in parentMap.
     *
     * @param surface Surface instance
     * @param childId Child component ID
     * @return Parent component ID, or null if not found
     */
    private String findParentInComponentTree(Surface surface, String childId) {
        try {
            Map<String, A2UIComponent> allComponents = surface.getComponentTree();
            if (allComponents == null || allComponents.isEmpty()) {
                return null;
            }

            for (Map.Entry<String, A2UIComponent> entry : allComponents.entrySet()) {
                String potentialParentId = entry.getKey();
                Map<String, Object> properties = entry.getValue().getProperties();
                if (properties == null) continue;

                // children array (Row, Column, etc.)
                Object childrenObj = properties.get("children");
                if (childrenObj instanceof List) {
                    for (Object child : (List<?>) childrenObj) {
                        if (childId.equals(child)) {
                            Log.d(TAG, "findParentInComponentTree: found parent=" + potentialParentId + " for child=" + childId);
                            return potentialParentId;
                        }
                    }
                }

                // child single reference
                if (childId.equals(properties.get("child"))) {
                    Log.d(TAG, "findParentInComponentTree: found parent=" + potentialParentId + " for child=" + childId);
                    return potentialParentId;
                }

                // tabs[].child (Tabs component)
                Object tabsObj = properties.get("tabs");
                if (tabsObj instanceof List) {
                    for (Object tabObj : (List<?>) tabsObj) {
                        if (tabObj instanceof Map) {
                            if (childId.equals(((Map<?, ?>) tabObj).get("child"))) {
                                Log.d(TAG, "findParentInComponentTree: found parent=" + potentialParentId + " for child=" + childId);
                                return potentialParentId;
                            }
                        }
                    }
                }

                // trigger / content (Modal component)
                if (childId.equals(properties.get("trigger")) || childId.equals(properties.get("content"))) {
                    Log.d(TAG, "findParentInComponentTree: found parent=" + potentialParentId + " for child=" + childId);
                    return potentialParentId;
                }
            }

            Log.d(TAG, "findParentInComponentTree: no parent found for child=" + childId);
            return null;

        } catch (Exception e) {
            Log.e(TAG, "findParentInComponentTree: error", e);
            return null;
        }
    }

    /**
     * Detects and logs orphaned nodes.
     *
     * An orphaned node is a component that exists in the componentTree but is not referenced
     * as a child by any other component. This is expected in streaming rendering (children
     * arrive before their parent), but should be logged for debugging and tracing purposes.
     *
     * @param surface Surface instance
     */
    private void detectAndLogOrphanedComponents(Surface surface) {
        try {
            Map<String, A2UIComponent> allComponents = surface.getComponentTree();
            if (allComponents == null || allComponents.isEmpty()) {
                return;
            }

            // Get the current root component
            A2UIComponent currentRoot = surface.getRootComponent();
            String currentRootId = (currentRoot != null) ? currentRoot.getId() : null;

            // Collect all child component IDs that are referenced
            Set<String> referencedChildren = new HashSet<>();

            for (A2UIComponent component : allComponents.values()) {
                Map<String, Object> properties = component.getProperties();
                if (properties == null) {
                    continue;
                }

                // Check children array
                Object childrenObj = properties.get("children");
                if (childrenObj instanceof List) {
                    List<?> childrenList = (List<?>) childrenObj;
                    for (Object child : childrenList) {
                        referencedChildren.add(String.valueOf(child));
                    }
                }

                // Check child single reference
                Object childObj = properties.get("child");
                if (childObj != null) {
                    referencedChildren.add(String.valueOf(childObj));
                }

                // Check tabs array
                Object tabsObj = properties.get("tabs");
                if (tabsObj instanceof List) {
                    List<?> tabsList = (List<?>) tabsObj;
                    for (Object tabObj : tabsList) {
                        if (tabObj instanceof Map) {
                            Map<String, Object> tab = (Map<String, Object>) tabObj;
                            Object tabChildObj = tab.get("child");
                            if (tabChildObj != null) {
                                referencedChildren.add(String.valueOf(tabChildObj));
                            }
                        }
                    }
                }

                // Check trigger and content
                Object triggerObj = properties.get("trigger");
                if (triggerObj != null) {
                    referencedChildren.add(String.valueOf(triggerObj));
                }

                Object contentObj = properties.get("content");
                if (contentObj != null) {
                    referencedChildren.add(String.valueOf(contentObj));
                }
            }

            // Find orphaned nodes: present in componentTree but not referenced by any component,
            // and not the root component
            List<String> orphanedNodes = new ArrayList<>();
            for (String componentId : allComponents.keySet()) {
                // Skip the root component
                if (componentId.equals(currentRootId)) {
                    continue;
                }

                // If not referenced by any component, it is an orphaned node
                if (!referencedChildren.contains(componentId)) {
                    orphanedNodes.add(componentId);
                }
            }

            // Log orphaned nodes
            if (!orphanedNodes.isEmpty()) {
                Log.w(TAG, "========== ORPHANED NODES DETECTED ==========");
                Log.w(TAG, "Surface: " + surface.getSurfaceId());
                Log.w(TAG, "Current root component: " + currentRootId);
                Log.w(TAG, "Total components in tree: " + allComponents.size());
                Log.w(TAG, "Orphaned nodes count: " + orphanedNodes.size());
                Log.w(TAG, "Orphaned node IDs: " + orphanedNodes);

                // Log details of each orphaned node
                for (String orphanedId : orphanedNodes) {
                    A2UIComponent orphanedComp = allComponents.get(orphanedId);
                    if (orphanedComp != null) {
                        Log.w(TAG, "  - " + orphanedId + " (" + orphanedComp.getClass().getSimpleName() + ")");
                        Log.w(TAG, "    Properties: " + orphanedComp.getProperties());
                        Log.w(TAG, "    Has view: " + (orphanedComp.getView() != null));
                    }
                }

                Log.w(TAG, "Note: Orphaned nodes are expected in streaming render (children arrive before parent)");
                Log.w(TAG, "They will be properly linked when their parent component arrives");
                Log.w(TAG, "========== ORPHANED NODES DETECTION END ==========");
            }

        } catch (Exception e) {
            Log.e(TAG, "❌ Error detecting orphaned components", e);
        }
    }
}
