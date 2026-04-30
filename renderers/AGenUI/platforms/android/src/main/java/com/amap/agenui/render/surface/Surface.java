package com.amap.agenui.render.surface;

import android.content.Context;
import android.os.Looper;
import android.os.SystemClock;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.amap.agenui.render.component.A2UIComponent;
import com.amap.agenui.render.component.ComponentEventDispatcher;
import com.amap.agenui.render.component.impl.ModalComponent;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Surface - represents an independent UI canvas
 *
 * Responsibilities:
 * 1. Manages CRUD operations on the component tree
 * 2. Maintains componentTree (component ID → component instance mapping)
 * 3. Provides interfaces for creating, updating, and destroying components
 * 4. Supports dynamic container bind/unbind (for RecyclerView optimization)
 *
 * Design notes:
 * - A Surface can exist without a container (CREATED state)
 * - Container bind/unbind is independent of the Surface lifecycle
 * - Supports pre-rendering: components can start being created before the container is bound
 *
 */
public class Surface {

    private static final String TAG = "Surface";

    /**
     * Surface state enumeration
     */

    private final String surfaceId;
    private ViewGroup container;  // Internally created root container; always non-null
    private final Context context;
    private final ComponentEventDispatcher componentEventDispatcher;

    private boolean destroyed = false;
    private A2UIComponent rootComponent;
    private final Map<String, A2UIComponent> componentTree = new HashMap<>();

