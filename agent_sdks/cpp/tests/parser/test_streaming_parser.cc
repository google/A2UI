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
#include "../../src/parser/streaming_impl.h"
#include "../../src/parser/streaming_v08.h"
#include "../../src/parser/streaming_v09.h"
#include "a2ui/schema/catalog.h"
#include <vector>
#include <string>
#include <algorithm>

namespace {

// --- Streaming Utils Tests ---

TEST(StreamingUtilsTest, FixJsonBasic) {
    std::string cut = "{\"a\": 1";
    EXPECT_EQ(a2ui::fix_json(cut), "{\"a\": 1}");
    
    std::string cut2 = "[{\"a\": 1}";
    EXPECT_EQ(a2ui::fix_json(cut2), "[{\"a\": 1}]");
}

TEST(StreamingUtilsTest, FixJsonInString) {
    std::string cut = "{\"text\": \"hello";
    EXPECT_EQ(a2ui::fix_json(cut), "{\"text\": \"hello\"}");
    
    std::string cut2 = "{\"text\": \"hello } world\"}";
    EXPECT_EQ(a2ui::fix_json(cut2), cut2);
}

TEST(StreamingUtilsTest, FixJsonCuttableKeys) {
    std::string cut = "{\"id\": \"root\", \"text\": \"hello";
    EXPECT_EQ(a2ui::fix_json(cut), "{\"id\": \"root\", \"text\": \"hello\"}");
    
    std::string cut2 = "{\"id\": \"ro";
    EXPECT_EQ(a2ui::fix_json(cut2), "");
}

// --- V0.8 Streaming Parser Unit Tests ---

class TestA2uiStreamParserV08 : public a2ui::A2uiStreamParserV08 {
public:
    explicit TestA2uiStreamParserV08(a2ui::A2uiCatalog catalog)
        : A2uiStreamParserV08(std::move(catalog)) {}
        
    const std::vector<std::string>& get_msg_types() const {
        return msg_types_;
    }
    
    void set_validator(std::unique_ptr<a2ui::A2uiValidator> v) {
        validator_ = std::move(v);
    }
};

TEST(StreamingParserV08UnitTest, StreamingMsgTypeDeduplication) {
    a2ui::A2uiCatalog catalog("0.8", "test_catalog", {{"type", "object"}}, {{"type", "object"}}, {{"catalogId", "test_catalog"}});
    TestA2uiStreamParserV08 parser(catalog);
    
    std::string chunk1 = "<a2ui-json>[{\"surfaceUpdate\": {\"surfaceId\": \"s1\", \"components\": [";
    parser.process_chunk(chunk1);
    
    const auto& msg_types = parser.get_msg_types();
    EXPECT_TRUE(std::find(msg_types.begin(), msg_types.end(), "surfaceUpdate") != msg_types.end());
    EXPECT_EQ(std::count(msg_types.begin(), msg_types.end(), "surfaceUpdate"), 1);
    
    std::string chunk2 = "{\"id\": \"root\", \"component\": {\"Text\": {\"text\": \"hi\"}}}]}]</a2ui-json>";
    parser.process_chunk(chunk2);
    
    EXPECT_TRUE(parser.get_msg_types().empty());
}

// --- V0.9 Streaming Parser Unit Tests ---

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

TEST(StreamingParserV09UnitTest, StreamingMsgTypeDeduplication) {
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

} // namespace
