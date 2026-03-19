package com.google.a2ui.core.parser

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class PayloadFixerTest {

  @Test
  fun arrayWithTrailingCommas_commasRemoved() {
    val invalidJson =
      """
            [
              {"foo": "bar"},
              {"foo": "baz"},
            ]
        """
        .trimIndent()
    val result = PayloadFixer.parseAndFix(invalidJson)
    assertEquals(2, result.size)
  }

  @Test
  fun objectWithTrailingCommas_commasRemoved() {
    val invalidJson =
      """
            {
              "foo": "bar",
              "foo2": "baz",
            }
        """
        .trimIndent()
    val result = PayloadFixer.parseAndFix(invalidJson)
    assertEquals(1, result.size)
  }

  @Test
  fun edgeCasesWithTrailingCommas_commasRemoved() {
    assertEquals("""{"a": 1}""", PayloadFixer.removeTrailingCommas("""{"a": 1,}"""))
    assertEquals("""[1, 2, 3]""", PayloadFixer.removeTrailingCommas("""[1, 2, 3,]"""))
    assertEquals("""{"a": [1, 2]}""", PayloadFixer.removeTrailingCommas("""{"a": [1, 2,]}"""))
  }

  @Test
  fun commasInStrings_notRemoved() {
    val jsonWithCommasInStrings = """{"text": "Hello, world", "array": ["a,b", "c"]}"""
    assertEquals(
      jsonWithCommasInStrings,
      PayloadFixer.removeTrailingCommas(jsonWithCommasInStrings),
    )

    val trickyJson = """{"text": "Ends with comma,]"}"""
    assertEquals(trickyJson, PayloadFixer.removeTrailingCommas(trickyJson))
  }

  @Test
  fun validJson_remainsUntouched() {
    val validJson = """[{"foo": "bar"}]"""
    val result = PayloadFixer.parseAndFix(validJson)
    assertEquals(1, result.size)
  }

  @Test
  fun unrecoverableJson_throwsException() {
    val badJson = "not_json_at_all"
    assertFailsWith<IllegalArgumentException> { PayloadFixer.parseAndFix(badJson) }
  }

  @Test
  fun normalizeSmartQuotes_replacesQuotesCorrectly() {
    val input = "“smart” ‘quotes’"
    val expected = "\"smart\" 'quotes'"
    assertEquals(expected, PayloadFixer.normalizeSmartQuotes(input))
  }
}
