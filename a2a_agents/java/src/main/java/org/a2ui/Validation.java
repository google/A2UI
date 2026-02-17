package org.a2ui;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;

import java.util.*;
import java.util.regex.Pattern;

/**
 * Validates A2UI JSON payloads against the provided schema and checks for integrity.
 */
public final class Validation {

    // RFC 6901 compliant regex for JSON Pointer
    private static final Pattern JSON_POINTER_PATTERN = Pattern.compile("^(?:/(?:[^~/]|~[01])*)*$");

    // Recursion Limits
    private static final int MAX_GLOBAL_DEPTH = 50;
    private static final int MAX_FUNC_CALL_DEPTH = 5;

    // Constants
    private static final String COMPONENTS = "components";
    private static final String ID = "id";
    private static final String COMPONENT_PROPERTIES = "componentProperties";
    private static final String ROOT = "root";
    private static final String PATH = "path";
    private static final String FUNCTION_CALL = "functionCall";
    private static final String CALL = "call";
    private static final String ARGS = "args";

    private static final ObjectMapper mapper = new ObjectMapper();

    private Validation() {}

    /**
     * Validates the A2UI JSON payload against the provided schema and checks for integrity.
     *
     * @param a2uiJson The JSON payload to validate (List or Map).
     * @param a2uiSchema The schema object to validate against.
     * @throws IllegalArgumentException if validation fails.
     */
    public static void validateA2uiJson(Object a2uiJson, Map<String, Object> a2uiSchema) {
        // 1. JSON Schema Validation using networknt
        JsonSchemaFactory factory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V202012);
        JsonNode schemaNode = mapper.valueToTree(a2uiSchema);
        JsonSchema schema = factory.getSchema(schemaNode);

        JsonNode instanceNode = mapper.valueToTree(a2uiJson);
        Set<ValidationMessage> errors = schema.validate(instanceNode);
        if (!errors.isEmpty()) {
            StringBuilder sb = new StringBuilder("JSON Schema Validation Failed:\n");
            for (ValidationMessage error : errors) {
                sb.append("- ").append(error.getMessage()).append("\n");
            }
            throw new IllegalArgumentException(sb.toString().trim());
        }

        // Normalize to list for iteration
        List<Object> messages = new ArrayList<>();
        if (a2uiJson instanceof List) {
            messages.addAll((List<?>) a2uiJson);
        } else {
            messages.add(a2uiJson);
        }

