#include <gtest/gtest.h>
#include "a2ui/schema/manager.h"
#include "a2ui/schema/common_modifiers.h"
#include "a2ui/schema/utils.h"
#include "../test_utils.h"
#include <filesystem>
#include <fstream>

namespace fs = std::filesystem;

namespace {
using namespace a2ui::tests;

TEST(SchemaManagerTest, GeneratePrompt) {
    fs::path repo_root = find_repo_root();
    ASSERT_FALSE(repo_root.empty()) << "Could not find repo root";
    
    fs::path catalog_path = repo_root / "agent_sdks" / "conformance" / "simplified_catalog_v08.json";
    a2ui::CatalogConfig config = a2ui::CatalogConfig::from_path("test_catalog", catalog_path.string());
    
    a2ui::A2uiSchemaManager manager("0.8", {config});
    
    std::string prompt = manager.generate_system_prompt("You are a helpful assistant");
    
    EXPECT_TRUE(prompt.find("You are a helpful assistant") != std::string::npos);
    EXPECT_TRUE(prompt.find("Workflow Description:") != std::string::npos);
}

TEST(SchemaManagerTest, RemoveStrictValidation) {
    nlohmann::json schema = {
        {"type", "object"},
        {"properties", {
            {"name", {{"type", "string"}}}
        }},
        {"additionalProperties", false}
    };
    
    nlohmann::json modified = a2ui::remove_strict_validation(schema);
    
    EXPECT_FALSE(modified.contains("additionalProperties"));
    EXPECT_EQ(modified["type"], "object");
}

TEST(SchemaUtilsTest, WrapAsJsonArray) {
    nlohmann::json schema = {{"type", "object"}};
    nlohmann::json wrapped = a2ui::wrap_as_json_array(schema);
    
    EXPECT_EQ(wrapped["type"], "array");
    EXPECT_EQ(wrapped["items"], schema);
}

TEST(SchemaUtilsTest, DeepUpdate) {
    nlohmann::json d = {
        {"a", 1},
        {"b", {{"c", 2}}}
    };
    nlohmann::json u = {
        {"b", {{"d", 3}}},
        {"e", 4}
    };
    
    nlohmann::json result = a2ui::deep_update(d, u);
    
    EXPECT_EQ(result["a"], 1);
    EXPECT_EQ(result["b"]["c"], 2);
    EXPECT_EQ(result["b"]["d"], 3);
    EXPECT_EQ(result["e"], 4);
}

} // namespace
