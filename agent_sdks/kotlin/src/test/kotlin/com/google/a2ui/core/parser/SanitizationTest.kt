package com.google.a2ui.core.parser

import kotlin.test.Test
import kotlin.test.assertEquals

class SanitizationTest {
  @Test
  fun sanitizeJsonString_stripsMarkdown() {
    val input =
      """
            ```json
            {"a": 1}
            ```
        """
        .trimIndent()
    assertEquals("{\"a\": 1}", sanitizeJsonString(input))
  }

  @Test
  fun sanitizeJsonString_stripsRawMarkdown() {
    val input =
      """
            ```
            {"a": 1}
            ```
        """
        .trimIndent()
    assertEquals("{\"a\": 1}", sanitizeJsonString(input))
  }

  @Test
  fun sanitizeJsonString_noMarkdown() {
    val input = """{"a": 1}"""
    assertEquals("{\"a\": 1}", sanitizeJsonString(input))
  }
}
