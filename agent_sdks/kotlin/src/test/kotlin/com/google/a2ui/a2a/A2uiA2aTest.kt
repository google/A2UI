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

package com.google.a2ui.a2a

import io.a2a.spec.DataPart
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class A2uiA2aTest {
  @Test
  fun createA2uiPart_setsCorrectMimeType() {
    val data = buildJsonObject { put("foo", "bar") }
    val part = A2uiA2a.createA2uiPart(data)
    assertTrue(part is DataPart)
    assertEquals(A2uiA2a.A2UI_MIME_TYPE, (part as DataPart).metadata?.get(A2uiA2a.MIME_TYPE_KEY))
  }

  @Test
  fun isA2uiPart_identifiesCorrectPart() {
    val data = buildJsonObject { put("foo", "bar") }
    val part = A2uiA2a.createA2uiPart(data)
    assertTrue(A2uiA2a.isA2uiPart(part))
  }

  @Test
  fun tryActivateA2uiExtension_requested_returnsTrue() {
    val activated = mutableListOf<String>()
    val result =
      A2uiA2a.tryActivateA2uiExtension(listOf(A2uiA2a.A2UI_EXTENSION_URI)) { activated.add(it) }

    assertTrue(result)
    assertEquals(listOf(A2uiA2a.A2UI_EXTENSION_URI), activated)
  }

  @Test
  fun tryActivateA2uiExtension_notRequested_returnsFalse() {
    val activated = mutableListOf<String>()
    val result = A2uiA2a.tryActivateA2uiExtension(listOf("other")) { activated.add(it) }

    kotlin.test.assertFalse(result)
    assertTrue(activated.isEmpty())
  }
}
