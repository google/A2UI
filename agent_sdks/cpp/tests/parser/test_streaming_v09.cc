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
#include "a2ui/parser/parser.h"
#include "a2ui/parser/streaming.h"
#include "a2ui/schema/catalog.h"
#include "../test_utils.h"
#include "../../src/parser/streaming_v09.h"
#include <filesystem>
#include <fstream>
#include <iostream>

namespace fs = std::filesystem;

namespace {
using namespace a2ui::tests;

class TestA2uiStreamParserV09 : public a2ui::A2uiStreamParserV09 {
public:
    explicit TestA2uiStreamParserV09(a2ui::A2uiCatalog catalog)
        : A2uiStreamParserV09(std::move(catalog)) {}
        
    const std::vector<std::string>& get_msg_types() const {
        return msg_types_;
    }
    
    void set_validator(std::unique_ptr<a2ui::A2uiValidator> v) {
        validator_ = std::move(v);
    }
};

TEST(ParserUnitTest, StreamingMsgTypeDeduplication_v09) {
    a2ui::A2uiCatalog catalog("0.9", "test_catalog", {{"type", "object"}}, {{"type", "object"}}, {{"catalogId", "test_catalog"}});
    TestA2uiStreamParserV09 parser(catalog);
    
    std::string chunk1 = "<a2ui-json>[{\"version\": \"v0.9\", \"updateComponents\": {\"surfaceId\": \"s1\", \"components\": [";
    parser.process_chunk(chunk1);
    
    const auto& msg_types = parser.get_msg_types();
    EXPECT_TRUE(std::find(msg_types.begin(), msg_types.end(), "updateComponents") != msg_types.end());
    EXPECT_EQ(std::count(msg_types.begin(), msg_types.end(), "updateComponents"), 1);
    
    std::string chunk2 = "{\"id\": \"root\", \"component\": \"Text\", \"text\": \"hi\"}]}}]</a2ui-json>";
    parser.process_chunk(chunk2);
    
    EXPECT_TRUE(parser.get_msg_types().empty());
}

TEST(ParserUnitTest, V09PathHeuristicRelativePath) {
    a2ui::A2uiCatalog catalog("0.9", "test_catalog", {{"type", "object"}}, {{"type", "object"}}, {{"catalogId", "test_catalog"}});
    TestA2uiStreamParserV09 parser(catalog);
    parser.set_validator(nullptr); // Disable validation
    
    std::string chunk_cs = "<a2ui-json>[{\"version\": \"v0.9\", \"createSurface\": {\"surfaceId\": \"s1\", \"catalogId\": \"c1\"}}]</a2ui-json>";
    parser.process_chunk(chunk_cs);
    
    std::string chunk_uc = "<a2ui-json>[{\"version\": \"v0.9\", \"updateComponents\": {\"surfaceId\": \"s1\", \"components\": [{\"id\": \"root\", \"component\": \"Text\", \"text\": {\"path\": \"some/relative/path\"}}]}}]</a2ui-json>";
    
    auto parts = parser.process_chunk(chunk_uc);
    
    ASSERT_FALSE(parts.empty());
    ASSERT_TRUE(parts[0].a2ui_json.has_value());
    auto msgs = *parts[0].a2ui_json;
    ASSERT_FALSE(msgs.empty());
    auto comp = msgs[0]["updateComponents"]["components"][0];
    EXPECT_EQ(comp["text"]["path"], "some/relative/path");
}

TEST(ParserUnitTest, V09PathHeuristicAbsolutePath) {
    a2ui::A2uiCatalog catalog("0.9", "test_catalog", {{"type", "object"}}, {{"type", "object"}}, {{"catalogId", "test_catalog"}});
    TestA2uiStreamParserV09 parser(catalog);
    parser.set_validator(nullptr); // Disable validation
    
    std::string chunk_cs = "<a2ui-json>[{\"version\": \"v0.9\", \"createSurface\": {\"surfaceId\": \"s1\", \"catalogId\": \"c1\"}}]</a2ui-json>";
    parser.process_chunk(chunk_cs);
    
    std::string chunk_uc = "<a2ui-json>[{\"version\": \"v0.9\", \"updateComponents\": {\"surfaceId\": \"s1\", \"components\": [{\"id\": \"root\", \"component\": \"Text\", \"text\": {\"path\": \"/absolute/path\"}}]}}]</a2ui-json>";
    
    auto parts = parser.process_chunk(chunk_uc);
    
    ASSERT_FALSE(parts.empty());
    ASSERT_TRUE(parts[0].a2ui_json.has_value());
    auto msgs = *parts[0].a2ui_json;
    ASSERT_FALSE(msgs.empty());
    auto comp = msgs[0]["updateComponents"]["components"][0];
    EXPECT_EQ(comp["text"]["path"], "/absolute/path");
}



} // namespace
