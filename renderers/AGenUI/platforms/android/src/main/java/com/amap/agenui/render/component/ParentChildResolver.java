package com.amap.agenui.render.component;

import android.util.Log;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;

/**
 * Parent-child relationship resolver
 *
 * Responsibilities:
 * 1. Builds a parent-child relationship map from a component's children property
 *    (conforming to the A2UI v0.9 adjacency-list model)
 * 2. Uses topological sorting to ensure components are processed in the correct order
 * 3. Supports progressive rendering (components may arrive in any order)
 *
 * A2UI v0.9 protocol requirements:
 * - Components are sent as a flat list
 * - Parent-child relationships are defined via the container's children property
 * - Components may arrive in any order
 *
 */
public class ParentChildResolver {

    private static final String TAG = "ParentChildResolver";

    /**
     * Builds a parent-child relationship map from a list of components
     *
     * Time complexity: O(n), where n is the total number of components
     *
     * @param components Component list
     * @return Map<childId, parentId> mapping child component IDs to parent component IDs
     */
    public Map<String, String> buildParentMap(List<Map<String, Object>> components) {
        Log.d(TAG, "========== buildParentMap START ==========");
        Map<String, String> parentMap = new HashMap<>();

        for (Map<String, Object> componentData : components) {
            String parentId = (String) componentData.get("id");
            Map<String, Object> properties = extractProperties(componentData);
            for (String childId : extractChildIds(properties)) {
                parentMap.put(childId, parentId);
                Log.d(TAG, "  Found child: " + childId + " -> parent: " + parentId);
            }
        }

        Log.d(TAG, "buildParentMap complete: " + parentMap.size() + " parent-child relationships");
        Log.d(TAG, "========== buildParentMap END ==========");
        return parentMap;
    }

    /**
     * Builds a children order map.
     * Records the order of child components within each parent component's children array.
     *
     * @param components Component list
     * @return Map<parentId, List<childId>> mapping parent component IDs to ordered child ID lists
     *         (ordered as defined in the children array)
     */
    public Map<String, List<String>> buildChildrenOrderMap(List<Map<String, Object>> components) {
        Log.d(TAG, "========== buildChildrenOrderMap START ==========");
        Map<String, List<String>> childrenOrderMap = new HashMap<>();

        for (Map<String, Object> componentData : components) {
            String parentId = (String) componentData.get("id");
            Map<String, Object> properties = extractProperties(componentData);
            List<String> orderedChildren = extractChildIds(properties);
            if (!orderedChildren.isEmpty()) {
                childrenOrderMap.put(parentId, orderedChildren);
                Log.d(TAG, "  Parent " + parentId + " has children in order: " + orderedChildren);
            }
        }

        Log.d(TAG, "buildChildrenOrderMap complete: " + childrenOrderMap.size() + " parents with ordered children");
        Log.d(TAG, "========== buildChildrenOrderMap END ==========");
        return childrenOrderMap;
    }

    /**
     * Extracts all direct child component IDs (in protocol order) from a component's properties.
     * Covers four reference styles: children, child, tabs[].child, trigger, and content.
     */
    private List<String> extractChildIds(Map<String, Object> properties) {
        List<String> childIds = new ArrayList<>();
        if (properties == null) {
            return childIds;
        }

        // 1. children array (Row, Column, List, etc.)
        Object childrenObj = properties.get("children");
        if (childrenObj instanceof List) {
            for (Object childObj : (List<?>) childrenObj) {
                if (childObj instanceof String) {
                    childIds.add((String) childObj);
                }
            }
        }

        // 2. child single reference (Card, Button, etc.)
        Object childObj = properties.get("child");
        if (childObj instanceof String) {
            childIds.add((String) childObj);
        }

        // 3. tabs[].child (Tabs component)
        Object tabsObj = properties.get("tabs");
        if (tabsObj instanceof List) {
            for (Object tabObj : (List<?>) tabsObj) {
                if (tabObj instanceof Map) {
                    Object tabChildObj = ((Map<?, ?>) tabObj).get("child");
                    if (tabChildObj instanceof String) {
                        childIds.add((String) tabChildObj);
                    }
                }
            }
        }

        // 4. trigger / content (Modal component)
        Object triggerObj = properties.get("trigger");
        if (triggerObj instanceof String) {
            childIds.add((String) triggerObj);
        }
        Object contentObj = properties.get("content");
        if (contentObj instanceof String) {
            childIds.add((String) contentObj);
        }

        return childIds;
    }

    /**
     * Extracts the properties of a component.
     * Compatible with two formats:
     * 1. Properties directly in the component object
     * 2. Properties in a dedicated "properties" field
     */
    private Map<String, Object> extractProperties(Map<String, Object> componentData) {
        // Try to get the "properties" field first
        Object propertiesObj = componentData.get("properties");
        if (propertiesObj instanceof Map) {
            return (Map<String, Object>) propertiesObj;
        }

        // If no "properties" field, use componentData directly
        return componentData;
    }

