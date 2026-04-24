// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include <gtest/gtest.h>
#include "a2ui/schema/catalog.h"
#include "a2ui/schema/manager.h"
#include "a2ui/basic_catalog/provider.h"
#include "a2ui/schema/common_modifiers.h"
#include "a2ui/schema/utils.h"
#include <filesystem>
#include <fstream>

namespace fs = std::filesystem;

namespace {
fs::path find_repo_root() {
    fs::path current = fs::current_path();
    while (true) {
        if (fs::is_directory(current / "specification")) {
            return current;
        }
        fs::path parent = current.parent_path();
        if (parent == current) {
            return "";
        }
        current = parent;
    }
}
}

TEST(CatalogTest, LoadCatalog) {
    fs::path repo_root = find_repo_root();
    ASSERT_FALSE(repo_root.empty()) << "Could not find repo root";
    
    fs::path catalog_path = repo_root / "agent_sdks" / "conformance" / "simplified_catalog_v08.json";
    
    a2ui::CatalogConfig config = a2ui::CatalogConfig::from_path("test_catalog", catalog_path.string());
    nlohmann::json schema = config.provider->load();
    
    EXPECT_EQ(schema["catalogId"], "test_catalog");
}

TEST(CatalogTest, ResolveExamplesPath) {
    auto resolved = a2ui::resolve_examples_path("file:///path/to/examples");
    EXPECT_EQ(resolved, "/path/to/examples");
    
    resolved = a2ui::resolve_examples_path("path/to/examples");
    EXPECT_EQ(resolved, "path/to/examples");
    
    EXPECT_THROW(a2ui::resolve_examples_path("http://example.com"), std::runtime_error);
}

TEST(CatalogTest, BasicCatalogConfig) {
    auto config = a2ui::basic_catalog::BasicCatalog::get_config("0.9");
    EXPECT_EQ(config.name, "basic");
    ASSERT_TRUE(config.provider != nullptr);
    
    nlohmann::json schema = config.provider->load();
    EXPECT_TRUE(schema.contains("catalogId"));
    EXPECT_TRUE(schema.contains("components"));
}


