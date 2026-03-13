/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <gtest/gtest.h>
#include "a2ui/validation.hpp"

using json = nlohmann::json;

class ValidationTest : public ::testing::Test {
protected:
    void SetUp() override {
        schema = json::parse(R"({
            "type": "object",
            "$defs": {
                "ComponentId": {"type": "string"},
                "ChildList": {"type": "array", "items": {"$ref": "#/$defs/ComponentId"}}
            },
            "properties": {
                "components": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"$ref": "#/$defs/ComponentId"},
                            "componentProperties": {
                                "type": "object",
                                "properties": {
                                    "Column": {
                                        "type": "object",
                                        "properties": {
                                            "children": {"$ref": "#/$defs/ChildList"}
                                        }
                                    },
                                    "Row": {
                                        "type": "object",
                                        "properties": {
                                            "children": {"$ref": "#/$defs/ChildList"}
                                        }
                                    },
                                    "Container": {
                                        "type": "object",
                                        "properties": {
                                            "children": {"$ref": "#/$defs/ChildList"}
                                        }
                                    },
                                    "Card": {
                                        "type": "object",
                                        "properties": {
                                            "child": {"$ref": "#/$defs/ComponentId"}
                                        }
                                    },
                                    "Button": {
                                        "type": "object",
                                        "properties": {
                                            "child": {"$ref": "#/$defs/ComponentId"},
                                            "action": {
                                                "properties": {
                                                    "functionCall": {
                                                        "properties": {
                                                            "call": {"type": "string"},
                                                            "args": {"type": "object"}
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    "Text": {
                                        "type": "object",
                                        "properties": {
                                            "text": {
                                                "oneOf": [
                                                    {"type": "string"},
                                                    {"type": "object"}
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "required": ["id"]
                    }
                }
            }
        })");
    }

    json schema;
};

TEST_F(ValidationTest, ValidIntegrity) {
    json payload = json::parse(R"({
        "components": [
            {"id": "root", "componentProperties": {"Column": {"children": ["child1"]}}},
            {"id": "child1", "componentProperties": {"Text": {"text": "Hello"}}}
        ]
    })");
    EXPECT_NO_THROW(a2ui::validate_a2ui_json(payload, schema));
}

TEST_F(ValidationTest, DuplicateIds) {
    json payload = json::parse(R"({
        "components": [
            {"id": "root", "componentProperties": {}},
            {"id": "root", "componentProperties": {}}
        ]
    })");
    try {
        a2ui::validate_a2ui_json(payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Duplicate component ID found: 'root'"), std::string::npos);
    }
}

TEST_F(ValidationTest, MissingRoot) {
    json payload = json::parse(R"({
        "components": [{"id": "not-root", "componentProperties": {}}]
    })");
    try {
        a2ui::validate_a2ui_json(payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Missing 'root' component"), std::string::npos);
    }
}

TEST_F(ValidationTest, DanglingReferencesCard) {
    json payload = json::parse(R"({
        "components": [{"id": "root", "componentProperties": {"Card": {"child": "missing_child"}}}]
    })");
    try {
        a2ui::validate_a2ui_json(payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Component 'root' references missing ID 'missing_child' in field 'child'"), std::string::npos);
    }
}

TEST_F(ValidationTest, DanglingReferencesColumn) {
    json payload = json::parse(R"({
        "components": [
            {"id": "root", "componentProperties": {"Column": {"children": ["child1", "missing_child"]}}},
            {"id": "child1", "componentProperties": {}}
        ]
    })");
    try {
        a2ui::validate_a2ui_json(payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Component 'root' references missing ID 'missing_child' in field 'children'"), std::string::npos);
    }
}

TEST_F(ValidationTest, SelfReference) {
    json payload = json::parse(R"({
        "components": [
            {"id": "root", "componentProperties": {"Container": {"children": ["root"]}}}
        ]
    })");
    try {
        a2ui::validate_a2ui_json(payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Self-reference detected: Component 'root' references itself in field 'children'"), std::string::npos);
    }
}

TEST_F(ValidationTest, CircularReference) {
    json payload = json::parse(R"({
        "components": [
            {
                "id": "root",
                "componentProperties": {"Container": {"children": ["child1"]}}
            },
            {
                "id": "child1",
                "componentProperties": {"Container": {"children": ["root"]}}
            }
        ]
    })");
    try {
        a2ui::validate_a2ui_json(payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Circular reference detected involving component"), std::string::npos);
    }
}

TEST_F(ValidationTest, OrphanedComponent) {
    json payload = json::parse(R"({
        "components": [
            {"id": "root", "componentProperties": {"Container": {"children": []}}},
            {"id": "orphan", "componentProperties": {}}
        ]
    })");
    try {
        a2ui::validate_a2ui_json(payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Orphaned components detected (not reachable from 'root'): ['orphan']"), std::string::npos);
    }
}

TEST_F(ValidationTest, ValidTopologyComplex) {
    json payload = json::parse(R"({
        "components": [
            {
                "id": "root",
                "componentProperties": {"Container": {"children": ["child1", "child2"]}}
            },
            {"id": "child1", "componentProperties": {"Text": {"text": "Hello"}}},
            {
                "id": "child2",
                "componentProperties": {"Container": {"children": ["child3"]}}
            },
            {"id": "child3", "componentProperties": {"Text": {"text": "World"}}}
        ]
    })");
    EXPECT_NO_THROW(a2ui::validate_a2ui_json(payload, schema));
}

TEST_F(ValidationTest, RecursionLimitExceeded) {
    json args = json::object();
    json* current = &args;
    for (int i = 0; i < 5; ++i) {
        (*current)["arg"] = {{"call", "fn" + std::to_string(i)}, {"args", json::object()}};
        current = &(*current)["arg"]["args"];
    }
    json payload = {
        {"components", {
            {
                {"id", "root"},
                {"componentProperties", {
                    {"Button", {
                        {"label", "Click me"},
                        {"action", {
                            {"functionCall", {
                                {"call", "fn_top"},
                                {"args", args}
                            }}
                        }}
                    }}
                }}
            }
        }}
    };
    try {
        a2ui::validate_a2ui_json(payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Recursion limit exceeded"), std::string::npos);
    }
}

TEST_F(ValidationTest, RecursionLimitValid) {
    json args = json::object();
    json* current = &args;
    for (int i = 0; i < 4; ++i) {
        (*current)["arg"] = {{"call", "fn" + std::to_string(i)}, {"args", json::object()}};
        current = &(*current)["arg"]["args"];
    }
    json payload = {
        {"components", {
            {
                {"id", "root"},
                {"componentProperties", {
                    {"Button", {
                        {"label", "Click me"},
                        {"action", {
                            {"functionCall", {
                                {"call", "fn_top"},
                                {"args", args}
                            }}
                        }}
                    }}
                }}
            }
        }}
    };
    EXPECT_NO_THROW(a2ui::validate_a2ui_json(payload, schema));
}

TEST_F(ValidationTest, InvalidPath1) {
    json payload = json::parse(R"({
        "updateDataModel": {
            "surfaceId": "surface1",
            "path": "invalid//path",
            "value": "data"
        }
    })");
    try {
        a2ui::validate_a2ui_json(payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Invalid JSON Pointer syntax"), std::string::npos);
    }
}

TEST_F(ValidationTest, InvalidPath2) {
    json payload = json::parse(R"({
        "components": [{
            "id": "root",
            "componentProperties": {
                "Text": {"text": {"path": "invalid path with spaces"}}
            }
        }]
    })");
    try {
        a2ui::validate_a2ui_json(payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Invalid JSON Pointer syntax"), std::string::npos);
    }
}

TEST_F(ValidationTest, InvalidPath3) {
    json payload = json::parse(R"({
        "updateDataModel": {
            "surfaceId": "surface1",
            "path": "/invalid/escape/~2",
            "value": "data"
        }
    })");
    try {
        a2ui::validate_a2ui_json(payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Invalid JSON Pointer syntax"), std::string::npos);
    }
}

TEST_F(ValidationTest, GlobalRecursionLimitExceeded) {
    json deep_payload = {{"level", 0}};
    json* current = &deep_payload;
    for (int i = 0; i < 55; ++i) {
        (*current)["next"] = {{"level", i + 1}};
        current = &(*current)["next"];
    }
    try {
        a2ui::validate_a2ui_json(deep_payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Global recursion limit exceeded"), std::string::npos);
    }
}

TEST_F(ValidationTest, NonStringId) {
    json payload = json::parse(R"({
        "components": [
            {"id": 123, "componentProperties": {}}
        ]
    })");
    try {
        a2ui::validate_a2ui_json(payload, schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Component 'id' must be a string."), std::string::npos);
    }
}

TEST_F(ValidationTest, CustomSchemaReference) {
    json custom_schema = json::parse(R"({
        "type": "object",
        "$defs": {
            "ComponentId": {"type": "string"},
            "ChildList": {"type": "array", "items": {"$ref": "#/$defs/ComponentId"}}
        },
        "properties": {
            "components": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"$ref": "#/$defs/ComponentId"},
                        "componentProperties": {
                            "type": "object",
                            "properties": {
                                "CustomLink": {
                                    "type": "object",
                                    "properties": {
                                        "linkedComponentId": {
                                            "$ref": "#/$defs/ComponentId"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "required": ["id"]
                }
            }
        }
    })");

    json payload = json::parse(R"({
        "components": [
            {
                "id": "root",
                "componentProperties": {
                    "CustomLink": {"linkedComponentId": "missing_target"}
                }
            }
        ]
    })");

    try {
        a2ui::validate_a2ui_json(payload, custom_schema);
        FAIL() << "Expected std::invalid_argument";
    } catch (const std::invalid_argument& e) {
        EXPECT_NE(std::string(e.what()).find("Component 'root' references missing ID 'missing_target' in field 'linkedComponentId'"), std::string::npos);
    }
}