    // Animation toggle - enabled by default
    private boolean animationEnabled = true;
    /**
     * Constructor
     *
     * @param surfaceId                Unique Surface identifier
     * @param context                  Android Context
     * @param componentEventDispatcher Bridge between components and the Native layer
     */
    public Surface(
            String surfaceId,
            Context context,
            ComponentEventDispatcher componentEventDispatcher) {
        this.surfaceId = surfaceId;
        this.context = context;
        this.componentEventDispatcher = componentEventDispatcher;

        // If a container is provided at construction time, enter the BOUND state immediately
        this.container = new FrameLayout(context);
        this.container.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT));

        Log.d(TAG, "Surface created: id=" + surfaceId);
    }

    /**
     * Sets the animation toggle
     *
     * @param enabled true to enable animation, false to disable
     */
    public void setAnimationEnabled(boolean enabled) {
        this.animationEnabled = enabled;
        Log.d(TAG, "Animation " + (enabled ? "enabled" : "disabled"));
    }

    /**
     * Returns the animation toggle state
     *
     * @return true if animation is enabled, false if disabled
     */
    public boolean isAnimationEnabled() {
        return animationEnabled;
    }

    /**
     * Adds a component
     *
     * @param parentId  Parent component ID (null for root component)
     * @param component Component instance
     */
    public void addComponent(String parentId, A2UIComponent component) {
        Log.d(TAG, "========== addComponent START ==========");
        Log.d(TAG, "componentId=" + component.getId() + ", parentId=" + (parentId != null ? parentId : "ROOT"));
        Log.d(TAG, "componentType=" + component.getClass().getSimpleName());

        component.setSurfaceId(this.surfaceId);
        component.setComponentBridge(this.componentEventDispatcher);

        if (component instanceof com.amap.agenui.render.component.impl.ImageComponent) {
            ((com.amap.agenui.render.component.impl.ImageComponent) component).setAnimationEnabled(animationEnabled);
        }

        componentTree.put(component.getId(), component);
        Log.d(TAG, "✓ Component added to tree, total components=" + componentTree.size());

        if (parentId == null) {
            handleRootComponent(component);
        } else {
            handleChildComponent(parentId, component);
        }
        Log.d(TAG, "========== addComponent END ==========");
    }

    private void handleRootComponent(A2UIComponent component) {
        Log.d(TAG, "→ Adding as ROOT component");

        if (rootComponent != null && rootComponent != component) {
            Log.w(TAG, "  ⚠ Root component already exists: " + rootComponent.getId());
            if (!"root".equals(component.getId())) {
                Log.w(TAG, "  ⚠ New component is NOT true root, keeping as orphaned");
                return;
            }
            Log.w(TAG, "  ✓ New component IS the true root, replacing fake root");
            replaceFakeRoot(component);
            return;
        }

        rootComponent = component;
        attachRootView(component);
    }

    private void replaceFakeRoot(A2UIComponent newRoot) {
        if (rootComponent.getView() != null) {
            Log.d(TAG, "  → Removing fake root view from container");
            container.removeView(rootComponent.getView());
        }
        rootComponent = newRoot;
        if (newRoot.getView() == null) {
            Log.d(TAG, "  → Creating view for TRUE root component");
            createComponentTreeViews(newRoot, container);
            Log.d(TAG, "  ✓ TRUE root component tree created");
        }
    }

    private void attachRootView(A2UIComponent component) {
        View existing = component.getView();
        if (existing != null) {
            Log.d(TAG, "  ⚠ Root component view already exists");
            if (existing.getParent() != container) {
                Log.d(TAG, "  → Adding existing view to container");
                container.addView(existing);
                Log.d(TAG, "  ✓ View added to container");
            } else {
                Log.d(TAG, "  ✓ View already in container, skipping add");
            }
            return;
        }
        Log.d(TAG, "  Creating view for root component...");
        View view = component.createView(context, container);
        if (view != null) {
            container.addView(view);
            Log.d(TAG, "  ✓ View created and added to container, childCount=" + container.getChildCount());
        } else {
            Log.e(TAG, "  ❌ createView returned null!");
        }
    }

    private void handleChildComponent(String parentId, A2UIComponent component) {
        Log.d(TAG, "→ Adding as CHILD component, parent=" + parentId);
        A2UIComponent parent = componentTree.get(parentId);
        if (parent == null) {
            Log.e(TAG, "  ❌ Parent component not found: " + parentId);
            return;
        }
        Log.d(TAG, "  ✓ Parent found: " + parent.getClass().getSimpleName());
        parent.addChild(component);
        Log.d(TAG, "  ✓ Child added to parent's children list");

        ViewGroup parentContainer = getComponentChildContainer(parent);
        if (parentContainer == null) {
            Log.w(TAG, "  ⚠ Parent childContainer is null, child view not created yet");
            return;
        }
        Log.d(TAG, "  Parent childContainer exists: " + parentContainer.getClass().getSimpleName());

        View childView = component.createView(context, parentContainer);
        if (childView == null) {
            Log.e(TAG, "  ❌ createView returned null for child!");
            return;
        }
        Log.d(TAG, "  ✓ Child view created: " + childView.getClass().getSimpleName());
        attachChildView(parent, component, childView, parentContainer);
    }

    private void attachChildView(A2UIComponent parent, A2UIComponent child,
                                 View childView, ViewGroup parentContainer) {
        if (!parent.shouldAutoAddChildView()) {
            Log.d(TAG, "  ⚠ Parent manages child views internally, not auto-adding");
            notifyParentChildViewCreated(parent, child);
            return;
        }

        int index = -1;
        Object childrenObj = parent.getProperties().get("children");
        if (childrenObj instanceof List) {
            index = calculateInsertIndex((List<?>) childrenObj, parent.getChildren(), child.getId());
        }
        parentContainer.addView(childView, index);

        if (animationEnabled) {
            float targetAlpha = childView.getAlpha();
            childView.setAlpha(0f);
            childView.animate().alpha(targetAlpha).setDuration(500).start();
        }
        Log.d(TAG, "  ✓ Child view added, parentChildCount=" + parentContainer.getChildCount());

        ViewGroup childContainer = getComponentChildContainer(child);
        if (childContainer != null && child.getChildren() != null && !child.getChildren().isEmpty()) {
            Log.d(TAG, "  → Component has children, creating their views recursively...");
            createChildrenViews(child, childContainer);
        }
    }


    private int calculateInsertIndex(List<?> expectedOrder,
                                     List<A2UIComponent> existingChildren,
                                     String newChildId) {

        // Build an id → expected order index map for O(1) lookup
        Map<String, Integer> orderMap = new HashMap<>();
        for (int i = 0; i < expectedOrder.size(); i++) {
            orderMap.put(String.valueOf(expectedOrder.get(i)), i);
        }

        Integer newChildExpectedIndex = orderMap.get(newChildId);
        if (newChildExpectedIndex == null) {
            return existingChildren.size(); // Not in the list; append to end
        }

        int insertIndex = 0;
        for (A2UIComponent existing : existingChildren) {
            Integer existingIndex = orderMap.get(existing.getId());
            if (existingIndex != null && existingIndex < newChildExpectedIndex) {
                insertIndex++;
            }
        }

        return insertIndex;
    }

    /**
     * Removes a component
     *
     * @param componentId Component ID
     */
    public void removeComponent(String componentId) {
        Log.d(TAG, "removeComponent: componentId=" + componentId);

        A2UIComponent component = componentTree.remove(componentId);
        if (component != null) {
            A2UIComponent parent = component.getParent();
            if (parent != null) {
                parent.removeChildById(componentId);
                // Remove from parent View
                if (parent.getView() instanceof ViewGroup && component.getView() != null) {
                    ((ViewGroup) parent.getView()).removeView(component.getView());
                }
            } else if (component == rootComponent) {
                // Remove root component
                if (component.getView() != null) {
                    container.removeView(component.getView());
                }
                rootComponent = null;
            }
            component.destroy();
        }
    }

    /**
     * Updates component properties
     *
     * @param componentId Component ID
     * @param properties  Properties Map
     */
    public void updateComponent(String componentId, Map<String, Object> properties) {
        Log.d(TAG, "updateComponent: componentId=" + componentId);

        A2UIComponent component = componentTree.get(componentId);
        if (component != null) {
            component.updateProperties(properties);
        } else {
            Log.w(TAG, "Component not found: " + componentId);
        }
    }

