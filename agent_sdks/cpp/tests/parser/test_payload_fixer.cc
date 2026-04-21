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
#include "a2ui/parser/payload_fixer.h"

namespace {

TEST(NonStreamingParserTest, ParseResponseWithFixes) {
    // Test smart quotes
    std::string content = "Behold:\n<a2ui-json>{\xE2\x80\x9Cid\xE2\x80\x9D: \xE2\x80\x9Ctest\xE2\x80\x9D}</a2ui-json>";
    auto parts = a2ui::parse_response(content);
    
    ASSERT_EQ(parts.size(), 1);
    ASSERT_TRUE(parts[0].a2ui_json.has_value());
    EXPECT_EQ((*parts[0].a2ui_json)[0]["id"], "test");
    
    // Test trailing commas
    std::string content2 = "Behold:\n<a2ui-json>[{\"id\": \"test\",}]</a2ui-json>";
    auto parts2 = a2ui::parse_response(content2);
    
    ASSERT_EQ(parts2.size(), 1);
    ASSERT_TRUE(parts2[0].a2ui_json.has_value());
    EXPECT_EQ((*parts2[0].a2ui_json)[0]["id"], "test");
}

TEST(PayloadFixerTest, RemoveTrailingCommas) {
    std::string malformed = "[{\"type\": \"Text\", \"text\": \"Hello\"},]";
    std::string fixed = a2ui::remove_trailing_commas(malformed);
    EXPECT_EQ(fixed, "[{\"type\": \"Text\", \"text\": \"Hello\"}]");
    
    std::string malformed_obj = "{\"type\": \"Text\", \"text\": \"Hello\",}";
    std::string fixed_obj = a2ui::remove_trailing_commas(malformed_obj);
    EXPECT_EQ(fixed_obj, "{\"type\": \"Text\", \"text\": \"Hello\"}");
}

TEST(PayloadFixerTest, RemoveTrailingCommasNoChange) {
    std::string valid = "[{\"type\": \"Text\", \"text\": \"Hello\"}]";
    std::string fixed = a2ui::remove_trailing_commas(valid);
    EXPECT_EQ(fixed, valid);
}

TEST(PayloadFixerTest, NormalizesSmartQuotes) {
    std::string smart_quotes = "{\"type\": \xE2\x80\x9CText\xE2\x80\x9D, \"other\": \"Value\xE2\x80\x99s\"}";
    std::string fixed = a2ui::normalize_smart_quotes(smart_quotes);
    EXPECT_EQ(fixed, "{\"type\": \"Text\", \"other\": \"Value's\"}");
}

TEST(PayloadFixerTest, ParsePayloadWrapping) {
    std::string obj_json = "{\"type\": \"Text\", \"text\": \"Hello\"}";
    nlohmann::json parsed = a2ui::parse_and_fix(obj_json);
    
    ASSERT_TRUE(parsed.is_array());
    ASSERT_EQ(parsed.size(), 1);
    EXPECT_EQ(parsed[0]["type"], "Text");
}

} // namespace
