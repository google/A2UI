/*
 * Copyright 2026 Google LLC
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

package com.google.a2ui.core.parser

import com.google.a2ui.core.schema.A2uiConstants
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ParserTest {

  @Test
  fun mixedText_extractsA2uiBlocks() {
    val mixedText =
      """
            Here is some response text.
            ${A2uiConstants.A2UI_OPEN_TAG}
            {"a": 1}
            ${A2uiConstants.A2UI_CLOSE_TAG}
            And some trailing output.
        """
        .trimIndent()

    val blocks = parseResponseToParts(mixedText)
    assertEquals(2, blocks.size)
    assertEquals("Here is some response text.", blocks[0].text)
    assertEquals("{\"a\":1}", blocks[0].a2uiJson!![0].toString())
    assertEquals("And some trailing output.", blocks[1].text)
    assertEquals(null, blocks[1].a2uiJson)
  }

  @Test
  fun noTagsPresent_throwsException() {
    val text = "Just some random { \"key\": null } JSON without tags"
    var threw = false
    try {
      parseResponseToParts(text)
    } catch (e: IllegalArgumentException) {
      threw = true
    }
    assertTrue(threw)
  }

  @Test
  fun textWithTags_returnsTrueForHasA2uiParts() {
    assertTrue(
      hasA2uiParts("foo\n${A2uiConstants.A2UI_OPEN_TAG}\nbar\n${A2uiConstants.A2UI_CLOSE_TAG}")
    )
    assertFalse(hasA2uiParts("No parts here!"))
  }

  @Test
  fun multipleBlocks_extractsRightBlocks() {
    val mixedText =
      """
            Prefix
            ${A2uiConstants.A2UI_OPEN_TAG}{"first": 1}${A2uiConstants.A2UI_CLOSE_TAG}
            Middle
            ${A2uiConstants.A2UI_OPEN_TAG}  {"second": 2}  ${A2uiConstants.A2UI_CLOSE_TAG}
            Suffix
        """
        .trimIndent()

    val blocks = parseResponseToParts(mixedText)
    assertEquals(3, blocks.size)
    assertEquals("Prefix", blocks[0].text)
    assertEquals("{\"first\":1}", blocks[0].a2uiJson!![0].toString())
    assertEquals("Middle", blocks[1].text)
    assertEquals("{\"second\":2}", blocks[1].a2uiJson!![0].toString())
    assertEquals("Suffix", blocks[2].text)
    assertEquals(null, blocks[2].a2uiJson)
  }

  @Test
  fun invalidJson_throwsException() {
    val mixedText =
      """
            ${A2uiConstants.A2UI_OPEN_TAG}
            { invalid_json: 
            ${A2uiConstants.A2UI_CLOSE_TAG}
        """
        .trimIndent()

    var threw = false
    try {
      parseResponseToParts(mixedText)
    } catch (e: Exception) {
      threw = true
    }
    assertTrue(threw)
  }
}
