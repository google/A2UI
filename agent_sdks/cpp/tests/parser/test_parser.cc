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

namespace {

TEST(NonStreamingParserTest, HasA2uiParts) {
    EXPECT_TRUE(a2ui::has_a2ui_parts("Hello <a2ui-json>[]</a2ui-json> World"));
    EXPECT_FALSE(a2ui::has_a2ui_parts("Hello World"));
    EXPECT_FALSE(a2ui::has_a2ui_parts("Hello <a2ui-json> World"));
}

TEST(NonStreamingParserTest, ParseResponse) {
    std::string content = "Hello\n<a2ui-json>[{\"id\": \"test\"}]</a2ui-json>\nGoodbye";
    auto parts = a2ui::parse_response(content);
    
    ASSERT_EQ(parts.size(), 2);
    EXPECT_EQ(parts[0].text, "Hello");
    ASSERT_TRUE(parts[0].a2ui_json.has_value());
    EXPECT_EQ((*parts[0].a2ui_json)[0]["id"], "test");
    
    EXPECT_EQ(parts[1].text, "Goodbye");
    EXPECT_FALSE(parts[1].a2ui_json.has_value());
}

TEST(NonStreamingParserTest, ParseResponseWithMarkdown) {
    std::string content = "Behold:\n<a2ui-json>\n```json\n[{\"id\": \"test\"}]\n```\n</a2ui-json>";
    auto parts = a2ui::parse_response(content);
    
    ASSERT_EQ(parts.size(), 1);
    EXPECT_EQ(parts[0].text, "Behold:");
    ASSERT_TRUE(parts[0].a2ui_json.has_value());
    EXPECT_EQ((*parts[0].a2ui_json)[0]["id"], "test");
}

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

} // namespace