        for (Object msgItem : messages) {
            if (!(msgItem instanceof Map)) {
                continue;
            }
            @SuppressWarnings("unchecked")
            Map<String, Object> message = (Map<String, Object>) msgItem;

            // Check for SurfaceUpdate which has 'components'
            if (message.containsKey(COMPONENTS)) {
                Object compsObj = message.get(COMPONENTS);
                if (compsObj instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> components = (List<Map<String, Object>>) compsObj;
                    Map<String, RefFields> refMap = extractComponentRefFields(a2uiSchema);
                    validateComponentIntegrity(components, refMap);
                    validateTopology(components, refMap);
                }
            }
            validateRecursionAndPaths(message);
        }
    }

    private static void validateComponentIntegrity(List<Map<String, Object>> components, Map<String, RefFields> refFieldsMap) {
        Set<String> ids = new HashSet<>();

        // 1. Collect IDs and check for duplicates
        for (Map<String, Object> comp : components) {
            Object compIdObj = comp.get(ID);
            if (!(compIdObj instanceof String)) continue;
            String compId = (String) compIdObj;

            if (ids.contains(compId)) {
                throw new IllegalArgumentException("Duplicate component ID found: '" + compId + "'");
            }
            ids.add(compId);
        }

        // 2. Check for root component
        if (!ids.contains(ROOT)) {
            throw new IllegalArgumentException("Missing '" + ROOT + "' component: One component must have '" + ID + "' set to '" + ROOT + "'.");
        }

        // 3. Check for dangling references using helper
        for (Map<String, Object> comp : components) {
            for (Map.Entry<String, String> ref : getComponentReferences(comp, refFieldsMap)) {
                String refId = ref.getKey();
                String fieldName = ref.getValue();
                if (!ids.contains(refId)) {
                    throw new IllegalArgumentException("Component '" + comp.get(ID) + "' references missing ID '" + refId + "' in field '" + fieldName + "'");
                }
            }
        }
    }

    private static void validateTopology(List<Map<String, Object>> components, Map<String, RefFields> refFieldsMap) {
        Map<String, List<String>> adjList = new HashMap<>();
        Set<String> allIds = new HashSet<>();

        // Build Adjacency List
        for (Map<String, Object> comp : components) {
            Object compIdObj = comp.get(ID);
            if (!(compIdObj instanceof String)) continue;
            String compId = (String) compIdObj;

            allIds.add(compId);
            adjList.putIfAbsent(compId, new ArrayList<>());

            for (Map.Entry<String, String> ref : getComponentReferences(comp, refFieldsMap)) {
                String refId = ref.getKey();
                String fieldName = ref.getValue();
                if (refId.equals(compId)) {
                    throw new IllegalArgumentException("Self-reference detected: Component '" + compId + "' references itself in field '" + fieldName + "'");
                }
                adjList.get(compId).add(refId);
            }
        }

        // Detect Cycles using DFS
        Set<String> visited = new HashSet<>();
        Set<String> recursionStack = new HashSet<>();

        if (allIds.contains(ROOT)) {
            dfs(ROOT, adjList, visited, recursionStack);
        }

        // Check for Orphans
        Set<String> orphans = new HashSet<>(allIds);
        orphans.removeAll(visited);
        if (!orphans.isEmpty()) {
            List<String> sortedOrphans = new ArrayList<>(orphans);
            Collections.sort(sortedOrphans);
            throw new IllegalArgumentException("Orphaned components detected (not reachable from '" + ROOT + "'): " + sortedOrphans);
        }
    }

    private static void dfs(String nodeId, Map<String, List<String>> adjList, Set<String> visited, Set<String> recursionStack) {
        visited.add(nodeId);
        recursionStack.add(nodeId);

        List<String> neighbors = adjList.getOrDefault(nodeId, Collections.emptyList());
        for (String neighbor : neighbors) {
            if (!visited.contains(neighbor)) {
                dfs(neighbor, adjList, visited, recursionStack);
            } else if (recursionStack.contains(neighbor)) {
                throw new IllegalArgumentException("Circular reference detected involving component '" + neighbor + "'");
            }
        }

        recursionStack.remove(nodeId);
    }

    private static class RefFields {
        Set<String> singleRefs = new HashSet<>();
        Set<String> listRefs = new HashSet<>();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, RefFields> extractComponentRefFields(Map<String, Object> schema) {
        Map<String, RefFields> refMap = new HashMap<>();

        Map<String, Object> compsSchema = getMap(schema, "properties", COMPONENTS);
        if (compsSchema == null) return refMap;

        Map<String, Object> itemsSchema = getMap(compsSchema, "items");
        if (itemsSchema == null) return refMap;

        Map<String, Object> compPropsSchema = getMap(itemsSchema, "properties", COMPONENT_PROPERTIES);
        if (compPropsSchema == null) return refMap;

        Map<String, Object> allComponents = getMap(compPropsSchema, "properties");
        if (allComponents == null) return refMap;

        for (Map.Entry<String, Object> compEntry : allComponents.entrySet()) {
            String compName = compEntry.getKey();
            if (!(compEntry.getValue() instanceof Map)) continue;
            Map<String, Object> compSchema = (Map<String, Object>) compEntry.getValue();

            RefFields refs = new RefFields();
            Map<String, Object> props = getMap(compSchema, "properties");
            if (props != null) {
                for (Map.Entry<String, Object> propEntry : props.entrySet()) {
                    String propName = propEntry.getKey();
                    if (!(propEntry.getValue() instanceof Map)) continue;
                    Map<String, Object> propSchema = (Map<String, Object>) propEntry.getValue();

                    if (isComponentIdRef(propSchema)) {
                        refs.singleRefs.add(propName);
                    } else if (isChildListRef(propSchema)) {
                        refs.listRefs.add(propName);
                    }
                }
            }
            if (!refs.singleRefs.isEmpty() || !refs.listRefs.isEmpty()) {
                refMap.put(compName, refs);
            }
        }
        return refMap;
    }

    private static boolean isComponentIdRef(Map<String, Object> propSchema) {
        Object ref = propSchema.get("$ref");
        return ref instanceof String && ((String) ref).endsWith("ComponentId");
    }

    @SuppressWarnings("unchecked")
    private static boolean isChildListRef(Map<String, Object> propSchema) {
        Object ref = propSchema.get("$ref");
        if (ref instanceof String && ((String) ref).endsWith("ChildList")) {
            return true;
        }
        if ("array".equals(propSchema.get("type"))) {
            Map<String, Object> items = getMap(propSchema, "items");
            if (items != null && isComponentIdRef(items)) {
                return true;
            }
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> getMap(Map<String, Object> map, String... keys) {
        Map<String, Object> current = map;
        for (String key : keys) {
            Object val = current.get(key);
            if (val instanceof Map) {
                current = (Map<String, Object>) val;
            } else {
                return null;
            }
        }
        return current;
    }

    @SuppressWarnings("unchecked")
    private static List<Map.Entry<String, String>> getComponentReferences(Map<String, Object> component, Map<String, RefFields> refFieldsMap) {
        List<Map.Entry<String, String>> references = new ArrayList<>();
        Object compPropsContainerObj = component.get(COMPONENT_PROPERTIES);
        if (!(compPropsContainerObj instanceof Map)) {
            return references;
        }

        Map<String, Object> compPropsContainer = (Map<String, Object>) compPropsContainerObj;

        for (Map.Entry<String, Object> typeEntry : compPropsContainer.entrySet()) {
            String compType = typeEntry.getKey();
            if (!(typeEntry.getValue() instanceof Map)) continue;
            Map<String, Object> props = (Map<String, Object>) typeEntry.getValue();

            RefFields refs = refFieldsMap.getOrDefault(compType, new RefFields());

            for (Map.Entry<String, Object> propEntry : props.entrySet()) {
                String key = propEntry.getKey();
                Object value = propEntry.getValue();

                if (refs.singleRefs.contains(key) && value instanceof String) {
                    references.add(new AbstractMap.SimpleEntry<>((String) value, key));
                } else if (refs.listRefs.contains(key) && value instanceof List) {
                    for (Object item : (List<?>) value) {
                        if (item instanceof String) {
                            references.add(new AbstractMap.SimpleEntry<>((String) item, key));
                        }
                    }
                }
            }
        }
        return references;
    }

    private static void validateRecursionAndPaths(Object data) {
        traverse(data, 0, 0);
    }

    @SuppressWarnings("unchecked")
    private static void traverse(Object item, int globalDepth, int funcDepth) {
        if (globalDepth > MAX_GLOBAL_DEPTH) {
            throw new IllegalArgumentException("Global recursion limit exceeded: Depth > " + MAX_GLOBAL_DEPTH);
        }

        if (item instanceof List) {
            for (Object x : (List<?>) item) {
                traverse(x, globalDepth + 1, funcDepth);
            }
            return;
        }

        if (item instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) item;

            // Check for path
            if (map.containsKey(PATH) && map.get(PATH) instanceof String) {
                String path = (String) map.get(PATH);
                if (!JSON_POINTER_PATTERN.matcher(path).matches()) {
                    throw new IllegalArgumentException("Invalid JSON Pointer syntax: '" + path + "'");
                }
            }

            // Check for FunctionCall
            boolean isFunc = map.containsKey(CALL) && map.containsKey(ARGS);

            if (isFunc) {
                if (funcDepth >= MAX_FUNC_CALL_DEPTH) {
                    throw new IllegalArgumentException("Recursion limit exceeded: " + FUNCTION_CALL + " depth > " + MAX_FUNC_CALL_DEPTH);
                }

                for (Map.Entry<String, Object> entry : map.entrySet()) {
                    String k = entry.getKey();
                    Object v = entry.getValue();
                    if (ARGS.equals(k)) {
                        traverse(v, globalDepth + 1, funcDepth + 1);
                    } else {
                        traverse(v, globalDepth + 1, funcDepth);
                    }
                }
            } else {
                for (Object v : map.values()) {
                    traverse(v, globalDepth + 1, funcDepth);
                }
            }
        }
    }
}
