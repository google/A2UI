package org.a2ui;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.*;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

class A2uiJsonValidatorTest {

        private Map<String, Object> schema;

        @BeforeEach
        void setUp() {
                schema = new HashMap<>();
                schema.put("type", "object");

                Map<String, Object> defs = new HashMap<>();
                Map<String, Object> componentId = new HashMap<>();
                componentId.put("type", "string");
                defs.put("ComponentId", componentId);

                Map<String, Object> childList = new HashMap<>();
                childList.put("type", "array");
                Map<String, Object> childListItems = new HashMap<>();
                childListItems.put("$ref", "#/$defs/ComponentId");
                childList.put("items", childListItems);
                defs.put("ChildList", childList);

                schema.put("$defs", defs);

                Map<String, Object> properties = new HashMap<>();
                Map<String, Object> componentsProp = new HashMap<>();
                componentsProp.put("type", "array");

                Map<String, Object> componentsItems = new HashMap<>();
                componentsItems.put("type", "object");
                componentsItems.put("required", Collections.singletonList("id"));

                Map<String, Object> itemProps = new HashMap<>();
                Map<String, Object> idSchema = new HashMap<>();
                idSchema.put("$ref", "#/$defs/ComponentId");
                itemProps.put("id", idSchema);

                Map<String, Object> componentProperties = new HashMap<>();
                componentProperties.put("type", "object");
                Map<String, Object> componentTypes = new HashMap<>();

                componentTypes.put("Column", createContainerSchema());
                componentTypes.put("Row", createContainerSchema());
                componentTypes.put("Container", createContainerSchema());

                Map<String, Object> cardSchema = new HashMap<>();
                cardSchema.put("type", "object");
                Map<String, Object> cardProps = new HashMap<>();
                Map<String, Object> cardChild = new HashMap<>();
                cardChild.put("$ref", "#/$defs/ComponentId");
                cardProps.put("child", cardChild);
                cardSchema.put("properties", cardProps);
                componentTypes.put("Card", cardSchema);

                Map<String, Object> buttonSchema = new HashMap<>();
                buttonSchema.put("type", "object");
                Map<String, Object> buttonProps = new HashMap<>();
                Map<String, Object> buttonChild = new HashMap<>();
                buttonChild.put("$ref", "#/$defs/ComponentId");
                buttonProps.put("child", buttonChild);

                Map<String, Object> actionSchema = new HashMap<>();
                Map<String, Object> actionProps = new HashMap<>();
                Map<String, Object> funcCallSchema = new HashMap<>();
                Map<String, Object> funcCallProps = new HashMap<>();
                funcCallProps.put("call", Map.of("type", "string"));
                funcCallProps.put("args", Map.of("type", "object"));
                funcCallSchema.put("properties", funcCallProps);
                actionProps.put("functionCall", funcCallSchema);
                actionSchema.put("properties", actionProps);
                buttonProps.put("action", actionSchema);
                buttonSchema.put("properties", buttonProps);
                componentTypes.put("Button", buttonSchema);

                Map<String, Object> textSchema = new HashMap<>();
                textSchema.put("type", "object");
                Map<String, Object> textProps = new HashMap<>();
                Map<String, Object> textText = new HashMap<>();
                textText.put("oneOf", Arrays.asList(Map.of("type", "string"), Map.of("type", "object")));
                textProps.put("text", textText);
                textSchema.put("properties", textProps);
                componentTypes.put("Text", textSchema);

                componentProperties.put("properties", componentTypes);
                itemProps.put("componentProperties", componentProperties);

                componentsItems.put("properties", itemProps);
                componentsProp.put("items", componentsItems);
                properties.put("components", componentsProp);
                schema.put("properties", properties);
        }

        private Map<String, Object> createContainerSchema() {
                Map<String, Object> container = new HashMap<>();
                container.put("type", "object");
                Map<String, Object> props = new HashMap<>();
                Map<String, Object> children = new HashMap<>();
                children.put("$ref", "#/$defs/ChildList");
                props.put("children", children);
                container.put("properties", props);
                return container;
        }

        private Map<String, Object> createComponent(String id, String type, Map<String, Object> props) {
                Map<String, Object> comp = new HashMap<>();
                comp.put("id", id);
                Map<String, Object> compProps = new HashMap<>();
                if (type != null) {
                        compProps.put(type, props);
                }
                comp.put("componentProperties", compProps);
                return comp;
        }

        @Test
        void testValidateA2uiJsonValidIntegrity() {
                Map<String, Object> payload = new HashMap<>();
                payload.put("components", Arrays.asList(
                                createComponent("root", "Column",
                                                Map.of("children", Collections.singletonList("child1"))),
                                createComponent("child1", "Text", Map.of("text", "Hello"))));
                assertDoesNotThrow(() -> A2uiJsonValidator.validate(payload, schema));
        }

