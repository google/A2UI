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

import com.google.a2ui.core.schema.A2uiConstants
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class A2uiA2aTest {

  @Test
  fun createsAgentExtensionWithDefaultParams() {
    val extension = A2uiA2a.getA2uiAgentExtension()

    assertEquals("Provides agent driven UI using the A2UI JSON format.", extension.description)
    assertNotNull(extension.params)
    assertTrue(extension.params!!.isEmpty())
    assertFalse(extension.required)
    assertEquals(A2uiA2a.A2UI_EXTENSION_URI, extension.uri)
  }

  @Test
  fun createsAgentExtensionWithCustomParams() {
    val extension =
      A2uiA2a.getA2uiAgentExtension(
        acceptsInlineCatalogs = true,
        supportedCatalogIds = listOf("c1", "c2"),
      )

    assertNotNull(extension.params)
    assertEquals(true, extension.params!![A2uiConstants.INLINE_CATALOGS_KEY])
    assertEquals(listOf("c1", "c2"), extension.params!![A2uiConstants.SUPPORTED_CATALOG_IDS_KEY])
  }
}