    /**
     * Sorts components in topological order.
     * Ensures parent components are processed before their children, and preserves the order
     * of children as defined in the children array for the same parent.
     *
     * Uses Kahn's algorithm for topological sorting with childrenOrderMap to maintain child order.
     * Time complexity: O(V + E), where V is the number of components and E is the number of
     * parent-child relationships.
     *
     * @param components Component list
     * @param parentMap  Parent-child relationship map
     * @return List of component IDs sorted in topological order
     */
    public List<String> topologicalSort(
            List<Map<String, Object>> components,
            Map<String, String> parentMap) {

        Log.d(TAG, "========== topologicalSort START ==========");

        // Build children order map to preserve the order defined in the children array
        Map<String, List<String>> childrenOrderMap = buildChildrenOrderMap(components);

        // 1. Build in-degree table
        Map<String, Integer> inDegree = new HashMap<>();

        // Initialize in-degree of all components to 0
        for (Map<String, Object> comp : components) {
            String id = (String) comp.get("id");
            inDegree.put(id, 0);
        }

        // Build in-degrees from parentMap
        for (Map.Entry<String, String> entry : parentMap.entrySet()) {
            String childId = entry.getKey();

            // Increment the child node's in-degree
            inDegree.put(childId, inDegree.getOrDefault(childId, 0) + 1);
        }

        // 2. Kahn's algorithm: find all nodes with in-degree 0 (root or independent nodes)
        Queue<String> queue = new LinkedList<>();
        for (Map.Entry<String, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                queue.offer(entry.getKey());
                Log.d(TAG, "  Root/Independent node: " + entry.getKey());
            }
        }

        // 3. Topological sort (using childrenOrderMap to preserve child order)
        List<String> result = new ArrayList<>();
        Set<String> resultSet = new HashSet<>();
        while (!queue.isEmpty()) {
            String current = queue.poll();
            result.add(current);
            resultSet.add(current);

            // Use childrenOrderMap to get children in the order defined in the children array
            List<String> orderedChildren = childrenOrderMap.get(current);
            if (orderedChildren != null) {
                // Process children in the order defined in the children array
                for (String child : orderedChildren) {
                    // Decrement the child node's in-degree
                    int newInDegree = inDegree.get(child) - 1;
                    inDegree.put(child, newInDegree);

                    // If the child's in-degree becomes 0, add it to the queue
                    if (newInDegree == 0) {
                        queue.offer(child);
                    }
                }
            }
        }

        // 4. Check for cycles (should not exist in theory)
        if (result.size() != components.size()) {
            Log.w(TAG, "⚠ Cycle detected or missing components! " +
                      "Expected: " + components.size() + ", Got: " + result.size());

            // Append unprocessed components to the result (O(1) lookup)
            for (Map<String, Object> comp : components) {
                String id = (String) comp.get("id");
                if (!resultSet.contains(id)) {
                    result.add(id);
                    resultSet.add(id);
                    Log.w(TAG, "  Adding unprocessed component: " + id);
                }
            }
        }

        Log.d(TAG, "topologicalSort complete: " + result.size() + " components sorted");
        Log.d(TAG, "Sorted order: " + result);
        Log.d(TAG, "========== topologicalSort END ==========");

        return result;
    }

    /**
     * Finds the root component.
     * A2UI v0.9 protocol requires exactly one component with ID "root".
     *
     * @param components Component list
     * @return ID of the root component, or null if not found
     */
    public String findRootComponent(List<Map<String, Object>> components) {
        for (Map<String, Object> comp : components) {
            String id = (String) comp.get("id");
            if ("root".equals(id)) {
                Log.d(TAG, "✓ Found root component: " + id);
                return id;
            }
        }

        Log.w(TAG, "⚠ No root component found! A2UI v0.9 requires a component with id='root'");
        return null;
    }

    /**
     * Validates the integrity of the component tree.
     * Checks that all referenced child components exist.
     *
     * @param components Component list
     * @param parentMap  Parent-child relationship map
     * @return true if all references are valid
     */
    public boolean validateComponentTree(
            List<Map<String, Object>> components,
            Map<String, String> parentMap) {

        Log.d(TAG, "========== validateComponentTree START ==========");

        // Build a set of component IDs
        Map<String, Boolean> componentIds = new HashMap<>();
        for (Map<String, Object> comp : components) {
            String id = (String) comp.get("id");
            componentIds.put(id, true);
        }

        // Check that all child component references are valid
        boolean isValid = true;
        for (Map.Entry<String, String> entry : parentMap.entrySet()) {
            String childId = entry.getKey();
            String parentId = entry.getValue();

            if (!componentIds.containsKey(childId)) {
                Log.w(TAG, "❌ Invalid child reference: " + childId +
                          " (parent: " + parentId + ")");
                isValid = false;
            }

            if (!componentIds.containsKey(parentId)) {
                Log.w(TAG, "❌ Invalid parent reference: " + parentId +
                          " (child: " + childId + ")");
                isValid = false;
            }
        }

        if (isValid) {
            Log.d(TAG, "✓ Component tree is valid");
        } else {
            Log.w(TAG, "⚠ Component tree has invalid references");
        }

        Log.d(TAG, "========== validateComponentTree END ==========");
        return isValid;
    }
}