        @Test
        void testValidateA2uiJsonDuplicateIds() {
                Map<String, Object> payload = new HashMap<>();
                payload.put("components", Arrays.asList(
                                createComponent("root", null, new HashMap<>()),
                                createComponent("root", null, new HashMap<>())));
                IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                                () -> A2uiJsonValidator.validate(payload, schema));
                assertTrue(exception.getMessage().contains("Duplicate component ID found: 'root'"));
        }

        @Test
        void testValidateA2uiJsonMissingRoot() {
                Map<String, Object> payload = new HashMap<>();
                payload.put("components", Collections.singletonList(
                                createComponent("not-root", null, new HashMap<>())));
                IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                                () -> A2uiJsonValidator.validate(payload, schema));
                assertTrue(exception.getMessage().contains("Missing 'root' component"));
        }

        static Stream<Arguments> danglingReferencesProvider() {
                return Stream.of(
                                Arguments.of("Card", "child", "missing_child"),
                                Arguments.of("Column", "children", Arrays.asList("child1", "missing_child")));
        }

        @ParameterizedTest
        @MethodSource("danglingReferencesProvider")
        void testValidateA2uiJsonDanglingReferences(String componentType, String fieldName, Object idsToRef) {
                Map<String, Object> payload = new HashMap<>();
                List<Map<String, Object>> components = new ArrayList<>();
                components.add(createComponent("root", componentType, Map.of(fieldName, idsToRef)));

                if (idsToRef instanceof List) {
                        for (Object childIdObj : (List<?>) idsToRef) {
                                String childId = (String) childIdObj;
                                if (!"missing_child".equals(childId)) {
                                        components.add(createComponent(childId, null, new HashMap<>()));
                                }
                        }
                }
                payload.put("components", components);

                IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                                () -> A2uiJsonValidator.validate(payload, schema));
                assertTrue(exception.getMessage()
                                .contains("Component 'root' references missing ID 'missing_child' in field '"
                                                + fieldName + "'"));
        }

        @Test
        void testValidateA2uiJsonSelfReference() {
                Map<String, Object> payload = new HashMap<>();
                payload.put("components", Collections.singletonList(
                                createComponent("root", "Container",
                                                Map.of("children", Collections.singletonList("root")))));
                IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                                () -> A2uiJsonValidator.validate(payload, schema));
                assertTrue(exception.getMessage()
                                .contains("Self-reference detected: Component 'root' references itself in field 'children'"));
        }

        @Test
        void testValidateA2uiJsonCircularReference() {
                Map<String, Object> payload = new HashMap<>();
                payload.put("components", Arrays.asList(
                                createComponent("root", "Container",
                                                Map.of("children", Collections.singletonList("child1"))),
                                createComponent("child1", "Container",
                                                Map.of("children", Collections.singletonList("root")))));
                IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                                () -> A2uiJsonValidator.validate(payload, schema));
                assertTrue(exception.getMessage().contains("Circular reference detected involving component"));
        }

        @Test
        void testValidateA2uiJsonOrphanedComponent() {
                Map<String, Object> payload = new HashMap<>();
                payload.put("components", Arrays.asList(
                                createComponent("root", "Container", Map.of("children", Collections.emptyList())),
                                createComponent("orphan", null, new HashMap<>())));
                IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                                () -> A2uiJsonValidator.validate(payload, schema));
                assertTrue(
                                exception.getMessage().contains(
                                                "Orphaned components detected (not reachable from 'root'): [orphan]"));
        }

        @Test
        void testValidateA2uiJsonValidTopologyComplex() {
                Map<String, Object> payload = new HashMap<>();
                payload.put("components", Arrays.asList(
                                createComponent("root", "Container",
                                                Map.of("children", Arrays.asList("child1", "child2"))),
                                createComponent("child1", "Text", Map.of("text", "Hello")),
                                createComponent("child2", "Container",
                                                Map.of("children", Collections.singletonList("child3"))),
                                createComponent("child3", "Text", Map.of("text", "World"))));
                assertDoesNotThrow(() -> A2uiJsonValidator.validate(payload, schema));
        }

        @Test
        void testValidateRecursionLimitExceeded() {
                Map<String, Object> args = new HashMap<>();
                Map<String, Object> current = args;
                for (int i = 0; i < 5; i++) {
                        Map<String, Object> argMap = new HashMap<>();
                        argMap.put("call", "fn" + i);
                        Map<String, Object> nextArgs = new HashMap<>();
                        argMap.put("args", nextArgs);
                        current.put("arg", argMap);
                        current = nextArgs;
                }

                Map<String, Object> buttonProps = new HashMap<>();
                buttonProps.put("label", "Click me");
                buttonProps.put("action", Map.of("functionCall", Map.of("call", "fn_top", "args", args)));

                Map<String, Object> payload = new HashMap<>();
                payload.put("components", Collections.singletonList(
                                createComponent("root", "Button", buttonProps)));
                IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                                () -> A2uiJsonValidator.validate(payload, schema));
                assertTrue(exception.getMessage().contains("Recursion limit exceeded"));
        }

        @Test
        void testValidateRecursionLimitValid() {
                Map<String, Object> args = new HashMap<>();
                Map<String, Object> current = args;
                for (int i = 0; i < 4; i++) {
                        Map<String, Object> argMap = new HashMap<>();
                        argMap.put("call", "fn" + i);
                        Map<String, Object> nextArgs = new HashMap<>();
                        argMap.put("args", nextArgs);
                        current.put("arg", argMap);
                        current = nextArgs;
                }

                Map<String, Object> buttonProps = new HashMap<>();
                buttonProps.put("label", "Click me");
                buttonProps.put("action", Map.of("functionCall", Map.of("call", "fn_top", "args", args)));

                Map<String, Object> payload = new HashMap<>();
                payload.put("components", Collections.singletonList(
                                createComponent("root", "Button", buttonProps)));
                assertDoesNotThrow(() -> A2uiJsonValidator.validate(payload, schema));
        }

        static Stream<Arguments> invalidPathsProvider() {
                return Stream.of(
                                Arguments.of(Map.of("updateDataModel",
                                                Map.of("surfaceId", "surface1", "path", "invalid//path", "value",
                                                                "data"))),
                                Arguments.of(Map.of("components",
                                                Collections.singletonList(Map.of("id", "root", "componentProperties",
                                                                Map.of("Text", Map.of("text", Map.of("path",
                                                                                "invalid path with spaces"))))))),
                                Arguments.of(Map.of("updateDataModel",
                                                Map.of("surfaceId", "surface1", "path", "/invalid/escape/~2", "value",
                                                                "data"))));
        }

        @ParameterizedTest
        @MethodSource("invalidPathsProvider")
        void testValidateInvalidPaths(Map<String, Object> payload) {
                IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                                () -> A2uiJsonValidator.validate(payload, schema));
                assertTrue(exception.getMessage().contains("Invalid JSON Pointer syntax"));
        }

        @Test
        void testValidateGlobalRecursionLimitExceeded() {
                Map<String, Object> deepPayload = new HashMap<>();
                deepPayload.put("level", 0);
                Map<String, Object> current = deepPayload;
                for (int i = 0; i < 55; i++) {
                        Map<String, Object> next = new HashMap<>();
                        next.put("level", i + 1);
                        current.put("next", next);
                        current = next;
                }
                IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                                () -> A2uiJsonValidator.validate(deepPayload, schema));
                assertTrue(exception.getMessage().contains("Global recursion limit exceeded"));
        }

        @Test
        void testValidateCustomSchemaReference() {
                Map<String, Object> customSchema = new HashMap<>(schema);

                Map<String, Object> properties = (Map<String, Object>) customSchema.get("properties");
                Map<String, Object> componentsProp = (Map<String, Object>) properties.get("components");
                Map<String, Object> componentsItems = (Map<String, Object>) componentsProp.get("items");
                Map<String, Object> itemProps = (Map<String, Object>) componentsItems.get("properties");
                Map<String, Object> componentProperties = (Map<String, Object>) itemProps.get("componentProperties");
                Map<String, Object> componentTypes = new HashMap<>(
                                (Map<String, Object>) componentProperties.get("properties"));

                Map<String, Object> customLinkSchema = new HashMap<>();
                customLinkSchema.put("type", "object");
                Map<String, Object> customLinkProps = new HashMap<>();
                Map<String, Object> linkedComponentId = new HashMap<>();
                linkedComponentId.put("$ref", "#/$defs/ComponentId");
                customLinkProps.put("linkedComponentId", linkedComponentId);
                customLinkSchema.put("properties", customLinkProps);
                componentTypes.put("CustomLink", customLinkSchema);

                componentProperties.put("properties", componentTypes);

                Map<String, Object> payload = new HashMap<>();
                payload.put("components", Collections.singletonList(
                                createComponent("root", "CustomLink", Map.of("linkedComponentId", "missing_target"))));

                IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                                () -> A2uiJsonValidator.validate(payload, customSchema));
                assertTrue(exception.getMessage()
                                .contains("Component 'root' references missing ID 'missing_target' in field 'linkedComponentId'"));
        }
}
