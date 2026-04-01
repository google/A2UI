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

package com.google.a2ui.core.schema

import kotlin.test.Test
import kotlin.test.assertNull
import kotlin.test.assertTrue
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

class SchemaModifiersTest {
  @Test
  fun removeStrictValidation_removesAdditionalPropertiesFalse() {
    val schema =
      Json.parseToJsonElement(
          """
            {
                "type": "object",
                "properties": {
                    "a": { "type": "string", "additionalProperties": false }
                },
                "additionalProperties": false
            }
        """
        )
        .jsonObject

    val modified = SchemaModifiers.removeStrictValidation(schema)

    assertNull(modified["additionalProperties"])
    val props = modified["properties"]!!.jsonObject
    val aSchema = props["a"]!!.jsonObject
    assertNull(aSchema["additionalProperties"])
  }

  @Test
  fun removeStrictValidation_keepsAdditionalPropertiesTrue() {
    val schema =
      Json.parseToJsonElement(
          """
            {
                "type": "object",
                "additionalProperties": true
            }
        """
        )
        .jsonObject

    val modified = SchemaModifiers.removeStrictValidation(schema)

    assertTrue(modified["additionalProperties"]!!.jsonPrimitive.booleanOrNull!!)
  }
}