//    /**
//     * Updates component styles
//     *
//     * @param componentId Component ID
//     * @param styles      Styles Map
//     */
//    public void updateComponentStyle(String componentId, Map<String, Object> styles) {
//        Log.d(TAG, "updateComponentStyle: componentId=" + componentId);
//
//        A2UIComponent component = componentTree.get(componentId);
//        if (component != null) {
//            component.updateStyle(styles);
//        } else {
//            Log.w(TAG, "Component not found: " + componentId);
//        }
//    }

    /**
     * Returns a component
     *
     * @param componentId Component ID
     * @return Component instance, or null if not found
     */
    public A2UIComponent getComponent(String componentId) {
        return componentTree.get(componentId);
    }

    /**
     * Recursively creates Views for child components.
     * Used in addComponent to recursively create Views for all child components.
     *
     * @param parentComponent Parent component instance
     * @param parentContainer Parent container ViewGroup
     */
    private void createChildrenViews(A2UIComponent parentComponent, ViewGroup parentContainer) {
        Log.d(TAG, "  createChildrenViews for: " + parentComponent.getId());

        for (A2UIComponent child : parentComponent.getChildren()) {
            if (child.getView() == null) {
                Log.d(TAG, "    → Creating view for child: " + child.getId() + " (" + child.getClass().getSimpleName() + ")");

                View childView = child.createView(context, parentContainer);
                if (childView != null) {
                    Log.d(TAG, "      ✓ Child view created: " + childView.getClass().getSimpleName());

                    if (parentComponent.shouldAutoAddChildView()) {
                        parentContainer.addView(childView);
                        Log.d(TAG, "      ✓ Child view added to parent");

                        ViewGroup childContainer = getComponentChildContainer(child);
                        if (childContainer != null && child.getChildren() != null && !child.getChildren().isEmpty()) {
                            Log.d(TAG, "      → Child has children, recursing...");
                            createChildrenViews(child, childContainer);
                        }
                    } else {
                        Log.d(TAG, "      ⚠ Parent manages child views internally");
                        notifyParentChildViewCreated(parentComponent, child);
                    }
                } else {
                    Log.e(TAG, "      ❌ Failed to create child view: " + child.getId());
                }
            } else {
                Log.d(TAG, "    ⚠ Child view already exists: " + child.getId());
            }
        }
    }


    /**
     * Recursively creates Views for the component tree.
     * Used in pre-rendering scenarios where components have been created but Views have not.
     *
     * Critical fix: supports streaming rendering scenarios where the root component arrives last.
     * - When the root arrives last, child components may already be in the componentTree.
     * - Child components must be found in the componentTree and have their Views created recursively.
     *
     * @param component  Component instance
     * @param parentView Parent container
     */
    private void createComponentTreeViews(A2UIComponent component, ViewGroup parentView) {
        Log.d(TAG, "  Creating view for component: " + component.getId() + " (" + component.getClass().getSimpleName() + ")");

        View view = component.createView(context, parentView);
        if (view == null) {
            Log.e(TAG, "  ❌ Failed to create view for component: " + component.getId());
            return;
        }

        Log.d(TAG, "  ✓ View created: " + view.getClass().getSimpleName());

        if (view.getParent() != null) {
            Log.d(TAG, "  ⚠ View already has parent, removing from old parent first");
            ViewGroup oldParent = (ViewGroup) view.getParent();
            oldParent.removeView(view);
            Log.d(TAG, "  ✓ View removed from old parent");
        }

        parentView.addView(view);
        Log.d(TAG, "  ✓ View added to parent container");

        Log.d(TAG, "  → Searching for children in componentTree...");
        List<A2UIComponent> childrenFromTree = findChildrenInComponentTree(component);
        Log.d(TAG, "  → Found " + childrenFromTree.size() + " children in componentTree");

        Map<String, A2UIComponent> allChildrenMap = new LinkedHashMap<>();

        for (A2UIComponent child : childrenFromTree) {
            allChildrenMap.put(child.getId(), child);
        }

        if (component.getChildren() != null) {
            for (A2UIComponent child : component.getChildren()) {
                if (!allChildrenMap.containsKey(child.getId())) {
                    allChildrenMap.put(child.getId(), child);
                }
            }
        }

        Log.d(TAG, "  → Total unique children: " + allChildrenMap.size());

        ViewGroup childContainer = getComponentChildContainer(component);
        if (childContainer != null && !allChildrenMap.isEmpty()) {
            for (A2UIComponent child : allChildrenMap.values()) {
                if (child.getView() == null) {
                    Log.d(TAG, "  → Creating child view: " + child.getId() + " (" + child.getClass().getSimpleName() + ")");

                    View childView = child.createView(context, childContainer);
                    if (childView != null) {
                        Log.d(TAG, "    ✓ Child view created: " + childView.getClass().getSimpleName());

                        if (childView.getParent() != null) {
                            Log.d(TAG, "    ⚠ Child view already has parent, removing from old parent first");
                            ViewGroup oldParent = (ViewGroup) childView.getParent();
                            oldParent.removeView(childView);
                            Log.d(TAG, "    ✓ Child view removed from old parent");
                        }

                        if (component.shouldAutoAddChildView()) {
                            childContainer.addView(childView);
                            Log.d(TAG, "    ✓ Child view added to parent childContainer");
                        } else {
                            Log.d(TAG, "    ⚠ Parent manages child views internally");
                            notifyParentChildViewCreated(component, child);
                        }

                        ViewGroup grandChildContainer = getComponentChildContainer(child);
                        if (grandChildContainer != null) {
                            List<A2UIComponent> grandChildren = findChildrenInComponentTree(child);

                            int unrenderedCount = 0;
                            for (A2UIComponent grandChild : grandChildren) {
                                if (grandChild.getView() == null) {
                                    unrenderedCount++;
                                }
                            }

                            if (unrenderedCount > 0) {
                                Log.d(TAG, "    → Child has " + unrenderedCount + " unrendered children, processing...");
                                for (A2UIComponent grandChild : grandChildren) {
                                    if (grandChild.getView() == null) {
                                        createComponentTreeViews(grandChild, grandChildContainer);
                                    }
                                }
                            }
                        }
                    } else {
                        Log.e(TAG, "    ❌ Failed to create child view: " + child.getId());
                    }
                } else {
                    Log.d(TAG, "  ⚠ Child view already exists: " + child.getId());

                    View existingChildView = child.getView();
                    ViewGroup oldParent = (ViewGroup) existingChildView.getParent();

                    if (oldParent != null && oldParent != childContainer) {
                        Log.d(TAG, "    → Child view is in wrong parent, moving to correct parent...");
                        oldParent.removeView(existingChildView);
                        Log.d(TAG, "    ✓ Child view removed from old parent");

                        if (component.shouldAutoAddChildView()) {
                            childContainer.addView(existingChildView);
                            Log.d(TAG, "    ✓ Child view added to correct parent");
                        } else {
                            Log.d(TAG, "    ⚠ Parent manages child views internally");
                            notifyParentChildViewCreated(component, child);
                        }
                    } else if (oldParent == null) {
                        Log.d(TAG, "    → Child view has no parent, adding to parent...");

                        if (component.shouldAutoAddChildView()) {
                            childContainer.addView(existingChildView);
                            Log.d(TAG, "    ✓ Child view added to parent");
                        } else {
                            Log.d(TAG, "    ⚠ Parent manages child views internally");
                            notifyParentChildViewCreated(component, child);
                        }
                    } else {
                        Log.d(TAG, "    ✓ Child view already in correct parent");
                    }

                    ViewGroup grandChildContainer = getComponentChildContainer(child);
                    if (grandChildContainer != null) {
                        List<A2UIComponent> grandChildren = findChildrenInComponentTree(child);

                        int unrenderedCount = 0;
                        for (A2UIComponent grandChild : grandChildren) {
                            if (grandChild.getView() == null) {
                                unrenderedCount++;
                            }
                        }

                        if (unrenderedCount > 0) {
                            Log.d(TAG, "    → Child has " + unrenderedCount + " unrendered children, processing...");
                            for (A2UIComponent grandChild : grandChildren) {
                                if (grandChild.getView() == null) {
                                    createComponentTreeViews(grandChild, grandChildContainer);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Finds all child components of the given parent in the componentTree.
     *
     * Use case: during streaming rendering, child components arrive first and are registered
     * in the componentTree. When the parent arrives, this method retrieves all its children.
     *
     * @param parent Parent component instance
     * @return List of child components
     */
    private List<A2UIComponent> findChildrenInComponentTree(A2UIComponent parent) {
        List<A2UIComponent> children = new ArrayList<>();

        // Get the parent component's properties
        Map<String, Object> properties = parent.getProperties();
        if (properties == null) {
            return children;
        }

        // Check children array
        Object childrenObj = properties.get("children");
        if (childrenObj instanceof List) {
            List<?> childrenIds = (List<?>) childrenObj;
            Log.d(TAG, "    Parent has children property: " + childrenIds);

            for (Object childIdObj : childrenIds) {
                String childId = String.valueOf(childIdObj);
                A2UIComponent child = componentTree.get(childId);
                if (child != null) {
                    Log.d(TAG, "      ✓ Found child in componentTree: " + childId);
                    children.add(child);
                } else {
                    Log.w(TAG, "      ⚠ Child not found in componentTree: " + childId);
                }
            }
        }

        // Check child single reference
        Object childObj = properties.get("child");
        if (childObj != null) {
            String childId = String.valueOf(childObj);
            A2UIComponent child = componentTree.get(childId);
            if (child != null) {
                Log.d(TAG, "    ✓ Found child (single) in componentTree: " + childId);
                children.add(child);
            }
        }

        // Check tabs array (Tabs component)
        Object tabsObj = properties.get("tabs");
        if (tabsObj instanceof List) {
            List<?> tabsList = (List<?>) tabsObj;
            for (Object tabObj : tabsList) {
                if (tabObj instanceof Map) {
                    Map<String, Object> tab = (Map<String, Object>) tabObj;
                    Object tabChildObj = tab.get("child");
                    if (tabChildObj != null) {
                        String childId = String.valueOf(tabChildObj);
                        A2UIComponent child = componentTree.get(childId);
                        if (child != null) {
                            children.add(child);
                        }
                    }
                }
            }
        }

        // Check trigger and content (Modal component)
        Object triggerObj = properties.get("trigger");
        if (triggerObj != null) {
            String childId = String.valueOf(triggerObj);
            A2UIComponent child = componentTree.get(childId);
            if (child != null) {
                children.add(child);
            }
        }

        Object contentObj = properties.get("content");
        if (contentObj != null) {
            String childId = String.valueOf(contentObj);
            A2UIComponent child = componentTree.get(childId);
            if (child != null) {
                children.add(child);
            }
        }

        return children;
    }

    /**
     * Destroys the Surface, cleaning up all components and views. Idempotent: repeated calls
     * have no side effects.
     */
    public void destroy() {
        if (destroyed) {
            Log.w(TAG, "destroy: already destroyed, surfaceId=" + surfaceId);
            return;
        }
        Log.d(TAG, "destroy: surfaceId=" + surfaceId);
        destroyed = true;

        if (rootComponent != null) {
            rootComponent.destroy();
            rootComponent = null;
        }
        componentTree.clear();

        if (Looper.myLooper() == Looper.getMainLooper()) {
            container.removeAllViews();
        } else {
            container.post(container::removeAllViews);
        }
        Log.d(TAG, "✓ Surface destroyed");
    }


    public String getSurfaceId() {
        return surfaceId;
    }

    /**
     * Returns a read-only view of the component tree (componentId → component instance).
     * External callers should only read, not directly modify the tree structure.
     */
    public Map<String, A2UIComponent> getComponentTree() {
        return Collections.unmodifiableMap(componentTree);
    }
    /**
     * Returns the container (internally created root view; always non-null).
     * <p>
     * Callers obtain the Surface's root view via this method and add it to their own page ViewTree.
     *
     * @return Container ViewGroup
     */
    public ViewGroup getContainer() {
        return container;
    }

    public A2UIComponent getRootComponent() {
        return rootComponent;
    }

    /**
     * Returns the current state
     *
     * @return Whether the Surface has been destroyed
     */
    public boolean isDestroyed() {
        return destroyed;
    }

    /**
     * Sets the root component.
     * Used to set the root component during progressive rendering.
     *
     * @param component Root component instance
     */
    public void setRootComponent(A2UIComponent component) {
        this.rootComponent = component;
        // Also add to the component tree
        if (component != null) {
            componentTree.put(component.getId(), component);
        }
    }

    public int getComponentCount() {
        return componentTree.size();
    }

    /**
     * Notifies the parent component that a child View has been created.
     * Used for special components (e.g. TabsComponent) to execute specific logic after
     * all child Views are created.
     */
    private void notifyParentChildViewCreated(A2UIComponent parent, A2UIComponent child) {
        // Call onChildViewCreated on the parent
        parent.onChildViewCreated(child);
        // If the parent does not have an onChildViewCreated method, ignore
    }

    /**
     * Handles the special logic for all Modal components.
     * Called after all components have been added to ensure that trigger and content components
     * are already in the componentTree.
     */
    public void linkModalComponents() {
        Log.d(TAG, "========== linkModalComponents START ==========");
        int linkedCount = 0;

        for (A2UIComponent component : componentTree.values()) {
            if (component instanceof ModalComponent) {
                Log.d(TAG, "Processing Modal component: " + component.getId());

                Map<String, Object> properties = component.getProperties();
                if (properties == null) {
                    Log.w(TAG, "  Modal has no properties");
                    continue;
                }

                // Handle trigger component
                if (properties.containsKey("trigger")) {
                    String triggerId = String.valueOf(properties.get("trigger"));
                    A2UIComponent triggerComp = componentTree.get(triggerId);
                    if (triggerComp != null) {
                        Log.d(TAG, "  ✓ Linking trigger: " + triggerId);
                        component.addChild(triggerComp);
                        linkedCount++;
                    } else {
                        Log.e(TAG, "  ❌ Trigger component not found: " + triggerId);
                    }
                }

                // Handle content component
                if (properties.containsKey("content")) {
                    String contentId = String.valueOf(properties.get("content"));
                    A2UIComponent contentComp = componentTree.get(contentId);
                    if (contentComp != null) {
                        Log.d(TAG, "  ✓ Linking content: " + contentId);
                        component.addChild(contentComp);
                        linkedCount++;
                    } else {
                        Log.w(TAG, "  ❌ Content component not found: " + contentId);
                    }
                }
            }
        }

        Log.d(TAG, "linkModalComponents complete: " + linkedCount + " links established");
        Log.d(TAG, "========== linkModalComponents END ==========");
    }


    // TODO temporary workaround for scroll jank; overall renderer optimization to follow

    /**
     * Pre-builds the View tree off-screen.
     *
     * Notes:
     * - Does not change the Surface's final bind semantics
     * - Only pre-creates the Views for rootComponent and child components ahead of time
     * - When bindContainer is actually called later, if rootView already exists, it will not
     *   re-enter createComponentTreeViews
     *
     * @param preloadHost Off-screen pre-build container
     */
    public void preloadViews(ViewGroup preloadHost) {
        if (isDestroyed()) {
            Log.w(TAG, "preloadViews ignored: surface destroyed, surfaceId=" + surfaceId);
            return;
        }

        if (preloadHost == null) {
            Log.w(TAG, "preloadViews ignored: preloadHost is null, surfaceId=" + surfaceId);
            return;
        }

        if (rootComponent == null) {
            Log.w(TAG, "preloadViews ignored: rootComponent is null, surfaceId=" + surfaceId);
            return;
        }

        if (rootComponent.getView() != null) {
            Log.d(TAG, "preloadViews skipped: root view already exists, surfaceId=" + surfaceId);
            return;
        }

        long start = SystemClock.elapsedRealtime();

        Log.d(TAG, "========== preloadViews START ==========");
        Log.d(TAG, "surfaceId=" + surfaceId
                + ", preloadHostHash=" + System.identityHashCode(preloadHost)
                + ", preloadHostChildCountBefore=" + preloadHost.getChildCount()
                + ", componentCount=" + componentTree.size()
                + ", rootComponentId=" + rootComponent.getId());

        ViewGroup oldContainer = this.container;
//        State oldState = this.state;

        try {
            // Temporarily borrow preloadHost to build the view tree
            this.container = preloadHost;
            createComponentTreeViews(rootComponent, preloadHost);

            Log.d(TAG, "preloadViews success"
                    + ", preloadHostChildCountAfter=" + preloadHost.getChildCount()
                    + ", rootViewExists=" + (rootComponent.getView() != null)
                    + ", cost=" + (SystemClock.elapsedRealtime() - start));
        } catch (Throwable t) {
            Log.e(TAG, "preloadViews failed, surfaceId=" + surfaceId, t);
        } finally {
            // Restore the original container/state semantics
            this.container = oldContainer;
//            this.state = oldState;
        }

        Log.d(TAG, "========== preloadViews END ==========");
    }

    private ViewGroup getComponentChildContainer(A2UIComponent component) {
        if (component instanceof com.amap.agenui.render.component.A2UILayoutComponent) {
            return ((com.amap.agenui.render.component.A2UILayoutComponent) component).getChildContainer();
        }

        View view = component.getView();
        if (view instanceof ViewGroup) {
            return (ViewGroup) view;
        }

        return null;
    }

}
